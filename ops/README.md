# 部署

## 目标形态（service host）

| 项 | 值 |
| --- | --- |
| 主机 | service host `8.138.202.79` |
| 系统账号 | `newenergy`（system、nologin、无 sudo、无附加组） |
| 安装路径 | `/opt/newenergy-ai-article-platform` |
| 监听 | `0.0.0.0:18580`（service host 端口池 `15000-19999` 内，由 unit 注入 `PORT`） |
| 防火墙 | ufw 仅放行 `154.9.24.30` 访问 `18580/tcp` |
| 运行时 | Node `v24.15.0`（`/usr/local/bin/node`，与 development host 同版本） |
| 单元 | `ops/newenergy.service` → `/etc/systemd/system/` |

## 构建与依赖模型

`npm run build` 用 `esbuild --packages=external`，**依赖不打进 bundle**，所以：

- 前端 `vite build` 与 `dist/server.cjs` 在 **development host** 上构建，只分发 `dist/`；
- 运行时依赖由目标机 `npm ci --omit=dev` 安装；目标机出口到 npmjs 不通，
  脚本固定用 `--registry=https://registry.npmmirror.com`；
- 只在 `package-lock.json` 变化时重装（比对 `$APP/.lock.sha256`）。

构建在临时目录里用 `git archive` 展开指定 ref，不触碰任何工作区。

## 布局与业务数据

应用用 `process.cwd()` 解析 `dist/` 与 `data/`，因此 `WorkingDirectory` 必须是应用根：

```
/opt/newenergy-ai-article-platform/
├── dist/            # 每次部署替换；上一版留在 dist.old
├── node_modules/    # npm ci --omit=dev
├── package.json / package-lock.json
└── data/            # 业务数据（BD 联系人、素材、文章、上传），700，绝不覆盖
```

`data/` 是唯一有状态的部分。首次搬迁时从旧位置手工播种一次，之后部署不再触碰。

## 环境变量

放在 `/etc/newenergy-ai-article-platform/env`（root 所有，`chmod 600`），**不进仓库**：

| 变量 | 说明 |
| --- | --- |
| `NODE_ENV` | `production` |
| `DISABLE_HMR` | `true` |
| `TAVILY_API_KEY` | 实时检索用（原先明文写在 unit 的 `Environment=` 里，已移出） |
| `LEAD_GEN_BASE_URL` | leadgen 服务地址；过渡期指向 `https://leadgen.ranlei.work` |
| `LEAD_GEN_AUTH` | leadgen 的**完整** `Authorization` 头值，如 `Basic <base64(user:pass)>`。原先硬编码在 `server.ts`，已移出；未配置时 `/api/leads*` 返回 503 |

`PORT` 不进这个文件：它由 `ops/newenergy.service` 的 `Environment=PORT=18580` 给出，
与 `ops/deploy.sh` 的 `PORT` 是同一事实的两处书写。

## 入口链路（过渡形态）

```
newenergy.ranlei.work → Cloudflare → development host nginx:443 → frps:8188
                      → frpc（localIP = 8.138.202.79, localPort = 18580）→ service host
```

## 跨服务依赖

新能线平台的"LinkedIn 销售线索"模块是 `linkedin-lead-gen` 的代理。该服务仍在
development host 上（`:8100`），从 service host 不可直连，因此过渡期通过它已有的公网隧道
`https://leadgen.ranlei.work` 访问（内部流量绕行 Cloudflare）。leadgen 迁到 service host 后，
应改回环回地址，这一跳的绕行即可删除。

## 回滚

1. 把 development host 的 `~/.config/frp/newenergy.toml` 改回 `localIP = "127.0.0.1"`、
   `localPort = 8580`，`systemctl --user restart newenergy-frp`（旧实例仍在运行）。
2. 或在 service host 上把 `dist.old` 换回 `dist` 并 `systemctl restart newenergy`。

## 待办

- 迁移完成后把 `LEAD_GEN_BASE_URL` 从公网隧道改为环回地址。
- leadgen 的 Basic Auth 凭据曾硬编码在 `server.ts`，且仍在 git 历史里。现已只从
  `LEAD_GEN_AUTH` 读取，**但旧凭据尚未轮换**——需在 leadgen 侧改口令，再更新 env 文件。
- 本仓库没有 CI：值得加一条最小门禁（lint + build）。
