# 本地 HTTPS 手机预览：Windows 端口转发 + 防火墙

同 WiFi 手机访问 WSL2 里的本地 https 栈（用 `scripts/dev-https.sh` 起，手机开
`https://<Windows-LAN-IP>`；麦克风/语音需要 https 安全上下文）。除了起栈，还要在
**Windows 宿主**做一次端口转发 + 防火墙放行。本文档记录当前规则、查看与清理命令。

当前实测值（会随 DHCP/重启变）：Windows LAN IP `192.168.0.105`、WSL IP `172.30.196.219`。
下文命令里的 `192.168.0.105` 都换成你当前的 Windows LAN IP（`ipconfig` 看 WLAN 的 IPv4，
或 `(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias WLAN).IPAddress`）。

## 为什么需要 / 为什么这样设

WSL2 默认 NAT：手机访问的是 **Windows 宿主的 LAN IP**，不是 WSL 的 `172.x`。需要把
Windows 的 `LAN:443` 引到 WSL 的 nginx。

转发**目标用回环 `127.0.0.1`**（而不是 WSL IP），是为绕开本机两个坑：

- `wslrelay.exe` 已占用 `127.0.0.1:443` / `::1:443`（WSL localhostForwarding 自动把容器
  443 镜像到 Windows 回环）——所以监听端要**绑具体 LAN IP**，别用 `0.0.0.0`（会和它撞）。
- `sing-box` / VPN 的 TUN 常是默认路由（metric 0）——转发目标若写 WSL IP（`172.x`）会被
  VPN 吞掉；写 `127.0.0.1` 走回环、不经路由表、不过 VPN，再由 `wslrelay` 自动桥接到 WSL。

完整链路：

```
手机 → https://192.168.0.105 → Windows portproxy(192.168.0.105:443)
     → 127.0.0.1:443 → wslrelay → WSL nginx:443 → web
```

> 下面统一用 `netsh` / `netstat`，**命令行（cmd.exe）和 PowerShell 都能跑**。
> 不要用 `Get-NetFirewallRule` / `Get-NetTCPConnection` / `New-NetFirewallRule` /
> `Remove-NetFirewallRule`——那些是 **PowerShell 专属 cmdlet**，在 cmd.exe 或 WSL
> 的 bash 提示符里会报「无法执行 / 不是内部或外部命令」。

## 设置（以管理员身份打开「命令提示符」或 PowerShell）

```bat
netsh interface portproxy add v4tov4 listenaddress=192.168.0.105 listenport=443 connectaddress=127.0.0.1 connectport=443
netsh advfirewall firewall add rule name="WSL https LAN 443" dir=in action=allow protocol=TCP localport=443
```

## 查看（无需管理员）

```bat
:: 转发表（应看到 192.168.0.105:443 → 127.0.0.1:443）
netsh interface portproxy show v4tov4

:: 防火墙规则
netsh advfirewall firewall show rule name="WSL https LAN 443"

:: 谁在听 443（127.0.0.1=wslrelay、192.168.0.105=portproxy；只看 LISTENING）
netstat -ano | findstr LISTENING | findstr :443

:: 端到端验证：期望输出 200
curl.exe -ks https://192.168.0.105/login -o NUL -w "%{http_code}\n"
```

## 清理 / 卸载

**推荐用脚本**（自提权 → 先查询 → 让你确认 → 删除 → 复查）：

```bash
# 从 WSL：
powershell.exe -ExecutionPolicy Bypass -File scripts/win-wsl-https-cleanup.ps1
# 或在 Windows 里右键 scripts/win-wsl-https-cleanup.ps1 → 使用 PowerShell 运行
```

**手动**（以管理员身份打开「命令提示符」或 PowerShell）：

```bat
netsh interface portproxy delete v4tov4 listenaddress=192.168.0.105 listenport=443
netsh advfirewall firewall delete rule name="WSL https LAN 443"
```

清理后确认转发表为空：`netsh interface portproxy show v4tov4`。

## 何时需要重做

- **Windows LAN IP（DHCP）变了** → 先 `delete` 旧的、再按新 IP `add`；同时重跑
  `scripts/dev-https.sh` 让证书 SAN 与 `NEXTAUTH_URL` 跟上新 IP。
- **WSL IP 变了** → **不用动**（转发目标是 `127.0.0.1`，`wslrelay` 自动跟踪 WSL IP）。
- **重启电脑** → portproxy + 防火墙规则会保留；只需确认 WSL Docker 栈已重新起来
  （`bash scripts/docker-start.sh`，或重跑 `scripts/dev-https.sh`）。

## 与 `scripts/win-wsl-https-forward.ps1` 的区别

那个助手脚本用 `listenaddress=0.0.0.0` + `connectaddress=<WSL_IP>`：在**没有** wslrelay
占用 443、**没有** VPN TUN 的机器上可用。本机这两者都有，所以改用本文档的
`listenaddress=<LAN_IP>` + `connectaddress=127.0.0.1`（已实测可达）。

## 证书提示

手机首次会提示「不私密 / 不受信任」（mkcert 自签证书）。仅浏览 / 看视频：点
「显示详情 → 仍要访问」即可。**麦克风 / 语音需要受信任证书**（绕过警告不算安全上下文），
要用就把 mkcert 根证书（`~/.local/share/mkcert/rootCA.pem`）装到手机并设为「完全信任」。
