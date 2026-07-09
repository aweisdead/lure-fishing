# 路亚助手部署说明

目标架构：

- GitHub：保存代码
- Cloudflare Pages：外网访问网站
- Cloudflare D1：保存钓况、标点、装备数据

## 1. 创建 D1 数据库

```bash
npm install
npx wrangler login
npx wrangler d1 create lure-assistant-db
```

把命令返回的 `database_id` 填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "lure-assistant-db"
database_id = "你的 database_id"
```

## 2. 初始化数据库表

```bash
npx wrangler d1 migrations apply lure-assistant-db --remote
```

## 3. 本地云端模拟开发

```bash
npm run dev
```

用浏览器打开 Wrangler 输出的本地地址。不要用 `file://` 测云端保存，因为 `file://` 没有 `/api/*`。

## 4. 部署到 Cloudflare Pages

```bash
npm run deploy
```

部署后，手机访问 Cloudflare Pages 给出的 URL。数据会写入 D1，不保存在电脑本地。

## GitHub 集成方式

也可以在 Cloudflare Pages 控制台连接这个 GitHub 仓库，设置项目目录为：

```text
lure-prototype
```

构建命令可以留空，输出目录为：

```text
.
```
