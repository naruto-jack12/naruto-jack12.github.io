# Markdown 编辑器

功能齐全的在线 Markdown 编辑器，支持实时预览、代码高亮、数学公式、图表绘制、定义列表、脚注、上/下标、公式选择器。所有依赖已预先下载，完全本地加载，无需网络。

---

## 完整文件结构

```
markdown-editor/
├── index.html                                 # 主页面 HTML
├── favicon.svg                                # SVG 网站图标
├── README.md                                  # 说明文档
│
├── assets/
│   ├── css/
│   │   ├── style.css                          # 主样式（布局、主题、格式栏、弹窗等）
│   │   ├── export.css                         # HTML 导出专用样式
│   │   │
│   │   └── lib/                               # 第三方库样式
│   │       ├── codemirror.min.css             # CodeMirror 编辑器基础样式
│   │       ├── katex.min.css                  # KaTeX 数学公式排版样式
│   │       ├── prism.min.css                  # Prism.js 代码语法高亮主题
│   │       │
│   │       └── fonts/                         # KaTeX 数学公式字体
│   │           ├── KaTeX_Main-Regular.woff2
│   │           ├── KaTeX_Main-Regular.woff
│   │           ├── KaTeX_Main-Regular.ttf
│   │           ├── KaTeX_Math-Italic.woff2
│   │           ├── KaTeX_Math-Italic.woff
│   │           ├── KaTeX_Math-Italic.ttf
│   │           ├── KaTeX_Size1-Regular.woff2
│   │           ├── KaTeX_Size1-Regular.woff
│   │           ├── KaTeX_Size1-Regular.ttf
│   │           ├── KaTeX_Size2-Regular.woff2
│   │           ├── KaTeX_Size2-Regular.woff
│   │           └── KaTeX_Size2-Regular.ttf
│   │
│   ├── js/
│   │   ├── app.js                             # 主逻辑（渲染、格式、搜索、主题等）
│   │   │
│   │   └── lib/                               # 第三方库
│   │       ├── marked.min.js                  # Markdown → HTML 编译 (v15)
│   │       ├── dompurify.min.js               # HTML 安全过滤，防 XSS (3.x)
│   │       ├── prism.min.js                   # 代码块语法高亮核心
│   │       ├── prism-autoloader.min.js        # Prism 语言按需自动加载
│   │       ├── katex.min.js                   # 数学公式渲染引擎
│   │       ├── katex-autorender.min.js        # KaTeX 自动扫描页面渲染公式
│   │       ├── mermaid.min.js                 # Mermaid 图表渲染（流程图、时序图等）
│   │       │
│   │       └── codemirror/
│   │           ├── codemirror.min.js          # CodeMirror 编辑器核心 (5.65)
│   │           ├── markdown.min.js            # Markdown 语法模式（着色规则）
│   │           └── xml.min.js                 # XML/HTML 模式（嵌入语法支持）
│   │
│   └── data/
│       ├── code-langs.json                    # 代码块语言选择器列表（50 种语言，含别名映射）
│       ├── default-content.md                 # 首次打开时的默认示例内容
│       ├── emoji.json                         # Emoji 数据（8 分类 400+ Emoji）
│       ├── charts.json                        # Mermaid 图表模板（14 种）
│       └── formulas.json                      # 常用 LaTeX 公式（9 分类 60+ 公式）
```

---

## 功能总览

### 编辑器
- 基于 **CodeMirror 5** 的编辑器，支持 Markdown 语法着色
- 行号显示、Tab 缩进、自动换行
- 自动闭合括号/引号 `()` `[]` `{}` `""` `''`
- **列表自动续写**：Enter 自动延续 `- ` / `1. ` / `- [ ] ` / `> ` 前缀，有序列表数字递增
- 空行按 Enter 结束列表

### 格式栏

