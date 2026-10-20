(function () {
  // ==================== 主题 ====================
  var isDark = (localStorage.getItem('theme') || 'dark') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ==================== 标题打字机 ====================
  var title = document.getElementById('heroTitle');
  if (title) {
    var full = (title.textContent || '').trim();
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (full && !reduceMotion) {
      var textNode = document.createTextNode('');
      var cursor = document.createElement('span');
      cursor.className = 'type-cursor';
      cursor.textContent = '\u258C'; // ▌
      title.textContent = '';
      title.appendChild(textNode);
      title.appendChild(cursor);
      var n = 0;
      var timer = setInterval(function () {
        n++;
        textNode.textContent = full.slice(0, n);
        if (n >= full.length) {
          clearInterval(timer);
          // 打字结束：光标短暂停留后迅速淡出移除
          setTimeout(function () {
            cursor.style.transition = 'opacity 0.1s';
            cursor.style.opacity = '0';
            setTimeout(function () {
              if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
            }, 100);
          }, 100);
        }
      }, 130);
    }
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
})();
