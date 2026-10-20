# 随机选择器

一个简洁美观的随机选择工具，支持单抽/多抽、快捷预设、自定义预设、历史记录。界面图标统一使用内联 SVG（线性风格），不再使用 emoji。

## 功能

- **随机抽取** — 从选项列表中随机选择一个或多个
- **老虎机动画** — 抽取时滚动切换，选中后粒子特效
- **快捷预设** — 内置午餐、骰子、是否、饮品等预设
- **自定义预设** — 保存当前选项为预设，支持管理删除
- **多项添加** — 输入框支持逗号分隔批量添加选项
- **历史记录** — 记录最近 20 次抽取结果
- **复制结果** — 一键复制到剪贴板
- **键盘快捷键** — 空格/Ctrl+Enter 抽取，Ctrl+Shift+X 清空

## 项目结构

```
random-picker/
├── index.html          # 入口页面
├── favicon.svg         # 站点图标
├── css/
│   └── style.css       # 样式
├── js/
│   ├── icons.js        # 统一 SVG 图标注册表（ICONS / iconHTML / hydrateIcons）
│   └── script.js       # 逻辑
└── data/
    └── presets.json    # 预设数据
```

## 图标

- 图标集中在 `js/icons.js` 的 `ICONS` 注册表，统一 24×24 线性风格（`stroke=currentColor`，自动跟随主题/强调色）。
- 静态图标在 HTML 用 `<span class="ic" data-icon="名称"></span>` 占位，加载后由 `hydrateIcons` 注入。
- 动态图标（删除、预设、复制、模式切换）在 JS 中用 `iconHTML('名称')` 生成。
- 新增图标只需向 `ICONS` 追加一条即可。

## 使用

直接用浏览器打开 `index.html` 即可使用，无需任何依赖。
