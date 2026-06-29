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
    },
    'Enter': function(cm) {
      var cursor = cm.getCursor();
      var line = cm.getLine(cursor.line);
      var match = line.match(/^(\s*)([-*>] |\d+\. |[-*] \[[ x]\] )/);
      if (match) {
        var indent = match[1];
        var prefix = match[2];
        // Increment ordered list number
        var numMatch = prefix.match(/^(\d+)\. /);
        if (numMatch) prefix = (parseInt(numMatch[1], 10) + 1) + '. ';
        var rest = line.slice(match[0].length);
        if (!rest.trim()) {
          cm.replaceRange('', { line: cursor.line, ch: 0 }, { line: cursor.line, ch: line.length });
          cm.execCommand('newlineAndIndent');
        } else {
          cm.replaceRange('\n' + indent + prefix, { line: cursor.line, ch: line.length });
          cm.setCursor({ line: cursor.line + 1, ch: (indent + prefix).length });
        }
      } else {
        cm.execCommand('newlineAndIndent');
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
  const clean = DOMPurify.sanitize(html, { ADD_TAGS: ['input'], ADD_ATTR: ['checked', 'type', 'disabled'] });
  preview.innerHTML = clean;

  preview.querySelectorAll('ul:not(.task-list) li input[type="checkbox"]').forEach(function(cb) {
    var ul = cb.closest('ul');
    if (ul) ul.classList.add('task-list');
  });

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
    preview.querySelectorAll('.mermaid').forEach(function(el) {
      var src = document.createElement('span');
      src.className = 'mermaid-source';
      src.textContent = el.textContent;
      el.parentNode.insertBefore(src, el);
    });
    mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default' });
    mermaid.run({ nodes: preview.querySelectorAll('.mermaid') }).catch(function() {});
  }
  updateWordCount();
  updateCursorPos();
  if (!dirty) { dirty = true; updateSaveStatus(); }
  autoSave();
  renderOutline();
  addCopyButtons();
  if (searchInput.value.trim()) highlightInPreview(searchInput.value);
}



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

function clearStorage() {
  if (!confirm('确定清空自动保存的草稿？编辑器内容将被清空，请先下载保存文件。')) return;
  localStorage.removeItem('md-editor-content');
  localStorage.removeItem('md-editor-file');
  setValue('');
  fileName.textContent = 'untitled.md';
  currentFile = null;
  dirty = false;
  render();
  updateSaveStatus();
}

// ====== Export ======
var exportCss = '';

function exportHTML() {
  var bodyHtml = preview.innerHTML;
  var copyScript = 'document.addEventListener(\"click\",function(e){var b=e.target.closest(\".copy-btn\");if(b){var t=b.parentElement.nextElementSibling;var c=t&&t.tagName===\"PRE\"?t.textContent:b.closest(\".code-block\").querySelector(\"pre\").textContent;navigator.clipboard.writeText(c).then(function(){b.textContent=\"\u5DF2\u590D\u5236\";setTimeout(function(){b.textContent=\"\u590D\u5236\"},2000)})}})';
  var html = '<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>' + fileName.textContent.replace('.md','') + '</title><style>' + exportCss + '</style></head><body>' + bodyHtml + '<script>' + copyScript + '<\/script></body></html>';
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), fileName.textContent.replace(/\.md$/i, '.html'));
}

function exportPDF() {
  window.print();
}

var sunSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
var moonSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark', theme === 'dark');
  document.getElementById('themeToggle').innerHTML = theme === 'dark' ? sunSvg : moonSvg;
  localStorage.setItem('md-theme', theme);
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default' });
    mermaid.run({ nodes: preview.querySelectorAll('.mermaid') }).catch(function() {});
  }
}

if (theme === 'dark') {
  document.body.classList.add('dark');
  document.getElementById('themeToggle').innerHTML = sunSvg;
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
var outlineVisible = true;

function toggleOutline() {
  outlineVisible = !outlineVisible;
  document.getElementById('outlinePane').classList.toggle('active', outlineVisible);
  if (outlineVisible) renderOutline();
}

function renderOutline() {
  var body = document.getElementById('outlineBody');
  if (!outlineVisible || !body) return;
  var headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) {
    body.innerHTML = '<div class="outline-empty">暂无标题</div>';
    return;
  }
  var html = '';
  headings.forEach(function(h) {
    var level = parseInt(h.tagName[1]);
    var id = h.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
    h.id = id;
    html += '<a class="outline-item h' + level + '" data-id="' + id + '">' + escapeHtml(h.textContent) + '</a>';
  });
  body.innerHTML = html;
  body.querySelectorAll('.outline-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      var target = document.getElementById(this.dataset.id);
      if (target) {
        var r = target.getBoundingClientRect();
        var pr = preview.getBoundingClientRect();
        var from = preview.scrollTop;
        var to = from + r.top - pr.top - 10;
        var startTime = null;
        var duration = 250;
        function step(now) {
          if (!startTime) startTime = now;
          var progress = Math.min((now - startTime) / duration, 1);
          var ease = 1 - Math.pow(1 - progress, 3);
          syncing = true;
          preview.scrollTop = from + (to - from) * ease;
          syncing = false;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }
    });
  });
}

