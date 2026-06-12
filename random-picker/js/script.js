(function() {
    const inputField = document.getElementById('inputField');
    const btnAdd = document.getElementById('btnAdd');
    const btnSelect = document.getElementById('btnSelect');
    const btnClear = document.getElementById('btnClear');
    const resultArea = document.getElementById('resultArea');
    const resultDisplay = document.getElementById('resultDisplay');
    const particlesContainer = document.getElementById('particlesContainer');
    const optionsList = document.getElementById('optionsList');
    const countBadge = document.getElementById('countBadge');
    const presetButtons = document.querySelectorAll('.btn-preset[data-preset]');
    const countInput = document.getElementById('count');
    const countDown = document.getElementById('countDown');
    const countUp = document.getElementById('countUp');
    const allowDuplicates = document.getElementById('allowDuplicates');
    const copyBtn = document.getElementById('copyBtn');
    const extraBar = document.getElementById('extraBar');
    const historyArea = document.getElementById('historyArea');
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const historyCount = document.getElementById('historyCount');

    let options = [];
    let isRolling = false;
    let rollTimeout = null;
    let pickHistory = [];
    let BUILTIN_PRESETS = {};

    const STORAGE_KEY = 'randomPickerCustomPresets';

    function getCustomPresets() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
    }

    function saveCustomPresets(presets) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    }

    // ==================== 渲染选项 ====================
    function renderOptions() {
        optionsList.innerHTML = '';
        options.forEach((opt, index) => {
            const tag = document.createElement('li');
            tag.className = 'option-tag';
            tag.style.animationDelay = `${index * 0.03}s`;
            tag.innerHTML = `
                <span>${escapeHtml(opt)}</span>
                <button class="delete-tag" data-index="${index}" title="删除">×</button>
            `;
            optionsList.appendChild(tag);
        });
        updateUIState();
    }

    function updateUIState() {
        countBadge.textContent = options.length;
        btnSelect.disabled = options.length < 2 || isRolling;
        btnClear.disabled = options.length === 0 || isRolling;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== 添加 / 删除选项 ====================
    function addOption(text) {
        const trimmed = text.trim();
        if (!trimmed) return;

        // 支持逗号分隔多项添加
        const parts = trimmed.split(/[,，、;；]+/).map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) {
            let added = 0;
            parts.forEach(part => {
                if (part.length > 60) return;
                options.push(part);
                added++;
            });
            if (added > 0) {
                renderOptions();
                inputField.value = '';
                inputField.focus();
                optionsList.scrollTop = optionsList.scrollHeight;
                showToast(`已添加 ${added} 个选项`);
            }
            return;
        }

        if (trimmed.length > 60) { shakeElement(inputField); return; }
        if (options.includes(trimmed)) {
            const existingTags = optionsList.querySelectorAll('.option-tag');
            options.forEach((opt, i) => {
                if (opt === trimmed && existingTags[i]) {
                    existingTags[i].style.borderColor = 'var(--gold)';
                    setTimeout(() => { if (existingTags[i]) existingTags[i].style.borderColor = 'transparent'; }, 800);
                }
            });
        }
        options.push(trimmed);
        renderOptions();
        inputField.value = '';
        inputField.focus();
        optionsList.scrollTop = optionsList.scrollHeight;
    }

    function removeOption(index) {
        if (isRolling || index < 0 || index >= options.length) return;
        const tags = optionsList.querySelectorAll('.option-tag');
        if (tags[index]) {
            tags[index].style.transform = 'scale(0.5)';
            tags[index].style.opacity = '0';
            tags[index].style.transition = '0.25s ease';
        }
        setTimeout(() => {
            options.splice(index, 1);
            renderOptions();
            if (options.length < 2) resetResultDisplay();
        }, 200);
    }

    function setOptions(newOptions) {
        options = [...newOptions];
        renderOptions();
        resetResultDisplay();
        resultArea.classList.remove('highlight');
        optionsList.scrollTop = 0;
    }

    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.5s ease';
        setTimeout(() => { el.style.animation = ''; }, 500);
    }

    function resetResultDisplay() {
        resultDisplay.textContent = '等待选择...';
        resultDisplay.className = 'result-placeholder';
        resultArea.classList.remove('highlight');
        particlesContainer.innerHTML = '';
    }

    // ==================== 核心选择 ====================
    function startSelection() {
        if (isRolling) return;
        if (options.length < 2) { shakeElement(btnSelect); return; }

        const count = parseInt(countInput.value);
        if (isNaN(count) || count < 1) { countInput.value = 1; }
        const finalCount = parseInt(countInput.value);

        if (!allowDuplicates.checked && finalCount > options.length) {
            showToast(`候选项不足（需要 ${finalCount} 个，现有 ${options.length} 个）`);
            return;
        }

        isRolling = true;
        updateUIState();
        resetResultDisplay();
        resultArea.classList.add('highlight');
        resultDisplay.className = 'result-text rolling';

        const totalDuration = 1800 + Math.random() * 600;
        const startSpeed = 50;
        const endSpeed = 280;
        const startTime = Date.now();
        let lastIndex = -1;

        function roll() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentInterval = startSpeed + (endSpeed - startSpeed) * easedProgress;

            let randomIndex;
            do { randomIndex = Math.floor(Math.random() * options.length); }
            while (randomIndex === lastIndex && options.length > 1);
            lastIndex = randomIndex;

            resultDisplay.textContent = options[randomIndex];

            if (progress >= 1) {
                finishSelection(finalCount);
            } else {
                rollTimeout = setTimeout(roll, currentInterval);
            }
        }

        roll();
    }

    function finishSelection(count) {
        if (rollTimeout) clearTimeout(rollTimeout);
        rollTimeout = null;

        let selected;
        if (count === 1) {
            // 直接用滚动的最终项
            selected = [resultDisplay.textContent];
        } else {
            selected = pickRandom(options, count, allowDuplicates.checked);
        }

        showFinalResult(selected);
        addHistory(selected);

        setTimeout(() => {
            isRolling = false;
            updateUIState();
            resultArea.classList.remove('highlight');
        }, 700);
    }

    function pickRandom(arr, count, allowDup) {
        if (allowDup) {
            const result = [];
            for (let i = 0; i < count; i++) result.push(arr[Math.floor(Math.random() * arr.length)]);
            return result;
        }
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    function showFinalResult(items) {
        if (items.length === 1) {
            resultDisplay.textContent = items[0];
            resultDisplay.className = 'result-text final';
            spawnParticles();
        } else {
            resultDisplay.className = 'result-multi';
            resultDisplay.innerHTML = items.map((item, i) => `
                <span class="result-tag" style="animation-delay:${i * 60}ms">
                    <span class="result-tag-index">${i + 1}</span>
                    ${escapeHtml(item)}
                </span>
            `).join('');
            spawnParticles();
        }
    }

    function stopRolling() {
        if (rollTimeout) clearTimeout(rollTimeout);
        rollTimeout = null;
        if (isRolling) {
            const finalIndex = Math.floor(Math.random() * options.length);
            finishSelection();
        }
    }

    // ==================== 粒子特效 ====================
    function spawnParticles() {
        particlesContainer.innerHTML = '';
        const colors = ['#f0c040', '#e94560', '#ff6b81', '#fff', '#ffa502', '#ff6348', '#7bed9f', '#70a1ff'];
        const rect = resultArea.getBoundingClientRect();
        const cx = resultArea.clientWidth / 2;
        const cy = resultArea.clientHeight / 2;

        for (let i = 0; i < 28; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.5;
            const distance = 40 + Math.random() * 80;
            const size = 4 + Math.random() * 8;
            particle.style.cssText = `
                left: ${cx}px; top: ${cy}px;
                width: ${size}px; height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                --dx: ${Math.cos(angle) * distance}px;
                --dy: ${Math.sin(angle) * distance}px;
                animation-duration: ${0.5 + Math.random() * 0.5}s;
                animation-delay: ${Math.random() * 0.08}s;
            `;
            particlesContainer.appendChild(particle);
        }
        setTimeout(() => { particlesContainer.innerHTML = ''; }, 900);
    }

    // ==================== 历史记录 ====================
    function addHistory(items) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        pickHistory.unshift({ items: [...items], time: timeStr });
        if (pickHistory.length > 20) pickHistory.pop();
        renderHistory();
    }

    function renderHistory() {
        const show = pickHistory.length > 0;
        historyArea.style.display = show ? 'block' : 'none';
        historyCount.textContent = pickHistory.length;
        historyEmpty.style.display = pickHistory.length === 0 ? 'block' : 'none';
        historyList.innerHTML = '';
        pickHistory.forEach(entry => {
            const el = document.createElement('div');
            el.className = 'history-item';
            const values = document.createElement('div');
            values.className = 'values';
            entry.items.forEach(item => {
                const tag = document.createElement('span');
                tag.className = 'value-tag';
                tag.textContent = item;
                values.appendChild(tag);
            });
            const time = document.createElement('span');
            time.className = 'time';
            time.textContent = entry.time;
            el.appendChild(values);
            el.appendChild(time);
            historyList.appendChild(el);
        });
    }

    // ==================== 预设 ====================
    function applyPreset(optionsArray) {
        setOptions(optionsArray);
        showToast(`已加载预设（${optionsArray.length} 项）`);
    }

    function renderCustomPresets() {
        const container = document.getElementById('customPresets');
        const presets = getCustomPresets();
        container.innerHTML = '';
        if (presets.length === 0) return;
        presets.forEach((preset, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn-preset';
            btn.innerHTML = `${preset.icon || '📌'} ${escapeHtml(preset.name)} <span class="preset-delete" data-index="${index}">✕</span>`;
            btn.addEventListener('click', e => {
                if (e.target.classList.contains('preset-delete')) return;
                applyPreset(preset.options);
            });
            container.appendChild(btn);
        });
        container.querySelectorAll('.preset-delete').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const presets = getCustomPresets();
                presets.splice(idx, 1);
                saveCustomPresets(presets);
                renderCustomPresets();
                renderCustomPresetList();
            });
        });
    }

    function renderCustomPresetList() {
        const list = document.getElementById('customPresetList');
        const presets = getCustomPresets();
        if (presets.length === 0) {
            list.innerHTML = '<div class="preset-empty">还没有自定义预设，保存一个吧 ✨</div>';
            return;
        }
        list.innerHTML = '';
        presets.forEach((preset, index) => {
            const item = document.createElement('div');
            item.className = 'custom-preset-item';
            item.innerHTML = `
                <div>
                    <span class="name">${escapeHtml(preset.name)}</span>
                    <span class="count-info">${preset.options.length} 项</span>
                </div>
                <div class="item-actions">
                    <button class="apply-btn" data-index="${index}">应用</button>
                    <button class="delete-preset-btn" data-index="${index}">删除</button>
                </div>
            `;
            list.appendChild(item);
        });
        list.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const presets = getCustomPresets();
                if (presets[idx]) { applyPreset(presets[idx].options); closeModal(); }
            });
        });
        list.querySelectorAll('.delete-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const presets = getCustomPresets();
                presets.splice(idx, 1);
                saveCustomPresets(presets);
                renderCustomPresets();
                renderCustomPresetList();
            });
        });
    }

    function openModal() {
        document.getElementById('presetModal').classList.add('active');
        document.getElementById('presetNameInput').value = '';
        document.getElementById('presetNameInput').focus();
        renderCustomPresetList();
    }

    function closeModal() {
        document.getElementById('presetModal').classList.remove('active');
    }

    // ==================== Toast ====================
    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // ==================== 事件绑定 ====================
    btnAdd.addEventListener('click', () => addOption(inputField.value));

    inputField.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addOption(inputField.value); }
    });

    inputField.addEventListener('paste', e => {
        setTimeout(() => addOption(inputField.value), 10);
    });

    // 删除标签（事件委托）
    optionsList.addEventListener('click', e => {
        const del = e.target.closest('.delete-tag');
        if (del) removeOption(parseInt(del.dataset.index));
    });

    // 预设按钮
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.preset;
            if (key && BUILTIN_PRESETS[key]) applyPreset(BUILTIN_PRESETS[key]);
        });
    });

    // 选择 / 停止
    btnSelect.addEventListener('click', () => {
        if (isRolling) stopRolling();
        else startSelection();
    });

    // 清空
    btnClear.addEventListener('click', () => {
        if (isRolling) return;
        if (options.length === 0) return;
        if (options.length >= 6 && !confirm(`确定清空全部 ${options.length} 个选项吗？`)) return;
        options = [];
        renderOptions();
        resetResultDisplay();
        resultArea.classList.remove('highlight');
        inputField.focus();
    });

    // 数量控制
    countDown.addEventListener('click', () => {
        const val = parseInt(countInput.value);
        if (val > 1) countInput.value = val - 1;
    });
    countUp.addEventListener('click', () => {
        const val = parseInt(countInput.value);
        if (val < 99) countInput.value = val + 1;
    });
    countInput.addEventListener('change', () => {
        let val = parseInt(countInput.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 99) val = 99;
        countInput.value = val;
    });

    // 复制结果
    copyBtn.addEventListener('click', () => {
        const text = resultDisplay.textContent;
        if (!text || text === '等待选择...' || resultDisplay.classList.contains('result-placeholder')) return;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = '✅ 已复制';
            setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 1500);
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    });

    // 保存预设
    document.getElementById('savePresetBtn').addEventListener('click', () => {
        if (options.length === 0) { showToast('请先添加候选项'); return; }
        openModal();
    });

    document.getElementById('managePresetBtn').addEventListener('click', openModal);

    document.getElementById('confirmSavePreset').addEventListener('click', () => {
        const name = document.getElementById('presetNameInput').value.trim();
        if (!name) { showToast('请输入预设名称'); return; }
        if (options.length === 0) { showToast('请先添加候选项'); return; }
        const presets = getCustomPresets();
        if (presets.some(p => p.name === name)) { showToast('该名称已存在'); return; }
        presets.push({ name, options: [...options], icon: '📌' });
        saveCustomPresets(presets);
        renderCustomPresets();
        renderCustomPresetList();
        document.getElementById('presetNameInput').value = '';
        showToast(`已保存预设「${name}」`);
    });

    document.getElementById('presetNameInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('confirmSavePreset').click(); }
    });

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('presetModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.getElementById('presetModal').classList.contains('active')) closeModal();
    });

    // 键盘快捷键
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey && e.key === 'Enter') || (e.key === ' ' && document.activeElement !== inputField)) {
            e.preventDefault();
            if (isRolling) stopRolling();
            else if (options.length >= 2) startSelection();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'X') { e.preventDefault(); btnClear.click(); }
    });

    // ==================== 注入 shake 动画 ====================
    if (!document.getElementById('shakeStyle')) {
        const s = document.createElement('style');
        s.id = 'shakeStyle';
        s.textContent = `
            @keyframes shake {
                0%,100% { transform: translateX(0); }
                20% { transform: translateX(-6px); }
                40% { transform: translateX(6px); }
                60% { transform: translateX(-4px); }
                80% { transform: translateX(4px); }
            }
        `;
        document.head.appendChild(s);
    }

    // ==================== 加载预设数据并初始化 ====================
    fetch('data/presets.json')
        .then(r => r.json())
        .then(data => {
            BUILTIN_PRESETS = data;
            setOptions(BUILTIN_PRESETS.lunch || []);
            renderCustomPresets();
            inputField.focus();
        })
        .catch(() => {
            showToast('预设数据加载失败');
        });
})();
