# 免费资源导航

一个精心整理的免费资源导航页面，提供各类优质免费网站链接。目前主要收录影视资源，未来将扩展更多类型。

## 特性

- **分类清晰**：按资源类型分组，方便查找
- **现代设计**：渐变背景 + 流畅交互效果
- **深色模式**：支持明暗主题切换，自动保存偏好
- **统一图标**：24×24 stroke 线性 SVG 图标，就地内联、随主题联动
- **加载动画**：优雅的数据加载过渡效果
- **响应式布局**：适配各种屏幕尺寸
- **动态渲染**：数据与视图分离，易于维护
- **智能过滤**：自动验证数据完整性，隐藏无效内容
- **无障碍友好**：语义化 HTML 结构与键盘可切换主题

## 在线预览

[点击这里查看在线演示](https://naruto-jack12.github.io/resources)

### 浏览器兼容性提示

- **不建议使用**：微信内置浏览器、QQ 内置浏览器（可能会屏蔽链接）
- **推荐使用**：系统自带浏览器或其他第三方浏览器（Chrome、Edge、Safari、Firefox 等）

## 项目结构

```
resources/
├── index.html              # 主页面（静态图标就地内联 SVG）
├── README.md               # 项目说明文档
├── data/
│   └── resources.json      # 资源数据文件（JSON格式）
└── assets/
    ├── css/
    │   └── style.css       # 编译后的样式文件
    ├── scss/
    │   ├── reset.scss      # CSS重置样式
    │   └── style.scss      # SCSS源文件
    └── js/
        ├── icons.js        # 动态分类图标注册表（window.ICONS）
        └── script.js       # JavaScript逻辑文件
```

## 技术栈

- **HTML5** - 语义化标记
- **SCSS** - CSS预处理器
- **JavaScript (ES6+)** - 面向对象编程
- **SVG 图标** - 静态就地内联 + 动态注册表（icons.js）
- **JSON** - 数据存储

## 如何添加/修改资源

### 方法一：直接编辑 JSON 文件

打开 `data/resources.json` 文件，按照以下格式添加新资源。每个分类需要一个 `icon` 字段（对应 `assets/js/icons.js` 中 `window.ICONS` 注册表的键名，如 `film` / `link` / `book`）；`category` 只放简短的分类名，如需补充说明请用可选的 `hint` 字段（会渲染成标题下的小字提示，不会跟着大标题一起放大）：

```json
{
    "category": "分类名称",
    "icon": "film",
    "hint": "可选：作为标题下的小字提示说明",
    "items": [
        {
            "name": "网站名称",
            "description": "网站描述（可选）",
            "url": "https://example.com"
        }
    ]
}
```

### 示例：添加新分类

```json
{
    "category": "动漫资源",
    "icon": "film",
    "items": [
        {
            "name": "Bilibili",
            "description": "哔哩哔哩动画",
            "url": "https://www.bilibili.com"
        },
        {
            "name": "AGE动漫",
            "url": "https://www.agemys.net"
        }
    ]
}
```

### 示例：在现有分类中添加资源

找到对应的分类，在 `items` 数组中添加新项目：

```json
{
    "category": "电影资源",
    "icon": "film",
    "items": [
        {
            "name": "新网站",
            "description": "描述信息",
            "url": "https://newsite.com"
        }
    ]
}
```

## 自定义图标

图标分两处维护，均采用统一绘制规范（24×24 viewBox、`fill="none" stroke="currentColor" stroke-width="1.7"` round 端点）：

- **静态图标**（主题切换、徽标、提示条）：直接内联在 index.html 对应位置，改哪改哪，互不影响。
- **动态分类图标**（资源列表）：集中在 `assets/js/icons.js` 的 `window.ICONS` 注册表里，每个图标一条。给新分类加图标只需追加一行 `"名字": '<path .../>'`，再在 `resources.json` 用同名 `icon` 字段引用，无需改动 script.js。

## 自定义配置

### 修改 JavaScript 配置

打开 `assets/js/script.js`，可以修改以下配置：

```javascript
const renderer = new ResourceRenderer({
    dataPath: 'data/resources.json',      // 数据文件路径
    containerId: 'resource-categories',   // 容器ID
    classCategory: 'category',            // 分类类名
    classResourceList: 'resource-list',   // 列表类名
    linkTarget: '_blank',                 // 链接打开方式
    errorMessage: '加载资源数据失败，请稍后重试。'
});
```

### 修改 SCSS 变量

打开 `assets/scss/style.scss`，Sass 层只保留少量布局变量：

```scss
$transition-smooth: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
$radius-lg: 18px;
$radius-md: 12px;
$radius-sm: 8px;
$max-width: 1160px;
```

颜色与主题由 CSS 自定义属性驱动，明暗两套在 `:root` 与 `[data-theme="dark"]` 中定义，改色只需改这些变量：

```css
:root {
    --primary: #6366f1;
    --accent: #ec4899;
    --bg: #eef1f8;
    --surface: #ffffff;
    --text: #1f2937;
    /* ... */
}
```

## 样式编译

如果你修改了 SCSS 文件，需要编译成 CSS：

```bash
# 使用 Sass 编译器
sass assets/scss/style.scss:assets/css/style.css --style expanded

# 或使用 watch 模式实时编译
sass assets/scss/style.scss:assets/css/style.css --watch
```

## 数据验证规则

系统会自动过滤无效数据：

### 分类验证
- 分类名称为空 —— 跳过
- items 不是数组或为空数组 —— 跳过

### 资源项验证
- 名称为空 —— 跳过
- URL 为空 —— 跳过
- 描述字段可选（为空时只显示名称）

## 问题反馈

如发现链接失效或有更好的推荐，欢迎通过以下方式反馈：

- [GitHub Issues #2 - 页面反馈](https://github.com/naruto-jack12/naruto-jack12.github.io/issues/2)

## 许可证

本项目仅供个人学习和使用。

## 致谢

- 感谢所有提供优质资源的网站和服务
- 感谢 GitHub 提供的免费托管服务
- 感谢所有反馈和建议的用户

---

**注意**：本站仅为资源导航，不存储任何内容。请支持正版，遵守相关法律法规。
