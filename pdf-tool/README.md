# PDF 工具箱 — 全能文档转换

纯前端文档处理工具，无需后端服务，所有操作在浏览器本地完成。

## 功能一览

| 分类 | 功能 | 说明 |
|------|------|------|
| **PDF 操作** | 合并 PDF | 多个 PDF 拖拽排序后合并为一个 |
| | 拆分 PDF | 按范围 / 每页独立 / 按页数分组 |
| | 旋转 PDF | 逐页或全部旋转 90° / 180° / 270° |
| | 压缩 PDF | 三级压缩级别（对象流压缩） |
| | 提取页面 | 按页码范围提取为新 PDF |
| **图片互转** | PDF → 图片 | 渲染 PDF 页面为 PNG / JPEG |
| | 图片 → PDF | PNG / JPG / WebP / BMP / GIF 合并为 PDF |
| | 图片格式转换 | PNG / JPG / WebP / BMP / GIF 互转 |
| **Office 互转** | PDF ↔ Word | 基础文本转换 |
| | PDF ↔ Excel | 基础数据转换 |
| | PDF ↔ PPT | 基础文本转换 |
| **其他** | HTML → PDF | HTML 内容渲染为 PDF |

> ⚠️ **注意**：纯前端 Office 互转仅支持基础文本，复杂排版 / 表格 / 图片可能丢失，需要精确还原请使用后端方案。

## 使用方式

1. 浏览器打开 `index.html`
2. 切换到对应功能 tab
3. 拖入或点击上传文件
4. 设置选项后点击操作按钮
5. 浏览器自动下载结果文件

## 技术栈

- **pdf-lib** — PDF 创建 / 修改（合并、拆分、旋转、压缩）
- **pdf.js** — PDF 解析与页面渲染（文本提取、导出图片）
- **JSZip** — Office 文档（.docx / .xlsx / .pptx）解析与生成
- **Canvas API** — 图片格式转换和预览

## 纯前端限制

| 限制 | 说明 |
|------|------|
| Office 排版丢失 | docx / xlsx / pptx 样式、图片、图表无法还原 |
| 扫描件 OCR | 需要后端 Tesseract 或 ML 模型 |
| 大文件（>50MB） | 浏览器内存受限，可能卡顿 |
| 精确表格还原 | PDF 中表格无结构化标记 |
| 字体缺失 | 仅支持 PDF 内嵌字体或标准字体 |

## 项目结构

```
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式（亮色 / 暗色主题）
├── js/
│   └── app.js          # 应用逻辑（全部功能）
└── README.md
```

## 依赖 CDN

- [pdf-lib](https://pdf-lib.js.org/) — `pdf-lib.min.js`
- [pdf.js](https://mozilla.github.io/pdf.js/) — `pdf.min.js` + `pdf.worker.min.js`
- [JSZip](https://stuk.github.io/jszip/) — `jszip.min.js`
