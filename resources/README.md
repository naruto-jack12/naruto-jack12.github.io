# 🎁 免费资源导航

一个精心整理的免费资源导航页面，提供各类优质免费网站链接。目前主要收录影视资源，未来将扩展更多类型。

## ✨ 特性

- 📊 **分类清晰**：按资源类型分组，方便查找
- 🎨 **现代设计**：渐变背景动画 + 流畅交互效果
- 🌙 **深色模式**：支持明暗主题切换，自动保存偏好
- ⏳ **加载动画**：优雅的数据加载过渡效果
- 📱 **响应式布局**：适配各种屏幕尺寸
- ⚡ **动态渲染**：数据与视图分离，易于维护
- 🔍 **智能过滤**：自动验证数据完整性，隐藏无效内容
- ♿ **无障碍友好**：语义化 HTML 结构

## 🚀 在线预览

[点击这里查看在线演示](https://naruto-jack12.github.io/resources)

### ⚠️ 浏览器兼容性提示

- ❌ **不建议使用**：微信内置浏览器、QQ内置浏览器（可能会屏蔽链接）
- ✅ **推荐使用**：系统自带浏览器或其他第三方浏览器（Chrome、Edge、Safari、Firefox等）

## 📁 项目结构

```
resources/
├── index.html              # 主页面
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
        └── script.js       # JavaScript逻辑文件
```

## 🛠️ 技术栈

- **HTML5** - 语义化标记
- **SCSS** - CSS预处理器
- **JavaScript (ES6+)** - 面向对象编程
- **JSON** - 数据存储

## 📝 如何添加/修改资源

### 方法一：直接编辑 JSON 文件

打开 `data/resources.json` 文件，按照以下格式添加新资源：

```json
{
    "category": "分类名称",
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
    "items": [
        // ... 现有项目
        {
            "name": "新网站",
            "description": "描述信息",
            "url": "https://newsite.com"
        }
    ]
}
```

## ⚙️ 自定义配置

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

打开 `assets/scss/style.scss`，可以修改主题色、间距等：

```scss
// 颜色变量
$primary-color: #007bff;
$secondary-color: #f0f8ff;
$text-color: #333;

// 间距变量
$spacing-xs: 0.5rem;
$spacing-sm: 0.8rem;
$spacing-md: 1rem;
// ... 更多变量
```

## 🎨 样式编译

如果你修改了 SCSS 文件，需要编译成 CSS：

```bash
# 使用 Sass 编译器
sass assets/scss/style.scss:assets/css/style.css --style compressed

# 或使用 watch 模式实时编译
sass assets/scss/style.scss:assets/css/style.css --watch
```

## 📋 数据验证规则

系统会自动过滤无效数据：

### 分类验证
- ❌ 分类名称为空
- ❌ items 不是数组或为空数组

### 资源项验证
- ❌ 名称为空
- ❌ URL 为空
- ✅ 描述字段可选（为空时只显示名称）

## 🐛 问题反馈

如发现链接失效或有更好的推荐，欢迎通过以下方式反馈：

- 📮 [GitHub Issues #2 - 页面反馈](https://github.com/naruto-jack12/naruto-jack12.github.io/issues/2)

## 📄 许可证

本项目仅供个人学习和使用。

## 🙏 致谢

- 感谢所有提供优质资源的网站和服务
- 感谢 GitHub 提供的免费托管服务
- 感谢所有反馈和建议的用户

---

**注意**：本站仅为资源导航，不存储任何内容。请支持正版，遵守相关法律法规。

