/**
 * 资源列表渲染器
 * 可复用的组件，用于从 JSON 数据加载并渲染资源列表
 */
// 统一风格图标：图标路径数据集中在 assets/js/icons.js 的 window.ICONS 中，
// 这里按名称生成一个内联 <svg>（24×24 stroke 线性，currentColor 随主题联动）。
// 新增分类图标只需在 icons.js 追加一个条目，无需改动本文件。
var SVG_NS = 'http://www.w3.org/2000/svg';
var ICON_ATTRS = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.7',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
};
function makeIcon(name, className) {
    var registry = window.ICONS || {};
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className || 'icon');
    Object.keys(ICON_ATTRS).forEach(function (k) { svg.setAttribute(k, ICON_ATTRS[k]); });
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = registry[name] || registry.link || '';
    return svg;
}

class ResourceRenderer {
    /**
     * 构造函数
     * @param {Object} config - 配置对象
     */
    constructor(config = {}) {
        // 默认配置
        this.config = {
            dataPath: 'data/resources.json',
            containerId: 'resource-categories',
            classCategory: 'category',
            classResourceList: 'resource-list',
            linkTarget: '_blank',
            errorMessage: '加载资源数据失败，请稍后重试。',
            ...config  // 合并用户配置
        };
    }

    /**
     * 初始化渲染器
     */
    init() {
        this.loadResources();
    }

    /**
     * 从 JSON 文件加载资源数据
     */
    async loadResources() {
        try {
            const response = await fetch(this.config.dataPath);
            if (!response.ok) {
                throw new Error('Failed to load resources data');
            }
            const resourcesData = await response.json();
            this.renderResources(resourcesData);
        } catch (error) {
            console.error('Error loading resources:', error);
            this.showError(this.config.errorMessage);
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    showError(message) {
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
        }
    }

    /**
     * 渲染资源列表
     * @param {Array} resourcesData - 资源数据数组
     */
    renderResources(resourcesData) {
        const container = document.getElementById(this.config.containerId);
        if (!container) {
            console.error(`Container with id "${this.config.containerId}" not found`);
            return;
        }

        // 清空容器（包括加载动画）
        container.innerHTML = '';

        // 验证数据是否为数组
        if (!Array.isArray(resourcesData) || resourcesData.length === 0) {
            console.warn('No resources data to render');
            return;
        }

        resourcesData.forEach(category => {
            // 验证分类数据
            if (!this.isValidCategory(category)) {
                console.warn('Invalid category data skipped:', category);
                return;
            }

            const section = this.createCategorySection(category);
            if (section) {
                container.appendChild(section);
            }
        });
        
        // 添加淡入动画
        container.classList.add('fade-in');
    }

    /**
     * 验证分类数据是否有效
     * @param {Object} category - 分类数据
     * @returns {boolean} - 是否有效
     */
    isValidCategory(category) {
        // 检查分类对象是否存在
        if (!category || typeof category !== 'object') {
            return false;
        }

        // 检查分类名称
        if (!category.category || !category.category.trim()) {
            return false;
        }

        // 检查 items 是否为数组且不为空
        if (!Array.isArray(category.items) || category.items.length === 0) {
            return false;
        }

        return true;
    }

    /**
     * 创建分类区块
     * @param {Object} category - 分类数据
     * @returns {HTMLElement|null} - 分类区块元素，如果无效则返回 null
     */
    createCategorySection(category) {
        // 创建分类区块
        const section = document.createElement('section');
        section.className = this.config.classCategory;

        // 创建分类标题（统一风格 SVG 图标 + 标题）
        const h2 = document.createElement('h2');
        h2.appendChild(makeIcon(category.icon || 'link', 'category-icon'));
        const titleSpan = document.createElement('span');
        titleSpan.className = 'category-title';
        titleSpan.textContent = category.category;
        h2.appendChild(titleSpan);
        section.appendChild(h2);

        // 分类提示（可选）：带信息图标的醒目提示块，与标题分级，让用户更容易识别
        if (category.hint && category.hint.trim()) {
            const hint = document.createElement('p');
            hint.className = 'category-hint';
            hint.appendChild(makeIcon('info', 'hint-icon'));
            const hintText = document.createElement('span');
            hintText.className = 'hint-text';
            hintText.textContent = category.hint;
            hint.appendChild(hintText);
            section.appendChild(hint);
        }

        // 创建资源列表
        const ul = document.createElement('ul');
        ul.className = this.config.classResourceList;

        // 添加资源项
        let hasValidItems = false;
        if (category.items && Array.isArray(category.items)) {
            category.items.forEach(item => {
                // 验证资源项数据
                if (this.isValidResourceItem(item)) {
                    const li = this.createResourceItem(item);
                    ul.appendChild(li);
                    hasValidItems = true;
                } else {
                    console.warn('Invalid resource item skipped:', item);
                }
            });
        }

        // 如果没有有效的资源项，不显示该分类
        if (!hasValidItems) {
            return null;
        }

        section.appendChild(ul);
        return section;
    }

    /**
     * 验证资源项数据是否有效
     * @param {Object} item - 资源项数据
     * @returns {boolean} - 是否有效
     */
    isValidResourceItem(item) {
        // 检查资源项对象是否存在
        if (!item || typeof item !== 'object') {
            return false;
        }

        // 检查名称和 URL
        if (!item.name || !item.name.trim()) {
            return false;
        }

        if (!item.url || !item.url.trim()) {
            return false;
        }

        return true;
    }

    /**
     * 创建单个资源项
     * @param {Object} item - 资源项数据
     * @returns {HTMLElement} - 资源项元素
     */
    createResourceItem(item) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.target = this.config.linkTarget;
        a.rel = 'noopener noreferrer';

        // 文本区：名称 + （可选）描述
        const body = document.createElement('span');
        body.className = 'resource-body';
        const name = document.createElement('span');
        name.className = 'resource-name';
        name.textContent = item.name;
        body.appendChild(name);
        if (item.description && item.description.trim()) {
            const desc = document.createElement('span');
            desc.className = 'resource-desc';
            desc.textContent = item.description;
            body.appendChild(desc);
        }
        a.appendChild(body);

        // 统一风格跳转箭头图标
        a.appendChild(makeIcon('arrow', 'resource-arrow'));

        li.appendChild(a);
        return li;
    }
}

// ==================== 主题切换功能 ====================
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        // 应用保存的主题（图标显隐由 CSS 根据 data-theme 驱动）
        this.applyTheme(this.currentTheme);
        
        // 绑定点击 / 键盘事件
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
            this.themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleTheme(); }
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }
}

// ==================== 初始化 ====================

// 本脚本位于 <body> 末尾，上方 DOM 已解析完毕。
// 立即启动，不再等待 DOMContentLoaded —— 因为 deferred 的 three.js 模块(background.js)
// 会拖后 DOMContentLoaded 的触发时机，导致资源列表被"排队"延迟渲染。
// 直接执行可让 resources.json 的 fetch 与 three.js 背景并行加载，互不阻塞。
function bootApp() {
    // 主题管理器（切换 + 恢复偏好）
    new ThemeManager();

    // 资源列表渲染器
    const renderer = new ResourceRenderer({
        // 可覆盖默认配置：dataPath / containerId / errorMessage
    });
    renderer.init();
}

bootApp();