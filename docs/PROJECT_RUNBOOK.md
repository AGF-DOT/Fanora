# Fanora 项目完整运行手册

本文覆盖 Fanora 的前端、FastAPI 后端和 Monad Testnet 合约。命令默认在仓库根目录执行：

```text
C:\Users\zxbbx\Desktop\比赛\Fanora
```

Linux/macOS 用户将下面的路径替换为自己的仓库路径即可。

## 1. 环境要求

- Node.js `>= 20.11` 和 npm
- Python `>= 3.13`
- `uv`（后端依赖和虚拟环境管理）
- Git
- Docker Desktop（仅在使用本地 PostgreSQL、Valkey 或完整容器环境时需要）
- 一个安装了 MetaMask 等钱包的浏览器
- Monad Testnet 测试币（仅部署合约或发送链上交易时需要）

检查工具：

```powershell
node --version
npm --version
py --version
uv --version
docker --version       # 可选
```

合约和后端部署钱包必须是测试网专用钱包。任何私钥都不能写入 `NEXT_PUBLIC_*` 变量、提交到 Git 或发送给他人。

## 2. 配置环境变量

### 2.1 前端

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

编辑 `frontend/.env.local`，至少确认：

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_RPC_URL=https://rpc.monad.xyz
```

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` 在 [WalletConnect Cloud](https://cloud.walletconnect.com/) 创建项目后取得。`NEXT_PUBLIC_PRIVY_APP_ID` 是可选项；不使用 Privy 时可以留空。

合约部署完成后，三个 `NEXT_PUBLIC_*_CONTRACT_ADDRESS_MONAD_TESTNET` 地址会由 `contracts` 的同步脚本自动写入。

### 2.2 后端

```powershell
Copy-Item backend\.env.example backend\.env
```

默认配置使用本地 SQLite：

```env
ENVIRONMENT=development
DATABASE_URL=sqlite+aiosqlite:///./fanora.db
AUTO_CREATE_SCHEMA=true
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

没有模型密钥时，后端仍可启动；涉及 LLM 或图片生成的功能会使用降级逻辑或不可用。需要 AI 功能时再填写 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 和模型名。

合约部署后，`backend/.env` 会由同步脚本写入合约地址、起始区块和与部署钱包相同的运营角色私钥（如果角色确实共用部署钱包）。不同运营角色的私钥必须手动配置。

### 2.3 合约部署配置

```powershell
Copy-Item contracts\.env.example contracts\.env
```

部署前编辑 `contracts/.env`。最小配置如下：

```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
DEPLOYER_PRIVATE_KEY=0x...
CONTRACT_ADMIN_ADDRESS=0x...
MEMBERSHIP_TREASURY_ADDRESS=0x...
```

其余角色地址（`TREASURY_MANAGER_ADDRESS`、`IDENTITY_*_ADDRESS`、`COLLECTIBLE_*_ADDRESS`）测试阶段可以先填同一个测试部署钱包；正式环境应拆分为最小权限钱包或多签。

`DEPLOYER_PRIVATE_KEY` 对应的钱包必须有 MON 测试币。`MEMBERSHIP_TREASURY_ADDRESS` 是收款地址，不是私钥。

## 3. 安装依赖

### 3.1 前端

```powershell
cd frontend
npm install
cd ..
```

### 3.2 后端

```powershell
cd backend
uv sync --all-extras --group dev
cd ..
```

如果 `uv` 的默认缓存目录没有写权限，可以把缓存放到项目内：

```powershell
cd backend
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
$env:UV_PYTHON_INSTALL_DIR = (Join-Path (Get-Location) '.uv-python')
uv sync --all-extras --group dev
cd ..
```

### 3.3 合约

```powershell
cd contracts
npm install
cd ..
```

## 4. 启动后端

### 4.1 SQLite 快速启动（推荐本地开发）

在一个终端窗口执行：

```powershell
cd backend
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --timeout-keep-alive 60
```

Windows 也可以直接使用已创建的虚拟环境：

```powershell
cd backend
\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

验证：

- 健康检查：<http://127.0.0.1:8000/health>
- API 健康检查：<http://127.0.0.1:8000/api/v1/health>
- OpenAPI 文档：<http://127.0.0.1:8000/docs>
- Prometheus 指标：<http://127.0.0.1:8000/metrics>

开发模式下 `AUTO_CREATE_SCHEMA=true` 会自动创建 SQLite 表并写入默认产品数据。停止服务使用 `Ctrl+C`。

### 4.2 本地 PostgreSQL/Valkey

需要 Docker Desktop 时，在另一个终端执行：

```powershell
cd backend
docker compose up -d db valkey
```

将 `backend/.env` 的数据库配置改为：

```env
DATABASE_URL=postgresql+psycopg://fanora:fanora-local-password@127.0.0.1:5432/fanora
CACHE_URL=redis://127.0.0.1:6379/0
AUTO_CREATE_SCHEMA=false
```

等待数据库就绪后运行迁移，再启动 API：

```powershell
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --timeout-keep-alive 60
```

停止本地依赖：

```powershell
docker compose stop db valkey
```

也可以使用完整容器环境：

```powershell
docker compose up -d --build db valkey app
```

## 5. 启动前端

保持后端运行，在第二个终端执行：

```powershell
cd frontend
npm run dev -- --hostname 127.0.0.1 --port 3000
```

浏览器访问 <http://127.0.0.1:3000>。

前端首次编译可能需要较长时间。修改 `frontend/.env.local` 后必须重启 Next.js 才会读取新值。

## 6. 编译和测试合约

先安装依赖并确认 `contracts/.env` 已配置：

```powershell
cd contracts
npm test
npm run compile
```

`npm run compile` 会编译 Solidity，并把三个合约的公开 ABI 导出到：

```text
shared/contracts/
backend/app/contracts/
```

## 7. 部署 Monad Testnet 合约

### 7.1 一键发布（推荐）

确认以下条件后执行：

1. 钱包网络为 Monad Testnet，链 ID 为 `10143`。
2. `DEPLOYER_PRIVATE_KEY` 对应账户有足够 MON 测试币。
3. `backend/.env` 和 `frontend/.env.local` 已存在，因为同步脚本会更新它们。
4. 这是一次新部署或你明确希望创建一套新的合约地址。

```powershell
cd contracts
npm run release:testnet
```

该命令依次执行合约测试、编译和 ABI 导出、部署三个合约、配置会员等级和角色、同步前后端配置，并验证链上 bytecode、会费和角色。

部署结果：

```text
contracts/deployments/monadTestnet.json
shared/contracts/monadTestnet.deployment.json
```

### 7.2 分步发布

需要逐步排查时执行：

```powershell
cd contracts
npm run compile
npm run deploy:testnet
npm run sync:testnet
npm run verify:testnet
```

`deploy:testnet` 会生成新的 `contracts/deployments/monadTestnet.json`。`sync:testnet` 会更新：

- `backend/.env` 中的合约地址和起始区块；
- `frontend/.env.local` 中的公开合约地址；
- `shared/contracts/monadTestnet.deployment.json`；
- `backend/app/contracts/` 中的 ABI。

同步完成后，重启后端和前端。

### 7.3 单独重部署某个合约

只有在确认迁移影响后才使用：

```powershell
cd contracts
npm run redeploy:gateway:testnet
npm run deploy:identity:testnet
npm run deploy:collectibles:testnet
npm run sync:testnet
npm run verify:testnet
```

单独重部署可能造成前端、后端和链上旧数据不一致；生产环境应先备份部署清单并制定迁移方案。

## 8. 钱包和链上功能检查

1. 打开 <http://127.0.0.1:3000>，点击连接钱包。
2. 在 MetaMask 中切换到 Monad Testnet。
3. 访问 `/login`，完成钱包签名登录。签名只用于一次性 challenge，不会把用户私钥发送给后端。
4. 访问 `/membership/join` 测试会员交易。若会费为 `0`，通常不需要支付 MON，但仍会发送链上交易。
5. 会员验证成功后，再测试会员身份和收藏品相关页面。

后端链上写入功能需要在 `backend/.env` 配置对应运营私钥，例如 `IDENTITY_MINTER_PRIVATE_KEY`、`COLLECTIBLE_MINTER_PRIVATE_KEY`。这些私钥必须属于已分配相应角色的账户。

## 9. 常用检查命令

后端：

```powershell
cd backend
uv run pytest
uv run ruff check .
uv run pyright
```

前端：

```powershell
cd frontend
npm run lint
npm run typecheck
npm run build
```

合约：

```powershell
cd contracts
npm test
npm run compile
```

## 10. 常见问题

### 端口已被占用

查看端口：

```powershell
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in 3000,8000}
```

可以把前端改为 `3001`，并同步修改 `NEXT_PUBLIC_APP_URL` 和后端 `FRONTEND_ORIGINS`。

### 前端显示无法连接后端

确认后端正在监听 `8000`，并检查 `frontend/.env.local`：

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

修改后重启 Next.js。

### WalletConnect 或 Privy 不显示

检查 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` 或 `NEXT_PUBLIC_PRIVY_APP_ID` 是否为空、是否配置了正确的域名，并重启前端。MetaMask 直连通常不需要 Privy。

### 合约部署提示没有部署钱包或余额

检查 `contracts/.env` 中的 `DEPLOYER_PRIVATE_KEY`、RPC 地址和链 ID，并给该账户准备 Monad Testnet MON。不要把私钥写入前端环境变量。

### 同步脚本提示环境文件不存在

先执行：

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

然后重新运行 `npm run sync:testnet`。

### SQLite 数据需要重置

停止后端后删除项目根目录下的数据库文件，再重新启动：

```powershell
Remove-Item backend\fanora.db -ErrorAction SilentlyContinue
```

这会清空本地开发数据，不影响链上数据；执行前确认目标确实是本地 SQLite 文件。

## 11. 停止全部服务

在运行前端和后端的终端分别按 `Ctrl+C`。如果启动了 Docker 依赖：

```powershell
cd backend
docker compose down
```

