# Incloing

[访问个人主页](https://incloing.github.io/Blog/)

浅色个人主页：风景背景与打字欢迎语、同一风景虚化的个人介绍、依次展开的学习笔记 / 项目 / 生活随笔。首页只展示分类入口，文章在分类内查看。分类列表和文章详情使用各自分类封面图的模糊版作为整页背景。

左上角固定目录按钮，打开后展示头像和大类导航。学校、专业、QQ 用图标呈现，支持触摸点击和键盘查看。配有圆头渐变圆环与像素 LOADING 加载文字、透明玻璃边框、点击光晕和实时运行时间。手机使用原生惯性滑动；页面没有滚轮接管、底部固定导航或强制整屏吸附。系统开启“减少动态效果”时，关闭打字和装饰动效。

## 本地预览

无需安装依赖或构建，在仓库根目录运行：

```sh
python -m http.server 4173
```

打开 `http://localhost:4173`。所有实际使用的字体、图片和图标都在本站托管。

## 更新个人内容

编辑 `content.js`：

- `heroText`：首屏文案，使用 `\n` 换行。目前为暂定文案。
- `profile.school` / `profile.major`：东北林业大学 / 人工智能。
- `profile.qq` / `profile.bio`：目前留空，填入后自动展示。
- `categories`：大类名称、说明。
- `posts`：文章与项目。现有内容均标注为示例，请替换为真实记录；真实内容设置 `demo: false`。
- `startedAt`：首次成功开通 GitHub Pages 的时间 `2026-10-17T02:34:10Z`，改版时保持不变。

头像为 `assets/avatar.webp`，使用站主提供的原图，保留完整画面并转换为 WebP。首屏桌面与手机分别使用 `hero-pastel.webp` / `hero-pastel-mobile.webp`。背景与分类素材来源见 [ASSETS.md](./ASSETS.md)。

## 主要文件

- `index.html`：页面框架、目录、搜索、加载动画。
- `app.js`：路由、分类筛选、搜索、打字、运行计时、弹层与滚动位置。
- `style.css`：浅色玻璃效果、响应式布局和动效。
- `assets/fonts/`：Outfit、Noto Sans SC、Material Symbols 与许可证。

文章使用唯一 `id`，分类为 `notes`、`projects`、`life`，日期为 `YYYY-MM-DD`；正文是含 `heading` 和 `text` 的数组。静态网站没有登录或在线编辑后台。

## 发布

GitHub Pages 从 `main` 分支根目录直接发布，`.nojekyll` 保留。更新 CSS / JS 后同步修改 `index.html` 的版本参数；更新字体后同步修改 CSS 中字体版本参数，以便手机取得新资源。当前版本 `light-20261017-r4`。旧版素材保留于 Git 历史及原文件中，新页面不会加载旧版滚动库。

主要检查：多种手机宽度与横屏、目录焦点及背景锁定、关闭弹层后位置恢复、浏览器返回、图标点击、分类筛选、搜索、运行计时、减少动态效果，以及背景加载失败后的恢复。
