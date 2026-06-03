# 部署说明

## 推荐架构

- 前端和 AI API：Vercel
- 登录、用户规则、月度账本：Supabase Auth + Postgres + RLS
- 原始账单文件存储：第一版不需要。当前流程在浏览器解析 Excel / CSV 后保存结构化交易明细。
- R2：等需要长期保存原始 PDF、图片、OFD、Excel 文件，或需要低成本大文件下载时再接。

## Supabase

1. 打开 Supabase 项目的 SQL Editor。
2. 执行 `supabase/schema.sql`。
3. 确认 Google 登录 Provider 已开启。
4. 确认站点 URL 和 Redirect URLs 包含生产域名。

这会创建：

- `finance_user_state`：每个用户自己的规则、训练记忆和字段学习结果。
- `finance_monthly_ledgers`：每个用户每个月自己的交易明细。

两张表都开启 RLS，只允许 `auth.uid() = user_id` 的登录用户读取和写入自己的数据。

## Vercel

需要配置环境变量：

```text
AI_API_KEY
AI_BASE_URL=https://api.apiyi.com/v1
AI_MODEL=claude-opus-4-6
AI_API_FORMAT=anthropic_messages
ANTHROPIC_VERSION=2023-06-01
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_PUBLISHABLE_KEY=你的 publishable key
REQUIRE_AI_AUTH=1
```

部署后前端仍调用：

```text
/api/parse-training
/api/review-transactions
```

`vercel.json` 会把它们转发到 Python Serverless Functions。

生产环境建议保持 `REQUIRE_AI_AUTH=1`。这样 `/api/parse-training` 和 `/api/review-transactions` 必须带 Supabase 登录 token，否则返回 `401`，避免公开 AI 接口被刷爆。

## 费用风控

上线前建议：

1. 不要提交 `start_ai_server.ps1`、`.env`、账单文件夹和日志。当前 `.gitignore` / `.vercelignore` 已排除这些文件。
2. 在 Vercel Pro 的 Spend Management 里设置预算提醒，并开启达到预算后暂停生产部署。
3. 不要把 AI API 做成匿名公开接口。生产环境保持 `REQUIRE_AI_AUTH=1`。
4. 首版可以不接 R2，因为当前不保存原始文件。等保存 PDF、图片、OFD 或原始 Excel 时再接对象存储。
5. 如果公开投放，后续还应加按用户/按 IP 的 AI 请求限流。

## SEO 和多语言

当前已补基础 SEO meta、Open Graph、`robots.txt`、`sitemap.xml`、`site.webmanifest` 和 `hreflang` 入口。

完整多语言下一步要做：

1. 把所有可见文案抽成 `locales/zh-CN.json`、`locales/en.json` 等字典。
2. 用 `?lang=` 或用户设置切换语言。
3. 把用户偏好语言保存到 `finance_user_state.locale`。
4. 让日期、金额和分类名称按 locale 格式化。
