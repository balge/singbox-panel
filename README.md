# sing-box 配置面板

Web 面板，用于编辑 sing-box 的 `config.json`，支持登录、入站/出站/路由/规则集配置、机场订阅解析。最终以 Docker 镜像交付，可通过 GitHub Actions 发布到 ghcr.io。

## 功能

- **登录**：账号密码由环境变量 `PANEL_USERNAME` / `PANEL_PASSWORD` 配置
- **配置**：按 [sing-box 文档](https://sing-box.sagernet.org/zh/configuration/) 编辑 log（仅 level）、dns、inbounds、outbounds、route、experimental
- **入站**：默认端口 2081 / 2082 / 2083，可自由修改
- **出站**：支持机场订阅链接（明文多行或 Base64），解析为节点并追加
- **规则集**：默认 rule_set 可编辑，可添加远程或本地规则（本地规则写入 `/rule` 目录）

## 持久化路径（Volume）

| 路径 | 说明 | 示例挂载 |
|------|------|----------|
| `/panel` | 面板配置（如订阅列表） | `panel:/panel` |
| `/config.json` | sing-box 配置 | `./config.json:/config.json` |
| `/log` | 日志目录 | `log:/log` |
| `/rule` | 本地规则集文件 | `rule:/rule` |

## 环境变量

- `PANEL_USERNAME`：登录用户名（默认 `admin`）
- `PANEL_PASSWORD`：登录密码（默认 `admin`）
- `JWT_SECRET`：JWT 签名密钥（可选，生产建议设置）
- `CONFIG_PATH`：覆盖 sing-box 配置文件路径（默认 `/config.json`）
- `PANEL_CONFIG_PATH`：覆盖面板配置路径（默认 `/panel/panel_config.json`）
- `RULES_DIR`：覆盖规则目录（默认 `/rule`）
- `LOG_DIR`：日志目录（默认 `/log`）
- `STATIC_DIR`：前端静态文件目录（Docker 内置为 `/app/static`）

## 运行

### 本地开发

**方式一：使用启动脚本（推荐）**

项目已包含默认的 `panel/panel_config.json` 和 `rule/` 目录。在仓库根目录下执行：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run.sh
```

`run.sh` 会使用以下默认值（可通过环境变量覆盖）：

- `CONFIG_PATH`：仓库根目录的 `config.json`
- `PANEL_CONFIG_PATH`：`panel/panel_config.json`
- `RULES_DIR`：`rule/`
- `LOG_DIR`：`log/`
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
CONFIG_PATH=../config.json PANEL_CONFIG_PATH=../panel/panel_config.json RULES_DIR=../rule LOG_DIR=../log \
  PANEL_USERNAME=admin PANEL_PASSWORD=admin \
  uvicorn app.main:app --reload --port 8000
```

**前端（另开终端）**

```bash
cd frontend && npm install && npm run dev
```

前端开发时通过 Vite 代理访问 `http://127.0.0.1:8000/api`。

### Docker

```bash
docker run -d \
  -v panel:/panel \
  -v /path/to/config.json:/config.json \
  -v log:/log \
  -v rule:/rule \
  -e PANEL_USERNAME=admin \
  -e PANEL_PASSWORD=your_secret \
  -p 8000:8000 \
  ghcr.io/<owner>/<repo>:latest
```

访问 `http://localhost:8000` 打开面板。

### 发布到 ghcr.io

推送代码到 `main`/`master` 或创建 Release 后，GitHub Action 会构建并推送镜像到 `ghcr.io/<owner>/<repo>`。需启用仓库的 Actions 并保留默认 `GITHUB_TOKEN` 权限（packages: write）。

## 技术栈

- 后端：Python 3.12 + FastAPI
- 前端：React 18 + Vite + Ant Design 5
- 配置：sing-box 最新版 JSON 结构
