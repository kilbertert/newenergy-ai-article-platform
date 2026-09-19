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

同理，`NODE_OPTIONS=--dns-result-order=ipv4first` 也写在 unit 里：service host 没有
IPv6 出口，Node 的 `fetch` 会先试 AAAA 并在 connect 阶段超时且不回落（`curl` 会回落，
所以只有从 Node 里发起的出站请求会中招）。

**带空格的值不要写进 unit 的 `Environment=`**：systemd 按空格切分赋值，
`Environment=LEAD_GEN_AUTH=Basic xxx` 会被截成 `LEAD_GEN_AUTH=Basic`，请求到上游就是 401。
`LEAD_GEN_AUTH` 正好是这种值——放 `EnvironmentFile`，或写成 `Environment="LEAD_GEN_AUTH=Basic xxx"`。

## 入口链路（当前状态）

**服务在 service host，入口（Cloudflare + nginx + frps + TLS）仍在 development host。**
frpc 那一跳把 `Host` 重写成 `localhost`，这是它能通的关键：

```
newenergy.ranlei.work → Cloudflare → development host nginx:443 → frps:8188
                      → frpc（localIP = 8.138.202.79, localPort = 18580,
                              hostHeaderRewrite = "localhost"）→ service host
```

### 为什么需要 `hostHeaderRewrite`

service host 是境内阿里云 ECS，其入站 HTTP 会按 `Host` 头做备案检查：`Host` 是未备案域名
就直接返回备案拦截页（HTTP 403），**不区分端口**。对照实验（全部在 development host 上发起）：

| 请求 | 结果 |
| --- | --- |
| `Host: newenergy.ranlei.work` → `8.138.202.79:18580` | `403` 阿里云备案拦截页 |
| `Host: 8.138.202.79:18580` → 同一端口 | `200` 应用 |
| `Host: example.com`、`Host: some-other.work` → 同一端口 | `200` 应用 |
| service host 本机 `127.0.0.1:18580` + `Host: newenergy.ranlei.work` | `200` 应用（拦截发生在机器之外） |
| 同一 `Host` 发往非阿里云目标（httpbin） | 头部照常送达（排除 development host 侧中间件） |
| **同上，但 frpc 加 `hostHeaderRewrite = "localhost"`** | **`200` 应用 —— 这就是解法** |

应用不读 `Host` 头（源码与构建产物都确认过），所以重写它没有副作用。

**代价与风险**：这绕开的是**入站检查**，内容仍托管在大陆，备案义务不因此消失——这是运维者
的合规判断，不是技术结论。若阿里云改变检查方式，这一跳会再次失效；届时可退回 IP 直连
（`http://8.138.202.79:18580`，IP 形式的 `Host` 实测不被拦）或走备案。同一改动也已应用到
`ds408.toml`。

Cloudflare Tunnel（cloudflared）在这台 ECS 上**不可用**：隧道边缘 `198.41.x.x:7844`
基本连不通（2026-09-19 实测 120 s 内 0 次成功、11 次失败；TCP 能连上但 TLS 数据不回流）。
二进制与 unit 留在 service host 上，已 `disable --now`。

## 跨服务依赖

新能线平台的"LinkedIn 销售线索"模块是 `linkedin-lead-gen` 的代理。该服务仍在
development host 上（`:8100`），从 service host 不可直连，因此过渡期通过它已有的公网隧道
`https://leadgen.ranlei.work` 访问（内部流量绕行 Cloudflare）。leadgen 迁到 service host 后，
应改回环回地址，这一跳的绕行即可删除。

## 回滚

1. `~/.config/frp/newenergy.toml` 改回 `localIP = "127.0.0.1"`、`localPort = 8580`
   并删掉 `hostHeaderRewrite`，`systemctl --user restart newenergy-frp`。
2. `systemctl --user start newenergy`（development host 实例仍在，停用状态即回滚点；
   它的 `dist` 是 `main` 的构建，`data/` 保持在切换那一刻的内容）。

注意第 2 步之后 development host 上的 `data/` 会从切换时刻继续，而 service host 上的那份
在此期间已被继续写入——两边分叉，再切回去需要重新播种（有状态，需一次短停写窗口）。
service host 上还有一次部署留下的 `dist.old`。

## 待办

- 迁移完成后把 `LEAD_GEN_BASE_URL` 从公网隧道改为环回地址。
- 本仓库没有 CI：值得加一条最小门禁（lint + build）。已确认 lint（`tsc --noEmit`）与
  build 在 `main` 上通过。
- **入口仍留在 development host**：服务已经搬走，但 nginx/frps/TLS 这套入口还在原机。
  要把它也搬走，需要已备案域名（或将入口改成 IP 直连），见"入口链路"一节。
- leadgen 的 Basic Auth 凭据仍留在 git 历史里（3 个提交）。2026-09-19 已轮换口令，历史里
  那份随即失效；`main` 上保留历史提交本身（仓库是 private），不再单独改写历史。
