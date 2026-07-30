(function () {
  // ==================== tsParticles 配置 ====================
  var isDark = (localStorage.getItem('theme') || 'dark') === 'dark';

  function getParticleColors() {
    if (document.documentElement.getAttribute('data-theme') === 'light') {
      return { particle: '180, 150, 80', line: '160, 130, 60' };
    }
    return { particle: '200, 160, 60', line: '180, 140, 50' };
  }

  function particleConfig() {
    var c = getParticleColors();
    var w = window.innerWidth;
    var count = w < 600 ? 50 : w < 1000 ? 75 : 110;

    return {
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: count, density: { enable: true } },
        color: { value: 'rgb(' + c.particle + ')' },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.3, max: 0.7 },
          animation: { enable: true, speed: 0.6, minimumValue: 0.2, sync: false }
        },
        size: {
          value: { min: 1.5, max: 4 },
          animation: { enable: true, speed: 2, minimumValue: 1, sync: false }
        },
        links: {
          enable: true,
          distance: 160,
          color: 'rgb(' + c.line + ')',
          opacity: 0.25,
          width: 1.2
        },
        move: {
          enable: true,
          speed: { min: 0.4, max: 1.5 },
          direction: 'none',
          outModes: { default: 'bounce' }
        }
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' },
          resize: true
        },
        modes: {
          grab: { distance: 180, links: { opacity: 0.45 } }
        }
      },
      detectRetina: true
    };
  }

  function initParticles() {
    if (typeof tsParticles === 'undefined') return;
    tsParticles.load('tsparticles', particleConfig());
  }

  // ==================== 主题 ====================
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      // 重新初始化粒子颜色
      tsParticles.load('tsparticles', particleConfig());
    });
  }

  // ==================== 加载链接卡片 ====================
  fetch('assets/data/links.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var box = document.querySelector('.links-container');
      if (!box) return;
      box.innerHTML = '';
      data.forEach(function (item) {
        var a = document.createElement('a');
        a.href = item.href;
        a.className = 'link-card';
        a.innerHTML =
          '<span class="card-line" style="background:' + item.color + '"></span>' +
          '<div class="card-icon" style="background:' + item.color + '18;color:' + item.color + '">' +
          item.icon +
          '</div>' +
          '<div class="card-content"><h3>' + item.title + '</h3><p>' + item.desc + '</p></div>' +
          '<div class="card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>';
        box.appendChild(a);
      });
    });

  // ==================== 启动 ====================
  initParticles();
})();
