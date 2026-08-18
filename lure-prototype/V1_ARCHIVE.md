# 路亚助手 V1

版本：`1.0.0`

## 架构

- 前端：`index.html`、`styles.css`、`app.js`
- 后端：Cloudflare Worker `worker.js`
- 数据库：Cloudflare D1 `lure-assistant-db`
- 静态资源：Worker Assets
- 移动端：PWA，可添加到手机主屏幕

## 已归档能力

- GPS 定位、地名识别、天气和钓况评分
- 标点新增、GPS 记录、编辑、删除
- 鱼获新增、编辑、删除、详情查看
- 鱼获按鱼种、装备、拟饵、标点和日期范围筛选
- 鱼获关联钓竿、渔轮、拟饵及拟饵克数
- 装备分类、新增、编辑、删除
- PWA 离线静态资源缓存

## 数据迁移

远程 D1 已按顺序应用 `migrations/0001` 至 `migrations/0006`。

本地完整包另含当前数据快照：`backups/d1-v1.0.0.sql`。

## 部署

```bash
npm install
npm run db:migrate:remote
npm run deploy
```

恢复数据时，可在目标 D1 完成数据库准备后执行：

```bash
npx wrangler d1 execute lure-assistant-db --remote --file backups/d1-v1.0.0.sql
```

线上地址：<https://lure-assistant.1071242743.workers.dev>
