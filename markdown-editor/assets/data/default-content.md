# 欢迎使用 Markdown 编辑器

功能齐全的在线 Markdown 编辑器，支持语法高亮、数学公式、图表和实时预览。

---

## 核心功能

| 功能 | 说明 |
|---|---|
| 实时预览 | 分栏/编辑/预览三种模式，拖拽调整宽度 |
| 格式栏 | 一键插入 Markdown 语法 + 公式/Emoji/日期时间选择器 |
| 文件操作 | 新建 / 打开 / 下载 |
| 导出 | 导出 HTML 或打印 PDF |
| 搜索替换 | Ctrl+F 搜索，支持替换全部和上下导航 |
| 列表续写 | Enter 自动延续列表前缀，有序列表数字递增 |
| 图片 | 拖拽/粘贴插入，支持点击跳转链接 |
| 主题切换 | 亮色 / 暗色主题 |
| 自动保存 | 内容自动保存到本地 |
| 目录侧栏 | 自动提取 h1-h6 标题结构，滚动联动高亮 |

## 文本样式

**加粗**、*斜体*、~~删除线~~、`行内代码`

## 标题

# H1 标题
## H2 标题
### H3 标题
#### H4 标题
##### H5 标题
###### H6 标题

## 数学公式 (KaTeX)

行内公式: $E = mc^2$

块级公式:

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

$$\int_{a}^{b} f(x)\,dx = F(b) - F(a)$$

## 图表 (Mermaid)

```mermaid
graph TD
    A[编写 Markdown] --> B{实时预览}
    B -->|语法高亮| C[Prism.js]
    B -->|数学公式| D[KaTeX]
    B -->|图表| E[Mermaid]
    B -->|代码着色| F[CodeMirror]
    C --> G[导出 HTML/PDF]
    D --> G
    E --> G
    F --> G
```

## 时序图

```mermaid
sequenceDiagram
    用户->>编辑器: 输入文字
    编辑器->>预览: 实时渲染 Markdown
    预览-->>用户: 显示格式化结果
    用户->>编辑器: Ctrl+S 下载
    编辑器->>本地: 自动保存到 localStorage
```

## 代码块 (Prism.js 语法高亮)

```javascript
// 带有语法着色的 JavaScript 代码
function fibonacci(n) {
  if (n <= 1) return n;
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

console.log(fibonacci(10)); // 55
```

```python
# Python 示例
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))
```

## 引用

> 简洁是终极的 sophistication。
> —— 达·芬奇

> 代码是写给人看的，顺便能在机器上运行。
> —— Harold Abelson

## 任务列表

- [x] 实时预览
- [x] 格式栏工具栏
- [x] 文件导入导出
- [x] 代码语法高亮
- [x] 数学公式
- [x] Mermaid 图表
- [x] Emoji 选择器
- [x] 公式选择器
- [x] 日期时间插入
- [x] 表格对齐控制
- [x] 列表自动续写
- [x] 目录侧栏
- [ ] 更多功能开发中...

## 表格对齐

| 左对齐 | 居中对齐 | 右对齐 |
|:---|:---:|---:|
| 文字 | 文字 | 文字 |
| 左 | 中 | 右 |

---

*开始写作吧！*
