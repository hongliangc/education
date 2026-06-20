# 把 Windows 入站 443 转发到「当前」WSL 的 443，让同 WiFi 的手机经 Windows LAN IP 访问
# WSL 里的 https 预览栈（配合 scripts/dev-https.sh）。
#
# 为什么不用再手动改：
#   - listenaddress=0.0.0.0 → 不绑定具体 Windows LAN IP，DHCP 换 IP 也照常工作。
#   - 自动探测当前 WSL IP（不写死）→ WSL 重启换 IP 后，重跑本脚本即可，无需手敲。
#   - 防火墙规则按「端口」放行（不按 IP），一次性、持久。
#
# 用法（任选其一）：
#   A. 即时：右键「以管理员身份运行 PowerShell」，执行本脚本一次。WSL 重启后再跑一次即可。
#   B. 全自动：把本文件复制到 Windows 本地路径（如 C:\Users\<你>\），再用文件末尾的命令注册成
#      「登录时运行」的计划任务，之后开机/登录自动重建转发，彻底不用管。
#
#requires -RunAsAdministrator
param(
  [int]$Port = 443,
  [string]$Distro = ""   # 留空=WSL 默认发行版
)
$ErrorActionPreference = "Stop"

# 取当前 WSL IP（eth0 第一个 IPv4）
$wslArgs = @()
if ($Distro) { $wslArgs += @("-d", $Distro) }
$wslArgs += @("hostname", "-I")
$wslIp = (& wsl.exe @wslArgs).Trim().Split(" ")[0]
if (-not $wslIp) { throw "拿不到 WSL IP，确认 WSL 正在运行（先在 WSL 里跑 scripts/dev-https.sh 起栈）" }

# 重建 portproxy（先删后加，幂等；listenaddress=0.0.0.0 不随 Windows LAN IP 变化）
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$Port 2>$null | Out-Null
netsh interface portproxy add    v4tov4 listenaddress=0.0.0.0 listenport=$Port connectaddress=$wslIp connectport=$Port

# 防火墙放行（一次性、持久，按端口不按 IP）
if (-not (Get-NetFirewallRule -DisplayName "WSL https $Port" -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName "WSL https $Port" -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow | Out-Null
}

Write-Host "✅ 0.0.0.0:$Port  ->  WSL ${wslIp}:$Port  （防火墙已放行）"
netsh interface portproxy show all

# ── 可选：注册成「登录时自动运行」，之后彻底不用手动（把本文件放到 Windows 本地路径后，管理员跑一次）──
#   $p = "C:\Users\<你>\win-wsl-https-forward.ps1"
#   $action    = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$p`""
#   $trigger   = New-ScheduledTaskTrigger -AtLogOn
#   $principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -RunLevel Highest -LogonType Interactive
#   Register-ScheduledTask -TaskName "WSL https 443 forward" -Action $action -Trigger $trigger -Principal $principal -Force
