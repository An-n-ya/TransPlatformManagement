# YX · 银杏叶社区 后台管理

**YX（银杏叶社区）** 的后台管理前端 —— 面向社区运营与管理员的 Web 控制台。
基于 **React 19 + TypeScript + Vite + Tailwind CSS 4** 构建，对接后端
[TransPlatformServer](https://github.com/An-n-ya/TransPlatformServer) 的 `/admin/v1/*` 管理接口。

生产环境部署于 `https://yx.annya.work/management/`（与 App API 同源，经 Caddy 反向代理）。

> ⚠️ **项目状态：早期开发阶段**。核心管理能力已可用，举报中心等模块仍在迭代。

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [路由与权限](#路由与权限)
- [项目结构](#项目结构)
- [CI / CD 与部署](#ci--cd-与部署)
- [开源许可](#开源许可)

---

## 功能特性

- **管理员登录**：独立管理员账号（`/admin/v1/auth/login`），Token 持久化与 **401 自动刷新**
- **仪表盘**：数据总览与统计图表（发帖量 / 新注册人数 / 活跃用户数 / 每日趋势，`recharts`）
- **用户管理**：用户列表、搜索 / 筛选、资料查看
- **内容管理**：帖文列表、全文搜索、逻辑删除（下架）
- **话题管理**：话题 CRUD、置顶 / 状态管理
- **邀请码管理**：生成邀请码、一键复制、使用状态查看
- **举报中心**（开发中）：`ReportsPage` 已就绪，待接入路由与后端审查接口
- **角色权限**：路由级 Guard（需 admin 角色）+ 登录 / 游客守卫

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript ~6.0 |
| 构建 | Vite 8 + `@vitejs/plugin-react` |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite`）+ `tailwindcss-animate` |
| 状态管理 | Zustand（`persist` 中间件持久化登录态） |
| 路由 | React Router 7（懒加载 + 路由守卫） |
| UI 组件 | Radix UI + shadcn 风格组件（avatar / dialog / dropdown / table 等） |
| 图表 / 提示 | recharts · sonner · lucide-react |
| HTTP | axios（拦截器统一错误处理 + Token 自动刷新） |
| 包管理 / 检查 | pnpm · oxlint |

## 快速开始

**前置条件**：Node.js ≥ 20（推荐 24）、pnpm ≥ 9。

```bash
pnpm install        # 安装依赖

pnpm dev            # 开发模式（http://localhost:5173/management/）
pnpm build          # 类型检查 + 生产构建（输出 dist/）
pnpm preview        # 本地预览构建产物
pnpm lint           # oxlint 检查
```

开发模式下，Vite 已配置代理：`/admin` 与 `/api` 请求转发到本地后端
`http://localhost:8081`，因此本地联调时需先启动
[TransPlatformServer](https://github.com/An-n-ya/TransPlatformServer)。

## 环境配置

生产构建通过 `VITE_API_BASE_URL` 注入 API 地址（构建时烘焙，`pnpm build` 即可出包）：

```bash
# .env.production
VITE_API_BASE_URL=https://yx.annya.work
```

- **生产**：默认走**同源相对路径** —— 后端与后台管理部署在同一源
  （`yx.annya.work`），无需跨域。
- **开发**：不设置该变量时使用相对路径，经 Vite 代理转发到 `localhost:8081`。

构建路径固定为 `/management/`（`vite.config.ts` 的 `base`），需由反向代理（Caddy）
将 `/management/*` 指向 `dist/`。

## 路由与权限

| 路径 | 页面 | 权限 |
|---|---|---|
| `/login` | 管理员登录 | 仅游客（GuestGuard） |
| `/` | 仪表盘（统计总览） | 需登录 + admin 角色 |
| `/users` | 用户管理 | 需登录 + admin 角色 |
| `/posts` | 内容管理 | 需登录 + admin 角色 |
| `/topics` | 话题管理 | 需登录 + admin 角色 |
| `/invitations` | 邀请码管理 | 需登录 + admin 角色 |

页面采用 **懒加载 + Suspense** 分包，首屏只加载必要的 chunk。

## 项目结构

```
src/
├── api/                        # 统一 API 层（axios 实例 + 模块化接口 + 类型）
│   ├── http.ts                 # axios 封装：拦截器、401 自动刷新、ApiError
│   ├── modules/                # auth / content / topic / user / invitation
│   └── types.ts                # 与后端 VO 对齐的 TypeScript 类型
├── components/
│   ├── layout/AppLayout.tsx    # 后台主布局（侧边导航 + 顶栏 + 退出）
│   └── ui/                     # shadcn 风格基础组件（button / table / dialog …）
├── pages/                      # 页面
│   ├── LoginPage.tsx           # 登录
│   ├── DashboardPage.tsx       # 统计总览
│   ├── UsersPage.tsx           # 用户管理
│   ├── PostsPage.tsx           # 内容管理
│   ├── TopicsPage.tsx          # 话题管理
│   ├── InvitationsPage.tsx     # 邀请码管理
│   └── ReportsPage.tsx         # 举报中心（开发中）
├── router/                     # 路由注册 + 守卫（AuthGuard / GuestGuard / RoleGuard）
├── store/                      # Zustand store（auth 登录态、app 全局状态）
├── services/statistic.ts       # 统计接口封装
└── lib/utils.ts                # 通用工具（class 合并、格式化）
```

## CI / CD 与部署

- **自动部署**：`.github/workflows/deploy.yml` —— 推送到 `main` 后，
  pnpm 安装 → 类型检查 + 构建 → `rsync` 同步 `dist/` 到生产服务器
  `/root/app/TransPlatformManagement/dist/`（`--delete` 增量同步，不保留属主）。

## 开源许可

本项目基于 **Apache License 2.0** 开源，详见 [LICENSE](LICENSE)。
