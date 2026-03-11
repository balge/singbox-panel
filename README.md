# sing-box 配置面板

Web 面板，用于编辑 sing-box 的 `config.json`，支持登录、入站/出站/路由/规则集配置、机场订阅解析。最终以 Docker 镜像交付，可通过 GitHub Actions 发布到 ghcr.io。

## 功能

- **登录**：账号密码由环境变量 `PANEL_USERNAME` / `PANEL_PASSWORD` 配置
- **配置**：按 [sing-box 文档](https://sing-box.sagernet.org/zh/configuration/) 编辑 log（仅 level）、dns、inbounds、outbounds、route、experimental
- **入站**：默认端口 2081 / 2082 / 2083，可自由修改
- **出站**：支持机场订阅链接（明文多行或 Base64），解析为节点并追加
- **规则集**：路由与规则均在 parts 的 route 等模块中配置，无单独 rules 目录

## 持久化路径（Volume）

统一使用 **panels** 目录，其下包含：

| 路径 | 说明 |
|------|------|
| `panels/config.json` | 合并后的 sing-box 主配置 |
| `panels/parts/` | 模块化配置（log、inbounds、outbounds、route、dns、experimental 等，含路由规则） |
| `panels/logs/` | 日志目录 |
| `panels/panel_config.json` | 面板配置（如订阅列表） |
| `panels/backups/` | 配置备份 |

Docker 只需挂载一个卷，例如：`-v panels_data:/panels` 或 `-v ./panels:/panels`。

## 环境变量

- `PANEL_USERNAME`：登录用户名（默认 `admin`）
- `PANEL_PASSWORD`：登录密码（默认 `admin`）
- `JWT_SECRET`：JWT 签名密钥（可选，生产建议设置）
- `PANELS_DIR`：统一配置目录（默认 `/panels`），其下包含 config.json、parts、logs、panel_config.json、backups
- `USE_PARTS`：是否使用模块化 parts（默认 `true`）
- `STATIC_DIR`：前端静态文件目录（Docker 内置为 `/app/static`）
- `SINGBOX_RESTART_CMD`：应用配置后重启 sing-box 的命令，逗号分隔，如 `killall,-HUP,sing-box`

## 运行

### 本地开发

**方式一：使用启动脚本（推荐）**

项目已包含默认的 `panels/` 目录。在仓库根目录下执行：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run.sh
```

`run.sh` 会使用以下默认值（可通过环境变量覆盖）：

- `PANELS_DIR`：仓库根目录下的 `panels/`（其内包含 config.json、parts、logs、panel_config.json、backups）
- `PANEL_USERNAME`：`admin`（前端登录用户名）
- `PANEL_PASSWORD`：`admin`（前端登录密码）

自定义账号密码示例：

```bash
PANEL_USERNAME=myuser PANEL_PASSWORD=mypass ./run.sh
```

**方式二：手动指定环境变量**

```bash
cd backend
source .venv/bin/activate
PANELS_DIR=../panels PANEL_USERNAME=admin PANEL_PASSWORD=admin \
  uvicorn app.main:app --reload --port 8000
```

**前端（另开终端）**

```bash
cd frontend && pnpm install && pnpm run dev
```

前端开发服务器端口为 **35173**，通过 Vite 代理访问 `http://127.0.0.1:35173`，API 代理到 `http://127.0.0.1:8000`。

### Docker

```bash
docker run -d \
  -v panels_data:/panels \
  -e PANEL_USERNAME=admin \
  -e PANEL_PASSWORD=your_secret \
  -p 8000:8000 \
  ghcr.io/<owner>/<repo>:latest
```

或使用 docker-compose（推荐）：

```bash
PANEL_PASSWORD=your_secret docker compose up -d
```

访问 `http://localhost:8000` 打开面板。

### 发布到 ghcr.io

推送代码到 `main`/`master` 或创建 Release 后，GitHub Action 会构建并推送镜像到 `ghcr.io/<owner>/<repo>`。需启用仓库的 Actions 并保留默认 `GITHUB_TOKEN` 权限（packages: write）。

## 技术栈

- 后端：Python 3.12 + FastAPI
- 前端：React 18 + Vite + Ant Design 5
- 配置：sing-box 最新版 JSON 结构
