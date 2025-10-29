// 配置常量
const CONFIG = {
    INITIAL_SPEED: 100,
    SPEED_INCREMENT_FAST: 30,
    SPEED_INCREMENT_SLOW: 50,
    MIN_ROUNDS: 3,
    SLOW_ROUNDS: 5,
    STOP_ROUNDS: 7,
    RESULT_DELAY: 1000
};

// 奖品数据
const PRIZES = [
    { id: 1, name: "一等奖", probability: 5, color: "#FFD700" },
    { id: 2, name: "二等奖", probability: 10, color: "#C0C0C0" },
    { id: 3, name: "三等奖", probability: 15, color: "#CD7F32" },
    { id: 4, name: "四等奖", probability: 20, color: "#FF6B6B" },
    { id: 5, name: "五等奖", probability: 25, color: "#4ECDC4" },
    { id: 6, name: "六等奖", probability: 10, color: "#95E1D3" },
    { id: 7, name: "七等奖", probability: 10, color: "#FFA07A" },
    { id: 8, name: "谢谢参与", probability: 5, color: "#D3D3D3" }
];

// DOM 元素选择器
const SELECTORS = {
    grid: '#grid',
    drawBtn: '#drawBtn',
    prizeList: '#prizeList',
    recordsList: '#recordsList',
    resultModal: '#resultModal',
    modalPrize: '#modalPrize',
    modalClose: '#modalClose'
};

