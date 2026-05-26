#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-8888}"
URL="http://localhost:${PORT}/"

echo ""
echo "  六级核心词背诵检测站"
echo "  ----------------------"
echo "  目录: $(pwd)"
echo ""

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "[错误] 未找到 Python。请安装 Python 3："
  echo "       macOS: brew install python3"
  echo "       或访问 https://www.python.org/downloads/"
  exit 1
fi

echo "  启动本地服务: ${URL}"
echo "  按 Ctrl+C 可停止服务"
echo ""

if [[ "$(uname -s)" == "Darwin" ]]; then
  open "${URL}" 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${URL}" 2>/dev/null || true
fi

exec "${PYTHON}" -m http.server "${PORT}"
