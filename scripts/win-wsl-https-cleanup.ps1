# 清理本地 HTTPS 手机预览在 Windows 宿主上加的端口转发 + 防火墙规则。
# 流程：自提权 → 查询当前 portproxy(端口 443) 与防火墙规则 → 让你确认 → 删除 → 复查。
# 只用 netsh（cmd/PowerShell 通用），不用 *-Net* cmdlet。配套文档：docs/local-https-phone-access.md
#
# 运行：
#   从 WSL：  powershell.exe -ExecutionPolicy Bypass -File scripts/win-wsl-https-cleanup.ps1
#   从 Windows：右键 → 使用 PowerShell 运行（会自动弹 UAC 提权）
param(
  [int]$ListenPort = 443,
  [string]$FirewallRuleName = "WSL https LAN 443"
)
$ErrorActionPreference = "Continue"

# ── 自提权（删除需要管理员）。从 \\wsl.localhost 路径运行时先把脚本拷到本地 TEMP，
#    避免“提权后以 UNC 路径为当前目录”导致的启动失败。──
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "需要管理员权限，正在请求提权（请在 UAC 弹窗点“是”）..." -ForegroundColor Yellow
  $self = $PSCommandPath
  if ($self -like '\\*') {
    $local = Join-Path $env:TEMP 'win-wsl-https-cleanup.ps1'
    Copy-Item -LiteralPath $self -Destination $local -Force
    $self = $local
  }
  Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList @(
    '-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$self`"",
    '-ListenPort',"$ListenPort",'-FirewallRuleName',"`"$FirewallRuleName`""
  )
  exit
}

# ── 1) 查询 ──
Write-Host "`n=== 当前 portproxy 转发表 ===" -ForegroundColor Cyan
netsh interface portproxy show v4tov4

# 解析出监听端口 = $ListenPort 的条目（按 IP/端口正则匹配，不依赖本地化表头）
$targets = @()
foreach ($line in (netsh interface portproxy show v4tov4)) {
  if ($line -match '^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+(\d+)\s+(\d{1,3}(?:\.\d{1,3}){3})\s+(\d+)') {
    if ([int]$matches[2] -eq $ListenPort) {
      $targets += [pscustomobject]@{
        ListenAddr = $matches[1]
        Listen     = "$($matches[1]):$($matches[2])"
        Connect    = "$($matches[3]):$($matches[4])"
      }
    }
  }
}

Write-Host "`n=== 当前防火墙规则: $FirewallRuleName ===" -ForegroundColor Cyan
netsh advfirewall firewall show rule name="$FirewallRuleName"

# ── 2) 确认 ──
Write-Host "`n将删除以下项：" -ForegroundColor Yellow
if ($targets.Count -gt 0) {
  $targets | ForEach-Object { Write-Host "  · 转发 $($_.Listen) -> $($_.Connect)" }
} else {
  Write-Host "  · （没有监听端口 $ListenPort 的 portproxy 条目）"
}
Write-Host "  · 防火墙规则 `"$FirewallRuleName`"（若存在）"
$ans = Read-Host "`n确认删除？输入 y 确认，其它任意键取消"
if ($ans -ne 'y' -and $ans -ne 'Y') {
  Write-Host "已取消，未做任何删除。" -ForegroundColor Green
  Read-Host "按回车关闭"; exit
}

# ── 3) 删除 ──
foreach ($t in $targets) {
  netsh interface portproxy delete v4tov4 listenaddress=$($t.ListenAddr) listenport=$ListenPort
  Write-Host "已删转发 $($t.Listen)" -ForegroundColor Green
}
netsh advfirewall firewall delete rule name="$FirewallRuleName" | Out-Null
Write-Host "已删防火墙规则 $FirewallRuleName（若存在）" -ForegroundColor Green

# ── 4) 复查 ──
Write-Host "`n=== 复查 portproxy（应不再有 :$ListenPort 条目）===" -ForegroundColor Cyan
netsh interface portproxy show v4tov4
Read-Host "`n完成。按回车关闭"
