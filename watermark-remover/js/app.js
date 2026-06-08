const App = (() => {
  let editor = null;
  let activeTool = 'rect';
  let spaceDown = false;

  let pinchStartDist = 0;
  let pinchStartZoom = 1;
  let isPinching = false;
  let cloneSourceSet = false;

  const DOM = {
    uploadBox: null, uploadInput: null,
    editorArea: null, editorContainer: null,
    canvas: null, overlay: null, emptyState: null,
    toolRect: null, toolBrush: null, toolWand: null, toolClone: null,
    brushSize: null, cloneSize: null, cloneSizeGroup: null,
    btnApplyInpaint: null, btnApplyPatch: null, btnApplyFast: null, btnApplyBlur: null,
    btnApplyAI: null, aiStatus: null, aiProgress: null, aiProgressWrap: null,
    inpaintRadius: null,
    btnUndo: null, btnRedo: null, btnClearSel: null,
    btnOpen: null, btnDownload: null, btnToggleOrig: null,
    zoomIn: null, zoomOut: null, zoomLevel: null,
    statusBar: null, processingOverlay: null,
    panel: null, panelHeader: null, btnTogglePanel: null,
  };

  function init() {
    cacheDOM();
    bindEvents();
    initEditor();
    updateToolUI();
    loadTheme();
  }

  function cacheDOM() {
    DOM.uploadBox = document.getElementById('uploadBox');
    DOM.uploadInput = document.getElementById('uploadInput');
    DOM.editorArea = document.getElementById('editorArea');
    DOM.editorContainer = document.getElementById('editorContainer');
    DOM.canvas = document.getElementById('mainCanvas');
    DOM.overlay = document.getElementById('overlayCanvas');
    DOM.emptyState = document.getElementById('emptyState');
    DOM.toolRect = document.getElementById('toolRect');
    DOM.toolBrush = document.getElementById('toolBrush');
    DOM.toolWand = document.getElementById('toolWand');
    DOM.toolClone = document.getElementById('toolClone');
    DOM.brushSize = document.getElementById('brushSize');
    DOM.cloneSize = document.getElementById('cloneSize');
    DOM.cloneSizeGroup = document.getElementById('cloneSizeGroup');
    DOM.btnApplyInpaint = document.getElementById('btnApplyInpaint');
    DOM.btnApplyPatch = document.getElementById('btnApplyPatch');
    DOM.btnApplyAI = document.getElementById('btnApplyAI');
    DOM.aiStatus = document.getElementById('aiStatus');
    DOM.aiProgress = document.getElementById('aiProgress');
    DOM.aiProgressWrap = document.getElementById('aiProgressWrap');
    DOM.btnApplyFast = document.getElementById('btnApplyFast');
    DOM.btnApplyBlur = document.getElementById('btnApplyBlur');
    DOM.inpaintRadius = document.getElementById('inpaintRadius');
    DOM.btnUndo = document.getElementById('btnUndo');
    DOM.btnRedo = document.getElementById('btnRedo');
    DOM.btnClearSel = document.getElementById('btnClearSel');
    DOM.btnOpen = document.getElementById('btnOpen');
    DOM.btnDownload = document.getElementById('btnDownload');
    DOM.btnToggleOrig = document.getElementById('btnToggleOrig');
    DOM.btnTheme = document.getElementById('btnTheme');
    DOM.zoomIn = document.getElementById('zoomIn');
    DOM.zoomOut = document.getElementById('zoomOut');
    DOM.zoomLevel = document.getElementById('zoomLevel');
    DOM.statusBar = document.getElementById('statusBar');
    DOM.processingOverlay = document.getElementById('processingOverlay');
    DOM.panel = document.getElementById('panel');
    DOM.panelHeader = document.getElementById('panelHeader');
    DOM.btnTogglePanel = document.getElementById('btnTogglePanel');
  }

  function getTouchXY(e) {
    const t = e.touches[0] || e.changedTouches[0];
    return { x: t.clientX, y: t.clientY };
  }

  function getTouchMid(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  function bindEvents() {
    DOM.uploadBox.addEventListener('click', () => DOM.uploadInput.click());
    DOM.uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); DOM.uploadBox.classList.add('drag-over'); });
    DOM.uploadBox.addEventListener('dragleave', () => DOM.uploadBox.classList.remove('drag-over'));
    DOM.uploadBox.addEventListener('drop', (e) => { e.preventDefault(); DOM.uploadBox.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
    DOM.uploadInput.addEventListener('change', (e) => { if (e.target.files.length) handleFiles(e.target.files); });

    DOM.toolRect.addEventListener('click', () => setTool('rect'));
    DOM.toolBrush.addEventListener('click', () => setTool('brush'));
    DOM.toolWand.addEventListener('click', () => setTool('magicwand'));
    DOM.toolClone.addEventListener('click', () => setTool('clonestamp'));

    DOM.brushSize.addEventListener('input', () => {
      if (editor) editor.brushSize = parseInt(DOM.brushSize.value);
    });

    DOM.cloneSize.addEventListener('input', () => {
      if (editor) editor.cloneSize = parseInt(DOM.cloneSize.value);
    });

    DOM.btnApplyInpaint.addEventListener('click', () => applyProcessing('inpaint'));
    DOM.btnApplyPatch.addEventListener('click', () => applyProcessing('patch'));
    DOM.btnApplyFast.addEventListener('click', () => applyProcessing('fast'));
    DOM.btnApplyBlur.addEventListener('click', () => applyProcessing('blur'));

    DOM.btnApplyAI.addEventListener('click', () => {
      if (AIInpaint.isLoading()) return;
      if (!AIInpaint.isLoaded()) {
        startModelDownload();
      } else if (editor && editor.hasSelection) {
        applyProcessing('ai');
      }
    });

    DOM.inpaintRadius.addEventListener('input', () => {
      if (editor) editor.inpaintRadius = parseInt(DOM.inpaintRadius.value);
    });
    DOM.btnUndo.addEventListener('click', () => { if (editor) editor.undo(); });
    DOM.btnRedo.addEventListener('click', () => { if (editor) editor.redo(); });
    DOM.btnClearSel.addEventListener('click', () => { if (editor) editor.clearSelection(); });
    DOM.btnOpen.addEventListener('click', () => {
      DOM.uploadInput.value = '';
      DOM.uploadInput.click();
    });
    DOM.btnDownload.addEventListener('click', downloadResult);
    DOM.btnTheme.addEventListener('click', toggleTheme);

    // Panel toggle (mobile bottom drawer)
    DOM.panelHeader.addEventListener('click', togglePanel);
    DOM.btnTogglePanel.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    document.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      if (DOM.panel.classList.contains('expanded') && !DOM.panel.contains(e.target)) {
        DOM.panel.classList.remove('expanded');
      }
    });

    DOM.btnToggleOrig.addEventListener('mousedown', () => { if (editor) { editor.showOriginal = true; editor.render(); } });
    DOM.btnToggleOrig.addEventListener('mouseup', () => { if (editor) { editor.showOriginal = false; editor.render(); } });
    DOM.btnToggleOrig.addEventListener('mouseleave', () => { if (editor) { editor.showOriginal = false; editor.render(); } });
    DOM.btnToggleOrig.addEventListener('touchstart', (e) => { e.preventDefault(); if (editor) { editor.showOriginal = true; editor.render(); } }, { passive: false });
    DOM.btnToggleOrig.addEventListener('touchend', () => { if (editor) { editor.showOriginal = false; editor.render(); } });
    DOM.btnToggleOrig.addEventListener('touchcancel', () => { if (editor) { editor.showOriginal = false; editor.render(); } });

    DOM.zoomIn.addEventListener('click', () => { if (editor) { editor.setZoom(editor.zoom * 1.2); updateZoomUI(); } });
    DOM.zoomOut.addEventListener('click', () => { if (editor) { editor.setZoom(editor.zoom / 1.2); updateZoomUI(); } });

    DOM.canvas.addEventListener('mousedown', onCanvasMouseDown);
    DOM.canvas.addEventListener('mousemove', onCanvasMouseMove);
    DOM.canvas.addEventListener('mouseup', onCanvasMouseUp);
    DOM.canvas.addEventListener('mouseleave', onCanvasMouseUp);
    DOM.canvas.addEventListener('wheel', onCanvasWheel, { passive: false });
    DOM.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    DOM.canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    DOM.canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    DOM.canvas.addEventListener('touchend', onCanvasTouchEnd, { passive: false });
    DOM.canvas.addEventListener('touchcancel', onCanvasTouchEnd, { passive: false });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('editor-update', (e) => {
      DOM.btnUndo.disabled = e.detail.undoCount === 0;
      DOM.btnRedo.disabled = e.detail.redoCount === 0;
      DOM.btnClearSel.disabled = !e.detail.hasSelection;
      DOM.btnApplyInpaint.disabled = !e.detail.hasSelection;
      DOM.btnApplyPatch.disabled = !e.detail.hasSelection;
      DOM.btnApplyFast.disabled = !e.detail.hasSelection;
      DOM.btnApplyBlur.disabled = !e.detail.hasSelection;
      if (!AIInpaint.isLoading()) {
        DOM.btnApplyAI.disabled = !e.detail.hasSelection;
      }
      updateZoomUI();
    });
  }

  function togglePanel() {
    DOM.panel.classList.toggle('expanded');
  }

  function initEditor() {
    editor = new Editor.Editor(DOM.canvas, DOM.overlay);
    editor.brushSize = parseInt(DOM.brushSize.value);
    editor.cloneSize = parseInt(DOM.cloneSize.value);
    editor.inpaintRadius = parseInt(DOM.inpaintRadius.value);
  }

  function setTool(tool) {
    if (window.innerWidth <= 768 && DOM.panel) {
      DOM.panel.classList.add('expanded');
    }
    activeTool = tool;
    cloneSourceSet = false;
    if (editor) {
      editor.tool = tool;
      editor.cloneSourceX = -1;
      editor.cloneSourceY = -1;
    }
    DOM.cloneSizeGroup.style.display = tool === 'clonestamp' ? 'flex' : 'none';
    updateToolUI();
    const tips = {
      rect: '矩形选择 — 拖动选择水印区域 | 双指缩放平移',
      brush: '画笔选择 — 涂抹选择水印区域 | 双指缩放平移',
      magicwand: '魔术棒 — 点击自动选择相似颜色 | 双指缩放平移',
      clonestamp: '仿制图章 — 触摸设源点后涂抹覆盖 | 双指缩放平移'
    };
    setStatus(tips[tool] || '');
  }

  function updateToolUI() {
    [DOM.toolRect, DOM.toolBrush, DOM.toolWand, DOM.toolClone].forEach(el => el.classList.remove('active'));
    const map = { rect: DOM.toolRect, brush: DOM.toolBrush, magicwand: DOM.toolWand, clonestamp: DOM.toolClone };
    if (map[activeTool]) map[activeTool].classList.add('active');
  }

  function handleFiles(files) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setStatus('请选择图片文件 (JPG/PNG/WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        DOM.emptyState.style.display = 'none';
        DOM.editorContainer.style.display = 'flex';
        editor.loadImage(img);
        setStatus(`已加载: ${img.naturalWidth}x${img.naturalHeight} | 选择水印区域后点智能填充(可调半径)`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function onCanvasMouseDown(e) {
    if (!editor || !editor.image) return;
    if (e.button === 2) return;

    if (e.button === 1) {
      e.preventDefault();
      editor.startPan(e.clientX, e.clientY);
      return;
    }

    if (spaceDown) {
      editor.startPan(e.clientX, e.clientY);
      return;
    }

    if (activeTool === 'clonestamp' && (e.ctrlKey || e.metaKey)) {
      editor.setCloneSource(e.clientX, e.clientY);
      setStatus('仿制源已设置，在目标区域涂抹');
      return;
    }

    editor.startDraw(e.clientX, e.clientY);
  }

  function onCanvasMouseMove(e) {
    if (!editor || !editor.image) return;
    if (spaceDown && editor.isPanning) {
      editor.movePan(e.clientX, e.clientY);
      return;
    }
    if (editor.isDrawing) {
      editor.moveDraw(e.clientX, e.clientY);
    }
  }

  function onCanvasMouseUp(e) {
    if (!editor) return;
    if (editor.isPanning) {
      editor.endPan();
      return;
    }
    editor.endDraw(e.clientX, e.clientY);
  }

  function onCanvasWheel(e) {
    e.preventDefault();
    if (!editor || !editor.image) return;
    const rect = DOM.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    editor.zoomToPoint(mx, my, factor);
    updateZoomUI();
  }

  function onCanvasTouchStart(e) {
    if (!editor || !editor.image) return;
    if (e.touches.length === 1) {
      const pos = getTouchXY(e);
      if (activeTool === 'clonestamp') {
        if (!cloneSourceSet) {
          editor.setCloneSource(pos.x, pos.y);
          cloneSourceSet = true;
          setStatus('仿制源已设，继续涂抹覆盖');
          return;
        }
        editor.startDraw(pos.x, pos.y);
        return;
      }
      editor.startDraw(pos.x, pos.y);
    } else if (e.touches.length === 2) {
      isPinching = true;
      const t = e.touches;
      pinchStartDist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      pinchStartZoom = editor.zoom;
      const mid = getTouchMid(t);
      editor.startPan(mid.x, mid.y);
    }
  }

  function onCanvasTouchMove(e) {
    if (!editor || !editor.image) return;
    if (e.touches.length === 2 && isPinching) {
      const t = e.touches;
      const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const scale = dist / pinchStartDist;
      editor.setZoom(pinchStartZoom * scale);
      const mid = getTouchMid(t);
      editor.movePan(mid.x, mid.y);
      return;
    }
    if (editor.isDrawing) {
      const pos = getTouchXY(e);
      editor.moveDraw(pos.x, pos.y);
    }
  }

  function onCanvasTouchEnd(e) {
    if (!editor) return;
    if (isPinching) {
      isPinching = false;
      editor.endPan();
      return;
    }
    if (editor.isDrawing) {
      const pos = getTouchXY(e);
      editor.endDraw(pos.x, pos.y);
    }
  }

  function onKeyDown(e) {
    if (e.key === ' ' && !spaceDown) {
      e.preventDefault();
      spaceDown = true;
      if (editor && editor.image) {
        document.getElementById('editorContainer').style.cursor = 'grab';
      }
      return;
    }
    if (!editor || !editor.image) return;
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); editor.undo(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); editor.redo(); }
    if (e.key === 'r' || e.key === 'R') setTool('rect');
    if (e.key === 'b' || e.key === 'B') setTool('brush');
    if (e.key === 'w' || e.key === 'W') setTool('magicwand');
    if (e.key === 'c' || e.key === 'C') setTool('clonestamp');
    if (e.key === 'Escape') { editor.clearSelection(); setStatus('选区已清除'); }
    if (e.key === 'Enter') { e.preventDefault(); applyProcessing('inpaint'); }
  }

  function onKeyUp(e) {
    if (e.key === ' ') {
      e.preventDefault();
      spaceDown = false;
      if (editor && editor.isPanning) editor.endPan();
      if (editor && editor.image) {
        const cursor = activeTool === 'brush' ? 'crosshair' :
          activeTool === 'clonestamp' ? 'cell' :
          activeTool === 'magicwand' ? 'pointer' : 'crosshair';
        document.getElementById('editorContainer').style.cursor = cursor;
      }
    }
  }

  function lazyInitAI() {
    if (AIInpaint.isLoaded() || AIInpaint.isLoading()) return;
    DOM.aiStatus.textContent = '检测模型...';
    AIInpaint.init().then((cached) => {
      if (cached) {
        DOM.aiStatus.textContent = '模型已就绪（缓存）';
        DOM.btnApplyAI.textContent = 'AI 修复';
        DOM.btnApplyAI.disabled = !(editor && editor.hasSelection);
      } else {
        DOM.aiStatus.textContent = '需下载模型 (~207MB)';
        DOM.btnApplyAI.textContent = '下载模型';
        DOM.btnApplyAI.disabled = false;
      }
    }).catch(() => {
      DOM.aiStatus.textContent = '需下载模型 (~207MB)';
      DOM.btnApplyAI.textContent = '下载模型';
      DOM.btnApplyAI.disabled = false;
    });
  }

  function startModelDownload() {
    DOM.aiProgressWrap.style.display = 'block';
    DOM.aiProgress.style.width = '0%';
    DOM.aiStatus.textContent = '加载 ONNX Runtime...';
    DOM.btnApplyAI.disabled = true;

    // 先确保 ONNX Runtime 加载完成
    loadONNXRuntime().then(() => {
      DOM.aiStatus.textContent = '下载模型中 0%';
      AIInpaint.download((pct) => {
        const p = Math.round(pct * 100);
        DOM.aiProgress.style.width = p + '%';
        DOM.aiStatus.textContent = `下载模型中 ${p}%`;
      }).then(() => {
        DOM.aiProgressWrap.style.display = 'none';
        DOM.aiStatus.textContent = '模型已就绪';
        DOM.btnApplyAI.textContent = 'AI 修复';
        DOM.btnApplyAI.disabled = !(editor && editor.hasSelection);
        setStatus('AI 模型就绪，选择水印区域后点 AI 修复');
      }).catch((e) => {
        DOM.aiProgressWrap.style.display = 'none';
        DOM.aiStatus.textContent = '下载失败，重试';
        DOM.btnApplyAI.textContent = '重新下载';
        DOM.btnApplyAI.disabled = false;
        setStatus('AI 模型下载失败: ' + e.message);
      });
    }).catch(() => {
      DOM.aiProgressWrap.style.display = 'none';
      DOM.aiStatus.textContent = '加载 ONNX Runtime 失败';
      DOM.btnApplyAI.textContent = '重试';
      DOM.btnApplyAI.disabled = false;
    });
  }

  function applyProcessing(method) {
    if (!editor || !editor.hasSelection) return;

    if (method === 'ai') {
      applyAIProcessing();
      return;
    }

    showProcessing(true);
    setStatus('正在处理...');
    setTimeout(() => {
      let ok = false;
      if (method === 'inpaint') ok = editor.applyInpaint();
      else if (method === 'patch') ok = editor.applyPatchMatch();
      else if (method === 'fast') ok = editor.applyFastInpaint();
      else if (method === 'blur') ok = editor.applyBlur();
      showProcessing(false);
      if (ok) {
        const msgs = { inpaint: '智能填充完成', patch: '纹理填充完成', fast: '快速修复完成', blur: '模糊处理完成' };
        setStatus(msgs[method] || '处理完成');
      }
    }, 80);
  }

  function applyAIProcessing() {
    if (!AIInpaint.isLoaded()) {
      lazyInitAI();
      return;
    }
    DOM.aiProgressWrap.style.display = 'block';
    DOM.aiProgress.style.width = '0%';
    setStatus('AI 修复中...');
    DOM.btnApplyAI.disabled = true;

    editor.applyAI((pct) => {
      const p = Math.round(pct * 100);
      DOM.aiProgress.style.width = p + '%';
      DOM.aiStatus.textContent = `AI 修复中 ${p}%`;
    }).then(() => {
      DOM.aiProgressWrap.style.display = 'none';
      DOM.aiStatus.textContent = '模型已就绪';
      DOM.btnApplyAI.disabled = false;
      setStatus('AI 修复完成');
    }).catch((e) => {
      DOM.aiProgressWrap.style.display = 'none';
      DOM.aiStatus.textContent = '模型已就绪';
      DOM.btnApplyAI.disabled = false;
      setStatus('AI 修复失败: ' + e.message);
    });
  }

  function showProcessing(show) {
    DOM.processingOverlay.style.display = show ? 'flex' : 'none';
  }

  function downloadResult() {
    if (!editor || !editor.image) return;
    setStatus('正在导出...');
    editor.getResultBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'watermark_removed.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('已下载');
    });
  }

  function updateZoomUI() {
    if (DOM.zoomLevel && editor) {
      DOM.zoomLevel.textContent = `${Math.round(editor.zoom * 100)}%`;
    }
  }

  function setStatus(msg) {
    if (DOM.statusBar) DOM.statusBar.textContent = msg;
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function loadTheme() {
    const saved = localStorage.getItem('theme');
    setTheme(saved === 'light' ? 'light' : 'dark');
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'dark' : 'light');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
