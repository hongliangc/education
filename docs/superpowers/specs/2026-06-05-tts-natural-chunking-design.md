# TTS Natural Chunking Design

## Problem

Story narration splits long text into independent TTS requests. The first two
chunks currently use hard limits of 24 and 60 characters. When a sentence is
longer than those limits, `splitForTts` cuts at the exact character count.
This can split Chinese words such as `闷闷不乐`, `天上`, or `西天取经`.
Because each chunk is synthesized and played independently, the boundary
becomes an audible pause and resets the voice prosody.

## Scope

Change only the pure chunking logic in `lib/speech/chunking.ts`.

Do not change:

- Story text or subtitle rendering.
- TTS API routes, voices, caching implementation, or playback controls.
- The 148-character hard maximum required by the TTS service.
- The 24/60-character first-chunk optimization as a target.

Changing chunk text changes cache keys. Existing cached chunks will no longer
match and will be synthesized again once before being cached under the new
boundaries.

## Design

Treat each chunk cap as a maximum, but choose a natural cut position at or
before that cap.

Cut priority:

1. Sentence-ending punctuation or newline.
2. Closing quote immediately following sentence-ending punctuation.
3. Clause punctuation such as comma, enumeration comma, colon, or dash.
4. A word boundary reported by `Intl.Segmenter` for Chinese text.
5. Exact character limit as the final fallback.

The first and second chunk targets remain 24 and 60 characters. If a complete
sentence already fits, keep it intact. If the next sentence is too long, split
that sentence using the priority above rather than slicing blindly.

Every produced chunk must satisfy these invariants:

- Joining all chunks reproduces the original text exactly.
- No chunk exceeds its applicable cap.
- Empty chunks are never emitted.
- Closing quotes stay attached to the preceding sentence-ending punctuation
  when they fit within the cap.

## Testing

Add focused tests for `splitForTts` using Node's built-in test runner and
TypeScript compilation to a temporary directory.

Regression cases:

- `闷闷不乐` is not split between `闷闷` and `不乐`.
- `天空` and `天上` remain intact at a nearby hard limit.
- `西天取经` remains intact.
- Closing quotes remain with the sentence they close.
- Long text still respects all dynamic chunk caps.
- Joining chunks exactly restores the input.

## Success Criteria

Story narration no longer introduces chunk boundaries inside the covered
Chinese words, while preserving short startup chunks and the TTS service's
maximum request length.
