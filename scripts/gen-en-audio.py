#!/usr/bin/env python3
"""Generate English audio clips for the 字母 + 音标 modules with AWS Polly.

Reads scripts/en-audio-items.json (produced by dump-en-audio-items.ts) and writes
one clip per item to public/audio/en/<slug>.mp3, using the right SSML per kind:
  chars -> <say-as interpret-as="characters"> (letter names, e.g. A -> "ay")
  ipa   -> <phoneme alphabet="ipa" ph="…">    (phonics sounds, e.g. /æ/)
  word  -> plain text                          (example words)
Output is committed as static files; the app never calls Polly at runtime.

Credentials come from the environment (never committed):
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
Run:  python3 scripts/gen-en-audio.py
"""
import json
import os
import sys
from xml.sax.saxutils import escape
import boto3

ITEMS = os.path.join("scripts", "en-audio-items.json")
OUT_DIR = os.path.join("public", "audio", "en")
VOICE = os.environ.get("POLLY_VOICE", "Joanna")
ENGINE = os.environ.get("POLLY_ENGINE", "neural")


def ssml_for(kind: str, value: str) -> str:
    v = escape(value)
    if kind == "chars":
        return f'<speak><say-as interpret-as="characters">{v}</say-as></speak>'
    if kind == "ipa":
        return f'<speak><phoneme alphabet="ipa" ph="{v}">{v}</phoneme></speak>'
    return f"<speak>{v}</speak>"  # word


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(ITEMS, encoding="utf-8") as fh:
        items = json.load(fh)
    only = set(sys.argv[1:])  # optional: regenerate just these slugs
    polly = boto3.client("polly")
    failures = 0
    for it in items:
        slug, kind, value = it["slug"], it["kind"], it["value"]
        if only and slug not in only:
            continue
        try:
            resp = polly.synthesize_speech(
                Text=ssml_for(kind, value), TextType="ssml", OutputFormat="mp3",
                VoiceId=VOICE, Engine=ENGINE,
            )
            data = resp["AudioStream"].read()
            with open(os.path.join(OUT_DIR, f"{slug}.mp3"), "wb") as out:
                out.write(data)
            print(f"  {slug:16s} [{kind:5s}] {value!r:14s} {len(data):6d}B")
        except Exception as exc:  # noqa: BLE001
            failures += 1
            print(f"  {slug:16s} [{kind:5s}] ERROR {type(exc).__name__}: {str(exc)[:90]}")
    print(f"done: {len(items) - failures}/{len(items)} clips ({VOICE}/{ENGINE})")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
