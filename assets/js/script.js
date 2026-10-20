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

  // ==================== 链接卡片：等标题打字结束后再显示 ====================
  // 数据并行预取，但只有在「打字完成」且「数据就绪」同时满足时才渲染，
  // 卡片 append 的瞬间触发 CSS 的 fadeUp 动画，观感连贯。
  var typingDone = false;
  var linksData = null;

  function renderLinks() {
    if (!typingDone || !linksData) return;
    var box = document.querySelector('.links-container');
    if (!box) return;
    box.innerHTML = '';
    linksData.forEach(function (item) {
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
  }

  function onTypingDone() {
    typingDone = true;
    renderLinks();
  }

  // ==================== 标题打字机 ====================
  var title = document.getElementById('heroTitle');
  var typed = false;
  if (title) {
    var full = (title.textContent || '').trim();
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (full && !reduceMotion) {
      typed = true;
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
          // 打字完成：先解锁链接显示，光标再短暂停留后淡出移除
          setTimeout(function () {
            cursor.style.transition = 'opacity 0.1s';
            cursor.style.opacity = '0';
            setTimeout(function () {
              if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
            }, 100);
          }, 100);
          onTypingDone();
        }
      }, 200);
    }
  }
  // 无打字动画（无标题 / 空文本 / reduced-motion）时直接解锁
  if (!typed) onTypingDone();

  // ==================== 加载链接数据（并行预取） ====================
  fetch('assets/data/links.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      linksData = data;
      renderLinks();
    })
    .catch(function (err) {
      console.error('链接加载失败:', err);
    });
})();