| 分组 | 按钮 |
|------|------|
| 文字样式 | 加粗 B、斜体 I、删除线 S |
| 标题 | H1 H2 H3 H4 H5 H6 |
| 列表 | 无序列表、有序列表、任务列表 |
| 块级元素 | 引用、行内代码、代码块▾（50 种语言）、表格▾（支持对齐控制）、分隔线 |
| 插入 | 链接▾、图片▾（支持点击跳转链接）、Emoji▾（400+） |
| 工具 | 图表▾（14 种 Mermaid 模板）、日期时间▾、公式▾（60+ 常用 LaTeX 公式，支持行内/块级切换） |

### 实时预览
- 三种视图模式：编辑 / **分栏**（默认） / 预览
- 分栏模式下拖拽分隔条调整左右宽度
- **目录侧栏**：自动提取 h1-h6 标题层级树，点击平滑跳转，滚动联动高亮
- 预览区代码块顶部显示 **语言标签 + 复制按钮**

### Markdown 渲染
- **marked** 编译 Markdown 为 HTML
- **DOMPurify** 安全过滤，防止 XSS 注入
- **Prism.js** 代码语法高亮，自动识别语言，支持 100+ 编程语言
- **KaTeX** 数学公式渲染（行内 `$...$`、块级 `$$...$$` 和 `\(...\)` `\[...\]`）
- **Mermaid** 图表渲染：流程图、时序图、饼图、类图、状态图、甘特图、思维导图、旅程图、ER 图、桑基图、时间线、Git 图、XY 图、C4 图

### 文件操作
- 新建文件、打开 `.md`/`.markdown`/`.txt` 文件
- 下载到本地（自动文件名）
- 导出为 HTML（内联样式，独立文件）、打印/导出 PDF

### 搜索替换
- Ctrl+F 打开搜索栏
- 实时统计匹配数量，上下导航
- 支持逐个替换和全部替换
- 预览区匹配高亮

### 主题
- 亮色/暗色一键切换，设置持久化到 localStorage
- 暗色模式下 Mermaid 自动切换 dark 主题
- KaTeX 公式颜色、Prism.js 代码配色、编辑器着色全部跟随暗色适配

### 自动保存
- 内容自动保存到 localStorage
- 刷新或重新打开页面自动恢复
- 文件名称和修改时间同步保存

### 其他
- 图片拖拽/粘贴自动插入（Base64 编码）
- 图片弹窗支持可选点击跳转链接（`[![alt](img)](url)`）
- 状态栏显示光标位置、字数/词数/行数、阅读时间
- 快捷键帮助面板（按 `?` 键打开）
- 手机端自适应（≤768px 自动切换为只读预览模式）

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B` | 加粗 |
| `Ctrl+I` | 斜体 |
| `Ctrl+K` | 插入链接 |
| `Ctrl+S` | 下载文件 |
| `Ctrl+N` | 新建文件 |
| `Ctrl+O` | 打开文件 |
| `Ctrl+F` | 搜索替换 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |
| `Ctrl+Shift+C` | 行内代码 |
| `Ctrl+Shift+P` | 切换视图模式 |
| `?` | 打开快捷键帮助 |

---

## 依赖清单

| 库 | 版本 | 文件 | 用途 |
|----|------|------|------|
| marked | 15.x | `marked.min.js` | Markdown 文本编译为 HTML |
| DOMPurify | 3.x | `dompurify.min.js` | HTML 安全过滤，防 XSS 攻击 |
| CodeMirror | 5.65 | `codemirror/` | 代码编辑器组件，提供行号和语法着色 |
| KaTeX | 0.16 | `katex.min.js` + css + fonts | 数学公式渲染引擎 |
| Prism | 1.x | `prism.min.js` + `prism-autoloader.min.js` + css | 代码块语法高亮 |
| Mermaid | 11.x | `mermaid.min.js` | 图表渲染（流程图、时序图等） |

所有依赖文件均位于 `assets/` 目录下，完全本地加载，无需 CDN。

> Prism 语言组件通过 `prism-autoloader` 按需从 CDN 加载（仅在页面中出现未内置的语言时请求），核心高亮功能不依赖网络。

---

## 使用方式

直接在浏览器打开 `index.html` 即可使用：
- **本地文件协议** (`file://`) — 全部功能正常工作
- **HTTP 服务器** — 同上，无差异

无需安装、无需构建、无需服务器。
