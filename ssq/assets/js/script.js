function generateNumbers() {
    // 生成6个不重复的红球号码
    let redBalls = [];
    while (redBalls.length < 6) {
        let num = Math.floor(Math.random() * 33) + 1;
        if (!redBalls.includes(num)) {
            redBalls.push(num);
        }
    }
    redBalls.sort((a, b) => a - b); // 将红球号码排序

    // 生成1个蓝球号码
    let blueBall = Math.floor(Math.random() * 16) + 1;

    // 显示结果，补0显示两位数
    let result = document.getElementById("result");
    result.innerHTML = redBalls.map(n => `<span class="red-ball">${String(n).padStart(2, '0')}</span>`).join(" ") + 
                       " + " + 
                       `<span class="blue-ball">${String(blueBall).padStart(2, '0')}</span>`;
}