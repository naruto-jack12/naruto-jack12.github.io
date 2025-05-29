// 在原有代码基础上增加截图功能
document.addEventListener('DOMContentLoaded', function() {
    const screenshotBtn = document.querySelector('.screenshotBtn button');

    // 截图功能实现
    screenshotBtn.addEventListener('click', function() {
        // 获取课表元素
        const table = document.querySelector('#app .wrapper');
        
        // 使用html2canvas库进行截图
        html2canvas(table, {
            // backgroundColor: '#fff',
            // scale: 2, // 提高截图质量
            logging: false,
            useCORS: true
        }).then(canvas => {
            // 创建下载链接
            const link = document.createElement('a');
            link.download = '课程表截图.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error('截图失败:', err);
            alert('截图失败，请重试');
        });
    });
});