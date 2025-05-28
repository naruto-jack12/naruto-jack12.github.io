const colorPicker = document.querySelector('input');
const cvs = document.querySelector('canvas');
const ctx = cvs.getContext('2d');

/**
 * 初始化画布尺寸
 *
 * 该函数用于初始化画布的尺寸，以适应设备的像素比，并确保画布的显示尺寸为指定宽度和高度。
 */
function init() {
    const w = 500,
        h = 300;
    cvs.width = w * devicePixelRatio;
    cvs.height = h * devicePixelRatio;
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';
}

init();

const shapes = [];

class Rectangle {
    constructor(startX, startY, color) {
        this.startX = startX;
        this.startY = startY;
        this.color = color;
        this.endX = startX;
        this.endY = startY;
    }

    get minX() {
        return Math.min(this.startX, this.endX);
    }

    get minY() {
        return Math.min(this.startY, this.endY);
    }

    get maxX() {
        return Math.max(this.startX, this.endX);
    }

    get maxY() {
        return Math.max(this.startY, this.endY);
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.minX * devicePixelRatio,
            this.minY * devicePixelRatio,
            (this.maxX - this.minX) * devicePixelRatio,
            (this.maxY - this.minY) * devicePixelRatio
        )

        // 绘制边框
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2 * devicePixelRatio;
        ctx.strokeRect(
            this.minX * devicePixelRatio,
            this.minY * devicePixelRatio,
            (this.maxX - this.minX) * devicePixelRatio,
            (this.maxY - this.minY) * devicePixelRatio
        );

    }

    isInside(x, y) {
        return (
            x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY
        );
    }

}

function getShape(x,y) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.isInside(x,y)) {
            return shape;
        }
    }
    return null;
}

cvs.onmousedown = (e) => {
    const shape = getShape(e.offsetX, e.offsetY);
    const cvsRect = cvs.getBoundingClientRect();
    if(shape) {
        const sx = e.offsetX, 
            sy = e.offsetY;
        const {startX, startY, endX, endY} = shape;

        window.onmousemove = (e) => {
            const x = e.clientX - cvsRect.left;
            const y = e.clientY - cvsRect.top;
            const dx = x - sx;
            const dy = y - sy;
            shape.startX = startX + dx;
            shape.startY = startY + dy;
            shape.endX = endX + dx;
            shape.endY = endY + dy;
        }

    } else {
        const rect = new Rectangle(e.offsetX, e.offsetY, colorPicker.value);
        shapes.push(rect);
        const cvsRect = cvs.getBoundingClientRect();

        window.onmousemove = (e) => {
            // 改变矩形的结束坐标
            const x = e.clientX - cvsRect.left;
            const y = e.clientY - cvsRect.top;
            rect.endX = x;
            rect.endY = y;
        }
    }

    window.onmouseup = () => {
        // 清除mousemove和mouseup事件
        window.onmousemove = null;
        window.onmouseup = null;
    }
}

function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    for (const shape of shapes) {
        shape.draw();
    }
}
draw();

// shapes.splice(2, 1); 撤销  删除最后一个矩形  *应该用shapes.splice(-1, 1);
