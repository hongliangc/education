# 把同 WiFi 手机的访问引到 WSL 里的 https 预览栈（配合 scripts/dev-https.sh）。
# 监听 Windows LAN IP:443 → 转发到 127.0.0.1:443（由 WSL 的 wslrelay 桥接到 WSL nginx）。
#
# 为什么转发目标用回环 127.0.0.1（而不是 WSL IP）——绕开两个本机坑：
#   - wslrelay 已占 127.0.0.1:443 / ::1:443（localhostForwarding）→ 监听绑「具体 LAN IP」，别用 0.0.0.0。
#   - sing-box / VPN 的 TUN 常是默认路由 → 转发目标若写 WSL IP(172.x) 会被吞；写 127.0.0.1 不经路由表。
# 与 scripts/win-wsl-https-cleanup.ps1 配套：同一套监听 IP 与规则名（WSL https <Port>）。
# 每次运行会先清掉所有监听本端口的旧 portproxy（含旧版的 0.0.0.0）和旧命名的防火墙规则，幂等不并存。
#
# 用法：
#   从 WSL：    powershell.exe -ExecutionPolicy Bypass -File scripts/win-wsl-https-forward.ps1
#   从 Windows：右键 → 使用 PowerShell 运行（会自动弹 UAC 提权）
# Windows LAN IP（DHCP）变了重跑即可；WSL IP 变了不用动（转发到 127.0.0.1）。
param(
  [int]$Port = 443,
  [string]$LanIp = "",                          # 留空=自动探测 Windows LAN IP
  [string]$FirewallRuleName = "WSL https LAN $Port"
)
$ErrorActionPreference = "Stop"

# ── 自提权（改 portproxy/防火墙需要管理员）。从 \\wsl.localhost 路径运行时先拷到本地 TEMP 再提权。──
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "需要管理员权限，正在请求提权（请在 UAC 弹窗点“是”）..." -ForegroundColor Yellow
  $self = $PSCommandPath
  if ($self -like '\\*') {
    $local = Join-Path $env:TEMP 'win-wsl-https-forward.ps1'
    Copy-Item -LiteralPath $self -Destination $local -Force
    $self = $local
  }
  Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList @(
    '-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$self`"",
    '-Port',"$Port",'-LanIp',"`"$LanIp`"",'-FirewallRuleName',"`"$FirewallRuleName`""
  )
  exit
}

# ── 探测 Windows LAN IP（排除 WSL/vEthernet/Loopback 虚拟网卡，优先 192.168./10. 私网段）──
if (-not $LanIp) {
  $LanIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and
      $_.InterfaceAlias -notlike '*WSL*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and
      $_.InterfaceAlias -notlike '*Loopback*'
    } | Where-Object { $_.IPAddress -match '^(192\.168\.|10\.)' } |
    Select-Object -First 1 -ExpandProperty IPAddress
}
if (-not $LanIp) { throw "拿不到 Windows LAN IP，请确认已连 WiFi，或手动指定：-LanIp 192.168.x.x" }

# ── 先清旧映射，避免并存冲突：删所有监听本端口的 portproxy（含旧版 0.0.0.0 和任意 LAN IP）──
foreach ($line in (netsh interface portproxy show v4tov4)) {
  if ($line -match '^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+(\d+)\s+') {
    if ([int]$matches[2] -eq $Port) {
      netsh interface portproxy delete v4tov4 listenaddress=$($matches[1]) listenport=$Port 2>$null | Out-Null
    }
  }
}
# 旧命名的防火墙规则（早期版本叫 "WSL https <Port>"）也一并清掉，统一到 $FirewallRuleName
netsh advfirewall firewall delete rule name="WSL https $Port" 2>$null | Out-Null
netsh advfirewall firewall delete rule name="$FirewallRuleName" 2>$null | Out-Null

# ── 加新映射：LAN IP:$Port → 127.0.0.1:$Port，并放行防火墙 ──
netsh interface portproxy add v4tov4 listenaddress=$LanIp listenport=$Port connectaddress=127.0.0.1 connectport=$Port
netsh advfirewall firewall add rule name="$FirewallRuleName" dir=in action=allow protocol=TCP localport=$Port | Out-Null

Write-Host "`n✅ ${LanIp}:$Port  ->  127.0.0.1:$Port  ->  (wslrelay) WSL nginx   （防火墙已放行）" -ForegroundColor Green
Write-Host "   手机同 WiFi 打开： https://$LanIp" -ForegroundColor Green
netsh interface portproxy show v4tov4
Read-Host "`n完成。按回车关闭"
