/**
 * 资源列表渲染器
 * 可复用的组件，用于从 JSON 数据加载并渲染资源列表
 */
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

        // 清空容器
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

        // 创建分类标题
        const h2 = document.createElement('h2');
        h2.textContent = category.category;
        section.appendChild(h2);

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
        
        // 判断 description 是否有数据
        if (item.description && item.description.trim()) {
            a.textContent = `${item.name} - ${item.description}`;
        } else {
            a.textContent = item.name;
        }
        
        li.appendChild(a);
        return li;
    }
}

// ==================== 初始化 ====================

// 页面加载完成后初始化渲染器
document.addEventListener('DOMContentLoaded', () => {
    // 创建渲染器实例（可以传入自定义配置）
    const renderer = new ResourceRenderer({
        // 在这里可以覆盖默认配置
        // dataPath: 'custom/path/data.json',
        // containerId: 'custom-container',
        // errorMessage: '自定义错误信息'
    });
    
    // 启动渲染器
    renderer.init();
});