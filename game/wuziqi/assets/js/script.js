document.addEventListener('DOMContentLoaded', () => {
    // 游戏常量
    const BOARD_SIZE = 15;
    const EMPTY = 0;
    const BLACK = 1;
    const WHITE = 2;
    
    // 棋型评分
    const SCORES = {
        FIVE: 100000,       // 五连
        FOUR: 10000,        // 活四
        BLOCKED_FOUR: 1000, // 冲四
        THREE: 1000,        // 活三
        BLOCKED_THREE: 100, // 眠三
        TWO: 100,           // 活二
        BLOCKED_TWO: 10,    // 眠二
        ONE: 10,            // 活一
        BLOCKED_ONE: 1      // 眠一
    };
    
    // 游戏状态
    let board = [];
    let currentPlayer = BLACK;
    let gameOver = false;
    let moveHistory = [];
    let gameMode = 'pvp'; // 'pvp' 或 'pve'
    let aiLevel = 2;      // 1:初级, 2:中级, 3:高级
    let searchDepth = 2;  // 默认搜索深度
    
    // DOM 元素
    const boardElement = document.getElementById('board');
    const statusElement = document.getElementById('status');
    const blackIndicator = document.getElementById('black-indicator');
    const whiteIndicator = document.getElementById('white-indicator');
    const restartButton = document.getElementById('restart');
    const undoButton = document.getElementById('undo');
    const pvpModeButton = document.getElementById('pvp-mode');
    const pveModeButton = document.getElementById('pve-mode');
    const aiLevelButtons = document.querySelectorAll('#ai-level button');
    
    // 初始化棋盘
    function initializeBoard() {
        board = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            board[i] = [];
            for (let j = 0; j < BOARD_SIZE; j++) {
                board[i][j] = EMPTY;
            }
        }
        
        renderBoard();
    }
    
    // 渲染棋盘
    function renderBoard() {
        boardElement.innerHTML = '';
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // 添加星位标记
                if ((i === 3 || i === 7 || i === 11) && (j === 3 || j === 7 || j === 11)) {
                    const star = document.createElement('div');
                    star.style.position = 'absolute';
                    star.style.width = '6px';
                    star.style.height = '6px';
                    star.style.backgroundColor = '#000';
                    star.style.borderRadius = '50%';
                    star.style.zIndex = '1';
                    cell.appendChild(star);
                }
                
                if (board[i][j] !== EMPTY) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${board[i][j] === BLACK ? 'black' : 'white'}`;
                    piece.classList.add('placed');
                    cell.appendChild(piece);
                }
                
                cell.addEventListener('click', () => handleMove(i, j));
                boardElement.appendChild(cell);
            }
        }
    }
    
    // 处理移动
    function handleMove(row, col) {
        if (gameOver || board[row][col] !== EMPTY) return;
        
        // 记录移动历史用于悔棋
        moveHistory.push({row, col, player: currentPlayer});
        
        // 放置棋子
        board[row][col] = currentPlayer;
        renderBoard();
        
        // 检查胜利
        if (checkWin(row, col)) {
            gameOver = true;
            statusElement.textContent = `${currentPlayer === BLACK ? '黑棋' : '白棋'}获胜！`;
            statusElement.style.color = '#4cff00';
            return;
        }
        
        // 检查平局
        if (isBoardFull()) {
            gameOver = true;
            statusElement.textContent = '平局！';
            return;
        }
        
        // 切换玩家
        currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
        updateStatus();
        
        // 如果是人机对战且当前是AI回合
        if (gameMode === 'pve' && currentPlayer === WHITE && !gameOver) {
            setTimeout(() => {
                makeAIMove();
            }, 500);
        }
    }
    
    // AI自动下棋
    function makeAIMove() {
        // 根据AI级别设置搜索深度
        switch(aiLevel) {
            case 1: searchDepth = 1; break; // 初级
            case 2: searchDepth = 2; break; // 中级
            case 3: searchDepth = 3; break; // 高级
        }
        
        // 获取最佳移动位置
        const bestMove = findBestMove();
        
        if (bestMove) {
            handleMove(bestMove.row, bestMove.col);
        }
    }
    
    // 寻找最佳移动位置 - 使用Minimax算法
    function findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        const availableMoves = getAvailableMoves();
        
        // 如果只有一个可选位置，直接返回
        if (availableMoves.length === 1) {
            return availableMoves[0];
        }
        
        // 检查是否有立即获胜的位置
        for (const move of availableMoves) {
            board[move.row][move.col] = WHITE;
            if (checkWin(move.row, move.col)) {
                board[move.row][move.col] = EMPTY;
                return move;
            }
            board[move.row][move.col] = EMPTY;
        }
        
        // 检查是否需要阻止玩家获胜
        for (const move of availableMoves) {
            board[move.row][move.col] = BLACK;
            if (checkWin(move.row, move.col)) {
                board[move.row][move.col] = EMPTY;
                return move;
            }
            board[move.row][move.col] = EMPTY;
        }
        
        // 使用Minimax算法寻找最佳移动
        for (const move of availableMoves) {
            board[move.row][move.col] = WHITE;
            const score = minimax(searchDepth, -Infinity, Infinity, false);
            board[move.row][move.col] = EMPTY;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || getRandomMove(availableMoves);
    }
    
    // Minimax算法实现
    function minimax(depth, alpha, beta, isMaximizing) {
        // 检查游戏是否结束或达到最大深度
        if (depth === 0 || isGameOver()) {
            return evaluateBoard();
        }
        
        const availableMoves = getAvailableMoves();
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of availableMoves) {
                board[move.row][move.col] = WHITE;
                const score = minimax(depth - 1, alpha, beta, false);
                board[move.row][move.col] = EMPTY;
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of availableMoves) {
                board[move.row][move.col] = BLACK;
                const score = minimax(depth - 1, alpha, beta, true);
                board[move.row][move.col] = EMPTY;
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return minScore;
        }
    }
    
    // 获取所有可能的移动位置
    function getAvailableMoves() {
        const moves = [];
        const center = Math.floor(BOARD_SIZE / 2);
        
        // 优先考虑已有棋子周围的空位
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === EMPTY && hasNeighbor(i, j, 2)) {
                    moves.push({row: i, col: j});
                }
            }
        }
        
        // 如果没有找到合适的移动，返回所有空位
        if (moves.length === 0) {
            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (board[i][j] === EMPTY) {
                        moves.push({row: i, col: j});
                    }
                }
            }
        }
        
        // 根据中心距离排序，中心位置优先
        moves.sort((a, b) => {
            const distA = Math.abs(a.row - center) + Math.abs(a.col - center);
            const distB = Math.abs(b.row - center) + Math.abs(b.col - center);
            return distA - distB;
        });
        
        return moves;
    }
    
    // 检查位置周围是否有邻居
    function hasNeighbor(row, col, distance) {
        for (let i = Math.max(0, row - distance); i <= Math.min(BOARD_SIZE - 1, row + distance); i++) {
            for (let j = Math.max(0, col - distance); j <= Math.min(BOARD_SIZE - 1, col + distance); j++) {
                if (i === row && j === col) continue;
                if (board[i][j] !== EMPTY) return true;
            }
        }
        return false;
    }
    
    // 评估棋盘状态
    function evaluateBoard() {
        let score = 0;
        
        // 评估AI的棋子
        score += evaluatePlayer(WHITE) * 1.2; // 给AI稍微更高的权重
        
        // 评估玩家的棋子
        score -= evaluatePlayer(BLACK);
        
        return score;
    }
    
    // 评估特定玩家的棋子
    function evaluatePlayer(player) {
        let score = 0;
        
        // 检查所有方向
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 右下对角线
            [1, -1]   // 左下对角线
        ];
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === player) {
                    // 中心位置更有价值
                    const center = BOARD_SIZE / 2;
                    const distanceToCenter = Math.sqrt(Math.pow(i - center, 2) + Math.pow(j - center, 2));
                    score += (BOARD_SIZE - distanceToCenter) / 10;
                    
                    // 检查四个方向
                    for (const [dx, dy] of directions) {
                        score += evaluateDirection(i, j, dx, dy, player);
                    }
                }
            }
        }
        
        return score;
    }
    
    // 评估特定方向的棋型
    function evaluateDirection(row, col, dx, dy, player) {
        let score = 0;
        let count = 1;      // 当前连续棋子数
        let empty = 0;      // 一端空位
        let blocked = 0;    // 一端被阻挡
        
        // 正向检查
        for (let i = 1; i <= 5; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                blocked++;
                break;
            }
            
            if (board[newRow][newCol] === player) {
                count++;
            } else if (board[newRow][newCol] === EMPTY) {
                empty++;
                break;
            } else {
                blocked++;
                break;
            }
        }
        
        // 反向检查
        for (let i = 1; i <= 5; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                blocked++;
                break;
            }
            
            if (board[newRow][newCol] === player) {
                count++;
            } else if (board[newRow][newCol] === EMPTY) {
                empty++;
                break;
            } else {
                blocked++;
                break;
            }
        }
        
        // 根据棋型评分
        if (count >= 5) {
            score += SCORES.FIVE;
        } else {
            switch(count) {
                case 4:
                    if (empty === 2) score += SCORES.FOUR;          // 活四
                    else if (empty === 1) score += SCORES.BLOCKED_FOUR; // 冲四
                    break;
                case 3:
                    if (empty === 2) score += SCORES.THREE;          // 活三
                    else if (empty === 1) score += SCORES.BLOCKED_THREE; // 眠三
                    break;
                case 2:
                    if (empty === 2) score += SCORES.TWO;            // 活二
                    else if (empty === 1) score += SCORES.BLOCKED_TWO;   // 眠二
                    break;
                case 1:
                    if (empty === 2) score += SCORES.ONE;            // 活一
                    else if (empty === 1) score += SCORES.BLOCKED_ONE;   // 眠一
                    break;
            }
        }
        
        return score;
    }
    
    // 随机选择一个移动
    function getRandomMove(moves) {
        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }
    
    // 检查游戏是否结束
    function isGameOver() {
        // 检查棋盘是否已满
        if (isBoardFull()) return true;
        
        // 检查是否有玩家获胜
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] !== EMPTY && checkWin(i, j)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 更新游戏状态显示
    function updateStatus() {
        statusElement.textContent = `${currentPlayer === BLACK ? '黑棋' : '白棋'}回合`;
        
        if (currentPlayer === BLACK) {
            blackIndicator.classList.add('current');
            whiteIndicator.classList.remove('current');
        } else {
            whiteIndicator.classList.add('current');
            blackIndicator.classList.remove('current');
        }
    }
    
    // 检查胜利条件
    function checkWin(row, col) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 右下对角线
            [1, -1]   // 左下对角线
        ];
        
        const player = board[row][col];
        
        for (const [dx, dy] of directions) {
            let count = 1;  // 当前位置已经有一个棋子
            
            // 正向检查
            for (let i = 1; i < 5; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                
                if (
                    newRow >= 0 && newRow < BOARD_SIZE &&
                    newCol >= 0 && newCol < BOARD_SIZE &&
                    board[newRow][newCol] === player
                ) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 反向检查
            for (let i = 1; i < 5; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                
                if (
                    newRow >= 0 && newRow < BOARD_SIZE &&
                    newCol >= 0 && newCol < BOARD_SIZE &&
                    board[newRow][newCol] === player
                ) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查棋盘是否已满（平局）
    function isBoardFull() {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // 悔棋功能
    function undoMove() {
        if (gameOver || moveHistory.length === 0) return;
        
        const lastMove = moveHistory.pop();
        board[lastMove.row][lastMove.col] = EMPTY;
        
        // 如果不是第一步，则切换回上一个玩家
        if (moveHistory.length > 0) {
            currentPlayer = moveHistory[moveHistory.length - 1].player;
        } else {
            currentPlayer = BLACK;
        }
        
        gameOver = false;
        renderBoard();
        updateStatus();
    }
    
    // 重新开始游戏
    function restartGame() {
        board = [];
        currentPlayer = BLACK;
        gameOver = false;
        moveHistory = [];
        initializeBoard();
        updateStatus();
        
        // 如果是人机对战且AI先手，让AI先下
        if (gameMode === 'pve' && currentPlayer === WHITE) {
            setTimeout(() => {
                makeAIMove();
            }, 500);
        }
    }
    
    // 切换游戏模式
    function setGameMode(mode) {
        gameMode = mode;
        
        if (mode === 'pvp') {
            pvpModeButton.classList.add('active');
            pveModeButton.classList.remove('active');
        } else {
            pveModeButton.classList.add('active');
            pvpModeButton.classList.remove('active');
        }
        
        restartGame();
    }
    
    // 设置AI级别
    function setAILevel(level) {
        aiLevel = parseInt(level);
        
        // 更新按钮状态
        aiLevelButtons.forEach(button => {
            if (parseInt(button.dataset.level) === aiLevel) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // 如果当前是AI回合，重新计算
        if (gameMode === 'pve' && currentPlayer === WHITE && !gameOver) {
            setTimeout(() => {
                makeAIMove();
            }, 500);
        }
    }
    
    // 事件监听
    restartButton.addEventListener('click', restartGame);
    undoButton.addEventListener('click', undoMove);
    pvpModeButton.addEventListener('click', () => setGameMode('pvp'));
    pveModeButton.addEventListener('click', () => setGameMode('pve'));
    aiLevelButtons.forEach(button => {
        button.addEventListener('click', () => setAILevel(button.dataset.level));
    });
    
    // 初始化游戏
    initializeBoard();
    updateStatus();
});