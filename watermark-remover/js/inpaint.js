const Inpaint = (() => {
  const T = 1e-8;

  function inpaintRegion(imageData, mask, radius = 5) {
    const w = imageData.width, h = imageData.height;
    const data = imageData.data;
    const dst = new Uint8ClampedArray(data);
    const total = w * h;

    const status = new Uint8Array(total);
    for (let i = 0; i < total; i++) status[i] = mask[i] ? 1 : 0;

    let count = 0;
    for (let i = 0; i < total; i++) count += status[i];
    if (count === 0) return imageData;

    const offsets = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 <= radius * radius) {
          offsets.push({ dx, dy, dist: Math.sqrt(d2) });
        }
      }
    }

    const queue = new Int32Array(total);
    let head = 0, tail = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (!status[idx]) continue;
        const hasKnown =
          (x > 0 && !status[idx - 1]) ||
          (x < w - 1 && !status[idx + 1]) ||
          (y > 0 && !status[idx - w]) ||
          (y < h - 1 && !status[idx + w]);
        if (hasKnown) queue[tail++] = idx;
      }
    }

    const inQueue = new Uint8Array(total);
    for (let i = head; i < tail; i++) inQueue[queue[i]] = 1;

    while (head < tail) {
      const idx = queue[head++];
      if (!status[idx]) continue;

      const cx = idx % w, cy = (idx / w) | 0;
      let tw = 0, tr = 0, tg = 0, tb = 0;

      for (const o of offsets) {
        const nx = cx + o.dx, ny = cy + o.dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const ni = ny * w + nx;
        if (!status[ni]) {
          const pi = ni * 4;
          const wgt = 1 / (o.dist * o.dist + T);
          tr += dst[pi] * wgt;
          tg += dst[pi + 1] * wgt;
          tb += dst[pi + 2] * wgt;
          tw += wgt;
        }
      }

      if (tw > 0) {
        const pi = idx * 4;
        dst[pi] = tr / tw;
        dst[pi + 1] = tg / tw;
        dst[pi + 2] = tb / tw;
        status[idx] = 0;

        const x = cx, y = cy;
        const nidx = [y * w + (x - 1), y * w + (x + 1), (y - 1) * w + x, (y + 1) * w + x];
        for (const ni of nidx) {
          if (ni >= 0 && ni < total && status[ni] && !inQueue[ni]) {
            queue[tail++] = ni;
            inQueue[ni] = 1;
          }
        }
      }

      if (tail >= total) break;
    }

    data.set(dst);
    return imageData;
  }

  function inpaintRegionHQ(imageData, mask, radius = 7, colorWeight = 0.3) {
    const w = imageData.width, h = imageData.height;
    const data = imageData.data;
    const dst = new Uint8ClampedArray(data);
    const total = w * h;

    const status = new Uint8Array(total);
    for (let i = 0; i < total; i++) status[i] = mask[i] ? 1 : 0;

    let count = 0;
    for (let i = 0; i < total; i++) count += status[i];
    if (count === 0) return imageData;

    const offsets = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 <= radius * radius) {
          offsets.push({ dx, dy, dist: Math.sqrt(d2) });
        }
      }
    }

    for (let pass = 0; pass < 3; pass++) {
      const passRadius = [radius, Math.ceil(radius * 0.6), Math.ceil(radius * 0.3)][pass];
      const passOffsets = offsets.filter(o => o.dist <= passRadius);

      const queue = new Int32Array(total);
      let head = 0, tail = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (!status[idx]) continue;
          const hasKnown =
            (x > 0 && !status[idx - 1]) ||
            (x < w - 1 && !status[idx + 1]) ||
            (y > 0 && !status[idx - w]) ||
            (y < h - 1 && !status[idx + w]);
          if (hasKnown) queue[tail++] = idx;
        }
      }

      const inQueue = new Uint8Array(total);
      for (let i = head; i < tail; i++) inQueue[queue[i]] = 1;

      while (head < tail) {
        const idx = queue[head++];
        if (!status[idx]) continue;

        const cx = idx % w, cy = (idx / w) | 0;
        let tw = 0, tr = 0, tg = 0, tb = 0;

        for (const o of passOffsets) {
          const nx = cx + o.dx, ny = cy + o.dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const ni = ny * w + nx;
          if (!status[ni]) {
            const pi = ni * 4;
            const dw = 1 / (o.dist * o.dist + T);
            const dc = Math.abs(dst[pi] - dst[idx * 4]) +
                       Math.abs(dst[pi + 1] - dst[idx * 4 + 1]) +
                       Math.abs(dst[pi + 2] - dst[idx * 4 + 2]);
            const cw = 1 / (dc * colorWeight + 1);
            const wgt = dw * cw;
            tr += dst[pi] * wgt;
            tg += dst[pi + 1] * wgt;
            tb += dst[pi + 2] * wgt;
            tw += wgt;
          }
        }

        if (tw > 0) {
          const pi = idx * 4;
          dst[pi] = tr / tw;
          dst[pi + 1] = tg / tw;
          dst[pi + 2] = tb / tw;
          status[idx] = 0;

          const x = cx, y = cy;
          const nidx = [y * w + (x - 1), y * w + (x + 1), (y - 1) * w + x, (y + 1) * w + x];
          for (const ni of nidx) {
            if (ni >= 0 && ni < total && status[ni] && !inQueue[ni]) {
              queue[tail++] = ni;
              inQueue[ni] = 1;
            }
          }
        }

        if (tail >= total) break;
      }
    }

    data.set(dst);
    return imageData;
  }

  function fastInpaint(imageData, mask, radius = 4, iterations = 5) {
    const w = imageData.width, h = imageData.height;
    const data = imageData.data;
    const m = new Uint8Array(mask);
    const total = w * h;

    const offsets = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 <= radius * radius) {
          offsets.push({ dx, dy, dist: Math.sqrt(d2) });
        }
      }
    }

    for (let iter = 0; iter < iterations; iter++) {
      const temp = new Uint8ClampedArray(data);
      let processed = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (!m[idx]) continue;

          let onEdge = false;
          for (let dy = -1; dy <= 1 && !onEdge; dy++) {
            for (let dx = -1; dx <= 1 && !onEdge; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (!m[ny * w + nx]) onEdge = true;
              }
            }
          }
          if (!onEdge) continue;

          let tw = 0, tr = 0, tg = 0, tb = 0;
          for (const o of offsets) {
            const nx = x + o.dx, ny = y + o.dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            if (!m[ny * w + nx]) {
              const pi = (ny * w + nx) * 4;
              const wgt = 1 / (o.dist * o.dist + T);
              tr += temp[pi] * wgt;
              tg += temp[pi + 1] * wgt;
              tb += temp[pi + 2] * wgt;
              tw += wgt;
            }
          }

          if (tw > 0) {
            const pi = idx * 4;
            data[pi] = tr / tw;
            data[pi + 1] = tg / tw;
            data[pi + 2] = tb / tw;
            processed++;
          }
        }
      }

      if (processed === 0) break;
    }

    return imageData;
  }

  function applyBlur(imageData, mask, radius = 9) {
    const w = imageData.width, h = imageData.height;
    const src = new Uint8ClampedArray(imageData.data);
    const m = new Uint8Array(mask);

    const size = radius * 2 + 1;
    const kernel = new Float32Array(size * size);
    let kSum = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const v = Math.exp(-(dx * dx + dy * dy) / (radius * radius * 0.5));
        kernel[(dy + radius) * size + (dx + radius)] = v;
        kSum += v;
      }
    }
    for (let i = 0; i < kernel.length; i++) kernel[i] /= kSum;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (!m[idx]) continue;
        let r = 0, g = 0, b = 0, a = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = x + kx, py = y + ky;
            if (px >= 0 && px < w && py >= 0 && py < h) {
              const pi = (py * w + px) * 4;
              const kw = kernel[(ky + radius) * size + (kx + radius)];
              r += src[pi] * kw;
              g += src[pi + 1] * kw;
              b += src[pi + 2] * kw;
              a += src[pi + 3] * kw;
            }
          }
        }
        const pi = idx * 4;
        imageData.data[pi] = r;
        imageData.data[pi + 1] = g;
        imageData.data[pi + 2] = b;
        imageData.data[pi + 3] = a;
      }
    }
    return imageData;
  }

  function patchMatchInpaint(imageData, mask, patchHalf = 2, searchIter = 4) {
    const w = imageData.width, h = imageData.height;
    const src = new Uint8ClampedArray(imageData.data);
    const dst = new Uint8ClampedArray(imageData.data);
    const total = w * h;

    const filled = new Uint8Array(mask);
    let remain = 0;
    for (let i = 0; i < total; i++) if (filled[i]) remain++;
    if (remain === 0) return imageData;

    const nnfDx = new Int32Array(total);
    const nnfDy = new Int32Array(total);
    const nnfDist = new Float32Array(total);
    for (let i = 0; i < total; i++) nnfDist[i] = 1e9;

    function pDist(idx, dx, dy) {
      const cx = idx % w, cy = (idx / w) | 0;
      let ssd = 0, cnt = 0;
      for (let py = -patchHalf; py <= patchHalf; py++) {
        for (let px = -patchHalf; px <= patchHalf; px++) {
          const ix = cx + px, iy = cy + py;
          const ox = cx + dx + px, oy = cy + dy + py;
          if (ix < 0 || ix >= w || iy < 0 || iy >= h) continue;
          if (ox < 0 || ox >= w || oy < 0 || oy >= h) continue;
          if (filled[iy * w + ix]) continue;
          const ii = (iy * w + ix) * 4;
          const oi = (oy * w + ox) * 4;
          const dr = dst[ii] - src[oi];
          const dg = dst[ii + 1] - src[oi + 1];
          const db = dst[ii + 2] - src[oi + 2];
          ssd += dr * dr + dg * dg + db * db;
          cnt++;
        }
      }
      return cnt < 3 ? 1e9 : ssd / cnt;
    }

    while (remain > 0) {
      const boundary = [];
      for (let i = 0; i < total; i++) {
        if (!filled[i]) continue;
        const x = i % w, y = (i / w) | 0;
        if ((x > 0 && !filled[i - 1]) || (x < w - 1 && !filled[i + 1]) ||
            (y > 0 && !filled[i - w]) || (y < h - 1 && !filled[i + w]))
          boundary.push(i);
      }
      if (boundary.length === 0) {
        for (let i = 0; i < total; i++) if (filled[i]) boundary.push(i);
      }
      if (boundary.length === 0) break;

      for (const idx of boundary) {
        const cx = idx % w, cy = (idx / w) | 0;
        let bestD = 1e9, bestDx = 0, bestDy = 0;
        for (let a = 0; a < searchIter * 12; a++) {
          const sx = Math.round(Math.random() * (w - 1));
          const sy = Math.round(Math.random() * (h - 1));
          if (!filled[sy * w + sx]) {
            const d = pDist(idx, sx - cx, sy - cy);
            if (d < bestD) { bestD = d; bestDx = sx - cx; bestDy = sy - cy; }
          }
        }
        nnfDx[idx] = bestDx; nnfDy[idx] = bestDy; nnfDist[idx] = bestD;
      }

      for (let iter = 0; iter < searchIter; iter++) {
        const dir = iter % 2 === 0 ? 1 : -1;
        const start = dir === 1 ? 0 : boundary.length - 1;
        const end = dir === 1 ? boundary.length : -1;
        for (let bi = start; bi !== end; bi += dir) {
          const idx = boundary[bi];
          const cx = idx % w, cy = (idx / w) | 0;
          const nbrs = [
            cy * w + (cx - 1), cy * w + (cx + 1),
            (cy - 1) * w + cx, (cy + 1) * w + cx
          ];
          for (const ni of nbrs) {
            if (ni < 0 || ni >= total || filled[ni] || nnfDist[ni] >= 1e8) continue;
            const ndx = nnfDx[ni] + (ni % w - cx);
            const ndy = nnfDy[ni] + ((ni / w) | 0) - cy;
            const sx = cx + ndx, sy = cy + ndy;
            if (sx >= 0 && sx < w && sy >= 0 && sy < h && !filled[sy * w + sx]) {
              const d = pDist(idx, ndx, ndy);
              if (d < nnfDist[idx]) { nnfDx[idx] = ndx; nnfDy[idx] = ndy; nnfDist[idx] = d; }
            }
          }
        }

        for (const idx of boundary) {
          const cx = idx % w, cy = (idx / w) | 0;
          let scale = Math.max(w, h);
          while (scale >= 1) {
            const rx = Math.round(cx + nnfDx[idx] + (Math.random() * 2 - 1) * scale);
            const ry = Math.round(cy + nnfDy[idx] + (Math.random() * 2 - 1) * scale);
            if (rx >= 0 && rx < w && ry >= 0 && ry < h && !filled[ry * w + rx]) {
              const d = pDist(idx, rx - cx, ry - cy);
              if (d < nnfDist[idx]) { nnfDx[idx] = rx - cx; nnfDy[idx] = ry - cy; nnfDist[idx] = d; }
            }
            scale = Math.floor(scale / 2);
          }
        }
      }

      for (const idx of boundary) {
        const cx = idx % w, cy = (idx / w) | 0;
        const sx = cx + nnfDx[idx], sy = cy + nnfDy[idx];
        if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
          const pi = (sy * w + sx) * 4;
          const di = idx * 4;
          dst[di] = src[pi]; dst[di + 1] = src[pi + 1];
          dst[di + 2] = src[pi + 2]; dst[di + 3] = src[pi + 3];
        }
        filled[idx] = 0;
        remain--;
      }
    }

    imageData.data.set(dst);
    return imageData;
  }

  return { inpaintRegion, inpaintRegionHQ, patchMatchInpaint, applyBlur, fastInpaint };
})();
