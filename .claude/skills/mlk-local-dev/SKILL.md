---
name: mlk-local-dev
description: Use when the user wants to run, launch, smoke-test, or experience the Magic Learning Kingdom app locally on WSL2 with browser access from Windows. Triggers on "跑起来 / 跑一下 / 本地跑 / 体验一下 / 打开看看 / 启动 / 看看效果 / 试一下 / start dev / open in browser / smoke test / launch". Covers starting the dev server, ensuring DB schema synced, WSL2 ↔ Windows localhost networking, opening default Windows browser, and a guided clickthrough script. NOT for production deployment — that's batch D.
---

# 本地启动 + Windows 浏览器体验

## 何时用
- "跑起来看看"、"跑一下"、"打开看看效果"
- 改完功能想立即在浏览器里看
- 新游戏/新页面接好后做 smoke test

## 前置检查（顺序执行）

1. [ ] 检查 DB 存在：
   ```bash
   wsl -e bash -ic "ls ~/workspace/education/prisma/dev.db"
   ```
   - 不存在 → 跑 `wsl -e bash -ic "cd ~/workspace/education && npm run db:push"`

2. [ ] 检查端口 3000 占用：
   ```bash
   wsl -e bash -ic "ss -ltn | grep :3000"
   ```
   - 占用 → 询问用户是否 kill 旧进程：`wsl -e bash -c "pkill -f 'next dev'"`

3. [ ] WSL2 网络模式：
   ```powershell
   wsl --version
   ```
   - 显示 mirrored 网络 → localhost 直通
   - NAT 模式 → 跑 `wsl hostname -I` 拿 IP，用 `http://<wsl-ip>:3000`

## 启动 dev server

```bash
wsl -e bash -ic "cd ~/workspace/education && npm run dev"
```

**重要**：用 Bash 工具的 `run_in_background: true`，否则会阻塞当前会话。

等待输出 `✓ Ready in <ms>ms`。一般 < 1s。

## 在 Windows 浏览器自动打开

PowerShell:
```powershell
Start-Process "http://localhost:3000"
```

或在 WSL 中：
```bash
wsl -e bash -ic "cmd.exe /c start http://localhost:3000"
```

## Clickthrough 体验脚本（首次完整流程）

1. [ ] 落地 `/` → 自动重定向到 `/login`
2. [ ] 点 "去注册" → 填 `parent@test.com` / `password123` → 创建账号
3. [ ] 自动跳到 `/child-select` → 点 "添加小冒险家"：
   - 名字：随意
   - 年龄：6 岁
   - 头像：🦊
4. [ ] 进入 `/world`：
   - 看到 5 个关卡节点
   - 精灵气泡问候出现
5. [ ] 依次玩 5 个关卡，每个至少一轮：
   - ✏️ 写字（描红 → 自评 → 通关）
   - 🔤 字母（emoji → 选字母）
   - 📖 单词（中文 → 配 emoji）
   - 🔢 算术（4 选 1）
   - 📜 故事（朗读 → 逐字高亮 → 3 题理解 → 道理）
6. [ ] 回 `/world` 检查 HUD 右上：⭐❤️🔥 数字与游戏一致

## 验证清单（每次 clickthrough 必查）

- [ ] 控制台无红色错误
- [ ] sfx 答对/答错有声
- [ ] StoryGame 朗读出声，字逐个高亮
- [ ] 通关后 `/api/sessions` 返 200（看 Network tab）
- [ ] `/api/progress/[childId]` 包含新 module 记录

## 体验中常见问题

| 现象 | 原因 | 修复 |
|---|---|---|
| 页面空白 + 控制台 CSS @import 报错 | globals.css 里 Google Font @import 在 tailwind 之后 | 改用 `next/font/google` |
| localhost:3000 在 Windows 打不开 | WSL2 NAT 模式 | `wsl hostname -I` 拿 IP，用 `http://<wsl-ip>:3000`；或升级 WSL 启用 mirrored |
| TTS 不出声 | Chrome 需用户首次点击页面才解锁 SpeechSynthesis | 先点击任意按钮再触发朗读 |
| 答错没扣血 | C 批未实施 | 已知 issue，待 C 批修 |
| Middleware 警告 | Next.js 16 推荐改 proxy.ts | 已知 warning，不影响功能；待 C 批迁移 |

## 停止 dev server

- 前台运行：Ctrl+C
- 后台启动：`wsl -e bash -c "pkill -f 'next dev'"`

## 验证（跑这条 skill 自己时）

完成上述 clickthrough 全 6 步 + 无控制台红色错误 = 通过。

Last verified against: Next.js 16.2.6 dev server · 2026-05-27
