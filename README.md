# Incloing · Cloudflare 独立博客

本版本以 Cloudflare Workers / Pages + D1 作为写作与实时数据后端，GitHub 保存源码和全部公开数据快照，支持从仓库修改文章并同步回网站。无需 R2 或绑定 R2 支付方式。前台保留浅色背景、玻璃效果、分屏翻转、头像、分类、社交链接和小恐龙游戏。

已上线：[个人主页](https://incloing-blog.incloing-cloudflare.workers.dev/) · [写作后台](https://incloing-blog.incloing-cloudflare.workers.dev/admin/)。

免费 Pages 备用入口：[个人主页](https://incloing-blog.pages.dev/) · [写作后台](https://incloing-blog.pages.dev/admin/)。两个入口直接绑定同一份 D1 数据，不会请求另一个入口来加载文章或登录。是否能在具体手机网络打开，应以站主的直连实测为准。

## 使用

打开网站的 `/admin/`，输入站主设置的密码。服务器验证密码并签发 HttpOnly、Secure、SameSite 登录 Cookie，保持登录 30 天；可在账户设置退出或修改密码。发布、图片上传、删除和个人资料修改均在服务器重新校验登录与 CSRF，页面入口不能代替服务器验证。

- 新建文章、选择分类、从手机相册选择图片、预览、直接发布。
- 重新编辑线上文章；支持删除单篇和经确认后清理示例文章。
- 编辑学校、专业、QQ 及自我介绍。
- 访客直接在站内填写昵称和留言；站主可在后台管理留言。
- 文章本机草稿仍支持自动保存、导入与导出。旧域名的未发布草稿应先从旧后台导出，再在新后台导入。

## 图片与额度

普通照片在浏览器缩放到最长边 1920 像素并压缩为 WebP，处理后每张最多 2MB，GIF 也最多 2MB。新上传图片按 256KB 分块保存到 D1，避免触及单行大小上限。后台显示新图片用量，应用限制为 200MB，为文章和数据库索引留出空间；达到限制会拒绝新上传，已有图片保留。删除文章不会立即删除其图片，以便其他文章复用。

Workers 与 D1 使用免费计划，实际服务受 Cloudflare 免费额度限制；本项目不自动升级套餐。大量照片应另行迁移到对象存储。Cloudflare 免费网络不等于中国内地网络，访问速度取决于实际网络。

## 数据与运行

`src/worker.mjs` 是服务端接口，`public/` 是唯一公开静态目录；`data/`、`.wrangler/`、本地会话与导入 SQL 不会部署为静态资源。密码校验值仅存数据库，明文密码不写进源码或客户端。文章逐篇存储，写入使用版本校验；不会静默覆盖别处的修改。留言按纯文字显示，写入有限流。

运行 `npm ci` 安装锁定依赖，`npm run dev` 本地预览，`npm run deploy` 通过 Cloudflare 官方工具部署。配置中的数据库 ID 只指向此站点；部署凭据在系统凭据库，不包含在源码中。

Pages 入口使用 `npm run deploy:pages` 单独发布；`scripts/build-pages.mjs` 从同一份前端和服务端生成 `pages-dist/`，仅动态接口与上传图片经过 Pages Functions。Pages 配置在 `pages/wrangler.jsonc`，沿用同一数据库 ID。它需要 Cloudflare 官方授权的 `pages:write` 权限，不需要 GitHub、R2 或购买域名。两个入口的登录状态与本机草稿分别保存在各自浏览器域名下；切换入口前，如有未发布草稿，请先导出再导入。

## 首次导入与备份

首次部署时应用 `migrations/`，再通过 `scripts/bootstrap.mjs` 从 stdin 输入站主密码，生成仅保存在非公开目录的导入 SQL。导入脚本仅供首次迁移；上线后不要重新导入旧快照，否则可能重新插入已删除的文章。`data/seed.json`、`data/guestbook.json` 和 `data/export-metadata.json` 为迁移快照，不包含在源码包。

整站数据库备份可在本机执行 `npx wrangler d1 export DB --remote --output backup.sql`，文件包含私人账户校验信息，须私下保存。不要把数据库、登录凭据或 `.wrangler/` 上传至公开仓库。D1 自带恢复功能以 Cloudflare 当前免费计划政策为准。

初始数据保留迁移时的所有正式文章、示例、个人简介、上传图片及历史留言。旧站的真实统计快照作为累计起点，新站访客按匿名浏览器标识去重；旧、新统计口径有所不同。本站运行时间继续使用首次上线时间。

独立域名需要站主另行注册后绑定；`workers.dev` 是 Cloudflare 提供的默认访问地址。

## 阅读与写作

每个分类逐屏显示一篇文章，轻滑一次只到相邻文章；“目录”按钮可直接定位。文章卡片上方为封面，下方为标题和正文开头。后台在“文章封面”选择图片，和正文一起发布；未设置时使用分类配图。文章末尾展示更新时间、感谢阅读和赞赏入口；收款码在“编辑个人简介”中上传和保存。

首页内置 100 条原创短句，按浏览器记录顺序轮换；每次回首页换下一条，停留约 5 秒后逐字删除、再打出新句。关闭系统动画时仅切换文字。小游戏持续加速，160 分后出现空中障碍：保持在地面可通过，跳起会撞到。

## GitHub 同步与练习

仓库：[Incloing/Blog](https://github.com/Incloing/Blog)。GitHub Pages 和 Cloudflare 页面共用 Cloudflare 的实时文章、留言和统计；GitHub 另保留可追溯的公开快照。GitHub 后台入口会进入统一写作后台。

- `public/`：前端页面、样式、图片；`src/`：服务端接口。
- `content/notes/`、`content/projects/`、`content/life/`：可直接在 GitHub 编辑的 Markdown 正文。第一行是 `# 文章标题`，空一行后写正文。新建文件名使用小写英文字母、数字、短横线，例如 `my-first-project.md`；从所在文件夹确定分类。
- `content/posts.json`：完整文章与简介快照，可修改日期、标签、摘要和 `cover`。正文也可以直接编辑对应 Markdown，避免同时改同一处。
- `public/assets/uploads/`：已发布的图片；新图片可上传到一个文章子目录，用新文件名，然后在 Markdown 或封面字段引用 `assets/uploads/文章标识/图片.webp`。
- `content/comments.json`、`content/metrics.json`：公开留言和统计快照，只做备份，不从 GitHub 覆盖实时计数与留言。
- `content/.sync-base.json`：自动合并基线，勿手动编辑。

“Blog sync and publish”工作流在提交到 main 时运行，也会约每 15 分钟拉取网页后台的新内容。GitHub 定时任务可能排队；需要立即同步时到 Actions 选择该工作流，点击 Run workflow。长期无仓库活动可能导致 GitHub 暂停定时任务，可在 Actions 重新启用。同一篇文章两边同时修改时停止并报告冲突，保留两边内容；不同文章可自动合并。

密码校验值、会话、匿名访客标识、限流记录、数据库备份及未发布草稿均不导出。只有已发布内容引用的图片会进入快照。专用 `CONTENT_SYNC_TOKEN` 存放在 Cloudflare Secrets 和 GitHub Actions Secrets，可导入公开内容，但不能登录后台、改密码或读取私人账户表。

## 从 GitHub 自动发布代码

当前 Pages 项目采用 Direct Upload，通过 `.github/workflows/blog.yml` 连接 GitHub Actions，无需更换网址。公开内容同步已使用独立授权；自动部署 Cloudflare 源码需要另加仓库 Secret `CLOUDFLARE_API_TOKEN`，权限仅限当前 Cloudflare 账号的 Cloudflare Pages Edit、Workers Scripts Edit 和 D1 Edit。令牌只填入 GitHub 仓库 Settings → Secrets and variables → Actions，不写入文件或聊天。

设置后，在 Actions 手动运行并勾选 Also deploy source changes to Cloudflare，完成首次验证。以后修改 `public/`、`src/` 等源码会自动构建并部署 Workers 和 Pages；只有文章或快照变化时不重复部署 Cloudflare。该工作流仅在 main 提交、定时任务或手动触发时运行，不接收外部 PR 的密钥请求。
