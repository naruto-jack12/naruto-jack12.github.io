// ====== DOM Elements ======
const preview = document.getElementById('preview');
const divider = document.getElementById('divider');
const wordCount = document.getElementById('wordCount');
const editorWordCount = document.getElementById('editorWordCount');
const previewWordCount = document.getElementById('previewWordCount');
const cursorPos = document.getElementById('cursorPos');
const saveStatus = document.getElementById('saveStatus');
const fileName = document.getElementById('fileName');
const editorPane = document.getElementById('editorPane');
const previewPane = document.getElementById('previewPane');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const replaceInput = document.getElementById('replaceInput');
const searchCount = document.getElementById('searchCount');

// ====== CodeMirror Editor ======
var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  mode: 'markdown',
  lineNumbers: true,
  lineWrapping: true,
  tabSize: 2,
  indentUnit: 2,
  extraKeys: {
    'Tab': function(cm) {
      var cursor = cm.getCursor();
      if (cm.somethingSelected()) {
        cm.indentSelection('add');
      } else {
        cm.replaceSelection('  ', 'end');
      }
    }
  }
});

function getValue() { return editor.getValue(); }
function setValue(v) { editor.setValue(v); }
function getSelStart() { return editor.indexFromPos(editor.getCursor('from')); }
function getSelEnd() { return editor.indexFromPos(editor.getCursor('to')); }
function getSelection() { return editor.getSelection(); }
function setSel(start, end) { editor.setSelection(editor.posFromIndex(start), editor.posFromIndex(end)); editor.focus(); }
function replaceRange(text, start, end) { editor.replaceRange(text, editor.posFromIndex(start), editor.posFromIndex(end)); }

// ====== Markdown Config ======
marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderer = new marked.Renderer();
renderer.image = function({ href, title, text }) {
  const img = `<img src="${href}" alt="${text || ''}"${title ? ` title="${title}"` : ''} loading="lazy">`;
  if (href.endsWith('.mp4') || href.endsWith('.webm')) {
    return `<video controls><source src="${href}"></video>`;
  }
  return img;
};

marked.use({ renderer });

// ====== State ======
let currentFile = null;
let dirty = false;
let isResizing = false;
let viewMode = 'split';
let searchMatches = [];
let currentSearchIndex = -1;
let theme = localStorage.getItem('md-theme') || 'light';

// ====== Render ======
function render() {
  const html = marked.parse(getValue());
  const clean = DOMPurify.sanitize(html, { ADD_TAGS: ['input'], ADD_ATTR: ['checked', 'type'] });
  preview.innerHTML = clean;
  renderTOC();

  preview.querySelectorAll('pre code.language-mermaid').forEach(function(el) {
    var text = el.textContent;
    var div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = text;
    el.parentElement.parentElement.replaceChild(div, el.parentElement);
  });

  if (typeof Prism !== 'undefined') {
    Prism.plugins.autoloader.languages_path = 'https://cdn.jsdelivr.net/npm/prismjs@1/components/';
    Prism.highlightAll();
  }
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(preview, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  }
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default' });
    mermaid.run({ nodes: preview.querySelectorAll('.mermaid') }).catch(function() {});
  }
  updateWordCount();
  updateCursorPos();
  if (!dirty) { dirty = true; updateSaveStatus(); }
  autoSave();
  renderOutline();
  addCopyButtons();
}

function renderTOC() {
  const headings = preview.querySelectorAll('h1, h2, h3, h4');
  if (headings.length < 3) return;
  let toc = '<div class="toc"><strong>目录</strong><ul>';
  headings.forEach(h => {
    const level = parseInt(h.tagName[1]);
    const id = h.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
    h.id = id;
    toc += `<li style="padding-left:${(level - 1) * 16}px"><a href="#${id}">${h.textContent}</a></li>`;
  });
  toc += '</ul></div>';
  const first = preview.querySelector('h1, h2');
  if (first) first.insertAdjacentHTML('beforebegin', toc);
}

