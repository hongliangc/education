#!/usr/bin/env bash
# 现网 TLS：给裸公网 IP 申请 Let's Encrypt 证书（IP 证书=短期约 6 天，自动续签），供 nginx 443 终结。
# 在【服务器】上以 root/sudo 跑（ubuntu@119.91.153.49）。分阶段、幂等。
#
#   sudo bash scripts/setup-prod-tls.sh bootstrap      # 建目录 + 自签占位证书（部署 443 overlay 前先跑）
#   sudo bash scripts/setup-prod-tls.sh issue          # certbot 签 LE IP 证书 → 装到 /opt/kidora/tls → reload nginx
#   sudo bash scripts/setup-prod-tls.sh renew-install  # 装/校验自动续签（续签后自动同步证书 + reload）
#   sudo bash scripts/setup-prod-tls.sh status         # 看证书与续签状态
#
# 变量：IP / TLS_DIR / WEBROOT / NGINX_CONTAINER / ACME_EMAIL（留空=无邮箱注册）。
set -euo pipefail

IP="${IP:-119.91.153.49}"
TLS_DIR="${TLS_DIR:-/opt/kidora/tls}"
WEBROOT="${WEBROOT:-/opt/kidora/acme-webroot}"
NGINX_CONTAINER="${NGINX_CONTAINER:-kidora-nginx-1}"
LE_LIVE="/etc/letsencrypt/live/$IP"
ACME_EMAIL="${ACME_EMAIL:-}"

reload_nginx() {
  if docker exec "$NGINX_CONTAINER" nginx -t >/dev/null 2>&1; then
    docker exec "$NGINX_CONTAINER" nginx -s reload && echo "  nginx reloaded"
  else
    echo "  ⚠ 容器内 nginx -t 失败，未 reload（保持旧配置）" >&2; return 1
  fi
}

install_certs_from_le() {
  cp -L "$LE_LIVE/fullchain.pem" "$TLS_DIR/fullchain.pem"
  cp -L "$LE_LIVE/privkey.pem"   "$TLS_DIR/privkey.pem"
  chmod 644 "$TLS_DIR/fullchain.pem"; chmod 640 "$TLS_DIR/privkey.pem"
}

ensure_certbot() {
  if command -v certbot >/dev/null 2>&1; then return; fi
  echo "▶ 安装 certbot"
  if command -v snap >/dev/null 2>&1; then
    snap install --classic certbot && ln -sf /snap/bin/certbot /usr/local/bin/certbot && return
  fi
  apt-get update -qq && apt-get install -y -qq certbot
}

cmd_bootstrap() {
  mkdir -p "$TLS_DIR" "$WEBROOT"
  if [ ! -s "$TLS_DIR/fullchain.pem" ]; then
    echo "▶ 生成自签 bootstrap 证书（让 nginx 443 先起来，稍后被 LE 替换）"
    openssl req -x509 -newkey rsa:2048 -nodes -days 3 \
      -keyout "$TLS_DIR/privkey.pem" -out "$TLS_DIR/fullchain.pem" \
      -subj "/CN=$IP" -addext "subjectAltName=IP:$IP" 2>/dev/null
    chmod 644 "$TLS_DIR/fullchain.pem"; chmod 640 "$TLS_DIR/privkey.pem"
  else
    echo "▶ 已有证书，跳过 bootstrap：$TLS_DIR/fullchain.pem"
  fi
  echo "✅ bootstrap done：$TLS_DIR + $WEBROOT"
}

cmd_issue() {
  ensure_certbot
  mkdir -p "$WEBROOT"
  local email_args
  if [ -n "$ACME_EMAIL" ]; then email_args=(-m "$ACME_EMAIL" --no-eff-email); else email_args=(--register-unsafely-without-email); fi
  echo "▶ certbot 申请 LE IP 证书（webroot http-01，短期证书 profile）：$IP"
  # LE 的 IP 证书必须用 --ip-address（不是 -d，-d 会被当 DNS 名而拒绝），且只签短期证书。
  certbot certonly --webroot -w "$WEBROOT" --ip-address "$IP" \
    --preferred-profile shortlived \
    --non-interactive --agree-tos "${email_args[@]}" \
    --deploy-hook "bash $(readlink -f "$0") deploy-hook"
  install_certs_from_le
  reload_nginx
  echo "✅ LE 证书已装并生效：$TLS_DIR"
}

cmd_deploy_hook() {
  # certbot 续签成功后自动调用：同步证书到 nginx 挂载目录并 reload
  install_certs_from_le
  reload_nginx
}

cmd_renew_install() {
  ensure_certbot
  systemctl enable --now snap.certbot.renew.timer 2>/dev/null \
    || systemctl enable --now certbot.timer 2>/dev/null || true
  echo "▶ 续签 timer："; systemctl list-timers '*certbot*' --no-pager 2>/dev/null | head -5 || true
  echo "▶ 干跑续签校验："; certbot renew --dry-run || echo "  ⚠ dry-run 失败，检查上面输出"
}

cmd_status() {
  echo "=== $TLS_DIR ==="; ls -l "$TLS_DIR" 2>/dev/null || true
  echo "=== 证书有效期 ==="; openssl x509 -in "$TLS_DIR/fullchain.pem" -noout -issuer -subject -dates 2>/dev/null || true
  echo "=== certbot certificates ==="; certbot certificates 2>/dev/null || true
  echo "=== 续签 timer ==="; systemctl list-timers '*certbot*' --no-pager 2>/dev/null | head -5 || true
}

case "${1:-}" in
  bootstrap)     cmd_bootstrap ;;
  issue)         cmd_issue ;;
  deploy-hook)   cmd_deploy_hook ;;
  renew-install) cmd_renew_install ;;
  status)        cmd_status ;;
  all)           cmd_bootstrap; cmd_issue; cmd_renew_install ;;
  *) echo "用法: sudo bash $0 {bootstrap|issue|renew-install|status|all}" >&2; exit 64 ;;
esac
