const Editor = (() => {
  class Editor {
    constructor(canvas, overlayCanvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.overlay = overlayCanvas;
      this.overCtx = overlayCanvas.getContext('2d');

      this.image = null;
      this.imageData = null;
      this.originalData = null;
      this.mask = null;
      this.backupData = null;

      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.tool = 'rect';
      this.brushSize = 20;

      this.isDrawing = false;
      this.isPanning = false;
      this.startX = 0;
      this.startY = 0;
      this.lastX = 0;
      this.lastY = 0;

      this.cloneSourceX = -1;
      this.cloneSourceY = -1;
      this.cloneSize = 30;

      this.inpaintRadius = 5;
      this.showOriginal = false;
      this.hasSelection = false;

      this.undoStack = [];
      this.redoStack = [];
      this.maxUndo = 20;

      this.canvas.style.transformOrigin = '0 0';
      this.overlay.style.transformOrigin = '0 0';
    }

    screenToImage(sx, sy) {
      const rect = this.canvas.getBoundingClientRect();
      const scale = rect.width / this.canvas.width;
      return {
        x: (sx - rect.left) / scale,
        y: (sy - rect.top) / scale
      };
    }

    _updateTransform() {
      const t = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoom})`;
      this.canvas.style.transform = t;
      this.overlay.style.transform = t;
    }

    loadImage(img) {
      this.image = img;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      this.canvas.width = w;
      this.canvas.height = h;
      this.overlay.width = w;
      this.overlay.height = h;

      this.ctx.drawImage(img, 0, 0);
      this.imageData = this.ctx.getImageData(0, 0, w, h);
      this.originalData = new Uint8ClampedArray(this.imageData.data);
      this.backupData = new Uint8ClampedArray(this.imageData.data);

      this.mask = new Uint8Array(w * h);
      this.hasSelection = false;

      this.undoStack = [];
      this.redoStack = [];
      this.showOriginal = false;
      this.cloneSourceX = -1;
      this.cloneSourceY = -1;

      this.fitToView();
      this.render();
    }

    fitToView() {
      const container = this.canvas.parentElement;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const iw = this.canvas.width;
      const ih = this.canvas.height;
      if (iw === 0 || ih === 0) return;
      const sx = cw / iw;
      const sy = ch / ih;
      this.zoom = Math.min(sx, sy, 1) * 0.9;
      this.offsetX = (cw - iw * this.zoom) / 2;
      this.offsetY = (ch - ih * this.zoom) / 2;
      this._updateTransform();
    }

    render() {
      const ctx = this.ctx;
      const overCtx = this.overCtx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      overCtx.clearRect(0, 0, w, h);

      if (this.showOriginal && this.originalData) {
        const tempData = new ImageData(
          new Uint8ClampedArray(this.originalData), w, h
        );
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(tempData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        ctx.putImageData(this.imageData, 0, 0);
      }

      if (this.hasSelection && this.mask) {
        const imgData = overCtx.createImageData(w, h);
        const d = imgData.data;
        const m = this.mask;
        let hasRed = false;
        for (let i = 0; i < w * h; i++) {
          if (m[i]) {
            const pi = i * 4;
            d[pi] = 255;
            d[pi + 1] = 50;
            d[pi + 2] = 50;
            d[pi + 3] = 80;
            hasRed = true;
          }
        }
        if (hasRed) {
          overCtx.putImageData(imgData, 0, 0);
        }
      }
    }

    saveUndoState() {
      const state = {
        data: new Uint8ClampedArray(this.imageData.data),
        mask: new Uint8Array(this.mask),
        hasSelection: this.hasSelection
      };
      this.undoStack.push(state);
      if (this.undoStack.length > this.maxUndo) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    }

    undo() {
      if (this.undoStack.length === 0) return false;
      const cur = {
        data: new Uint8ClampedArray(this.imageData.data),
        mask: new Uint8Array(this.mask),
        hasSelection: this.hasSelection
      };
      this.redoStack.push(cur);
      const state = this.undoStack.pop();
      this.imageData.data.set(state.data);
      this.mask.set(state.mask);
      this.hasSelection = state.hasSelection;
      this.render();
      this.updateUI();
      return true;
    }

    redo() {
      if (this.redoStack.length === 0) return false;
      const cur = {
        data: new Uint8ClampedArray(this.imageData.data),
        mask: new Uint8Array(this.mask),
        hasSelection: this.hasSelection
      };
      this.undoStack.push(cur);
      const state = this.redoStack.pop();
      this.imageData.data.set(state.data);
      this.mask.set(state.mask);
      this.hasSelection = state.hasSelection;
      this.render();
      this.updateUI();
      return true;
    }

    clearSelection() {
      this.mask = new Uint8Array(this.canvas.width * this.canvas.height);
      this.hasSelection = false;
      this.render();
      this.updateUI();
    }

    startDraw(x, y) {
      const p = this.screenToImage(x, y);
      this.isDrawing = true;
      this.startX = p.x;
      this.startY = p.y;
      this.lastX = p.x;
      this.lastY = p.y;

      if (this.tool === 'rect') {
        this.saveUndoState();
        this.mask = new Uint8Array(this.canvas.width * this.canvas.height);
        this.hasSelection = true;
      } else if (this.tool === 'brush') {
        this.saveUndoState();
        this._paintBrush(p.x, p.y);
      } else if (this.tool === 'magicwand') {
        this.saveUndoState();
        this._magicWand(p.x, p.y);
      } else if (this.tool === 'clonestamp') {
        this.saveUndoState();
      }
    }

    moveDraw(x, y) {
      if (!this.isDrawing) return;
      const p = this.screenToImage(x, y);
      if (this.tool === 'rect') {
        this._drawRectPreview(this.startX, this.startY, p.x, p.y);
      } else if (this.tool === 'brush') {
        this._paintBrushLine(this.lastX, this.lastY, p.x, p.y);
        this.lastX = p.x;
        this.lastY = p.y;
      } else if (this.tool === 'clonestamp') {
        this._applyClone(p.x, p.y);
        this.lastX = p.x;
        this.lastY = p.y;
      }
    }

    endDraw(x, y) {
      if (!this.isDrawing) return;
      const p = this.screenToImage(x, y);
      if (this.tool === 'brush') {
        this._paintBrushLine(this.lastX, this.lastY, p.x, p.y);
      } else if (this.tool === 'clonestamp') {
        this._applyClone(p.x, p.y);
      }
      this.isDrawing = false;
      if (this.tool === 'rect') {
        this._finalizeRect(this.startX, this.startY, p.x, p.y);
      }
      this.render();
      this.updateUI();
    }

    _fillRectInMask(x1, y1, x2, y2) {
      const w = this.canvas.width, h = this.canvas.height;
      const lx = Math.max(0, Math.floor(Math.min(x1, x2)));
      const ly = Math.max(0, Math.floor(Math.min(y1, y2)));
      const rx = Math.min(w - 1, Math.ceil(Math.max(x1, x2)));
      const ry = Math.min(h - 1, Math.ceil(Math.max(y1, y2)));
      for (let y = ly; y <= ry; y++) {
        for (let x = lx; x <= rx; x++) {
          this.mask[y * w + x] = 1;
        }
      }
    }

    _drawRectPreview(x1, y1, x2, y2) {
      this.mask = new Uint8Array(this.canvas.width * this.canvas.height);
      this._fillRectInMask(x1, y1, x2, y2);
      this.render();
    }

    _finalizeRect(x1, y1, x2, y2) {
      this._fillRectInMask(x1, y1, x2, y2);
    }

    _paintBrush(x, y) {
      const w = this.canvas.width, h = this.canvas.height;
      const r = this.brushSize / 2;
      const cx = Math.round(x);
      const cy = Math.round(y);
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            if (px >= 0 && px < w && py >= 0 && py < h) {
              this.mask[py * w + px] = 1;
              this.hasSelection = true;
            }
          }
        }
      }
      this.render();
    }

    _paintBrushLine(x1, y1, x2, y2) {
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const steps = Math.max(1, Math.ceil(dist));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        this._paintBrush(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t
        );
      }
    }

    _magicWand(cx, cy, threshold = 30) {
      const w = this.canvas.width, h = this.canvas.height;
      const data = this.imageData.data;
      const visited = new Uint8Array(w * h);
      const stack = [{ x: Math.round(cx), y: Math.round(cy) }];
      const ti = (Math.round(cy) * w + Math.round(cx)) * 4;
      const tr = data[ti], tg = data[ti + 1], tb = data[ti + 2];

      this.mask = new Uint8Array(w * h);
      this.hasSelection = true;

      while (stack.length > 0) {
        const { x, y } = stack.pop();
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const idx = y * w + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const pi = idx * 4;
        const diff = Math.sqrt(
          (data[pi] - tr) ** 2 +
          (data[pi + 1] - tg) ** 2 +
          (data[pi + 2] - tb) ** 2
        );

        if (diff <= threshold) {
          this.mask[idx] = 1;
          stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
        }
      }
      this.render();
    }

    setCloneSource(x, y) {
      const p = this.screenToImage(x, y);
      this.cloneSourceX = p.x;
      this.cloneSourceY = p.y;
      return true;
    }

    _applyClone(x, y) {
      if (this.cloneSourceX < 0 || this.cloneSourceY < 0) return;
      const w = this.canvas.width, h = this.canvas.height;
      const data = this.imageData.data;
      const src = this.backupData;
      const dx = x - this.lastX;
      const dy = y - this.lastY;
      this.cloneSourceX += dx;
      this.cloneSourceY += dy;

      const r = this.cloneSize / 2;
      const cx = Math.round(x);
      const cy = Math.round(y);
      const scx = Math.round(this.cloneSourceX);
      const scy = Math.round(this.cloneSourceY);

      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const px = cx + dx, py = cy + dy;
            const sx = scx + dx, sy = scy + dy;
            if (px >= 0 && px < w && py >= 0 && py < h &&
                sx >= 0 && sx < w && sy >= 0 && sy < h) {
              const di = (py * w + px) * 4;
              const si = (sy * w + sx) * 4;
              data[di] = src[si];
              data[di + 1] = src[si + 1];
              data[di + 2] = src[si + 2];
              data[di + 3] = src[si + 3];
            }
          }
        }
      }
      this.render();
    }

    applyInpaint() {
      if (!this.hasSelection) return false;
      this.saveUndoState();
      this.backupData = new Uint8ClampedArray(this.imageData.data);
      Inpaint.inpaintRegion(this.imageData, this.mask, this.inpaintRadius);
      this.render();
      this.updateUI();
      return true;
    }

    applyInpaintHQ() {
      if (!this.hasSelection) return false;
      this.saveUndoState();
      this.backupData = new Uint8ClampedArray(this.imageData.data);
      Inpaint.inpaintRegionHQ(this.imageData, this.mask, Math.min(this.inpaintRadius + 2, 12), 0.3);
      this.render();
      this.updateUI();
      return true;
    }

    applyPatchMatch() {
      if (!this.hasSelection) return false;
      this.saveUndoState();
      this.backupData = new Uint8ClampedArray(this.imageData.data);
      const half = Math.max(2, Math.min(4, Math.round(this.inpaintRadius / 2)));
      Inpaint.patchMatchInpaint(this.imageData, this.mask, half, 4);
      this.render();
      this.updateUI();
      return true;
    }

    async applyAI(onProgress) {
      if (!this.hasSelection) return false;
      this.saveUndoState();
      this.backupData = new Uint8ClampedArray(this.imageData.data);
      try {
        await AIInpaint.inpaint(this.imageData, this.mask, onProgress);
        this.render();
        this.updateUI();
        return true;
      } catch (e) {
        this.undo();
        throw e;
      }
    }

    applyFastInpaint() {
      if (!this.hasSelection) return false;
      this.saveUndoState();
      this.backupData = new Uint8ClampedArray(this.imageData.data);
      Inpaint.fastInpaint(this.imageData, this.mask, Math.min(this.inpaintRadius, 5), 5);
      this.render();
      this.updateUI();
      return true;
    }

    applyBlur() {
      if (!this.hasSelection) return false;
      this.saveUndoState();
      this.backupData = new Uint8ClampedArray(this.imageData.data);
      Inpaint.applyBlur(this.imageData, this.mask, Math.max(this.inpaintRadius + 2, 7));
      this.render();
      this.updateUI();
      return true;
    }

    setZoom(z) {
      this.zoom = Math.max(0.1, Math.min(20, z));
      this._updateTransform();
      this.render();
    }

    zoomToPoint(px, py, factor) {
      const newZoom = Math.max(0.1, Math.min(20, this.zoom * factor));
      const ix = (px - this.offsetX) / this.zoom;
      const iy = (py - this.offsetY) / this.zoom;
      this.zoom = newZoom;
      this.offsetX = px - ix * this.zoom;
      this.offsetY = py - iy * this.zoom;
      this._updateTransform();
      this.render();
    }

    startPan(sx, sy) {
      this.isPanning = true;
      this.panStartX = sx;
      this.panStartY = sy;
      this.panOffX = this.offsetX;
      this.panOffY = this.offsetY;
    }

    movePan(sx, sy) {
      if (!this.isPanning) return;
      this.offsetX = this.panOffX + (sx - this.panStartX);
      this.offsetY = this.panOffY + (sy - this.panStartY);
      this._updateTransform();
    }

    endPan() {
      this.isPanning = false;
    }

    toggleOriginal() {
      this.showOriginal = !this.showOriginal;
      this.render();
    }

    getResultBlob(cb) {
      this.canvas.toBlob(cb, 'image/png');
    }

    updateUI() {
      document.dispatchEvent(new CustomEvent('editor-update', {
        detail: {
          hasSelection: this.hasSelection,
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length,
          zoom: this.zoom
        }
      }));
    }
  }

  return { Editor };
})();
