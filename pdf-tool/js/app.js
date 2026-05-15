(function () {
  'use strict';

  const { PDFDocument } = PDFLib;
  const { getDocument: getPdfDoc } = pdfjsLib;

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  let mergeFiles = [];
  let splitData = null;
  let rotateData = null;
  let rotateAngles = [];
  let compressData = null;
  let extractData = null;
  let img2pdfFiles = [];

  const officeData = {};

  function toast(msg, dur) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), dur || 2500);
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function parseRange(str, total) {
    const pages = new Set();
    for (const p of str.split(',').map(s => s.trim())) {
      if (/^\d+$/.test(p)) { const n = parseInt(p, 10); if (n >= 1 && n <= total) pages.add(n); }
      else if (/^(\d+)\s*-\s*(\d+)$/.test(p)) {
        const [, s, e] = p.match(/^(\d+)\s*-\s*(\d+)$/);
        for (let i = Math.max(1, parseInt(s, 10)); i <= Math.min(total, parseInt(e, 10)); i++) pages.add(i);
      }
    }
    return [...pages].sort((a, b) => a - b);
  }

  function setStatus(t) { $('statusBar').textContent = t; }

  function spin(t) {
    $('processingIndicator').style.display = 'flex';
    $('processingText').textContent = t || '处理中...';
  }

  function stop() { $('processingIndicator').style.display = 'none'; }

  function dl(bytes, name, mime) {
    const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function makeUpload(elId, accept, multi, cb) {
    const area = $(elId);
    area.addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = accept;
      if (multi) inp.multiple = true;
      inp.onchange = () => { if (inp.files.length) cb(inp.files); };
      inp.click();
    });
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', e => {
      e.preventDefault(); area.classList.remove('dragover');
      if (e.dataTransfer.files.length) cb(e.dataTransfer.files);
    });
  }

  function makeOfficeUpload(elId, accept, key) {
    makeUpload(elId, accept, false, files => {
      const f = files[0];
      if (!f.name.match(/\.(pdf|docx|xlsx|pptx)$/i)) { toast('文件格式不支持'); return; }
      officeData[key] = { buf: null, name: f.name, file: f };
      const infoEl = $(elId.replace('Upload', 'FileInfo'));
      if (infoEl) {
        infoEl.style.display = 'flex';
        infoEl.innerHTML = '<span>' + f.name + '</span><span>' + fmtSize(f.size) + '</span>';
      }
      const btnKey = elId.replace('Upload', '').replace('office', 'btnOffice');
      const btn = $(btnKey);
      if (btn) btn.disabled = false;
      setStatus('已加载 ' + f.name);
    });
  }

  $('btnTheme').addEventListener('click', () => {
    const h = document.documentElement;
    const d = h.getAttribute('data-theme') === 'dark';
    h.setAttribute('data-theme', d ? 'light' : 'dark');
  });

  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      $('tab-' + tab.dataset.tab).classList.add('active');
      setStatus('就绪');
    });
  });

  $$('.office-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.office-tab').forEach(t => t.classList.remove('active'));
      $$('.office-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $('office-' + tab.dataset.office).classList.add('active');
    });
  });

  // ===================== MERGE =====================
  makeUpload('mergeUpload', '.pdf,application/pdf', true, files => {
    mergeFiles = [];
    $('mergeFileList').innerHTML = '';
    for (const f of files) {
      if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) continue;
      mergeFiles.push(f);
    }
    renderMerge();
    $('btnMerge').disabled = mergeFiles.length < 2;
    setStatus('已添加 ' + mergeFiles.length + ' 个 PDF');
  });

  function renderMerge() {
    const c = $('mergeFileList');
    c.innerHTML = '';
    mergeFiles.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'file-item'; div.draggable = true; div.dataset.index = i;
      div.innerHTML = '<div class="file-name"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8M12 8v8"/></svg><span>' + (i + 1) + '. ' + f.name + '</span><span class="file-size">' + fmtSize(f.size) + '</span></div><button class="file-remove">&times;</button>';
      div.querySelector('.file-remove').addEventListener('click', e => { e.stopPropagation(); mergeFiles.splice(i, 1); renderMerge(); $('btnMerge').disabled = mergeFiles.length < 2; });
      div.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i); div.classList.add('dragging'); });
      div.addEventListener('dragend', () => div.classList.remove('dragging'));
      div.addEventListener('dragover', e => e.preventDefault());
      div.addEventListener('drop', e => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (from !== i) { const [item] = mergeFiles.splice(from, 1); mergeFiles.splice(i, 0, item); renderMerge(); }
      });
      c.appendChild(div);
    });
  }

  $('btnMerge').addEventListener('click', async () => {
    if (mergeFiles.length < 2) return;
    spin('合并中...');
    try {
      const merged = await PDFDocument.create();
      for (const f of mergeFiles) {
        const buf = await f.arrayBuffer();
        const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      dl(await merged.save(), 'merged.pdf', 'application/pdf');
      toast('合并成功！');
      setStatus('合并完成');
    } catch (e) { toast('合并失败: ' + e.message); } finally { stop(); }
  });

  // ===================== SPLIT =====================
  makeUpload('splitUpload', '.pdf,application/pdf', false, async files => {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { toast('请选择 PDF 文件'); return; }
    try {
      const buf = await f.arrayBuffer();
      const pdf = await getPdfDoc({ data: buf.slice(0) }).promise;
      splitData = { buf, pages: pdf.numPages, name: f.name };
      $('splitFileInfo').style.display = 'flex';
      $('splitFileInfo').innerHTML = '<span>' + f.name + '</span><span>共 ' + pdf.numPages + ' 页 · ' + fmtSize(f.size) + '</span>';
      $('splitOptions').style.display = 'block';
      $('btnSplit').disabled = false;
      setStatus('已加载 ' + f.name + '（' + pdf.numPages + ' 页）');
      pdf.destroy();
    } catch (e) { toast('加载失败: ' + e.message); }
  });

  $('splitMode').addEventListener('change', () => {
    const m = $('splitMode').value;
    $('splitRangeGroup').style.display = m === 'range' ? 'block' : 'none';
    $('splitCustomGroup').style.display = m === 'custom' ? 'block' : 'none';
  });

  $('btnSplit').addEventListener('click', async () => {
    if (!splitData) return;
    spin('拆分中...');
    try {
      const mode = $('splitMode').value;
      const src = await PDFDocument.load(splitData.buf, { ignoreEncryption: true });
      const t = src.getPageCount();
      if (mode === 'all') {
        for (let i = 0; i < t; i++) { const d = await PDFDocument.create(); const [p] = await d.copyPages(src, [i]); d.addPage(p); dl(await d.save(), 'page_' + (i + 1) + '.pdf', 'application/pdf'); }
        toast('已拆分为 ' + t + ' 个文件');
      } else if (mode === 'range') {
        const rs = $('splitRange').value.trim();
        if (!rs) { toast('请输入页码范围'); stop(); return; }
        const pages = parseRange(rs, t);
        if (!pages.length) { toast('无效的页码范围'); stop(); return; }
        const d = await PDFDocument.create();
        const copied = await d.copyPages(src, pages.map(p => p - 1));
        copied.forEach(p => d.addPage(p));
        dl(await d.save(), 'split_' + rs.replace(/\s/g, '') + '.pdf', 'application/pdf');
        toast('已提取 ' + pages.length + ' 页');
      } else if (mode === 'custom') {
        const gs = parseInt($('splitCustomPages').value, 10) || 2;
        for (let s = 0; s < t; s += gs) {
          const e = Math.min(s + gs, t);
          const d = await PDFDocument.create();
          const idx = []; for (let i = s; i < e; i++) idx.push(i);
          const copied = await d.copyPages(src, idx);
          copied.forEach(p => d.addPage(p));
          dl(await d.save(), 'split_part_' + (Math.floor(s / gs) + 1) + '.pdf', 'application/pdf');
        }
        toast('已拆分为 ' + Math.ceil(t / gs) + ' 个文件');
      }
      src.destroy();
      setStatus('拆分完成');
    } catch (e) { toast('拆分失败: ' + e.message); } finally { stop(); }
  });

  // ===================== PDF TO IMAGE =====================
  let pdf2imgBuf = null;

  makeUpload('pdf2imgUpload', '.pdf,application/pdf', false, async files => {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { toast('请选择 PDF 文件'); return; }
    pdf2imgBuf = await f.arrayBuffer();
    $('pdf2imgFileInfo').style.display = 'flex';
    $('pdf2imgFileInfo').innerHTML = '<span>' + f.name + '</span><span>' + fmtSize(f.size) + '</span>';
    $('pdf2imgOptions').style.display = 'block';
    $('btnPdf2Img').disabled = false;
    $('pdf2imgResult').innerHTML = '';
    setStatus('已加载 ' + f.name);
  });

  $('btnPdf2Img').addEventListener('click', async function () {
    if (!pdf2imgBuf) return;
    spin('渲染页面...');
    try {
      const buf = pdf2imgBuf;
      const pdfDoc = await getPdfDoc({ data: buf }).promise;
      const fmt = $('pdf2imgFormat').value;
      const qual = parseFloat($('pdf2imgQuality').value);
      const rangeStr = $('pdf2imgRange').value.trim();

      let pages = [];
      if (rangeStr) {
        pages = parseRange(rangeStr, pdfDoc.numPages);
      } else {
        for (let i = 1; i <= pdfDoc.numPages; i++) pages.push(i);
      }

      const resultGrid = $('pdf2imgResult');
      resultGrid.innerHTML = '';

      for (const pg of pages) {
        const page = await pdfDoc.getPage(pg);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        const blob = await new Promise(r => canvas.toBlob(r, 'image/' + (fmt === 'jpeg' ? 'jpeg' : fmt), qual));
        if (blob) {
          const url = URL.createObjectURL(blob);
          const div = document.createElement('div');
          div.className = 'result-item';
          div.innerHTML = '<img src="' + url + '" alt="page ' + pg + '"><div class="result-label">第 ' + pg + ' 页 (' + fmtSize(blob.size) + ')</div>';
          resultGrid.appendChild(div);
          dl(await blob.arrayBuffer(), 'page_' + pg + '.' + fmt, 'image/' + (fmt === 'jpeg' ? 'jpeg' : fmt));
        }
      }
      pdfDoc.destroy();
      toast('导出完成！');
      setStatus('PDF 转图片完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  // ===================== IMAGE TO PDF =====================
  makeUpload('img2pdfUpload', '.png,.jpg,.jpeg,.webp,.bmp,.gif,image/*', true, files => {
    img2pdfFiles = [];
    $('img2pdfFileList').innerHTML = '';
    for (const f of files) {
      if (!f.type.match(/^image\//)) continue;
      img2pdfFiles.push(f);
    }
    renderImg2pdf();
    $('btnImg2Pdf').disabled = img2pdfFiles.length === 0;
    setStatus('已添加 ' + img2pdfFiles.length + ' 张图片');
  });

  function renderImg2pdf() {
    const c = $('img2pdfFileList');
    c.innerHTML = '';
    img2pdfFiles.forEach((f, i) => {
      const url = URL.createObjectURL(f);
      const div = document.createElement('div');
      div.className = 'img-preview-item';
      div.innerHTML = '<img src="' + url + '"><div class="img-preview-name">' + (i + 1) + '. ' + f.name + '</div><button class="img-preview-remove" data-idx="' + i + '">&times;</button>';
      div.querySelector('.img-preview-remove').addEventListener('click', e => {
        e.stopPropagation();
        img2pdfFiles.splice(i, 1);
        renderImg2pdf();
        $('btnImg2Pdf').disabled = img2pdfFiles.length === 0;
      });
      c.appendChild(div);
    });
  }

  $('btnImg2Pdf').addEventListener('click', async () => {
    if (!img2pdfFiles.length) return;
    spin('生成 PDF...');
    try {
      const pdfDoc = await PDFDocument.create();
      const sizeOpt = $('img2pdfSize').value;

      for (const f of img2pdfFiles) {
        const buf = await f.arrayBuffer();
        const img = await loadImage(buf);
        let pdfImg;
        if (f.type === 'image/png') pdfImg = await pdfDoc.embedPng(buf);
        else pdfImg = await pdfDoc.embedJpg(buf);

        let pw, ph;
        if (sizeOpt === 'auto') {
          pw = pdfImg.width;
          ph = pdfImg.height;
        } else {
          const sizes = { A4: [595, 842], A3: [842, 1191], letter: [612, 792] };
          [pw, ph] = sizes[sizeOpt] || [595, 842];
          const scale = Math.min(pw / pdfImg.width, ph / pdfImg.height);
          pw = pdfImg.width * scale;
          ph = pdfImg.height * scale;
        }

        const page = pdfDoc.addPage([pw, ph]);
        page.drawImage(pdfImg, { x: 0, y: 0, width: pw, height: ph });
      }
      dl(await pdfDoc.save(), 'images.pdf', 'application/pdf');
      toast('转换成功！共 ' + img2pdfFiles.length + ' 页');
      setStatus('图片转 PDF 完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  function loadImage(buf) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(new Blob([buf]));
    });
  }

  // ===================== IMAGE CONVERT =====================
  let imgconvBuf = null;
  let imgconvName = '';

  makeUpload('imgconvUpload', '.png,.jpg,.jpeg,.webp,.bmp,.gif,image/*', false, async files => {
    const f = files[0];
    if (!f.type.match(/^image\//)) { toast('请选择图片文件'); return; }
    imgconvBuf = await f.arrayBuffer();
    imgconvName = f.name;
    $('imgconvFileInfo').style.display = 'flex';
    $('imgconvFileInfo').innerHTML = '<span>' + f.name + '</span><span>' + fmtSize(f.size) + '</span>';
    $('imgconvOptions').style.display = 'block';
    $('btnImgConv').disabled = false;
    setStatus('已加载 ' + f.name);
  });

  $('imgconvFormat').addEventListener('change', () => {
    const fmt = $('imgconvFormat').value;
    $('imgconvQualityGroup').style.display = (fmt === 'jpeg' || fmt === 'webp') ? 'block' : 'none';
  });

  $('btnImgConv').addEventListener('click', async function () {
    if (!imgconvBuf) return;
    spin('转换中...');
    try {
      const buf = imgconvBuf;
      const fmt = $('imgconvFormat').value;
      const qual = parseFloat($('imgconvQuality').value);
      const name = imgconvName;

      const img = await loadImage(buf);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(blob => {
        if (blob) {
          const base = name.replace(/\.[^.]+$/, '');
          dl(blob, base + '.' + fmt, blob.type);
          toast('转换成功！');
          setStatus('转换完成');
        }
        stop();
      }, 'image/' + (fmt === 'jpeg' ? 'jpeg' : fmt), qual);
    } catch (e) { toast('转换失败: ' + e.message); stop(); }
  });

  // ===================== OFFICE =====================
  makeOfficeUpload('officeWordUpload', '.pdf,application/pdf', 'pdf2word');
  makeOfficeUpload('officeDocxUpload', '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx2pdf');
  makeOfficeUpload('officeExcelUpload', '.pdf,application/pdf', 'pdf2xlsx');
  makeOfficeUpload('officeXlsxUpload', '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx2pdf');
  makeOfficeUpload('officePptUpload', '.pdf,application/pdf', 'pdf2pptx');
  makeOfficeUpload('officePptxUpload', '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx2pdf');

  $('btnOfficeWord2Doc').addEventListener('click', async () => {
    const d = officeData['pdf2word'];
    if (!d) { toast('请先上传 PDF'); return; }
    spin('提取文本中...');
    try {
      const buf = await d.file.arrayBuffer();
      const pdf = await getPdfDoc({ data: buf.slice(0) }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        text += c.items.map(item => item.str).join(' ') + '\n\n';
      }
      pdf.destroy();
      const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>转换文档</title><style>body{font-family:SimSun,serif;padding:40px;line-height:1.8;font-size:12pt}p{text-indent:2em;margin:8px 0}</style></head><body>' + text.split('\n').filter(l => l.trim()).map(l => '<p>' + l.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>').join('\n') + '</body></html>';
      dl(new TextEncoder().encode(html), d.name.replace(/\.pdf$/i, '.doc'), 'application/msword');
      toast('转换成功！');
      setStatus('Word 转换完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  $('btnOfficeDocx2Pdf').addEventListener('click', async () => {
    const d = officeData['docx2pdf'];
    if (!d) { toast('请先上传 .docx'); return; }
    spin('转换中...');
    try {
      const zip = await JSZip.loadAsync(await d.file.arrayBuffer());
      const docXml = await zip.file('word/document.xml').async('text');
      const xml = new DOMParser().parseFromString(docXml, 'text/xml');
      const ns = { w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main' };
      const nodes = xml.evaluate('//w:t', xml, p => ns[p] || null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      let text = '';
      for (let i = 0; i < nodes.snapshotLength; i++) text += nodes.snapshotItem(i).textContent;
      await renderTextToPdf(text, d.name.replace(/\.docx$/i, '.pdf'));
      toast('转换成功！');
      setStatus('PDF 转换完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  $('btnOfficeExcel2Xlsx').addEventListener('click', async () => {
    const d = officeData['pdf2xlsx'];
    if (!d) { toast('请先上传 PDF'); return; }
    spin('提取数据中...');
    try {
      const buf = await d.file.arrayBuffer();
      const pdf = await getPdfDoc({ data: buf.slice(0) }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        text += c.items.map(item => item.str).join('\t') + '\n';
      }
      pdf.destroy();
      const xlsx = textToXlsx(text);
      dl(xlsx, d.name.replace(/\.pdf$/i, '.xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast('转换成功！');
      setStatus('Excel 转换完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  $('btnOfficeXlsx2Pdf').addEventListener('click', async () => {
    const d = officeData['xlsx2pdf'];
    if (!d) { toast('请先上传 .xlsx'); return; }
    spin('转换中...');
    try {
      const zip = await JSZip.loadAsync(await d.file.arrayBuffer());
      const sharedStringsXml = zip.file('xl/sharedStrings.xml');
      const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');
      let strings = [];
      if (sharedStringsXml) {
        const ss = await sharedStringsXml.async('text');
        const sx = new DOMParser().parseFromString(ss, 'text/xml');
        const sn = sx.evaluate('//t', sx, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < sn.snapshotLength; i++) strings.push(sn.snapshotItem(i).textContent);
      }
      const xml = new DOMParser().parseFromString(sheetXml, 'text/xml');
      const ns = { si: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };
      const rows = xml.evaluate('//si:row', xml, p => ns[p] || null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      let text = '';
      for (let r = 0; r < rows.snapshotLength; r++) {
        const cells = rows.snapshotItem(r).querySelectorAll('c');
        const rowTexts = [];
        cells.forEach(cell => {
          const v = cell.querySelector('v');
          const tAttr = cell.getAttribute('t');
          if (tAttr === 's' && v) rowTexts.push(strings[parseInt(v.textContent, 10)] || '');
          else if (v) rowTexts.push(v.textContent);
        });
        text += rowTexts.join('\t') + '\n';
      }
      await renderTextToPdf(text, d.name.replace(/\.xlsx$/i, '.pdf'));
      toast('转换成功！');
      setStatus('PDF 转换完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  $('btnOfficePpt2Pptx').addEventListener('click', async () => {
    const d = officeData['pdf2pptx'];
    if (!d) { toast('请先上传 PDF'); return; }
    spin('提取文本中...');
    try {
      const buf = await d.file.arrayBuffer();
      const pdf = await getPdfDoc({ data: buf.slice(0) }).promise;
      const slides = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        slides.push(c.items.map(item => item.str).join(' '));
      }
      pdf.destroy();
      const pptx = textToPptx(slides);
      dl(pptx, d.name.replace(/\.pdf$/i, '.pptx'), 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      toast('转换成功！');
      setStatus('PPT 转换完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  $('btnOfficePptx2Pdf').addEventListener('click', async () => {
    const d = officeData['pptx2pdf'];
    if (!d) { toast('请先上传 .pptx'); return; }
    spin('转换中...');
    try {
      const zip = await JSZip.loadAsync(await d.file.arrayBuffer());
      const slides = [];
      const slideFiles = Object.keys(zip.files).filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k)).sort();
      for (const sf of slideFiles) {
        const xml = await zip.file(sf).async('text');
        const x = new DOMParser().parseFromString(xml, 'text/xml');
        const ns = { a: 'http://schemas.openxmlformats.org/drawingml/2006/main' };
        const nodes = x.evaluate('//a:t', x, p => ns[p] || null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        let text = '';
        for (let i = 0; i < nodes.snapshotLength; i++) text += nodes.snapshotItem(i).textContent;
        slides.push(text);
      }
      await renderSlidesToPdf(slides, d.name.replace(/\.pptx$/i, '.pdf'));
      toast('转换成功！');
      setStatus('PDF 转换完成');
    } catch (e) { toast('转换失败: ' + e.message); } finally { stop(); }
  });

  async function renderTextToPdf(text, filename) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fs = 12, m = 50, pw = 595, ph = 842, mw = pw - m * 2, lh = fs * 1.5;
    let lines = [], cur = '';
    for (const ch of text) {
      if (ch === '\n' || ch === '\r') { if (cur) { lines.push(cur); cur = ''; } continue; }
      if (font.widthOfTextAtSize(cur + ch, fs) > mw) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    let page = pdfDoc.addPage([pw, ph]), y = ph - m;
    for (const line of lines) {
      if (y < m + lh) { page = pdfDoc.addPage([pw, ph]); y = ph - m; }
      page.drawText(line, { x: m, y: y - fs, size: fs, font });
      y -= lh;
    }
    dl(await pdfDoc.save(), filename, 'application/pdf');
  }

  async function renderSlidesToPdf(slides, filename) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fs = 18, m = 60, pw = 720, ph = 540, mw = pw - m * 2, lh = fs * 1.5;
    for (const slide of slides) {
      let lines = [], cur = '';
      for (const ch of slide) {
        if (ch === '\n' || ch === '\r') { if (cur) { lines.push(cur); cur = ''; } continue; }
        if (font.widthOfTextAtSize(cur + ch, fs) > mw) { lines.push(cur); cur = ch; }
        else cur += ch;
      }
      if (cur) lines.push(cur);
      const page = pdfDoc.addPage([pw, ph]);
      let y = ph - m;
      page.drawText('Slide ' + lines.length, { x: m, y: y - fs, size: 14, font, color: PDFLib.rgb(0.5, 0.5, 0.5) });
      y -= lh + 10;
      for (const line of lines) {
        if (y < m + lh) break;
        page.drawText(line, { x: m, y: y - fs, size: fs, font });
        y -= lh;
      }
    }
    dl(await pdfDoc.save(), filename, 'application/pdf');
  }

  function textToXlsx(text) {
    const rows = text.split('\n').filter(r => r.trim()).map(r => r.split('\t'));
    const escaped = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
    rows.forEach(row => {
      xml += '<row>';
      row.forEach(cell => { xml += '<c><v>' + escaped(cell) + '</v></c>'; });
      xml += '</row>';
    });
    xml += '</sheetData></worksheet>';

    const sharedStrings = [];
    rows.forEach(row => row.forEach(cell => { if (!sharedStrings.includes(cell)) sharedStrings.push(cell); }));
    let ssXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + sharedStrings.length + '" uniqueCount="' + sharedStrings.length + '">';
    sharedStrings.forEach(s => { ssXml += '<si><t>' + escaped(s) + '</t></si>'; });
    ssXml += '</sst>';

    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>';

    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';

    const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>';

    const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>';

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    const relsZip = zip.folder('_rels');
    relsZip.file('.rels', rels);
    const xl = zip.folder('xl');
    xl.file('workbook.xml', wb);
    const xlRels = xl.folder('_rels');
    xlRels.file('workbook.xml.rels', wbRels);
    const ws = xl.folder('worksheets');
    ws.file('sheet1.xml', xml);
    xl.file('sharedStrings.xml', ssXml);

    return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  }

  function textToPptx(slides) {
    const escaped = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const slideXml = (idx, text) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
      + '<p:cSld><p:spTree>'
      + '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>'
      + '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title ' + idx + '"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="457200" y="457200"/><a:ext cx="6858000" cy="914400"/></a:xfrm><a:prstGeom prst="rect"/></p:spPr><p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="zh-CN" sz="2400"/><a:t>' + escaped(text) + '</a:t></a:r></a:p></p:txBody></p:sp>'
      + '</p:spTree></p:cSld></p:sld>';

    const slideRefs = slides.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (i + 1) + '.xml"/>').join('\n');
    const slideList = slides.map((_, i) => '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 1) + '"/>').join('\n');

    const presXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
      + '<p:sldIdLst>' + slideList + '</p:sldIdLst>'
      + '<p:sldSz cx="9144000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>';

    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
      + '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
      + slides.map((_, i) => '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join('\n')
      + '</Types>';

    const presRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
      + '</Relationships>';

    const mainRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + slideRefs
      + '<Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
      + '</Relationships>';

    const masterXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld></p:sldMaster>';

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.folder('_rels').file('.rels', presRels);
    const ppt = zip.folder('ppt');
    ppt.file('presentation.xml', presXml);
    ppt.folder('_rels').file('presentation.xml.rels', mainRels);
    const slidesFolder = ppt.folder('slides');
    slides.forEach((text, i) => slidesFolder.file('slide' + (i + 1) + '.xml', slideXml(i + 1, text)));
    const masters = ppt.folder('slideMasters');
    masters.file('slideMaster1.xml', masterXml);

    return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  }

  // ===================== ROTATE =====================
  makeUpload('rotateUpload', '.pdf,application/pdf', false, async files => {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { toast('请选择 PDF 文件'); return; }
    try {
      const buf = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const cnt = pdfDoc.getPageCount();
      rotateData = { buf, name: f.name };
      rotateAngles = new Array(cnt).fill(0);
      $('rotateFileInfo').style.display = 'flex';
      $('rotateFileInfo').innerHTML = '<span>' + f.name + '</span><span>共 ' + cnt + ' 页</span>';
      const list = $('rotatePageList');
      list.innerHTML = '';
      for (let i = 0; i < cnt; i++) {
        const div = document.createElement('div');
        div.className = 'page-item';
        div.innerHTML = '<div class="page-num">第 ' + (i + 1) + ' 页</div><div style="display:flex;gap:4px;justify-content:center;margin-bottom:4px"><button class="page-rotate-btn" data-p="' + i + '" data-d="1">↻</button><button class="page-rotate-btn" data-p="' + i + '" data-d="-1">↺</button></div><div class="page-angle">0°</div>';
        div.querySelectorAll('.page-rotate-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const pi = parseInt(btn.dataset.p, 10), dir = parseInt(btn.dataset.d, 10);
            rotateAngles[pi] = (rotateAngles[pi] + dir * 90 + 360) % 360;
            div.querySelector('.page-angle').textContent = rotateAngles[pi] + '°';
          });
        });
        list.appendChild(div);
      }
      $('btnRotate').disabled = false;
      pdfDoc.destroy();
      setStatus('已加载 ' + f.name + '（' + cnt + ' 页）');
    } catch (e) { toast('加载失败: ' + e.message); }
  });

  $('btnRotateAllCW').addEventListener('click', () => {
    $$('.page-angle').forEach((el, i) => { rotateAngles[i] = (rotateAngles[i] + 90) % 360; el.textContent = rotateAngles[i] + '°'; });
  });

  $('btnRotateAllCCW').addEventListener('click', () => {
    $$('.page-angle').forEach((el, i) => { rotateAngles[i] = (rotateAngles[i] - 90 + 360) % 360; el.textContent = rotateAngles[i] + '°'; });
  });

  $('btnRotate').addEventListener('click', async () => {
    if (!rotateData) return;
    spin('旋转中...');
    try {
      const pdfDoc = await PDFDocument.load(rotateData.buf, { ignoreEncryption: true });
      for (let i = 0; i < pdfDoc.getPageCount(); i++) { if (rotateAngles[i]) pdfDoc.getPage(i).setRotation(PDFLib.degrees(rotateAngles[i])); }
      dl(await pdfDoc.save(), 'rotated.pdf', 'application/pdf');
      toast('旋转成功！');
      setStatus('旋转完成');
      pdfDoc.destroy();
    } catch (e) { toast('旋转失败: ' + e.message); } finally { stop(); }
  });

  // ===================== COMPRESS =====================
  makeUpload('compressUpload', '.pdf,application/pdf', false, async files => {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { toast('请选择 PDF 文件'); return; }
    compressData = { buf: await f.arrayBuffer(), name: f.name, size: f.size };
    $('compressFileInfo').style.display = 'flex';
    $('compressFileInfo').innerHTML = '<span>' + f.name + '</span><span>' + fmtSize(f.size) + '</span>';
    $('compressOptions').style.display = 'block';
    $('btnCompress').disabled = false;
    setStatus('已加载 ' + f.name);
  });

  $('btnCompress').addEventListener('click', async () => {
    if (!compressData) return;
    spin('压缩中...');
    try {
      const pdfDoc = await PDFDocument.load(compressData.buf, { ignoreEncryption: true });
      const level = $('compressLevel').value;
      const bytes = await pdfDoc.save({ useObjectStreams: level !== 'low', addDefaultPage: false });
      const ratio = ((1 - bytes.length / compressData.size) * 100).toFixed(1);
      dl(bytes, 'compressed_' + compressData.name, 'application/pdf');
      toast('压缩成功！减小了 ' + ratio + '%');
      setStatus('压缩完成 ' + fmtSize(compressData.size) + ' → ' + fmtSize(bytes.length));
    } catch (e) { toast('压缩失败: ' + e.message); } finally { stop(); }
  });

  // ===================== EXTRACT =====================
  makeUpload('extractUpload', '.pdf,application/pdf', false, async files => {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { toast('请选择 PDF 文件'); return; }
    try {
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      const t = pdf.getPageCount();
      extractData = { buf, name: f.name, total: t };
      pdf.destroy();
      $('extractFileInfo').style.display = 'flex';
      $('extractFileInfo').innerHTML = '<span>' + f.name + '</span><span>共 ' + t + ' 页 · ' + fmtSize(f.size) + '</span>';
      $('extractOptions').style.display = 'block';
      $('btnExtract').disabled = false;
      setStatus('已加载 ' + f.name + '（' + t + ' 页）');
    } catch (e) { toast('加载失败: ' + e.message); }
  });

  $('btnExtract').addEventListener('click', async () => {
    if (!extractData) return;
    const rs = $('extractRange').value.trim();
    if (!rs) { toast('请输入页码范围'); return; }
    spin('提取中...');
    try {
      const src = await PDFDocument.load(extractData.buf, { ignoreEncryption: true });
      const pages = parseRange(rs, extractData.total);
      if (!pages.length) { toast('无效的页码范围'); stop(); return; }
      const doc = await PDFDocument.create();
      const copied = await doc.copyPages(src, pages.map(p => p - 1));
      copied.forEach(p => doc.addPage(p));
      dl(await doc.save(), 'extracted_' + rs.replace(/\s/g, '') + '.pdf', 'application/pdf');
      toast('成功提取 ' + pages.length + ' 页');
      setStatus('提取完成');
      src.destroy();
    } catch (e) { toast('提取失败: ' + e.message); } finally { stop(); }
  });

  // ===================== HTML TO PDF =====================
  $('btnHtml2Pdf').addEventListener('click', async () => {
    const html = $('html2pdfContent').value.trim();
    if (!html) { toast('请输入 HTML 内容'); return; }
    spin('生成 PDF...');
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      await new Promise(resolve => setTimeout(resolve, 500));

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

      const bodyText = doc.body ? doc.body.innerText || doc.body.textContent : '';
      document.body.removeChild(iframe);

      const fs = 12, m = 50, pw = 595, ph = 842, mw = pw - m * 2, lh = fs * 1.5;
      const lines = [];
      let cur = '';
      for (const ch of bodyText) {
        if (ch === '\n' || ch === '\r') { if (cur) { lines.push(cur); cur = ''; } continue; }
        if (font.widthOfTextAtSize(cur + ch, fs) > mw) { lines.push(cur); cur = ch; }
        else cur += ch;
      }
      if (cur) lines.push(cur);

      let page = pdfDoc.addPage([pw, ph]), y = ph - m;
      for (const line of lines) {
        if (y < m + lh) { page = pdfDoc.addPage([pw, ph]); y = ph - m; }
        page.drawText(line, { x: m, y: y - fs, size: fs, font });
        y -= lh;
      }
      dl(await pdfDoc.save(), 'html_output.pdf', 'application/pdf');
      toast('生成成功！');
      setStatus('HTML 转 PDF 完成');
    } catch (e) { toast('生成失败: ' + e.message); } finally { stop(); }
  });

  setStatus('就绪 - 全能文档转换工具箱');
})();
