# Incloing

Incloing 的个人主页，包含关于我、学习笔记、项目与生活随笔。

网站：[https://incloing.github.io/Blog/](https://incloing.github.io/Blog/)

采用深色的大幅材质画面与液态玻璃风格界面，支持平滑滚动、页面转场、指针高光、卡片轻微倾斜和点击光环。手机端使用底部导航与原生横向滑动卡片，触屏保留原生滚动。开启系统的“减少动态效果”后，平滑滚动和装饰性动效会自动关闭。

## 预览

直接用浏览器打开 `index.html`，或在仓库根目录运行：

```sh
python -m http.server 4173
```

打开 `http://localhost:4173`。无需安装依赖，也无需构建。

## 修改内容

- `content.js`：首页介绍、关于我、分类、文章和项目。
- `style.css`：配色、字体、桌面与手机布局。
- `app.js`：导航、筛选、搜索、归档和主题切换。
- `assets/hero-glass.webp`、`assets/cover-*.webp`：原创生成的视觉素材。
- `assets/fonts/`：本站使用的字体和 Google Material Symbols 图标，附许可证。
- `assets/vendor/`：固定版本 Lenis 1.3.27 的平滑滚动库，附 MIT 许可证。

初始文章与项目均为已标注的示例，发布自己的内容前请替换或删除。文章使用唯一的 `id`，`category` 为 `notes`、`projects` 或 `life`，日期使用 `YYYY-MM-DD`。`body` 是包含 `heading` 和 `text` 的段落数组。真实内容请将 `demo` 设为 `false`。

## 功能

- 响应式布局与深浅色主题，当前浏览器记住主题偏好。
- 分类列表、项目详情、文章详情、关于我和按年归档。
- 搜索标题、标签和正文，快捷键 `/` 或 `Ctrl/Cmd+K`。
- 图片、字体、图标和脚本均随网站托管，浏览时不需要访问第三方 CDN。

这是静态网站，没有登录、评论或在线编辑后台；修改源文件后再更新托管版本。

## GitHub Pages

如需通过 GitHub Pages 托管，可以将这些文件放在仓库根目录，然后在仓库的 Settings → Pages 中选择从 `main` 分支的根目录发布。是否可用取决于仓库可见性、账号套餐及仓库设置。

`.nojekyll` 表示直接提供静态文件。仓库地址与网站访问地址不同，启用托管后以 GitHub Pages 返回的地址为准。
