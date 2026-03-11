#!/usr/bin/env bash
# 本地启动后端，使用项目内 panels 目录（config.json、parts、logs、rules、panel_config 均在其下）
# 登录账号密码可通过环境变量覆盖，例如: PANEL_USERNAME=myuser PANEL_PASSWORD=mypass ./run.sh

set -e
cd "$(dirname "$0")"

ROOT="$(cd .. && pwd)"
PANELS_DIR="${PANELS_DIR:-$ROOT/panels}"
PANEL_USERNAME="${PANEL_USERNAME:-admin}"
PANEL_PASSWORD="${PANEL_PASSWORD:-admin}"

mkdir -p "$PANELS_DIR"/parts "$PANELS_DIR"/logs "$PANELS_DIR"/backups

export PANELS_DIR
export PANEL_USERNAME
export PANEL_PASSWORD

echo "PANELS_DIR=$PANELS_DIR"
echo "PANEL_USERNAME=$PANEL_USERNAME"
echo "PANEL_PASSWORD=****"
echo "Starting uvicorn on http://127.0.0.1:8000"
exec uvicorn app.main:app --reload --port 8000