preview.addEventListener('click', function(e) {
  var link = e.target.closest('.toc a');
  if (link) {
    e.preventDefault();
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ====== Word Count ======
function updateWordCount() {
  const text = getValue();
  const chars = text.replace(/\s/g, '').length;
  const lines = text.split('\n').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 200));
  editorWordCount.textContent = `${chars} 字`;
  wordCount.textContent = `${chars} 字 | ${words} 词 | ${lines} 行 | ${readTime} 分钟`;
  previewWordCount.textContent = `${chars} 字`;
}

function addCopyButtons() {
  preview.querySelectorAll('pre').forEach(function(pre) {
    if (pre.closest('.code-block') || pre.closest('.mermaid')) return;
    var code = pre.querySelector('code');
    var lang = '';
    if (code) {
      var cls = code.className.match(/language-(\w+)/);
      if (cls) lang = cls[1];
    }
    var displayLang = lang || 'code';
    if (lang) {
      for (var i = 0; i < codeLangs.length; i++) {
        if (codeLangs[i].lang === lang || (codeLangs[i].aliases && codeLangs[i].aliases.indexOf(lang) !== -1)) {
          displayLang = codeLangs[i].label;
          break;
        }
      }
    }
    var wrap = document.createElement('div');
    wrap.className = 'code-block';
    var header = document.createElement('div');
    header.className = 'code-header';
    var label = document.createElement('span');
    label.className = 'code-lang';
    label.textContent = displayLang;
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = '复制';
    btn.addEventListener('click', function() {
      var text = code ? code.textContent : pre.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          btn.textContent = '已复制';
          setTimeout(function() { btn.textContent = '复制'; }, 2000);
        });
      }
    });
    header.appendChild(label);
    header.appendChild(btn);
    wrap.appendChild(header);
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
  });
}

// ====== Cursor Position ======
function updateCursorPos() {
  var cur = editor.getCursor();
  cursorPos.textContent = '行: ' + (cur.line + 1) + ', 列: ' + (cur.ch + 1);
}

// ====== Save Status ======
function updateSaveStatus() {
  saveStatus.textContent = dirty ? '⚠ 未保存' : '✓ 已保存';
}

// ====== Auto Save ======
const AUTO_SAVE_KEY = 'md-editor-content';
const AUTO_SAVE_FILE = 'md-editor-file';

function autoSave() {
  localStorage.setItem(AUTO_SAVE_KEY, getValue());
  localStorage.setItem(AUTO_SAVE_FILE, JSON.stringify({ name: fileName.textContent, modified: Date.now() }));
}

function loadAutoSave() {
  const saved = localStorage.getItem(AUTO_SAVE_KEY);
  const meta = JSON.parse(localStorage.getItem(AUTO_SAVE_FILE) || '{}');
  if (saved) {
    setValue(saved);
    if (meta.name) fileName.textContent = meta.name;
    render();
    dirty = false;
    updateSaveStatus();
  }
}

// ====== File Operations ======
function newFile() {
  if (dirty && !confirm('当前内容未保存，确定新建？')) return;
  setValue('');
  fileName.textContent = 'untitled.md';
  currentFile = null;
  dirty = false;
  render();
  updateSaveStatus();
}

function openFile() {
  document.getElementById('fileInput').click();
}

function loadFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    setValue(e.target.result);
    fileName.textContent = file.name;
    currentFile = file;
    dirty = false;
    render();
    updateSaveStatus();
  };
  reader.readAsText(file);
  event.target.value = '';
}

function saveFile() {
  var content = getValue();
  if (currentFile) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name || fileName.textContent;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    downloadBlob(new Blob([content], { type: 'text/markdown' }), fileName.textContent);
  }
  dirty = false;
  updateSaveStatus();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ====== Export ======
