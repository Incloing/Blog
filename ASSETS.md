# 图像与字体来源

## 站主头像

`assets/avatar.webp`：Incloing 提供的戴红帽、圆框眼镜玩偶照片。原图没有 AI 修改，仅转换尺寸和 WebP 格式。

## Google Cloud 分类配图

来源：[Google Cloud — AI Business Trends 2025 原始报告](https://services.google.com/fh/files/misc/google_cloud_ai_trends.pdf)。提取报告内嵌图像并裁出右侧画面，未包含标题、导航图标、标志或水印。

- `assets/google-cloud.webp`：PDF 第 27 页，蓝色粒子云，裁切框 `(920,130,1920,930)`。
- `assets/google-liquid.webp`：PDF 第 34 页，金色流动雕塑，裁切框 `(930,130,1920,925)`。
- `assets/google-moss.webp`：PDF 第 16 页，绿色自然形态，裁切框 `(920,130,1920,930)`。

这些图像的权利归原权利人所有。依照站主本次要求用于个人主页视觉参考与展示，本站与 Google 无关联。界面页脚保留原始报告链接。

## 首页背景

使用内置 ImageGen 工具，按站主提供的浅色 Google 风景参考重新绘制。桌面版与手机版各有一张，均已保存到项目中，页面不调用图像生成服务。

### `assets/hero-pastel.webp`

Final prompt:

> Edit target: attached pastel landscape poster. Create a clean wide 16:9 website background by extending this landscape horizontally and removing ALL Google lettering, ALL watermark lettering, and the standing human. Preserve closely the reference's dreamy landscape, pastel peach/lavender sky, lime green gently undulating grassy hills, tranquil reflecting water, tall very thin iridescent transparent oval mirror portals. Keep the distinctive soft photographic grain and tactile surreal 3D landscape quality. Sky fills the upper 65%; flowing hills and reflecting lake lower 35%. Place thin portals at the lateral thirds so central area is airy clear sky for a website heading to be overlaid later. Light luminous pastel colors, delicate reflections. The same reference aesthetic is the goal, not dark space, not a large metallic donut. Full bleed landscape, absolutely no text, logos, borders, interface, people, or watermark.

### `assets/hero-pastel-mobile.webp`

Final prompt:

> Edit this image into a clean portrait 9:16 mobile website background. Remove all Google lettering, small watermark text, ALL text, and the standing person. Preserve the distinctive original scene: soft pastel peach/lavender cloudy sky upper 60%, lime green rolling hills lower 30% and a tranquil reflecting lake at bottom, delicately thin oval transparent mirror portals with iridescent rims. Recompose as 9:16 portrait: two portals near left and right edges, middle of sky empty for a website heading to be added by HTML later. Same luminous light pastel surreal photographic 3D aesthetic, soft fine grain. Do not add dark metallic donuts, words, logos, frames, people or interface.

## 字体与图标

- Outfit、Noto Sans SC：Google Fonts，SIL Open Font License，许可证位于 `assets/fonts/`。
- Material Symbols Rounded：Google Material Symbols，Apache 2.0，许可证位于 `assets/fonts/`。按实际图标名称提取子集并自托管。
- QQ 联络图标 `assets/qq-official.png` 来自 [腾讯 QQ 官网](https://im.qq.com/index) 实际使用的[企鹅标识资源](https://static-res.qq.com/static-res/imqq/qq-logo.png)，保持原始图片，标识权利归腾讯所有。

## 页脚社交图标

GitHub、X、Instagram、Facebook 图标来自 [Bootstrap Icons](https://github.com/twbs/icons)，MIT 许可证；小红书图标来自 [Simple Icons](https://github.com/simple-icons/simple-icons)，CC0。图标及许可证已保存到 `assets/social/`。

## 文章渲染依赖

- marked 18.1.1，MIT，来源为 marked 官方 npm 发布包。
- DOMPurify 3.4.17，Apache 2.0 / MPL 2.0，来源为 DOMPurify 官方 npm 发布包。

文件自托管在 `assets/vendor/`，保留许可证、版本和下载校验信息（`versions.json`）；页面不加载第三方 CDN 脚本。