function updateActiveOutline() {
  var headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
  var items = document.querySelectorAll('.outline-item');
  if (!headings.length || !items.length) return;
  var scrollTop = preview.scrollTop + 100;
  var active = -1;
  for (var i = 0; i < headings.length; i++) {
    if (headings[i].offsetTop <= scrollTop) active = i;
  }
  items.forEach(function(el, idx) {
    el.classList.toggle('active', idx === active);
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
  searchBar.classList.toggle('preview-mode', mode === 'preview');
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
    h4: '#### ',
    h5: '##### ',
    h6: '###### ',
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
    if (!fullLine.trim()) {
      replaceLine(prefixes[type]);
    } else if (fullLine.trim().startsWith(prefixes[type].trim())) {
      replaceLine(fullLine.replace(/^[#>\-*\s\[\]]+/, '') || '');
    } else {
      replaceLine(prefixes[type] + fullLine);
    }
    return;
  }

  if (type === 'hr') {
    insertText('\n---\n', 0, 0);
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
  var tablePop = document.getElementById('tablePopover');
  if (tablePop && tablePop.classList.contains('active') && !e.target.closest('.table-group')) {
    tablePop.classList.remove('active');
  }
  var linkPop = document.getElementById('linkPopover');
  if (linkPop && linkPop.classList.contains('active') && !e.target.closest('.link-group')) {
    linkPop.classList.remove('active');
  }
  var imagePop = document.getElementById('imagePopover');
  if (imagePop && imagePop.classList.contains('active') && !e.target.closest('.image-group')) {
    imagePop.classList.remove('active');
  }
  var dtPop = document.getElementById('datetimePopover');
  if (dtPop && dtPop.classList.contains('active') && !e.target.closest('.datetime-group')) {
    dtPop.classList.remove('active');
  }
  var fPop = document.getElementById('formulaPopover');
  if (fPop && fPop.classList.contains('active') && !e.target.closest('.formula-group')) {
    fPop.classList.remove('active');
  }
});

// ====== Data Loading ======
var emojiData = [];
var emojiCategories = [];
var chartTypes = [];
var formulaData = [];
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
  loadJSON('assets/data/formulas.json', function(data) { formulaData = data; });
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

// ====== Formula Picker ======

function toggleFormulaPicker() {
  document.getElementById('formulaPopover').classList.toggle('active');
  if (document.getElementById('formulaPopover').classList.contains('active')) {
    if (!document.getElementById('formulaGrid').children.length) buildFormulaPicker();
  }
}

var formulaBuilt = false;

function buildFormulaPicker() {
  if (formulaBuilt) return;
  formulaBuilt = true;
  var tabs = document.getElementById('formulaTabs');
  var grid = document.getElementById('formulaGrid');
  tabs.innerHTML = '';
  grid.innerHTML = '';
  formulaData.forEach(function(cat, idx) {
    var tab = document.createElement('span');
    tab.className = 'formula-tab' + (idx === 0 ? ' active' : '');
    tab.textContent = cat.category;
    tab.dataset.index = idx;
    tab.addEventListener('click', function() {
      document.querySelectorAll('.formula-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      showFormulaCategory(idx);
    });
    tabs.appendChild(tab);
  });
  showFormulaCategory(0);
}

function showFormulaCategory(idx) {
  var grid = document.getElementById('formulaGrid');
  grid.innerHTML = '';
  var cat = formulaData[idx];
  if (!cat) return;
  cat.items.forEach(function(item) {
    var el = document.createElement('div');
    el.className = 'formula-item';
    el.innerHTML = '<span class="formula-item-label">' + item.label + '</span><span class="formula-item-latex">' + item.latex + '</span>';
    el.addEventListener('click', function() { insertFormula(item.latex); });
    grid.appendChild(el);
  });
}

function insertFormula(latex) {
  document.getElementById('formulaPopover').classList.remove('active');
  var mode = document.querySelector('.formula-mode-option.active').dataset.mode;
  if (mode === 'inline') {
    insertText('$' + latex + '$', latex.length + 2, latex.length + 1);
  } else {
    insertText('$$' + latex + '$$', latex.length + 4, latex.length + 2);
  }
}

function setFormulaMode(mode) {
  document.querySelectorAll('.formula-mode-option').forEach(function(el) {
    el.classList.toggle('active', el.dataset.mode === mode);
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

function toggleDatetimePicker() {
  document.getElementById('datetimePopover').classList.toggle('active');
}

function insertDateTime(type) {
  document.getElementById('datetimePopover').classList.remove('active');
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  var h = String(d.getHours()).padStart(2, '0');
  var min = String(d.getMinutes()).padStart(2, '0');
  var s = String(d.getSeconds()).padStart(2, '0');
  var text;
  switch (type) {
    case 'date': text = y + '-' + m + '-' + day; break;
    case 'time': text = h + ':' + min + ':' + s; break;
    case 'datetime': text = y + '-' + m + '-' + day + ' ' + h + ':' + min + ':' + s; break;
    case 'cn': text = y + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; break;
  }
  insertText(text, 1, 0);
}

var tableBuilt = false;

function toggleTablePicker() {
  var popover = document.getElementById('tablePopover');
  if (!tableBuilt) { buildTableGrid(); tableBuilt = true; }
  popover.classList.toggle('active');
}

var tableAlign = 'left';

function setTableAlignment(align) {
  tableAlign = align;
  document.querySelectorAll('.table-align-option').forEach(function(el) {
    el.classList.toggle('active', el.dataset.align === align);
  });
}

function buildTableGrid() {
  var grid = document.getElementById('tableGrid');
  var display = document.getElementById('tableSizeDisplay');
  var rows = 1, cols = 1;

  for (var r = 0; r < 10; r++) {
    for (var c = 0; c < 10; c++) {
      var cell = document.createElement('div');
      cell.className = 'table-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('mouseenter', function() {
        var tr = parseInt(this.dataset.row);
        var tc = parseInt(this.dataset.col);
        rows = tr + 1;
        cols = tc + 1;
        display.textContent = rows + ' × ' + cols;
        grid.querySelectorAll('.table-cell').forEach(function(el) {
          var er = parseInt(el.dataset.row);
          var ec = parseInt(el.dataset.col);
          el.classList.toggle('selected', er <= tr && ec <= tc);
        });
      });

      cell.addEventListener('click', function() {
        insertTable(rows, cols);
      });

      grid.appendChild(cell);
    }
  }
}

function insertTable(r, c) {
  document.getElementById('tablePopover').classList.remove('active');
  var header = '|';
  var sep = '|';
  for (var i = 0; i < c; i++) {
    header += ' 标题 |';
    if (tableAlign === 'center') sep += ':-----:|';
    else if (tableAlign === 'right') sep += '------:|';
    else sep += '------|';
  }
  var body = '';
  for (var j = 0; j < r; j++) {
    body += '|';
    for (var i = 0; i < c; i++) {
      body += '  |';
    }
    body += '\n';
  }
  insertText('\n' + header + '\n' + sep + '\n' + body, 7, 6);
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

function toggleLinkPicker() {
  document.getElementById('linkPopover').classList.toggle('active');
  if (document.getElementById('linkPopover').classList.contains('active')) {
    document.getElementById('linkUrlInput').value = '';
    document.getElementById('linkTextInput').value = '';
    document.getElementById('linkUrlInput').focus();
  }
}

function insertLink() {
  var url = document.getElementById('linkUrlInput').value.trim();
  var text = document.getElementById('linkTextInput').value.trim() || '链接文字';
  if (!url) return;
  document.getElementById('linkPopover').classList.remove('active');
  insertText('[' + text + '](' + url + ')', 0, 0);
}

function toggleImagePicker() {
  document.getElementById('imagePopover').classList.toggle('active');
  if (document.getElementById('imagePopover').classList.contains('active')) {
    document.getElementById('imageUrlInput').value = '';
    document.getElementById('imageAltInput').value = '';
    document.getElementById('imageLinkInput').value = '';
    document.getElementById('imageUrlInput').focus();
  }
}

function insertImage() {
  var url = document.getElementById('imageUrlInput').value.trim();
  var alt = document.getElementById('imageAltInput').value.trim() || '图片';
  var link = document.getElementById('imageLinkInput').value.trim();
  if (!url) return;
  document.getElementById('imagePopover').classList.remove('active');
  if (link) {
    insertText('[![' + alt + '](' + url + ')](' + link + ')', 0, 0);
  } else {
    insertText('![' + alt + '](' + url + ')', 0, 0);
  }
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

var searchTimer = null;

function searchInEditor() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function() {
    var query = searchInput.value;
    clearPreviewHighlights();
    if (!query) {
      searchCount.textContent = '';
      document.querySelectorAll('.search-arrow').forEach(function(b) { b.disabled = true; });
      return;
    }
    highlightInPreview(query);
    var lowerQuery = query.toLowerCase();
    var text = getValue();
    var lowerText = text.toLowerCase();
    searchMatches = [];
    var idx = -1;
    while ((idx = lowerText.indexOf(lowerQuery, idx + 1)) !== -1) {
      searchMatches.push(idx);
    }
    currentSearchIndex = searchMatches.length > 0 ? 0 : -1;
    if (searchMatches.length > 0) {
      try { editor.setSelection(editor.posFromIndex(searchMatches[0]), editor.posFromIndex(searchMatches[0] + query.length)); } catch(e) {}
    }
    searchCount.textContent = searchMatches.length > 0 ? (currentSearchIndex + 1) + '/' + searchMatches.length : '无结果';
    document.querySelectorAll('.search-arrow').forEach(function(b) { b.disabled = searchMatches.length < 2; });
  }, 200);
}

function clearPreviewHighlights() {
  preview.querySelectorAll('.search-highlight').forEach(function(el) {
    var parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightInPreview(query) {
  if (!query) return;
  var lowerQuery = query.toLowerCase();
  function walk(el) {
    var children = Array.from(el.childNodes);
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      if (node.nodeType === 3) {
        var text = node.textContent;
        var lowerText = text.toLowerCase();
        if (lowerText.indexOf(lowerQuery) !== -1) {
          var html = '';
          var last = 0;
          var idx;
          while ((idx = lowerText.indexOf(lowerQuery, last)) !== -1) {
            html += escapeHtml(text.substring(last, idx)) + '<span class="search-highlight">' + escapeHtml(text.substring(idx, idx + query.length)) + '</span>';
            last = idx + query.length;
          }
          html += escapeHtml(text.substring(last));
          var span = document.createElement('span');
          span.innerHTML = html;
          el.replaceChild(span, node);
          walk(span);
        }
      } else if (node.nodeType === 1) {
        if (!node.closest('.mermaid, .katex, .katex-html') && node.tagName !== 'PRE' && node.tagName !== 'CODE' && node.tagName !== 'SVG' && !node.classList.contains('search-highlight')) {
          walk(node);
        }
      }
    }
  }
  walk(preview);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function searchPrev() {
  if (searchMatches.length === 0 || !searchInput.value.trim()) return;
  currentSearchIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
  var pos = searchMatches[currentSearchIndex];
  editor.setSelection(editor.posFromIndex(pos), editor.posFromIndex(pos + searchInput.value.length));
  searchCount.textContent = (currentSearchIndex + 1) + '/' + searchMatches.length;
  scrollPreviewToMatch(currentSearchIndex);
}

function searchNext() {
  if (searchMatches.length === 0 || !searchInput.value.trim()) return;
  currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
  var pos = searchMatches[currentSearchIndex];
  editor.setSelection(editor.posFromIndex(pos), editor.posFromIndex(pos + searchInput.value.length));
  searchCount.textContent = (currentSearchIndex + 1) + '/' + searchMatches.length;
  scrollPreviewToMatch(currentSearchIndex);
}

function scrollPreviewToMatch(idx) {
  var highlights = preview.querySelectorAll('.search-highlight');
  highlights.forEach(function(h) { h.classList.remove('active'); });
  if (highlights.length > idx) {
    highlights[idx].classList.add('active');
    highlights[idx].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
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
var syncing = false;

editor.on('change', function() { render(); });
editor.on('scroll', function() {
  if (syncing) return;
  syncing = true;
  var info = editor.getScrollInfo();
  var pct = info.top / (info.height - info.clientHeight);
  preview.scrollTop = pct * (preview.scrollHeight - preview.clientHeight);
  syncing = false;
});
preview.addEventListener('scroll', function() {
  updateActiveOutline();
  if (syncing) return;
  syncing = true;
  var pct = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
  var info = editor.getScrollInfo();
  editor.scrollTo(null, pct * (info.height - info.clientHeight));
  syncing = false;
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
document.querySelectorAll('.search-arrow').forEach(function(b) { b.disabled = true; });
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
loadText('assets/css/export.css', function(text) { exportCss = text; });

console.log('📝 Markdown 编辑器已启动！');