function exportHTML() {
  const style = `
body { max-width: 800px; margin: 40px auto; padding: 0 20px; font: 16px/1.8 -apple-system, sans-serif; color: #1a1a2e; }
pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
blockquote { border-left: 4px solid #1a73e8; margin: 10px 0; padding: 8px 16px; background: #f8f9ff; }
img { max-width: 100%; border-radius: 8px; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px 12px; }
th { background: #f5f5f5; }`;
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${fileName.textContent.replace('.md','')}</title><style>${style}</style></head><body>${preview.innerHTML}</body></html>`;
  const name = fileName.textContent.replace(/\.md$/i, '.html');
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), name);
}

function exportPDF() {
  window.print();
}

// ====== Theme ======
function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark', theme === 'dark');
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('md-theme', theme);
  render();
}

if (theme === 'dark') {
  document.body.classList.add('dark');
  document.getElementById('themeToggle').textContent = '☀️';
}

// ====== Shortcut Help ======
function toggleShortcutHelp() {
  document.getElementById('shortcutHelp').classList.toggle('active');
}

function closeShortcutHelp() {
  document.getElementById('shortcutHelp').classList.remove('active');
}

document.addEventListener('keydown', function(e) {
  if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.target.closest('.CodeMirror') && !e.target.closest('input')) {
    toggleShortcutHelp();
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
    e.preventDefault();
    var modes = ['edit', 'split', 'preview'];
    var idx = modes.indexOf(viewMode);
    setViewMode(modes[(idx + 1) % 3]);
  }
});

// ====== Document Outline ======
var outlineVisible = false;

function toggleOutline() {
  outlineVisible = !outlineVisible;
  document.getElementById('outlinePane').classList.toggle('active', outlineVisible);
  if (outlineVisible) renderOutline();
}

function renderOutline() {
  var body = document.getElementById('outlineBody');
  if (!outlineVisible || !body) return;
  var headings = preview.querySelectorAll('h1, h2, h3, h4');
  if (headings.length === 0) {
    body.innerHTML = '<div class="outline-empty">暂无标题</div>';
    return;
  }
  var html = '';
  headings.forEach(function(h) {
    var level = parseInt(h.tagName[1]);
    var id = h.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
    h.id = id;
    html += '<a class="outline-item h' + level + '" href="#' + id + '">' + escapeHtml(h.textContent) + '</a>';
  });
  body.innerHTML = html;
  body.querySelectorAll('.outline-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.getElementById(this.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ====== View Mode ======
function setViewMode(mode) {
  viewMode = mode;
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  editorPane.style.display = (mode === 'preview') ? 'none' : 'flex';
  previewPane.style.display = (mode === 'edit') ? 'none' : 'flex';
  divider.style.display = (mode === 'split') ? 'block' : 'none';
  if (mode !== 'preview') setTimeout(function() { editor.refresh(); }, 50);
}

// ====== Format Toolbar ======
function format(type) {
  var start = getSelStart();
  var end = getSelEnd();
  var selected = getSelection();
  var text = getValue();
  var lineStart = text.lastIndexOf('\n', start - 1) + 1;
  var lineEnd = text.indexOf('\n', start);
  var fullLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

  var wrappers = {
    bold: ['**', '**'],
    italic: ['*', '*'],
    strikethrough: ['~~', '~~'],
    code: ['`', '`'],
  };

  if (wrappers[type]) {
    var w = wrappers[type];
    var insertion = selected ? w[0] + selected + w[1] : w[0] + '文本' + w[1];
    insertText(insertion, w[0].length, w[1].length);
    return;
  }

  var prefixes = {
    h1: '# ',
    h2: '## ',
    h3: '### ',
    ul: '- ',
    ol: '1. ',
    task: '- [ ] ',
    blockquote: '> ',
  };

  if (type === 'task') {
    if (/^- \[ \] /.test(fullLine)) {
      replaceLine(fullLine.replace('- [ ] ', '- [x] '));
    } else if (/^- \[x\] /.test(fullLine)) {
      replaceLine(fullLine.replace('- [x] ', '- [ ] '));
    } else {
      replaceLine('- [ ] ' + fullLine);
    }
    return;
  }

  if (prefixes[type]) {
    if (!fullLine.trim() || fullLine.trim().startsWith(prefixes[type].trim())) {
      replaceLine(fullLine.replace(/^[#>\-*\s\[\]]+/, '') || '');
    } else {
      replaceLine(prefixes[type] + fullLine);
    }
    return;
  }

  if (type === 'table') {
    insertText('\n| 标题 | 内容 |\n|------|------|\n| 示例 | 数据 |\n', 0, 0);
  }

  if (type === 'hr') {
    insertText('\n---\n', 0, 0);
  }

  if (type === 'link') {
    var url = prompt('请输入链接 URL:', 'https://');
    if (url) {
      var text = selected || '链接文字';
      insertText('[' + text + '](' + url + ')', 0, 0);
    }
  }

  if (type === 'image') {
    var url = prompt('请输入图片 URL:', 'https://');
    if (url) {
      var alt = selected || '图片描述';
      insertText('![' + alt + '](' + url + ')', 0, 0);
    }
  }
}

function loadLanguages() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'assets/data/code-langs.json', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      var langs = JSON.parse(xhr.responseText);
      codeLangs = langs;
      var grid = document.getElementById('langGrid');
      langs.forEach(function(item) {
        var el = document.createElement('span');
        el.className = 'lang-item';
        el.textContent = item.label;
        el.dataset.lang = item.lang;
        el.addEventListener('click', function() {
          insertCodeblock(this.dataset.lang);
        });
        grid.appendChild(el);
      });
    }
  };
  xhr.send();
}

function toggleCodeLang() {
  document.getElementById('langPopover').classList.toggle('active');
}

function insertCodeblock(lang) {
  document.getElementById('langPopover').classList.remove('active');
  var selected = getSelection();
  var code = selected || '代码';
  var fence = lang ? '\n```' + lang + '\n' + code + '\n```\n' : '\n```\n' + code + '\n```\n';
  insertText(fence, lang.length + 5, 4);
}

document.addEventListener('click', function(e) {
  var popover = document.getElementById('langPopover');
  if (popover && popover.classList.contains('active') && !e.target.closest('.codeblock-group')) {
    popover.classList.remove('active');
  }
  var emojiPop = document.getElementById('emojiPopover');
  if (emojiPop && emojiPop.classList.contains('active') && !e.target.closest('.emoji-group')) {
    emojiPop.classList.remove('active');
  }
  var chartPop = document.getElementById('chartPopover');
  if (chartPop && chartPop.classList.contains('active') && !e.target.closest('.chart-group')) {
    chartPop.classList.remove('active');
  }
});

// ====== Data Loading ======
var emojiData = [];
var emojiCategories = [];
var chartTypes = [];
var codeLangs = [];
var defaultContent = '';

function loadText(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function() {
    if (xhr.status === 200 || xhr.status === 0) callback(xhr.responseText);
  };
  xhr.send();
}

function loadJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function() {
    if (xhr.status === 200 || xhr.status === 0) callback(JSON.parse(xhr.responseText));
  };
  xhr.send();
}

function loadData() {
  loadJSON('assets/data/emoji.json', function(data) {
    emojiCategories = data.categories;
    emojiData = data.data;
  });
  loadJSON('assets/data/charts.json', function(data) { chartTypes = data; });
}

// ====== Emoji Picker ======

function buildEmojiPicker() {
  var tabs = document.getElementById('emojiTabs');
  var grid = document.getElementById('emojiGrid');
  tabs.innerHTML = '';
  grid.innerHTML = '';
  emojiCategories.forEach(function(cat, idx) {
    var tab = document.createElement('span');
    tab.className = 'emoji-tab' + (idx === 0 ? ' active' : '');
    tab.textContent = cat.icon;
    tab.title = cat.label;
    tab.dataset.index = idx;
    tab.addEventListener('click', function() {
      document.querySelectorAll('.emoji-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      showEmojiCategory(idx);
    });
    tabs.appendChild(tab);
  });
  showEmojiCategory(0);
}

function showEmojiCategory(idx) {
  var grid = document.getElementById('emojiGrid');
  grid.innerHTML = '';
  var data = emojiData[idx];
  if (!data) return;
  data.emojis.forEach(function(emoji) {
    var el = document.createElement('span');
    el.className = 'emoji-item';
    el.textContent = emoji;
    el.title = emoji;
    el.addEventListener('click', function() {
      insertEmoji(emoji);
    });
    grid.appendChild(el);
  });
}

function toggleEmojiPicker() {
  var popover = document.getElementById('emojiPopover');
  if (!popover.classList.contains('active')) buildEmojiPicker();
  popover.classList.toggle('active');
}

function insertEmoji(emoji) {
  document.getElementById('emojiPopover').classList.remove('active');
  insertText(emoji, 0, 0);
}

// ====== Chart Picker ======
function buildChartPicker() {
  var grid = document.getElementById('chartGrid');
  grid.innerHTML = '';
  chartTypes.forEach(function(chart) {
    var el = document.createElement('div');
    el.className = 'chart-item';
    el.innerHTML = '<span class="chart-item-icon">' + chart.icon + '</span><span class="chart-item-info"><span class="chart-item-name">' + chart.name + '</span><span class="chart-item-desc">' + chart.desc + '</span></span>';
    el.addEventListener('click', function() { insertChart(chart.template); });
    grid.appendChild(el);
  });
}

function toggleChartPicker() {
  var popover = document.getElementById('chartPopover');
  if (!popover.classList.contains('active')) buildChartPicker();
  popover.classList.toggle('active');
}

function insertChart(template) {
  document.getElementById('chartPopover').classList.remove('active');
  insertText('\n' + template + '\n', 4, 4);
}

function insertText(text, cursorOffsetStart, cursorOffsetEnd) {
  var start = getSelStart();
  var end = getSelEnd();
  var before = getValue().substring(0, start);
  var after = getValue().substring(end);
  setValue(before + text + after);
  var pos = start + text.length - cursorOffsetEnd;
  setSel(pos, pos);
  render();
}

function replaceLine(newText) {
  var start = getSelStart();
  var v = getValue();
  var lineStart = v.lastIndexOf('\n', start - 1) + 1;
  var lineEnd = v.indexOf('\n', start);
  var after = lineEnd === -1 ? '' : v.substring(lineEnd);
  setValue(v.substring(0, lineStart) + newText + after);
  var pos = lineStart + newText.length;
  setSel(pos, pos);
  render();
}

// ====== Search & Replace ======
function toggleSearch() {
  searchBar.classList.toggle('active');
  if (searchBar.classList.contains('active')) {
    searchInput.focus();
    searchInput.select();
  }
}

function searchInEditor() {
  var query = searchInput.value;
  if (!query) { searchCount.textContent = ''; return; }
  var text = getValue();
  searchMatches = [];
  var idx = -1;
  while ((idx = text.indexOf(query, idx + 1)) !== -1) {
    searchMatches.push(idx);
  }
  currentSearchIndex = searchMatches.length > 0 ? 0 : -1;
  if (searchMatches.length > 0) {
    setSel(searchMatches[0], searchMatches[0] + query.length);
  }
  searchCount.textContent = searchMatches.length > 0 ? (currentSearchIndex + 1) + '/' + searchMatches.length : '无结果';
}

function replaceNext() {
  var query = searchInput.value;
  var replace = replaceInput.value;
  if (!query) return;
  var start = getSelStart();
  var text = getValue();
  var from = text.substring(start);
  var pos = from.indexOf(query);
  if (pos === -1) return;
  var absPos = start + pos;
  setValue(text.substring(0, absPos) + replace + text.substring(absPos + query.length));
  setSel(absPos + replace.length, absPos + replace.length);
  searchInEditor();
  render();
}

function replaceAll() {
  var query = searchInput.value;
  var replace = replaceInput.value;
  if (!query) return;
  var regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  setValue(getValue().replace(regex, replace));
  searchInput.value = '';
  searchCount.textContent = '';
  render();
}

// ====== Undo / Redo ======
function undo() { editor.undo(); }
function redo() { editor.redo(); }

// ====== Auto-close Brackets ======
var autoPairs = { "'": "'", '"': '"', '(': ')', '[': ']', '{': '}' };

editor.on('beforeChange', function(cm, change) {
  if (change.origin !== '+input' || change.text.length !== 1) return;
  var ch = change.text[0];
  var pair = autoPairs[ch];
  if (!pair) return;
  var cursor = change.from;
  var line = cm.getLine(cursor.line);
  var nextChar = line.charAt(cursor.ch);
  if (ch === "'" || ch === '"') {
    var charBefore = line.charAt(cursor.ch - 1);
    if (/[\w\u4e00-\u9fff]/.test(charBefore)) return;
  }
  if (pair === ch && nextChar === ch) {
    change.update(null, null, [ch]);
    return;
  }
  var newText = ch + pair;
  var newPos = { line: cursor.line, ch: cursor.ch + 1 };
  change.update(null, null, [newText]);
  cm.setCursor(newPos);
});

// ====== Editor Events ======
editor.on('change', function() { render(); });
editor.on('scroll', function() {
  var info = editor.getScrollInfo();
  var pct = info.top / (info.height - info.clientHeight);
  preview.scrollTop = pct * (preview.scrollHeight - preview.clientHeight);
});
editor.on('cursorActivity', function() { updateCursorPos(); });

// ====== Divider Drag ======
divider.addEventListener('mousedown', (e) => {
  isResizing = true;
  divider.classList.add('active');
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const container = document.querySelector('.container');
  const rect = container.getBoundingClientRect();
  const x = Math.max(200, Math.min(e.clientX - rect.left, rect.width - 200));
  const pct = (x / rect.width) * 100;
  editorPane.style.flex = `0 0 ${pct}%`;
  previewPane.style.flex = `1 1 ${100 - pct}%`;
});

document.addEventListener('mouseup', () => {
  isResizing = false;
  divider.classList.remove('active');
  setTimeout(function() { editor.refresh(); }, 50);
});

// ====== Keyboard Shortcuts ======
document.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.key === 's') { e.preventDefault(); saveFile(); }
  if (ctrl && e.key === 'o') { e.preventDefault(); openFile(); }
  if (ctrl && e.key === 'n') { e.preventDefault(); newFile(); }
  if (ctrl && e.key === 'f') { e.preventDefault(); toggleSearch(); }

  if (ctrl && e.key === 'b') { e.preventDefault(); format('bold'); }
  if (ctrl && e.key === 'i') { e.preventDefault(); format('italic'); }
  if (ctrl && e.key === 'k') { e.preventDefault(); format('link'); }
  if (ctrl && e.shiftKey && e.key === 'S') { e.preventDefault(); format('strikethrough'); }
  if (ctrl && e.shiftKey && e.key === 'C') { e.preventDefault(); format('code'); }

  if (e.key === 'Escape') { searchBar.classList.remove('active'); }
});

// ====== Drag & Drop Images ======
editor.getWrapperElement().addEventListener('drop', function(e) {
  e.preventDefault();
  var files = e.dataTransfer.files;
  for (var i = 0; i < files.length; i++) {
    if (files[i].type.startsWith('image/')) {
      (function(file) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          var pos = getSelStart();
          var imgTag = '\n![' + file.name + '](' + ev.target.result + ')\n';
          setValue(getValue().substring(0, pos) + imgTag + getValue().substring(pos));
          render();
        };
        reader.readAsDataURL(file);
      })(files[i]);
    }
  }
});

editor.getWrapperElement().addEventListener('dragover', function(e) { e.preventDefault(); });

// ====== Paste Images ======
editor.on('paste', function(instance, e) {
  var items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      e.preventDefault();
      var file = items[i].getAsFile();
      var reader = new FileReader();
      reader.onload = function(ev) {
        var pos = getSelStart();
        var imgTag = '![pasted-image](' + ev.target.result + ')';
        setValue(getValue().substring(0, pos) + imgTag + getValue().substring(pos));
        render();
      };
      reader.readAsDataURL(file);
      return;
    }
  }
});

// ====== Init ======
if (localStorage.getItem(AUTO_SAVE_KEY)) {
  loadAutoSave();
} else {
  loadText('assets/data/default-content.md', function(text) {
    defaultContent = text;
    setValue(defaultContent);
    render();
  });
  render();
}

setViewMode('split');
loadLanguages();
loadData();

console.log('📝 Markdown 编辑器已启动！');
