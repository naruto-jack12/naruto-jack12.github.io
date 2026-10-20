// 保存课表截图（html2canvas）
document.addEventListener('DOMContentLoaded', function () {
    const screenshotBtn = document.getElementById('btn-shot');
    if (!screenshotBtn) return;

    screenshotBtn.addEventListener('click', function () {
        // 包含标题与课表表格，仅剔除顶部科目栏：截图时临时隐藏科目栏，完成后还原
        const wrapper = document.querySelector('#app .wrapper');
        const subjectBar = document.querySelector('#app .subjects');
        if (!wrapper) return;

        const prevDisplay = subjectBar ? subjectBar.style.display : '';
        if (subjectBar) subjectBar.style.display = 'none';

        const restore = () => { if (subjectBar) subjectBar.style.display = prevDisplay; };

        html2canvas(wrapper, {
            logging: false,
            useCORS: true,
            scale: 2,                 // 提高导出清晰度
            backgroundColor: '#ffffff'
        }).then(canvas => {
            restore();
            const link = document.createElement('a');
            link.download = '课程表截图.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            restore();
            console.error('截图失败:', err);
            alert('截图失败，请重试');
        });
    });
});
