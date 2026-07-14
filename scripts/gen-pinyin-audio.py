#!/usr/bin/env python3
"""Generate the complete static Mandarin pinyin library with Amazon Polly.

The manifest is produced by scripts/dump-pinyin-audio-items.mjs from the same
content used by the UI. Audio is generated offline and committed under
public/audio/pinyin; the browser never receives AWS credentials.

Credentials come from AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY and the optional
AWS_SESSION_TOKEN. Defaults are intentionally pinned to the approved setup:
Tokyo, Zhiyu, neural engine. The request signer uses only Python's standard
library, so the generator needs no local AWS SDK installation.

Run:
  python3 scripts/gen-pinyin-audio.py
Optional: pass manifest ids to regenerate only selected clips.
"""
import json
import hashlib
import hmac
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape

MANIFEST = Path("scripts/pinyin-audio-items.json")
REGION = os.environ.get("POLLY_REGION", "ap-northeast-1")
VOICE = os.environ.get("POLLY_VOICE", "Zhiyu")
ENGINE = os.environ.get("POLLY_ENGINE", "neural")
WORKERS = int(os.environ.get("POLLY_WORKERS", "8"))


def ssml_for(phoneme: str, fallback: str) -> str:
    return (
        '<speak><phoneme alphabet="x-amazon-pinyin" '
        f'ph="{escape(phoneme)}">{escape(fallback)}</phoneme></speak>'
    )


def signature_key(secret: str, date: str, region: str, service: str) -> bytes:
    date_key = hmac.new(f"AWS4{secret}".encode(), date.encode(), hashlib.sha256).digest()
    region_key = hmac.new(date_key, region.encode(), hashlib.sha256).digest()
    service_key = hmac.new(region_key, service.encode(), hashlib.sha256).digest()
    return hmac.new(service_key, b"aws4_request", hashlib.sha256).digest()


def synthesize(access_key: str, secret_key: str, session_token: str | None, text: str) -> bytes:
    service = "polly"
    host = f"polly.{REGION}.amazonaws.com"
    endpoint = f"https://{host}/v1/speech"
    body = json.dumps(
        {
            "Engine": ENGINE,
            "LanguageCode": "cmn-CN",
            "OutputFormat": "mp3",
            "SampleRate": "24000",
            "Text": text,
            "TextType": "ssml",
            "VoiceId": VOICE,
        },
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    now = datetime.now(timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = hashlib.sha256(body).hexdigest()
    signed = {
        "content-type": "application/json",
        "host": host,
        "x-amz-date": amz_date,
    }
    if session_token:
        signed["x-amz-security-token"] = session_token
    signed_names = ";".join(sorted(signed))
    canonical_headers = "".join(f"{name}:{signed[name]}\n" for name in sorted(signed))
    canonical_request = "\n".join(
        ["POST", "/v1/speech", "", canonical_headers, signed_names, payload_hash]
    )
    scope = f"{date_stamp}/{REGION}/{service}/aws4_request"
    string_to_sign = "\n".join(
        ["AWS4-HMAC-SHA256", amz_date, scope, hashlib.sha256(canonical_request.encode()).hexdigest()]
    )
    signature = hmac.new(
        signature_key(secret_key, date_stamp, REGION, service),
        string_to_sign.encode(),
        hashlib.sha256,
    ).hexdigest()
    authorization = (
        f"AWS4-HMAC-SHA256 Credential={access_key}/{scope}, "
        f"SignedHeaders={signed_names}, Signature={signature}"
    )
    headers = {**signed, "authorization": authorization}
    request = Request(endpoint, data=body, headers=headers, method="POST")
    try:
        with urlopen(request, timeout=30) as response:
            return response.read()
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"Polly HTTP {error.code}: {detail}") from error


def main() -> int:
    with MANIFEST.open(encoding="utf-8") as stream:
        items = json.load(stream)

    selected = set(sys.argv[1:])
    if selected:
        items = [item for item in items if item["id"] in selected]
        missing = selected.difference(item["id"] for item in items)
        if missing:
            print(f"unknown ids: {', '.join(sorted(missing))}", file=sys.stderr)
            return 2

    access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    session_token = os.environ.get("AWS_SESSION_TOKEN")
    if not access_key or not secret_key:
        print("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required", file=sys.stderr)
        return 2
    def generate(index: int, item: dict[str, str]) -> tuple[int, str, int]:
        output = Path("public") / item["path"].lstrip("/")
        output.parent.mkdir(parents=True, exist_ok=True)
        data = synthesize(
            access_key,
            secret_key,
            session_token,
            ssml_for(item["phoneme"], item["fallback"]),
        )
        if not data:
            raise RuntimeError("Polly returned empty audio")
        temporary = output.with_suffix(".mp3.tmp")
        temporary.write_bytes(data)
        temporary.replace(output)
        return index, item["id"], len(data)

    failures = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {
            executor.submit(generate, index, item): (index, item)
            for index, item in enumerate(items, start=1)
        }
        for future in as_completed(futures):
            index, item = futures[future]
            try:
                _, item_id, size = future.result()
                print(f"[{index:03d}/{len(items):03d}] {item_id:<34} {size:6d}B")
            except Exception as exc:  # noqa: BLE001 - batch should report every failed item
                failures += 1
                print(f"[{index:03d}/{len(items):03d}] {item['id']} ERROR {type(exc).__name__}: {exc}")

    print(f"done: {len(items) - failures}/{len(items)} clips ({REGION}, {VOICE}/{ENGINE})")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
