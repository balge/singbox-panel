#!/usr/bin/env bash
# 本地启动后端，使用项目内 config.json、panel、rule、log 目录
# 登录账号密码可通过环境变量覆盖，例如: PANEL_USERNAME=myuser PANEL_PASSWORD=mypass ./run.sh

set -e
cd "$(dirname "$0")"

ROOT="$(cd .. && pwd)"
CONFIG_PATH="${CONFIG_PATH:-$ROOT/config.json}"
PANEL_CONFIG_PATH="${PANEL_CONFIG_PATH:-$ROOT/panel/panel_config.json}"
RULES_DIR="${RULES_DIR:-$ROOT/rule}"
LOG_DIR="${LOG_DIR:-$ROOT/log}"
PANEL_USERNAME="${PANEL_USERNAME:-admin}"
PANEL_PASSWORD="${PANEL_PASSWORD:-admin}"

mkdir -p "$(dirname "$PANEL_CONFIG_PATH")" "$RULES_DIR" "$LOG_DIR"

export CONFIG_PATH
export PANEL_CONFIG_PATH
export RULES_DIR
export LOG_DIR
export PANEL_USERNAME
export PANEL_PASSWORD

echo "CONFIG_PATH=$CONFIG_PATH"
echo "PANEL_CONFIG_PATH=$PANEL_CONFIG_PATH"
echo "RULES_DIR=$RULES_DIR"
echo "LOG_DIR=$LOG_DIR"
echo "PANEL_USERNAME=$PANEL_USERNAME"
echo "PANEL_PASSWORD=****"
echo "Starting uvicorn on http://127.0.0.1:8000"
exec uvicorn app.main:app --reload --port 8000
