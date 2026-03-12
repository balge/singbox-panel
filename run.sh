#!/usr/bin/env bash
# 一键运行前后端
# 后端默认参数: PANEL_USERNAME=myuser PANEL_PASSWORD=mypass PANELS_DIR=../panels
# 可通过环境变量覆盖，例如: PANEL_USERNAME=u PANEL_PASSWORD=p PANELS_DIR=/path/to/panels ./run.sh
# 需要: Python 环境、Node 环境

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# 默认/可覆盖的环境变量（PANELS_DIR 默认为项目下的 panels）
export PANEL_USERNAME="${PANEL_USERNAME:-myuser}"
export PANEL_PASSWORD="${PANEL_PASSWORD:-mypass}"
export PANELS_DIR="${PANELS_DIR:-$ROOT/panels}"

# 检查 Python
if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
  echo "错误: 未找到 Python，请先安装 Python 环境"
  exit 1
fi

# 检查 Node（前端）
if ! command -v node >/dev/null 2>&1; then
  echo "错误: 未找到 Node，请先安装 Node 环境"
  exit 1
fi

# 安装后端 Python 依赖（使用 backend/.venv，避免与系统 Python 冲突）
VENV_DIR="$ROOT/backend/.venv"
if [ ! -d "$VENV_DIR" ]; then
  echo ">> 创建后端虚拟环境: $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi
echo ">> 安装/检查后端依赖 (pip install -r backend/requirements.txt)..."
"$VENV_DIR/bin/pip" install -q -r "$ROOT/backend/requirements.txt"

# 安装前端依赖
echo ">> 安装/检查前端依赖..."
if [ -f "$ROOT/frontend/yarn.lock" ]; then
  (cd "$ROOT/frontend" && yarn install --silent)
else
  (cd "$ROOT/frontend" && npm install --no-audit --no-fund)
fi

cleanup() {
  echo ""
  echo "正在停止后端 (PID $BACKEND_PID)..."
  kill "$BACKEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

# 启动后端（后台，使用 .venv 中的 Python）
echo "=========================================="
echo "后端: http://127.0.0.1:8000"
echo "  PANELS_DIR=$PANELS_DIR"
echo "  PANEL_USERNAME=$PANEL_USERNAME"
echo "  PANEL_PASSWORD=****"
echo "=========================================="
cd "$ROOT/backend"
PATH="$VENV_DIR/bin:$PATH" PANEL_USERNAME="$PANEL_USERNAME" PANEL_PASSWORD="$PANEL_PASSWORD" PANELS_DIR="$PANELS_DIR" ./run.sh &
BACKEND_PID=$!
cd "$ROOT"

# 等后端就绪
sleep 2
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "错误: 后端启动失败"
  exit 1
fi

# 启动前端（前台，Ctrl+C 会先停前端再停后端）
echo "正在启动前端..."
cd "$ROOT/frontend"
if [ -f yarn.lock ]; then
  yarn dev
else
  npm run dev
fi
