#!/bin/bash
# 发布 newenergy 到 service host。
#   ops/deploy.sh [--host root@8.138.202.79] [--ref <git-ref>] [--skip-build]
#
# 构建在 development host 上做（vite + esbuild --packages=external），只分发
# dist/ 与 package 清单；运行时依赖由目标机 `npm ci --omit=dev` 安装。
# data/ 是业务数据，本脚本绝不覆盖。
set -euo pipefail

HOST=root@8.138.202.79
REF=""
SKIP_BUILD=0
DEV_HOST_IP=154.9.24.30                       # 只放行 development host 访问服务端口
# 应用把端口写死在源码里（server.ts: const PORT = 8580），当前不是环境变量。
# 搬迁以"行为不变"为先，故沿用 8580，并作为 service host 上的既有例外登记；
# 等能把端口环境变量化时再挪进服务机端口池 15000-19999。
PORT=8580
APP_ROOT=/opt/newenergy-ai-article-platform
ENV_FILE=/etc/newenergy-ai-article-platform/env
SERVICE_USER=newenergy
SERVICE=newenergy
NPM_REGISTRY=https://registry.npmmirror.com   # 目标机出口到 npmjs 不通

while [ $# -gt 0 ]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --ref)  REF="$2";  shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    *) echo "未知参数：$1" >&2; exit 2 ;;
  esac
done

ROOT=$(git rev-parse --show-toplevel)
[ -n "$REF" ] || REF=$(git -C "$ROOT" rev-parse HEAD)
REF=$(git -C "$ROOT" rev-parse "$REF")
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

echo "==> 导出 $REF"
mkdir -p "$STAGE/src"
git -C "$ROOT" archive --format=tar "$REF" | tar x -C "$STAGE/src"

if [ "$SKIP_BUILD" -eq 0 ]; then
  echo "==> 构建（在 development host 上，临时目录里，不动工作区）"
  ( cd "$STAGE/src" && npm ci --no-audit --no-fund >/dev/null && npm run build >/dev/null )
fi
if [ ! -d "$STAGE/src/dist" ]; then
  echo "错误：$REF 没有产出 dist/，检查构建" >&2
  exit 1
fi

echo "==> 打包"
tar czf "$STAGE/app.tar.gz" -C "$STAGE/src" dist package.json package-lock.json
cp "$ROOT/ops/$SERVICE.service" "$STAGE/$SERVICE.service"

echo "==> 上传"
scp -q "$STAGE/app.tar.gz" "$STAGE/$SERVICE.service" "$HOST:/tmp/"

echo "==> 上线（$HOST）"
ssh "$HOST" bash -s <<REMOTE
set -euo pipefail
APP="$APP_ROOT"

if [ ! -f "$ENV_FILE" ]; then
  echo "缺少环境文件 $ENV_FILE（内容见 ops/README.md）" >&2
  exit 1
fi

if ! id -u $SERVICE_USER >/dev/null 2>&1; then
  adduser --system --group --no-create-home --home "\$APP" $SERVICE_USER
fi
install -d -m 755 -o $SERVICE_USER -g $SERVICE_USER "\$APP"
install -d -m 700 -o $SERVICE_USER -g $SERVICE_USER "\$APP/data"

STAGING=\$(mktemp -d)
trap 'rm -rf "\$STAGING"' EXIT
tar xzf /tmp/app.tar.gz -C "\$STAGING"

install -m 644 "\$STAGING/package.json" "\$APP/package.json"
install -m 644 "\$STAGING/package-lock.json" "\$APP/package-lock.json"

LOCK_SHA=\$(sha256sum "\$STAGING/package-lock.json" | cut -d' ' -f1)
if [ "\$LOCK_SHA" != "\$(cat "\$APP/.lock.sha256" 2>/dev/null || true)" ]; then
  echo "依赖清单变化，安装生产依赖"
  ( cd "\$APP" && npm ci --omit=dev --no-audit --no-fund --registry=$NPM_REGISTRY >/dev/null )
  printf '%s\n' "\$LOCK_SHA" > "\$APP/.lock.sha256"
fi

if [ -d "\$APP/dist" ]; then
  rm -rf "\$APP/dist.old"
  mv "\$APP/dist" "\$APP/dist.old"
fi
mv "\$STAGING/dist" "\$APP/dist"

install -m 644 /tmp/$SERVICE.service /etc/systemd/system/$SERVICE.service
ufw allow from $DEV_HOST_IP to any port $PORT proto tcp >/dev/null

chown -R $SERVICE_USER:$SERVICE_USER "\$APP/dist"
chown $SERVICE_USER:$SERVICE_USER "\$APP" "\$APP/package.json" "\$APP/package-lock.json"
[ -f "\$APP/.lock.sha256" ] && chown $SERVICE_USER:$SERVICE_USER "\$APP/.lock.sha256"

systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null 2>&1 || true
systemctl restart "$SERVICE"

for _ in \$(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
    echo "自检通过 http://127.0.0.1:$PORT/ (\$(systemctl is-active $SERVICE))"
    exit 0
  fi
  sleep 1
done
echo "自检失败：$SERVICE 未在 60s 内就绪" >&2
systemctl status "$SERVICE" --no-pager -n 20 >&2 || true
exit 1
REMOTE

echo "==> 完成：unit=$SERVICE port=$PORT ref=$REF"