// 工具函数
const utils = {
    // 格式化时间
    formatTime(date) {
        const pad = (num) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// 抽奖类
class Lottery {
    constructor() {
        this.winRecords = [];
        this.isDrawing = false;
        this.currentIndex = 0;
        this.rounds = 0;
        this.speed = CONFIG.INITIAL_SPEED;
        this.timer = null;
        this.elements = {};
        
        this.init();
    }

    // 初始化
    init() {
        this.cacheElements();
        this.initGrid();
        this.initPrizeList();
        this.initRecords();
        this.bindEvents();
    }

    // 缓存 DOM 元素
    cacheElements() {
        Object.keys(SELECTORS).forEach(key => {
            this.elements[key] = document.querySelector(SELECTORS[key]);
        });
    }

    // 初始化九宫格
    initGrid() {
        this.elements.grid.innerHTML = '';

        // 创建奖品格子
        PRIZES.forEach((prize, index) => {
            const item = this.createGridItem(prize, index);
            this.elements.grid.appendChild(item);
        });

        // 添加中心按钮
        const center = this.createCenterButton();
        this.elements.grid.appendChild(center);
    }

    // 创建格子元素
    createGridItem(prize, index) {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.textContent = prize.name;
        item.style.backgroundColor = prize.color;
        item.dataset.index = index;
        return item;
    }

    // 创建中心按钮
    createCenterButton() {
        const center = document.createElement('div');
        center.className = 'grid-item grid-center';
        center.innerHTML = '开始<br><span>点击抽奖</span>';
        center.addEventListener('click', () => this.startDraw());
        return center;
    }

    // 初始化奖品列表
    initPrizeList() {
        this.elements.prizeList.innerHTML = '';

        PRIZES.forEach(prize => {
            const item = document.createElement('div');
            item.className = 'prize-item';
            item.innerHTML = `
                <div class="prize-name">${prize.name}</div>
                <div class="prize-probability">中奖概率: ${prize.probability}%</div>
            `;
            this.elements.prizeList.appendChild(item);
        });
    }

    // 初始化中奖记录
    initRecords() {
        this.elements.recordsList.innerHTML = '';

        if (this.winRecords.length === 0) {
            this.showEmptyRecords();
            return;
        }

        this.winRecords.forEach(record => {
            const item = document.createElement('div');
            item.className = 'record-item';
            item.innerHTML = `
                <div class="record-prize">${record.prize}</div>
                <div class="record-time">${record.time}</div>
            `;
            this.elements.recordsList.appendChild(item);
        });
    }

    // 显示空记录提示
    showEmptyRecords() {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = '暂无中奖记录';
        emptyMsg.style.cssText = 'text-align: center; padding: 20px; opacity: 0.7;';
        this.elements.recordsList.appendChild(emptyMsg);
    }

    // 绑定事件
    bindEvents() {
        this.elements.drawBtn.addEventListener('click', 
            utils.debounce(() => this.startDraw(), 300)
        );

        this.elements.modalClose.addEventListener('click', () => {
            this.hideResultModal();
        });

        // 点击模态框背景关闭
        this.elements.resultModal.addEventListener('click', (e) => {
            if (e.target === this.elements.resultModal) {
                this.hideResultModal();
            }
        });
    }

    // 开始抽奖
    startDraw() {
        if (this.isDrawing) return;

        this.isDrawing = true;
        this.elements.drawBtn.disabled = true;
        this.resetDrawState();
        this.resetGridItems();
        this.animateGrid();
    }

    // 重置抽奖状态
    resetDrawState() {
        this.currentIndex = 0;
        this.rounds = 0;
        this.speed = CONFIG.INITIAL_SPEED;
        clearTimeout(this.timer);
    }

    // 重置格子状态
    resetGridItems() {
        const gridItems = this.getGridItems();
        gridItems.forEach(item => {
            item.classList.remove('active', 'highlight');
        });
    }

    // 获取所有格子元素（排除中心按钮）
    getGridItems() {
        return document.querySelectorAll('.grid-item:not(.grid-center)');
    }

    // 九宫格动画
    animateGrid() {
        const gridItems = this.getGridItems();
        
        this.deactivatePreviousItem(gridItems);
        this.activateCurrentItem(gridItems);
        
        this.currentIndex++;
        this.rounds = Math.floor(this.currentIndex / gridItems.length);

        this.handleAnimationProgress(gridItems);
    }

    // 取消上一个激活的格子
    deactivatePreviousItem(gridItems) {
        if (this.currentIndex > 0) {
            const prevIndex = (this.currentIndex - 1) % gridItems.length;
            gridItems[prevIndex].classList.remove('active');
        }
    }

    // 激活当前格子
    activateCurrentItem(gridItems) {
        const currentItemIndex = this.currentIndex % gridItems.length;
        gridItems[currentItemIndex].classList.add('active');
    }

    // 处理动画进度
    handleAnimationProgress(gridItems) {
        if (this.rounds < CONFIG.MIN_ROUNDS) {
            this.continueAnimation();
        } else if (this.rounds < CONFIG.SLOW_ROUNDS) {
            this.slowDownAnimation(CONFIG.SPEED_INCREMENT_FAST);
        } else if (this.rounds < CONFIG.STOP_ROUNDS) {
            this.slowDownAnimation(CONFIG.SPEED_INCREMENT_SLOW);
        } else {
            this.finishAnimation(gridItems);
        }
    }

    // 继续动画
    continueAnimation() {
        this.timer = setTimeout(() => this.animateGrid(), this.speed);
    }

    // 减速动画
    slowDownAnimation(increment) {
        this.speed += increment;
        this.timer = setTimeout(() => this.animateGrid(), this.speed);
    }

    // 完成动画
    finishAnimation(gridItems) {
        clearTimeout(this.timer);
        const randomPrize = this.getRandomPrize();
        this.highlightWinningItem(gridItems, randomPrize);
        this.showFinalResult(randomPrize);
    }

    // 高亮中奖格子
    highlightWinningItem(gridItems, prize) {
        const prizeIndex = Array.from(gridItems).findIndex(item => 
            item.textContent === prize.name
        );
        
        gridItems.forEach(item => item.classList.remove('active'));
        if (prizeIndex !== -1) {
            gridItems[prizeIndex].classList.add('highlight');
        }
    }

    // 显示最终结果
    showFinalResult(prize) {
        setTimeout(() => {
            this.recordWin(prize);
            this.showResultModal(prize);
            this.isDrawing = false;
            this.elements.drawBtn.disabled = false;
        }, CONFIG.RESULT_DELAY);
    }

    // 根据概率随机获取奖品
    getRandomPrize() {
        const random = Math.random() * 100;
        let cumulativeProbability = 0;

        for (const prize of PRIZES) {
            cumulativeProbability += prize.probability;
            if (random <= cumulativeProbability) {
                return prize;
            }
        }

        return PRIZES[PRIZES.length - 1];
    }

    // 记录中奖信息
    recordWin(prize) {
        const record = {
            prize: prize.name,
            time: utils.formatTime(new Date())
        };

        this.winRecords.unshift(record);
        
        // 限制记录数量
        if (this.winRecords.length > 50) {
            this.winRecords = this.winRecords.slice(0, 50);
        }

        this.initRecords();
    }

    // 显示结果弹窗
    showResultModal(prize) {
        this.elements.modalPrize.textContent = prize.name;
        this.elements.resultModal.style.display = 'flex';
    }

    // 隐藏结果弹窗
    hideResultModal() {
        this.elements.resultModal.style.display = 'none';
    }

    // 获取中奖记录（公开方法）
    getWinRecords() {
        return [...this.winRecords];
    }

    // 清空中奖记录（公开方法）
    clearRecords() {
        this.winRecords = [];
        this.initRecords();
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    window.lottery = new Lottery();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Lottery, PRIZES, CONFIG };
}