#!/usr/bin/env python3
"""Generate American-English IPA phoneme audio clips with AWS Polly.

One-time generator: produces public/audio/phonemes/<id>.mp3 for each phoneme in
content/english/ipa.ts, using Polly's <phoneme alphabet="ipa"> SSML so the exact
IPA sound is synthesized (not guessed from text). Output is committed as static
files; the app never calls Polly at runtime.

Credentials come from the environment (never hard-coded / committed):
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
Run:  python3 scripts/gen-phoneme-audio.py
Voice/engine overridable: POLLY_VOICE (default Joanna), POLLY_ENGINE (default neural).
"""
import os
import sys
import boto3

# phoneme id (matches IPA_PHONEMES in content/english/ipa.ts) -> American IPA pronunciation
PHONEMES: dict[str, str] = {
    # long / tense vowels (General American)
    "long-i": "i", "long-er": "ɝ", "long-a": "ɑr", "long-or": "ɔ", "long-u": "u",
    # short / lax vowels
    "short-i": "ɪ", "short-e": "ɛ", "short-a": "æ", "schwa": "ə",
    "short-u": "ʌ", "short-o": "ɑ", "short-oo": "ʊ",
    # diphthongs (+ r-colored)
    "diphthong-ai": "eɪ", "diphthong-eye": "aɪ", "diphthong-oy": "ɔɪ",
    "diphthong-ear": "ɪr", "diphthong-air": "ɛr", "diphthong-tour": "ʊr",
    "diphthong-oh": "oʊ", "diphthong-ow": "aʊ",
    # consonants
    "p": "p", "b": "b", "t": "t", "d": "d", "k": "k", "g": "ɡ",
    "f": "f", "v": "v", "s": "s", "z": "z", "theta": "θ", "eth": "ð",
    "sh": "ʃ", "zh": "ʒ", "h": "h", "r": "ɹ", "ch": "tʃ", "j": "dʒ",
    "tr": "tr", "dr": "dr", "ts": "ts", "dz": "dz",
    "m": "m", "n": "n", "ng": "ŋ", "y": "j", "w": "w", "l": "l",
}

OUT_DIR = os.path.join("public", "audio", "phonemes")
VOICE = os.environ.get("POLLY_VOICE", "Joanna")
ENGINE = os.environ.get("POLLY_ENGINE", "neural")


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    polly = boto3.client("polly")
    only = set(sys.argv[1:])  # optional: regenerate just these ids
    failures = 0
    for pid, ipa in PHONEMES.items():
        if only and pid not in only:
            continue
        ssml = f'<speak><phoneme alphabet="ipa" ph="{ipa}">{ipa}</phoneme></speak>'
        try:
            resp = polly.synthesize_speech(
                Text=ssml, TextType="ssml", OutputFormat="mp3",
                VoiceId=VOICE, Engine=ENGINE,
            )
            data = resp["AudioStream"].read()
            path = os.path.join(OUT_DIR, f"{pid}.mp3")
            with open(path, "wb") as fh:
                fh.write(data)
            print(f"  {pid:14s} /{ipa}/  {len(data):6d} bytes -> {path}")
        except Exception as exc:  # noqa: BLE001 - report and continue
            failures += 1
            print(f"  {pid:14s} /{ipa}/  ERROR {type(exc).__name__}: {str(exc)[:120]}")
    print(f"done: {len(PHONEMES) - failures}/{len(PHONEMES)} clips ({VOICE}/{ENGINE})")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
