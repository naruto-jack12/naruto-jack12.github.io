/**
 * 课程表：Pointer 事件拖拽（桌面鼠标 + 移动触摸通用）+ 可编辑科目 + 本地自动保存。
 *
 * 科目（顶部面板）：
 *   - 默认来自 data/subjects.json；fetch 失败时回退内置 DEFAULT_SUBJECTS（兼容 file://）。
 *   - 用户可增 / 删 / 改名，任何修改后整体存入 localStorage(timetable_subjects)，之后优先读取本地。
 *
 * 拖拽三种情形：
 *   copy  左 -> 表   （复制一份进格子，面板原件保留）
 *   move  表 -> 表   （格内移动；目标已占用则两科互换）
 *   move  表 -> 左   （拖回面板，即丢弃）
 * 课表内容每次有效拖放后自动存 localStorage(timetable_data)，刷新恢复。
 *
 * 用 Pointer 事件而非原生 HTML5 draggable：原生拖拽依赖鼠标事件模型，触摸/自动化下常不触发。
 * 采用“移动阈值”：按下后移动超过 6px 才进入拖拽，从而让 单击/双击 仍可正常用于删除与改名。
 */
(function () {
    const SUBJECTS_KEY = 'timetable_subjects';
    const TIMETABLE_KEY = 'timetable_data';
    const DRAG_THRESHOLD = 6;

    const DEFAULT_SUBJECTS = [
        { name: '语文', color: '#ff6b6b' },
        { name: '数学', color: '#4dabf7' },
        { name: '英语', color: '#51cf66' },
        { name: '物理', color: '#5c7cfa' },
        { name: '化学', color: '#cc5de8' },
        { name: '生物', color: '#20c997' },
        { name: '历史', color: '#ff922b' },
        { name: '地理', color: '#15aabf' },
        { name: '道德与法治', color: '#7048e8' },
        { name: '科学', color: '#0ca678' },
        { name: '音乐', color: '#f76707' },
        { name: '美术', color: '#d6336c' },
        { name: '体育', color: '#2f9e44' },
        { name: '信息技术', color: '#1971c2' },
        { name: '书法', color: '#e8590c' },
        { name: '班会', color: '#868e96' }
    ];

    const container = document.querySelector('.container');
    const subjectPanel = document.querySelector('.subjects');

    let subjects = [];               // 当前科目列表 [{name,color}]
    let adding = false;              // 是否展开“添加科目”表单

    let pending = null;              // 按下候选：{item,x,y}
    let source = null;               // 已进入拖拽的源元素
    let ghost = null;                // 跟随指针的浮层 { node, offX, offY }

    // ==================== 工具 ====================
    function getCells() {
        return Array.from(document.querySelectorAll('.timetable td[data-allow="copy"]'));
    }
    function clearDropTargets() {
        document.querySelectorAll('.drop-over').forEach(el => el.classList.remove('drop-over'));
    }
    function getDropNode(node) {
        while (node && node !== document) {
            if (node.dataset && node.dataset.allow) return node;
            node = node.parentNode;
        }
        return null;
    }
    function canDrop(src, node) {
        if (!src || !node) return false;
        const s = src.dataset.effect, a = node.dataset.allow;
        return (s === 'copy' && a === 'copy') || (s === 'move' && a === 'copy') || (s === 'move' && a === 'move');
    }
    function findTarget(x, y) {
        const el = document.elementFromPoint(x, y);
        return el ? getDropNode(el) : null;
    }

    // ==================== 科目渲染与编辑 ====================
    function makeSubjectItem(s, index) {
        const d = document.createElement('div');
        d.className = 'item sub';
        d.dataset.effect = 'copy';
        d.dataset.color = s.color || '';
        d.dataset.name = s.name;
        d.dataset.index = index;
        if (s.color) d.style.background = s.color;

        const name = document.createElement('span');
        name.className = 'sub-name';
        name.textContent = s.name;
        d.appendChild(name);

        const del = document.createElement('button');
        del.className = 'sub-del';
        del.type = 'button';
        del.setAttribute('aria-label', '删除科目');
        del.textContent = '×';
        d.appendChild(del);
        return d;
    }

    function buildAddZone() {
        if (!adding) {
            const btn = document.createElement('button');
            btn.className = 'add-subject';
            btn.type = 'button';
            btn.textContent = '＋ 添加科目';
            return btn;
        }
        const form = document.createElement('div');
        form.className = 'add-form';

        const name = document.createElement('input');
        name.type = 'text';
        name.className = 'add-name';
        name.placeholder = '科目名称';

        const color = document.createElement('input');
        color.type = 'color';
        color.className = 'add-color';
        color.value = '#4dabf7';

        const ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'add-ok';
        ok.textContent = '确定';

        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'add-cancel';
        cancel.textContent = '取消';

        form.append(name, color, ok, cancel);
        setTimeout(() => name.focus(), 0);
        return form;
    }

    function renderSubjects() {
        if (!subjectPanel) return;
        subjectPanel.innerHTML = '';
        subjects.forEach((s, i) => subjectPanel.appendChild(makeSubjectItem(s, i)));
        subjectPanel.appendChild(buildAddZone());
    }

    function persistSubjects() {
        try { localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)); } catch (err) {}
    }

    async function loadSubjects() {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(SUBJECTS_KEY)); } catch (err) {}
        if (Array.isArray(saved) && saved.length) { subjects = saved; renderSubjects(); return; }

        let list = DEFAULT_SUBJECTS;
        try {
            const res = await fetch('data/subjects.json');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.subjects) && data.subjects.length) list = data.subjects;
            }
        } catch (err) { /* file:// 或缺失：用内置默认 */ }
        subjects = list.slice();
        renderSubjects();
    }

    // 科目面板的点击（删除 / 添加 / 表单），用委托避免重渲染后丢失绑定
    subjectPanel.addEventListener('click', (e) => {
        const del = e.target.closest('.sub-del');
        if (del) {
            const item = del.closest('.item.sub');
            const idx = +item.dataset.index;
            if (window.confirm(`删除科目「${subjects[idx].name}」？`)) {
                subjects.splice(idx, 1);
                persistSubjects();
                renderSubjects();
            }
            return;
        }
        if (e.target.closest('.add-subject')) { adding = true; renderSubjects(); return; }
        if (e.target.closest('.add-cancel')) { adding = false; renderSubjects(); return; }
        if (e.target.closest('.add-ok')) {
            const nameEl = subjectPanel.querySelector('.add-name');
            const colorEl = subjectPanel.querySelector('.add-color');
            const val = (nameEl.value || '').trim();
            if (!val) { nameEl.focus(); return; }
            subjects.push({ name: val, color: colorEl.value || '' });
            persistSubjects();
            adding = false;
            renderSubjects();
            return;
        }
    });

    // 双击科目改名
    subjectPanel.addEventListener('dblclick', (e) => {
        const item = e.target.closest('.item.sub');
        if (!item) return;
        const idx = +item.dataset.index;
        const name = window.prompt('修改科目名称', subjects[idx].name);
        if (name && name.trim()) {
            subjects[idx].name = name.trim();
            persistSubjects();
            renderSubjects();
        }
    });

    // ==================== Pointer 拖拽（带移动阈值） ====================
    function createGhost(item, e) {
        const r = item.getBoundingClientRect();
        const g = item.cloneNode(true);
        g.classList.add('drag-ghost');
        const del = g.querySelector('.sub-del');
        if (del) del.remove();
        g.style.position = 'fixed';
        g.style.left = r.left + 'px';
        g.style.top = r.top + 'px';
        g.style.width = r.width + 'px';
        g.style.height = r.height + 'px';
        g.style.margin = '0';
        document.body.appendChild(g);
        return { node: g, offX: e.clientX - r.left, offY: e.clientY - r.top };
    }

    function startDrag(e) {
        source = pending.item;
        if (source.dataset.effect === 'move') source.classList.add('dragging');
        ghost = createGhost(source, e);
    }

    container.addEventListener('pointerdown', (e) => {
        if (!e.isPrimary) return;
        const item = e.target.closest && e.target.closest('.item');
        if (!item || item.classList.contains('drag-ghost')) return;
        if (e.target.closest('.sub-del') || e.target.closest('.add-form')) return; // 交给 click 处理
        pending = { item, x: e.clientX, y: e.clientY };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    });

    function onMove(e) {
        if (!source) {
            if (!pending) return;
            if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < DRAG_THRESHOLD) return;
            startDrag(e);
        }
        ghost.node.style.left = (e.clientX - ghost.offX) + 'px';
        ghost.node.style.top = (e.clientY - ghost.offY) + 'px';
        clearDropTargets();
        const target = findTarget(e.clientX, e.clientY);
        if (canDrop(source, target) && target !== source.parentNode) target.classList.add('drop-over');
    }

    function onUp(e) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (ghost) {
            performDrop(findTarget(e.clientX, e.clientY));
            cleanup();
        }
        pending = null;
    }

    function performDrop(targetNode) {
        if (!canDrop(source, targetNode)) return;
        if (targetNode === source.parentNode) return;                 // 落回原格：无操作
        const s = source.dataset.effect, a = targetNode.dataset.allow;

        if (s === 'copy' && a === 'copy') {
            const existing = targetNode.querySelector('.item');
            if (existing) existing.remove();
            targetNode.appendChild(makeCellItem(source.dataset.name, source.dataset.color));
            saveState();
        } else if (s === 'move' && a === 'copy') {
            const existing = targetNode.querySelector('.item');
            if (existing) source.parentNode.appendChild(existing);    // 交换
            targetNode.appendChild(source);
            saveState();
        } else if (s === 'move' && a === 'move') {
            source.remove();                                          // 拖回科目栏：丢弃
            saveState();
        }
    }

    function cleanup() {
        clearDropTargets();
        if (source) source.classList.remove('dragging');
        if (ghost) ghost.node.remove();
        ghost = null;
        source = null;
    }

    // ==================== 课表本地保存 / 恢复 / 清空 ====================
    function makeCellItem(name, color) {
        const d = document.createElement('div');
        d.className = 'item';
        d.dataset.effect = 'move';
        d.dataset.color = color || '';
        d.dataset.name = name || '';
        if (color) d.style.background = color;
        d.textContent = name;
        return d;
    }

    function saveState() {
        const data = getCells().map(td => {
            const it = td.querySelector('.item');
            if (!it) return null;
            return { t: it.dataset.name || it.textContent, c: it.dataset.color || '' };
        });
        try { localStorage.setItem(TIMETABLE_KEY, JSON.stringify(data)); } catch (err) {}
    }

    function loadState() {
        let data;
        try { data = JSON.parse(localStorage.getItem(TIMETABLE_KEY)); } catch (err) { return; }
        if (!Array.isArray(data)) return;
        const cells = getCells();
        data.forEach((v, i) => {
            if (v && cells[i] && !cells[i].querySelector('.item')) {
                cells[i].appendChild(makeCellItem(v.t, v.c));
            }
        });
    }

    function clearAll() {
        getCells().forEach(td => {
            const it = td.querySelector('.item');
            if (it) it.remove();
        });
        try { localStorage.removeItem(TIMETABLE_KEY); } catch (err) {}
    }

    const btnClear = document.getElementById('btn-clear');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (window.confirm('确定清空当前课表？（不影响顶部科目栏）')) clearAll();
        });
    }

    loadSubjects();
    loadState();
})();
