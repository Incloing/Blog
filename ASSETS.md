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
- QQ 联络图标为代码内联的简笔轮廓。

- 加载文字采用 Press Start 2P 像素字体，仅包含 `LOADING` 的字形子集，SIL Open Font License，字体和许可证保存在 `assets/fonts/loading-pixel.woff2` 与 `assets/fonts/LICENSE-loading-pixel.txt`。
