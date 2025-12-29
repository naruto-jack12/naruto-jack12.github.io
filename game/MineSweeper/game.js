
class Minesweeper {
    constructor() {
        this.boardSize = 9;
        this.mineCount = 10;
        this.board = [];
        this.revealedCount = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.timer = null;
        this.seconds = 0;
        
        this.initElements();
        this.initGame();
        this.bindEvents();
    }

    initElements() {
        this.boardElement = document.getElementById('board');
        this.mineCountElement = document.getElementById('mineCount');
        this.timerElement = document.getElementById('timer');
        this.resetBtn = document.getElementById('resetBtn');
        this.levelSelect = document.getElementById('level');
    }

    initGame() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.boardSize}, 30px)`;
        
        // 初始化棋盘
        this.board = Array(this.boardSize).fill().map(() => 
            Array(this.boardSize).fill().map(() => ({
                isMine: false,
                revealed: false,
                flagged: false,
                adjacentMines: 0
            }))
        );
        
        this.revealedCount = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.seconds = 0;
        this.updateTimer();
        this.mineCountElement.textContent = `💣${this.mineCount}`;
        
        // 创建格子
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.boardElement.appendChild(cell);
            }
        }
    }

    bindEvents() {
        this.boardElement.addEventListener('click', (e) => this.handleCellClick(e));
        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.levelSelect.addEventListener('change', () => this.changeLevel());
    }

    handleCellClick(e) {
        if (this.gameOver) return;
        
        const cell = e.target.closest('.cell');
        if (!cell || cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;
        
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        if (this.firstClick) {
            this.placeMines(x, y);
            this.calculateAdjacentMines();
            this.firstClick = false;
            this.startTimer();
        }
        
        if (this.board[y][x].isMine) {
            this.gameOver = true;
            this.revealAllMines();
            cell.classList.add('mine');
            this.resetBtn.textContent = '😵';
            clearInterval(this.timer);
            return;
        }
        
        this.revealCell(x, y);
        
        if (this.checkWin()) {
            this.gameOver = true;
            this.resetBtn.textContent = '😎';
            clearInterval(this.timer);
        }
    }

    handleRightClick(e) {
        if (this.gameOver) return;
        
        const cell = e.target.closest('.cell');
        if (!cell || cell.classList.contains('revealed')) return;
        
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        if (this.board[y][x].flagged) {
            this.board[y][x].flagged = false;
            cell.classList.remove('flagged');
            this.mineCountElement.textContent = `💣${parseInt(this.mineCountElement.textContent.slice(1)) + 1}`;
        } else {
            this.board[y][x].flagged = true;
            cell.classList.add('flagged');
            this.mineCountElement.textContent = `💣${parseInt(this.mineCountElement.textContent.slice(1)) - 1}`;
        }
    }

    placeMines(firstX, firstY) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mineCount) {
            const x = Math.floor(Math.random() * this.boardSize);
            const y = Math.floor(Math.random() * this.boardSize);
            
            // 确保第一次点击的格子及其周围不是地雷
            if ((x === firstX && y === firstY) || 
                (Math.abs(x - firstX) <= 1 && Math.abs(y - firstY) <= 1)) {
                continue;
            }
            
            if (!this.board[y][x].isMine) {
                this.board[y][x].isMine = true;
                minesPlaced++;
            }
        }
    }

    calculateAdjacentMines() {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x].isMine) continue;
                
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && 
                            this.board[ny][nx].isMine) {
                            count++;
                        }
                    }
                }
                this.board[y][x].adjacentMines = count;
            }
        }
    }

    revealCell(x, y) {
        if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize || 
            this.board[y][x].revealed || this.board[y][x].flagged) {
            return;
        }
        
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        this.board[y][x].revealed = true;
        cell.classList.add('revealed');
        this.revealedCount++;
        
        if (this.board[y][x].adjacentMines > 0) {
            cell.textContent = this.board[y][x].adjacentMines;
            cell.classList.add(`cell-${this.board[y][x].adjacentMines}`);
        } else {
            // 如果是空白格子，自动展开周围格子
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    this.revealCell(x + dx, y + dy);
                }
            }
        }
    }

    revealAllMines() {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x].isMine) {
                    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                    cell.classList.add('revealed', 'mine');
                    cell.textContent = '💣';
                }
            }
        }
    }

    checkWin() {
        return this.revealedCount === (this.boardSize * this.boardSize - this.mineCount);
    }

    startTimer() {
        clearInterval(this.timer);
        this.seconds = 0;
        this.updateTimer();
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateTimer();
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.seconds / 60).toString().padStart(2, '0');
        const seconds = (this.seconds % 60).toString().padStart(2, '0');
        this.timerElement.textContent = `⏱️${minutes}:${seconds}`;
    }

    resetGame() {
        clearInterval(this.timer);
        this.initGame();
        this.resetBtn.textContent = '😊';
    }

    changeLevel() {
        const level = this.levelSelect.value;
        if (level === '10') {
            this.boardSize = 9;
            this.mineCount = 10;
        } else if (level === '40') {
            this.boardSize = 16;
            this.mineCount = 40;
        } else if (level === '99') {
            this.boardSize = 30;
            this.mineCount = 99;
        }
        this.resetGame();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
