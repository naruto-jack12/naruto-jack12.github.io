/**
 * 粒子背景动画系统
 */
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.connectionDistance = 150;
        this.mouseDistance = 200;
        
        this.mouse = {
            x: null,
            y: null,
            radius: this.mouseDistance
        };

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();
        this.addEventListeners();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        // 从 CSS 变量获取颜色配置
        const rootStyles = getComputedStyle(document.documentElement);
        const colorBase = parseInt(rootStyles.getPropertyValue('--particle-color-base')) || 100;
        const colorRange = parseInt(rootStyles.getPropertyValue('--particle-color-range')) || 155;
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `rgba(${colorBase + Math.random() * colorRange}, ${colorBase + Math.random() * colorRange}, 255, ${0.3 + Math.random() * 0.5})`
            });
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
        });
    }

    connectParticles() {
        const rootStyles = getComputedStyle(document.documentElement);
        const connectionColor = rootStyles.getPropertyValue('--connection-color').trim() || 'rgba(100, 150, 255, 0.2)';
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    const opacity = 1 - (distance / this.connectionDistance);
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = connectionColor.replace('0.2', (opacity * 0.2).toFixed(2));
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    updateParticles() {
        this.particles.forEach(particle => {
            // 鼠标交互
            if (this.mouse.x != null && this.mouse.y != null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    const directionX = forceDirectionX * force * 2;
                    const directionY = forceDirectionY * force * 2;

                    particle.x -= directionX;
                    particle.y -= directionY;
                }
            }

            // 移动粒子
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // 边界检测
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX = -particle.speedX;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY = -particle.speedY;
            }
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateParticles();
        this.drawParticles();
        this.connectParticles();
        requestAnimationFrame(() => this.animate());
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }
}

// ==================== 主题切换功能 ====================
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle?.querySelector('.theme-icon');
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        
        this.init();
    }

    init() {
        // 应用保存的主题
        this.applyTheme(this.currentTheme);
        
        // 绑定点击事件
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新图标
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
        
        console.log(`🎨 主题已切换至: ${theme === 'dark' ? '深色' : '浅色'}`);
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }
}

// ==================== 卡片颜色动态设置 ====================
function setupCardColors() {
    const cards = document.querySelectorAll('.link-card');
    cards.forEach(card => {
        const color = card.getAttribute('data-color');
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = `0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px ${color}40`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '';
        });
    });
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 启动主题管理器
    new ThemeManager();
    
    // 启动粒子系统
    new ParticleSystem();
    
    // 设置卡片颜色
    setupCardColors();
    
    console.log('🎨 NARUTO-JACK12 个人主页已加载');
});