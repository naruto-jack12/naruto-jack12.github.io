const container = document.querySelector('.container');
let source;

container.ondragstart = (e) => {
    if (e.target.classList.contains('item')) {
        e.dataTransfer.effectAllowed = e.target.dataset.effect;
        source = e.target;
    }
}

container.ondragover = (e) => {
    e.preventDefault();
}

function clearDropTargets() {
    document.querySelectorAll('.drop-over').forEach(el => {
        el.classList.remove('drop-over');
    });
}

function getDropNode(node) {
    while (node && node !== document) {
        if (node.dataset?.allow) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

container.ondragenter = (e) => {
    clearDropTargets();
    const node = getDropNode(e.target);
    if (!node) return;

    // 允许三种拖拽情况：
    // 1. 从左侧复制到课表 (copy → copy)
    // 2. 在课表内移动 (move → copy)
    // 3. 从课表移回左侧 (move → move)
    const isCopyToTable = source.dataset.effect === 'copy' && node.dataset.allow === 'copy';
    const isMoveInTable = source.dataset.effect === 'move' && node.dataset.allow === 'copy';
    const isMoveBackToLeft = source.dataset.effect === 'move' && node.dataset.allow === 'move';

    if (isCopyToTable || isMoveInTable || isMoveBackToLeft) {
        node.classList.add('drop-over');
    }
}

container.ondrop = (e) => {
    clearDropTargets();
    const targetNode = getDropNode(e.target);
    if (!targetNode) return;

    // 情况1：从左侧复制到课表
    if (source.dataset.effect === 'copy' && targetNode.dataset.allow === 'copy') {
        if (targetNode.firstChild) {
            targetNode.removeChild(targetNode.firstChild);
        }
        const cloned = source.cloneNode(true);
        cloned.dataset.effect = 'move';
        targetNode.appendChild(cloned);
    }
    // 情况2：在课表内移动
    else if (source.dataset.effect === 'move' && targetNode.dataset.allow === 'copy') {
        if (targetNode.firstChild) {
            const existingItem = targetNode.firstChild;
            source.parentNode.appendChild(existingItem);
        }
        targetNode.appendChild(source);
    }
    // 情况3：从课表移回左侧
    else if (source.dataset.effect === 'move' && targetNode.dataset.allow === 'move') {
        source.remove();
    }
}

// 处理课表内动态生成的项目的拖拽
document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('item') && e.target.parentNode.classList.contains('right')) {
        e.dataTransfer.effectAllowed = 'move';
        source = e.target;
    }
});