const AIInpaint = (() => {
  const MODEL_URL = 'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx';
  const SIZE = 512;
  const CACHE_KEY = 'lama-onnx-v1';

  let session = null;
  let loaded = false;
  let loading = false;
  let modelSize = 0;

  function isLoaded() { return loaded; }
  function isLoading() { return loading; }

  async function ensureORT() {
    if (typeof ort !== 'undefined') return;
    if (typeof loadONNXRuntime === 'function') {
      await loadONNXRuntime();
    }
    if (typeof ort === 'undefined') {
      throw new Error('ONNX Runtime 未能加载');
    }
  }

  async function init() {
    try {
      await ensureORT();
      const cache = await caches.open(CACHE_KEY);
      const resp = await cache.match(MODEL_URL);
      if (resp) {
        const blob = await resp.blob();
        modelSize = blob.size;
        const buf = await blob.arrayBuffer();
        session = await ort.InferenceSession.create(buf, {
          executionProviders: ['webgpu', 'wasm']
        });
        loaded = true;
        return true;
      }
    } catch (e) {
      console.warn('Cache load failed, will download:', e);
    }
    return false;
  }

  async function download(onProgress) {
    if (loading) return false;
    loading = true;

    try {
      await ensureORT();
      const resp = await fetch(MODEL_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const total = parseInt(resp.headers.get('content-length') || '207000000');
      const reader = resp.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (onProgress) onProgress(received / total);
      }

      const buf = new Uint8Array(received);
      let pos = 0;
      for (const c of chunks) { buf.set(c, pos); pos += c.length; }
      modelSize = received;

      session = await ort.InferenceSession.create(buf.buffer, {
        executionProviders: ['webgpu', 'wasm']
      });
      loaded = true;

      try {
        const cache = await caches.open(CACHE_KEY);
        await cache.put(MODEL_URL, new Response(buf, {
          headers: { 'content-type': 'application/octet-stream' }
        }));
      } catch (e) { console.warn('Cache write failed:', e); }

      loading = false;
      return true;
    } catch (e) {
      loading = false;
      throw e;
    }
  }

  function getMaskBounds(mask, w, h) {
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < x0) return null;
    const margin = 20;
    x0 = Math.max(0, x0 - margin);
    y0 = Math.max(0, y0 - margin);
    x1 = Math.min(w - 1, x1 + margin);
    y1 = Math.min(h - 1, y1 + margin);
    return { x0, y0, x1, y1, bw: x1 - x0 + 1, bh: y1 - y0 + 1 };
  }

  function getTiles(bbox) {
    const tiles = [];
    const stepX = SIZE - 64;
    const stepY = SIZE - 64;
    const nx = Math.max(1, Math.ceil((bbox.bw - 64) / stepX));
    const ny = Math.max(1, Math.ceil((bbox.bh - 64) / stepY));

    for (let ty = 0; ty < ny; ty++) {
      for (let tx = 0; tx < nx; tx++) {
        const ox = tx === 0 ? 0 : Math.round((bbox.bw - SIZE) * tx / (nx - 1));
        const oy = ty === 0 ? 0 : Math.round((bbox.bh - SIZE) * ty / (ny - 1));
        tiles.push({
          sx: bbox.x0 + ox, sy: bbox.y0 + oy,
          ox, oy,
          tileW: Math.min(SIZE, bbox.bw - ox),
          tileH: Math.min(SIZE, bbox.bh - oy),
        });
      }
    }
    return tiles;
  }

  function featherWeight(d, maxD) {
    return 1 - Math.min(1, d / maxD);
  }

  async function inpaint(imageData, mask, onProgress) {
    if (!loaded || !session) throw new Error('模型未加载');

    const w = imageData.width, h = imageData.height;
    const src = new Uint8ClampedArray(imageData.data);
    const bbox = getMaskBounds(mask, w, h);
    if (!bbox) return imageData;

    const dst = new Uint8ClampedArray(src);
    const weightMap = new Float32Array(src.length / 4);

    const tiles = getTiles(bbox);
    const inputName = session.inputNames[0];
    const maskName = session.inputNames[1];
    const outputName = session.outputNames[0];

    for (let ti = 0; ti < tiles.length; ti++) {
      const t = tiles[ti];

      const patch = new Uint8ClampedArray(SIZE * SIZE * 4);
      const maskPatch = new Float32Array(SIZE * SIZE);

      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const ix = t.sx + px, iy = t.sy + py;
          const pi = (py * SIZE + px) * 4;
          if (ix >= 0 && ix < w && iy >= 0 && iy < h) {
            const si = (iy * w + ix) * 4;
            patch[pi] = src[si];
            patch[pi + 1] = src[si + 1];
            patch[pi + 2] = src[si + 2];
            patch[pi + 3] = 255;
            maskPatch[py * SIZE + px] = mask[iy * w + ix] ? 1 : 0;
          } else {
            maskPatch[py * SIZE + px] = 1;
          }
        }
      }

      const imgInput = new Float32Array(3 * SIZE * SIZE);
      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const pi = (py * SIZE + px) * 4;
          imgInput[0 * SIZE * SIZE + py * SIZE + px] = patch[pi] / 255;
          imgInput[1 * SIZE * SIZE + py * SIZE + px] = patch[pi + 1] / 255;
          imgInput[2 * SIZE * SIZE + py * SIZE + px] = patch[pi + 2] / 255;
        }
      }

      const imgTensor = new ort.Tensor('float32', imgInput, [1, 3, SIZE, SIZE]);
      const maskTensor = new ort.Tensor('float32', maskPatch, [1, 1, SIZE, SIZE]);

      const feeds = {};
      feeds[inputName] = imgTensor;
      feeds[maskName] = maskTensor;

      const result = await session.run(feeds);
      const outData = result[outputName].data;

      const outImg = new Uint8ClampedArray(SIZE * SIZE * 4);
      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const pi = (py * SIZE + px) * 4;
          outImg[pi] = Math.round(Math.min(1, Math.max(0, outData[0 * SIZE * SIZE + py * SIZE + px])) * 255);
          outImg[pi + 1] = Math.round(Math.min(1, Math.max(0, outData[1 * SIZE * SIZE + py * SIZE + px])) * 255);
          outImg[pi + 2] = Math.round(Math.min(1, Math.max(0, outData[2 * SIZE * SIZE + py * SIZE + px])) * 255);
          outImg[pi + 3] = 255;
        }
      }

      for (let py = 0; py < SIZE; py++) {
        for (let px = 0; px < SIZE; px++) {
          const ix = t.sx + px, iy = t.sy + py;
          if (ix < 0 || ix >= w || iy < 0 || iy >= h) continue;
          if (!mask[iy * w + ix]) continue;

          const fwX = featherWeight(px, SIZE) * featherWeight(SIZE - 1 - px, SIZE);
          const fwY = featherWeight(py, SIZE) * featherWeight(SIZE - 1 - py, SIZE);
          const fw = fwX * fwY;

          const di = (iy * w + ix) * 4;
          const pi = (py * SIZE + px) * 4;
          const wi = iy * w + ix;

          const currW = weightMap[wi];
          const newW = fw;

          if (currW <= 0) {
            dst[di] = outImg[pi];
            dst[di + 1] = outImg[pi + 1];
            dst[di + 2] = outImg[pi + 2];
            weightMap[wi] = newW;
          } else {
            const total = currW + newW;
            dst[di] = Math.round((dst[di] * currW + outImg[pi] * newW) / total);
            dst[di + 1] = Math.round((dst[di + 1] * currW + outImg[pi + 1] * newW) / total);
            dst[di + 2] = Math.round((dst[di + 2] * currW + outImg[pi + 2] * newW) / total);
            weightMap[wi] = total;
          }
        }
      }

      if (onProgress) onProgress((ti + 1) / tiles.length);
    }

    imageData.data.set(dst);
    return imageData;
  }

  return { init, download, inpaint, isLoaded, isLoading };
})();
