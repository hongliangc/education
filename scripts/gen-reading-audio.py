#!/usr/bin/env python3
"""Generate sentence narration clips for the 双语阅读 (bilingual reading) stories with AWS Polly.

Reads scripts/reading-audio-items.json (produced by dump-reading-sentences.ts) and writes one mp3 per
sentence to the file path it names (public/audio/reading/<story>/<NN>.mp3). Uses Joanna's US English
female voice and wraps each line in SSML with a gentle pace + a short end-of-sentence pause, so the
reading is calm and easy to follow along. Output is committed as static files; the app never calls Polly
at runtime.

Credentials come from the environment (never committed):
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
Run:  python3 scripts/gen-reading-audio.py
Override voice/engine/pace:
  POLLY_VOICE=Ruth POLLY_ENGINE=neural READING_RATE=92% python3 scripts/gen-reading-audio.py
Regenerate only some files:  python3 scripts/gen-reading-audio.py public/audio/reading/lion-and-the-mouse/01.mp3
"""
import json
import os
import sys
from xml.sax.saxutils import escape
import boto3

ITEMS = os.path.join("scripts", "reading-audio-items.json")
VOICE = os.environ.get("POLLY_VOICE", "Joanna")       # Joanna = US English female voice
ENGINE = os.environ.get("POLLY_ENGINE", "neural")
RATE = os.environ.get("READING_RATE", "92%")          # gentle, follow-along pace
BREAK_MS = os.environ.get("READING_BREAK", "350ms")   # short pause after each sentence


def ssml_for(text: str) -> str:
    return f'<speak><prosody rate="{RATE}">{escape(text)}<break time="{BREAK_MS}"/></prosody></speak>'


def main() -> int:
    with open(ITEMS, encoding="utf-8") as fh:
        items = json.load(fh)
    only = set(sys.argv[1:])  # optional: regenerate just these file paths
    polly = boto3.client("polly")
    failures = 0
    for it in items:
        path, text = it["file"], it["text"]
        if only and path not in only:
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        try:
            resp = polly.synthesize_speech(
                Text=ssml_for(text), TextType="ssml", OutputFormat="mp3",
                VoiceId=VOICE, Engine=ENGINE,
            )
            data = resp["AudioStream"].read()
            with open(path, "wb") as out:
                out.write(data)
            print(f"  {path}  {len(data):6d}B  {text[:48]!r}")
        except Exception as exc:  # noqa: BLE001
            failures += 1
            print(f"  {path}  ERROR {type(exc).__name__}: {str(exc)[:90]}")
    print(f"done: {len(items) - failures}/{len(items)} clips ({VOICE}/{ENGINE}, rate {RATE})")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
