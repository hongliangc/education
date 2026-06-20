#!/usr/bin/env bash
# 本地 HTTPS 预览：mkcert 自签可信证书 + nginx 443 终结，让同 WiFi 的手机能拿到麦克风
# 权限测试和小精灵语音对话（getUserMedia 只在 secure context 下可用，明文 http 的 LAN IP 不行）。
#
#   bash scripts/dev-https.sh
#
# 覆盖项：WIN_LAN_IP（手机访问的 Windows 宿主 LAN IP）、WSL_IP（WSL eth0，端口转发的目标）。
set -euo pipefail
cd "$(dirname "$0")/.."

CERT_DIR="deploy/certs"

# 自动探测手机访问用的 Windows 宿主 LAN IP：排除 WSL/vEthernet/Hyper-V 等虚拟网卡，
# 优先 192.168./10. 私网段。探测不到再回退环境变量/已知值。
# —— IP 变了直接重跑本脚本即可：会自动按新 IP 重签证书、并打印新的 netsh 命令；
#    手机已装的 mkcert rootCA 不用动（它信任同一 CA 签出的任何叶证书）。
detect_win_lan_ip() {
  powershell.exe -NoProfile -Command \
    "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.IPAddress -notlike '127.*' -and \$_.IPAddress -notlike '169.254.*' -and \$_.InterfaceAlias -notlike '*WSL*' -and \$_.InterfaceAlias -notlike '*vEthernet*' -and \$_.InterfaceAlias -notlike '*Loopback*' } | Select-Object -ExpandProperty IPAddress" 2>/dev/null \
    | tr -d '\r' | grep -E '^(192\.168\.|10\.)' | head -1
}
WIN_LAN_IP="${WIN_LAN_IP:-$(detect_win_lan_ip || true)}"
WIN_LAN_IP="${WIN_LAN_IP:-192.168.0.102}"
WSL_IP="${WSL_IP:-$(ip -4 addr show eth0 2>/dev/null | grep -oP 'inet \K[0-9.]+' | head -1)}"
echo "▶ 手机访问 IP（Windows LAN）：$WIN_LAN_IP   端口转发目标（WSL）：$WSL_IP"
SANS=(localhost 127.0.0.1 "$WIN_LAN_IP")
[ -n "$WSL_IP" ] && SANS+=("$WSL_IP")

# ── 1) mkcert 在否 ──
if ! command -v mkcert >/dev/null 2>&1; then
  cat >&2 <<'EOF'
需要 mkcert（生成设备可信的本地证书）。安装：
  sudo apt-get update && sudo apt-get install -y libnss3-tools
  curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
  chmod +x mkcert-v*-linux-amd64 && sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
  mkcert -install      # 建本地 CA 并装入本机信任库
然后重跑：bash scripts/dev-https.sh
EOF
  exit 1
fi

# 建本地 CA（幂等；失败不致命，手机端无论如何要手动装 rootCA）
mkcert -install >/dev/null 2>&1 || true

# ── 2) 生成/更新证书：SAN 必须含手机访问的 WIN_LAN_IP，否则重签 ──
mkdir -p "$CERT_DIR"
if [ -f "$CERT_DIR/fullchain.pem" ] &&
   openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -ext subjectAltName 2>/dev/null | grep -q "$WIN_LAN_IP"; then
  echo "▶ 复用已有证书（已含 $WIN_LAN_IP）：$CERT_DIR/fullchain.pem"
else
  echo "▶ mkcert 生成证书（SAN: ${SANS[*]}）"
  mkcert -cert-file "$CERT_DIR/fullchain.pem" -key-file "$CERT_DIR/privkey.pem" "${SANS[@]}"
fi

# ── 3) 起本地 https 预览栈（复用 release.sh local + overlay）──
export LOCAL_PUBLIC_URL="https://$WIN_LAN_IP"
export COMPOSE_OVERLAY="deploy/docker-compose.https.yml"
# 探活从 WSL 走 http://localhost（netsh 端口转发尚未建时，https://WIN_LAN_IP 在 WSL 不可达）。
export HEALTH_URL="${HEALTH_URL:-http://localhost/api/health}"
echo "▶ 启动本地 https 预览栈：$LOCAL_PUBLIC_URL"
bash scripts/release.sh local

# ── 4) 打印脚本做不了的人工步骤 ──
CAROOT="$(mkcert -CAROOT 2>/dev/null || echo '<mkcert -CAROOT>')"
cat <<EOF

────────────────────────────────────────────────────────
✅ 本地 https 预览已起。桌面浏览器：https://localhost
   （桌面若仍报不安全，把 $CAROOT/rootCA.pem 导入系统/浏览器信任库；不影响手机测试）

📱 手机测麦克风，还差两步（一次性）：

1) Windows 端口转发——【必须管理员】PowerShell（listenaddress=0.0.0.0 → 之后 IP 变了也不用重做）：
   netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=443 connectaddress=$WSL_IP connectport=443
   New-NetFirewallRule -DisplayName "WSL https 443" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
   —— 或直接跑助手脚本（自动探测 WSL IP，WSL 重启换 IP 后重跑一次即可；可注册成登录自动运行）：
   powershell -ExecutionPolicy Bypass -File scripts/win-wsl-https-forward.ps1
   撤销：netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=443

2) 手机装 mkcert 根证书（信任 → 无警告 → secure context → 麦克风可用）：
   根证书：$CAROOT/rootCA.pem  （传到手机：微信/邮件/U盘）
   - iOS：安装描述文件后，设置→通用→关于→证书信任设置→对 mkcert 根证书开「完全信任」
   - Android：设置→安全→加密与凭据→安装证书→CA 证书

然后手机浏览器开  https://$WIN_LAN_IP  →进精灵聊天→点「按住说话」，应弹出麦克风授权。
────────────────────────────────────────────────────────
EOF
