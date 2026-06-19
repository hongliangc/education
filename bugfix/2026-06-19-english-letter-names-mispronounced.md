# 字母名 A/H/R 在 TTS 下发音不准

- id: `2026-06-19-english-letter-names-mispronounced`
- status: done
- commit: this commit

## 现象与复现
- 字母朗读：本地（浏览器音色）A、R 不对；现网（腾讯音色）报 A、E、F、H 等。
- 复现：英语岛 → 字母板/字母歌，听 A、H、R。

## 根因
- 字母名朗读文本取自 `content/english/alphabet.ts` 的 `LETTER_NAMES`（仅用于 TTS，不显示）。
- 个别拼写在腾讯英文音色（WeWinny）下念错。用「合成→再识别」客观验证（控制组 bee→B、see→C 校准可信）：
  - A `"ay"` → 听成 'A y'（/eɪ/ 被念成两段）。
  - R `"ar"` → 听成 'AR'。
  - H `"aitch"` → 听成 'I'（元音错）——对应用户现网列表里的 H。
- E `"ee"`、F `"eff"` 在英文音色下其实正确（现网的 E/F 错是中文音色串用，已由
  `bugfix:2026-06-19-english-tts-uses-chinese-voice` 修复），故本次不动。

## 修复
- `content/english/alphabet.ts` `LETTER_NAMES` 改三处拼写（验证后均干净命中目标字母）：
  - A：`"ay"` → `"eigh"`（→'A'）
  - H：`"aitch"` → `"aytch"`（→'H'）
  - R：`"ar"` → `"are"`（→'Are'，R=/ɑːr/ 与 "are" 同音）
- 这些是 TTS 朗读用近似拼写，不参与显示（界面显示 `entry.letter`）。云 TTS 为主路径；
  极少触发的浏览器 Web Speech 回退下这些拼写同样可读。

## 回归测试
- `tests/english/letter-names.test.ts`：断言 ALPHABET 中 A=`eigh`、H=`aytch`、R=`are`，
  且不再出现 `ay`/`aitch`/`ar`（防回退）。

## 验证
- `npx tsc --noEmit` 通过；新测试通过。
- 端到端（重建本地镜像 `...100044`，已为本地补 TENCENT_* 启用云 TTS）：合成 app 实际发送的
  字母名 → 再识别：eigh→'A'、aytch→'H'、are→'Are'，控制组 bee→'B'、see→'C' 不变。
- 现网生效需 `bash scripts/release.sh prod`。
