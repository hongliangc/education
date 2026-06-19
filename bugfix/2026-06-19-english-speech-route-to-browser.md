# 英文字母/音标发音不准：改用预生成 Polly 美式音频 + 浏览器回退

- id: `2026-06-19-english-speech-route-to-browser`
- status: done
- commit: this commit

## 现象与复现
- 英文字母/音标发音不准：现网（腾讯音色）尤甚；给本地补上腾讯密钥后本地也变差（E、F 等）。
- 原本地（无腾讯密钥、走浏览器音色）反而更好——这是关键线索。

## 根因
- `speakText` 默认优先腾讯云 TTS，失败才回退浏览器 Web Speech。腾讯唯一英文音色 WeWinny
  对**孤立字母名/音标**渲染偏差大；浏览器原生英文音色更准。
- 配置腾讯密钥的环境（现网，以及我给本地补密钥后）→ 英文走 WeWinny → 多字母/音标听感不对；
  未配置腾讯的环境（原本地）→ 英文走浏览器 → 好。即差异来自**音色引擎**，非拼写本身。
- 逐字调腾讯近似拼写是在弱音色上打地鼠；用户确认浏览器音色更好。

## 根因（续）
- 更深层：TTS 引擎按**词/句**合成，无法可靠产出**孤立音素**——给近似拼写它瞎猜（/ɪ/），
  给真实词它念整词（/ʊ/→读成 "book"）。所以靠任何文本喂 TTS 都做不准孤立音标。

## 修复
- **预生成 Polly 美式音频（主路径）**：用 AWS Polly `<phoneme alphabet="ipa">`（音素，按 IPA 精确合成）
  + `<say-as characters>`（字母名）+ 普通词（例词），离线生成 48 个音素 + 125 个字母/词 clip，
  落 `public/audio/{phonemes,en}/*.mp3` 静态文件，运行时**不**再调用云。生成脚本：
  `scripts/gen-phoneme-audio.py`、`scripts/dump-en-audio-items.ts`→`scripts/en-audio-items.json`→`scripts/gen-en-audio.py`。
- `lib/speech.ts`：新增 `playClip`（按音素 id 播）、`enAudioSlug`/`speakEnglish`/`speakEnglishSequence`
  （按文本 slug 播 `/audio/en/<slug>.mp3`，**缺失即优雅回退浏览器 Web Speech**）。英文（`lang` 以 `en`
  开头）整体不再先试腾讯（`speakText`/`speakTextStream`/`speakChunks` 三入口短路到浏览器）；中文仍走腾讯童声。
- 组件改播 clip：`IpaBoard`（音素=playClip，例词=speakEnglish）、`AlphabetBoard`/`AlphabetSong`/
  `LetterTracePad`（字母名+例词=speakEnglishSequence/speakEnglish）、`GroupChant`（整组连读）、`SpeakPanel`（跟读目标词）。
- IPA 显示符号改美式 GenAm（`ipa.ts` + `alphabet.ts` LETTER_SOUNDS）：/e/→/ɛ/、/ɜː/→/ɝ/、/əʊ/→/oʊ/、
  /ɒ/→/ɑ/、/r/→/ɹ/、中央双元音→r 化 /ɪr//ɛr//ʊr/、去长音符 /iː/→/i/ 等、长 a→/ɑr/；分组名/数量不动。
- 历史拼写（`LETTER_NAMES` A=`eigh`/H=`aitch`/R=`are`、`PHONEME_SAY`、`LETTER_SOUNDS_SAY`）现仅作
  clip slug / 浏览器回退用，发音以 Polly clip 为准。relates [[english-letter-names-mispronounced]] 的 Tencent 思路已被本方案取代。
- 字母名 `content/english/alphabet.ts` `LETTER_NAMES`：H 从腾讯专用的 `"aytch"` 还原为浏览器
  既有良好的 `"aitch"`；A=`"eigh"`、R=`"are"` 保留（原 `"ay"`/`"ar"` 在浏览器同样念错）。
- 音标朗读 `content/english/ipa.ts` `PHONEME_SAY`（美式英语）：TTS 无法孤立念准的松元音/破擦音
  改用清晰美式关键词——/ɪ/`it`、/æ/`at`（原 `"ah"` 与 /ɑ/ 混同）、/ʊ/`book`、/eɪ/`eigh`、
  /ʊə/`tour`、/ʒ/`vision`、/ts/`cats`、/dz/`kids`；并随符号美化调 /ɑr/`are`、/ɑ/`ah`。
- IPA 显示符号改美式 GenAm（`ipa.ts` IPA_PHONEMES + `alphabet.ts` LETTER_SOUNDS）：
  /e/→/ɛ/、/ɜː/→/ɝ/、/əʊ/→/oʊ/、/ɒ/→/ɑ/、/r/→/ɹ/、中央双元音 /ɪə//eə//ʊə/→r 化 /ɪr//ɛr//ʊr/、
  去长音符 /iː/→/i/、/uː/→/u/、/ɔː/→/ɔ/，长 a 取美式 r 化 /ɑr/。分组名/数量不动。
- 字母自然拼读音 `LETTER_SOUNDS_SAY`：A `"ah"`→`"at"`(/æ/)、I `"ih"`→`"it"`(/ɪ/)、O `"aw"`→`"ah"`(/ɑ/)。

## 回归测试
- `tests/english/ipa.test.ts`：48 音符号序列更新为 GenAm，分组数量不变（6/6 通过）。
- `tests/english/letter-names.test.ts`：A/R 拼写 + 英文路由到浏览器断言。
- `tests/speech/voice-language-match.test.ts`：音色语言匹配（中文音色不念英文）。
- 全量 275 测试通过（顺带修复既有 `tests/speech/chunking.test.ts` 漏 `.ts` 扩展名——单独提交）。

## 验证
- `npx tsc --noEmit` 通过；全量测试 275/275 通过。
- 本地重建镜像后端到端：`/audio/phonemes/*.mp3`、`/audio/en/*.mp3` 经 nginx 返回 200 audio/mpeg；
  英语岛字母名/例词/音素/整组连读均播预生成美式音频；缺 clip 的句子（如字母歌结尾）回退浏览器。
- 用户本地体验确认发音正确后提交。AWS 仅用于离线生成（密钥经 env、未入库），运行时零云调用。
- 待办：用户在 IAM 轮换/删除本次明文分享的 AWS access key。
