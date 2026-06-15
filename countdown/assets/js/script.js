(function() {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const daysWrapper = document.getElementById('daysWrapper');
    const hoursWrapper = document.getElementById('hoursWrapper');
    const minutesWrapper = document.getElementById('minutesWrapper');
    const secondsWrapper = document.getElementById('secondsWrapper');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressLabel = document.getElementById('progressLabel');
    const progressSection = document.getElementById('progressSection');
    const datetimePicker = document.getElementById('datetimePicker');
    const targetNameInput = document.getElementById('targetNameInput');
    const messageArea = document.getElementById('messageArea');
    const btnSet = document.getElementById('btnSet');
    const btnReset = document.getElementById('btnReset');
    const presetRow = document.getElementById('presetRow');
    const countdownDisplay = document.getElementById('countdownDisplay');

    let targetDate = null;
    let totalSeconds = 0;
    let intervalId = null;
    let prevSecondsValue = null;
    let isExpired = false;
    let presetData = {};

    const STORAGE_VER = 'countdown_ver';
    const STORAGE_KEY_TARGET = 'countdown_target_iso';
    const STORAGE_KEY_NAME = 'countdown_target_name';
    const STORAGE_KEY_TOTAL = 'countdown_total_seconds';

    function createStars() {
        const container = document.getElementById('starsContainer');
        const count = 120;
        let html = '';
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 2.2 + 0.8;
            const dur = Math.random() * 4 + 2.5;
            const delay = Math.random() * 5;
            html +=
                `<div class="star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;--dur:${dur}s;--delay:${delay}s;"></div>`;
        }
        container.innerHTML = html;
    }
    createStars();

    function padZero(num) {
        return String(num).padStart(2, '0');
    }

    function getNow() {
        return new Date();
    }

    function toDatetimeLocalString(date) {
        const y = date.getFullYear();
        const m = padZero(date.getMonth() + 1);
        const d = padZero(date.getDate());
        const h = padZero(date.getHours());
        const min = padZero(date.getMinutes());
        return `${y}-${m}-${d}T${h}:${min}`;
    }

    function triggerPulse(wrapper) {
        if (!wrapper) return;
        wrapper.classList.remove('pulse');
        void wrapper.offsetWidth;
        wrapper.classList.add('pulse');
    }

    function updateDisplay(diffSeconds, targetTotal) {
        if (diffSeconds <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';
            progressLabel.textContent = '已完成';
            if (!isExpired) {
                isExpired = true;
                messageArea.innerHTML = '<span class="expired-badge">🎉 时间到！</span>';
                flashAllWrappers();
            }
            return;
        }

        isExpired = false;
        const days = Math.floor(diffSeconds / 86400);
        const hours = Math.floor((diffSeconds % 86400) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const secs = diffSeconds % 60;

        if (prevSecondsValue !== null && prevSecondsValue !== secs) {
            triggerPulse(secondsWrapper);
            if (secs === 59) triggerPulse(minutesWrapper);
            if (secs === 59 && minutes === 59) triggerPulse(hoursWrapper);
            if (secs === 59 && minutes === 59 && hours === 23) triggerPulse(daysWrapper);
        }
        prevSecondsValue = secs;

        daysEl.textContent = padZero(days);
        hoursEl.textContent = padZero(hours);
        minutesEl.textContent = padZero(minutes);
        secondsEl.textContent = padZero(secs);

        if (targetTotal > 0) {
            const elapsed = targetTotal - diffSeconds;
            const percent = Math.min(100, Math.max(0, Math.round((elapsed / targetTotal) * 100)));
            progressBar.style.width = percent + '%';
            progressPercent.textContent = percent + '%';
            progressLabel.textContent = '已过时间';
        } else {
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            progressLabel.textContent = '已过时间';
        }
    }

    function flashAllWrappers() {
        [daysWrapper, hoursWrapper, minutesWrapper, secondsWrapper].forEach(w => triggerPulse(w));
    }

    function tick() {
        if (!targetDate) {
            daysEl.textContent = '--';
            hoursEl.textContent = '--';
            minutesEl.textContent = '--';
            secondsEl.textContent = '--';
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            messageArea.innerHTML = '<span style="color:#8888aa;">请设定目标时间</span>';
            isExpired = false;
            prevSecondsValue = null;
            return;
        }

        const now = getNow();
        const diffMs = targetDate.getTime() - now.getTime();
        const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

        updateDisplay(diffSeconds, totalSeconds);

        if (diffSeconds <= 0) {
            const name = targetNameInput.value.trim() || '目标时间';
            messageArea.innerHTML = `<span class="expired-badge">🎉 ${escapeHtml(name)} 已到达！</span>`;
        } else {
            messageArea.innerHTML = '';
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function startTicking() {
        stopTicking();
        tick();
        intervalId = setInterval(tick, 1000);
    }

    function stopTicking() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function setTarget(date, totalSecOverride) {
        targetDate = date;
        if (totalSecOverride !== undefined && totalSecOverride > 0) {
            totalSeconds = totalSecOverride;
        } else if (date) {
            const now = getNow();
            const diffMs = date.getTime() - now.getTime();
            totalSeconds = diffMs > 0 ? Math.floor(diffMs / 1000) : 0;
        } else {
            totalSeconds = 0;
        }
        prevSecondsValue = null;
        isExpired = false;
        if (date) {
            datetimePicker.value = toDatetimeLocalString(date);
        } else {
            datetimePicker.value = toDatetimeLocalString(getNow());
        }
        if (date) {
            localStorage.setItem(STORAGE_KEY_TARGET, date.toISOString());
            localStorage.setItem(STORAGE_KEY_TOTAL, String(totalSeconds));
        } else {
            localStorage.removeItem(STORAGE_KEY_TARGET);
            localStorage.removeItem(STORAGE_KEY_TOTAL);
        }
        if (date) {
            startTicking();
        } else {
            stopTicking();
        }
    }

    function getPresetConfig(presetKey) {
        return presetData[presetKey] || null;
    }

    function loadPresets() {
        fetch('data/presets.json')
            .then(res => res.json())
            .then(data => {
                presetData = data;
                renderPresetButtons();
                checkPresetMatch(targetDate);
            })
            .catch(err => console.warn('预设数据加载失败:', err));
    }

    function renderPresetButtons() {
        const now = getNow();
        let html = '';
        for (const [key, cfg] of Object.entries(presetData)) {
            const date = getPresetDate(cfg);
            if (!date || date <= now) {
                const isSpring = cfg.type === 'spring';
                if (isSpring && (!cfg.offsets || !cfg.baseYear ||
                    now.getFullYear() < cfg.baseYear ||
                    now.getFullYear() >= cfg.baseYear + cfg.offsets.length)) continue;
                if (!isSpring) continue;
            }
            html += `<button class="btn-preset" data-preset="${key}">${cfg.icon || ''} ${cfg.name || key}</button>`;
        }
        presetRow.innerHTML = html;
    }

    function getPresetDate(cfg) {
        if (!cfg) return null;
        const now = getNow();
        const y = now.getFullYear();
        switch (cfg.type) {
            case 'annual':
                let d = new Date(y, cfg.month, cfg.day, cfg.hour || 0, cfg.min || 0, 0);
                if (d <= now) d = new Date(y + 1, cfg.month, cfg.day, cfg.hour || 0, cfg.min || 0, 0);
                return d;
            case 'spring': {
                const base = cfg.baseYear || 2000;
                const offsets = cfg.offsets || [];
                const idx = y - base;
                const idxNext = y + 1 - base;
                if (idx < 0 || idx >= offsets.length) return null;
                let val = offsets[idx];
                let mv = Math.floor(val / 100), dv = val % 100;
                let sd = new Date(y, mv - 1, dv, 0, 0, 0);
                if (sd <= now) {
                    if (idxNext < 0 || idxNext >= offsets.length) return null;
                    val = offsets[idxNext];
                    mv = Math.floor(val / 100); dv = val % 100;
                    sd = new Date(y + 1, mv - 1, dv, 0, 0, 0);
                }
                return sd;
            }
            case 'birthday':
                let bd = new Date(y, now.getMonth(), now.getDate(), cfg.hour || 9, cfg.min || 0, 0);
                if (bd <= now) bd = new Date(y + 1, now.getMonth(), now.getDate(), cfg.hour || 9, cfg.min || 0, 0);
                return bd;
            case 'offset':
                return new Date(now.getTime() + (cfg.seconds || 3600) * 1000);
            default:
                return null;
        }
    }

    function applyPreset(presetKey) {
        const cfg = getPresetConfig(presetKey);
        if (!cfg) return;
        const date = getPresetDate(cfg);
        if (!date) return;
        const totalSec = Math.floor((date.getTime() - getNow().getTime()) / 1000);
        setTarget(date, totalSec > 0 ? totalSec : 0);
        targetNameInput.value = cfg.name || '倒计时';
        localStorage.setItem(STORAGE_KEY_NAME, targetNameInput.value);
        messageArea.innerHTML =
            '<span style="color:#a29bfe;">✅ 已设定：' + escapeHtml(cfg.name || '倒计时') + '</span>';
        highlightPreset(presetKey);
    }

    function highlightPreset(presetKey) {
        const buttons = presetRow.querySelectorAll('.btn-preset');
        buttons.forEach(b => {
            if (b.dataset.preset === presetKey) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    btnSet.addEventListener('click', () => {
        const val = datetimePicker.value;
        if (!val) {
            messageArea.innerHTML = '<span style="color:#ff7675;">⚠️ 请选择一个日期时间</span>';
            return;
        }
        const date = new Date(val);
        if (isNaN(date.getTime())) {
            messageArea.innerHTML = '<span style="color:#ff7675;">⚠️ 无效的日期时间</span>';
            return;
        }
        if (date <= getNow()) {
            messageArea.innerHTML = '<span style="color:#ff7675;">⚠️ 目标时间已过，请选择未来时间</span>';
            return;
        }
        const totalSec = Math.floor((date.getTime() - getNow().getTime()) / 1000);
        setTarget(date, totalSec > 0 ? totalSec : 0);
        targetNameInput.value = val.replace('T', ' ');
        localStorage.setItem(STORAGE_KEY_NAME, targetNameInput.value);
        messageArea.innerHTML = '<span style="color:#a29bfe;">✅ 倒计时已设定！</span>';
        highlightPreset(null);
    });

    btnReset.addEventListener('click', () => {
        setTarget(null);
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        targetNameInput.value = '';
        datetimePicker.value = toDatetimeLocalString(getNow());
        messageArea.innerHTML = '';
        highlightPreset(null);
    });

    presetRow.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-preset');
        if (!btn) return;
        const presetKey = btn.dataset.preset;
        if (presetKey) {
            applyPreset(presetKey);
        }
    });

    targetNameInput.addEventListener('input', () => {
        localStorage.setItem(STORAGE_KEY_NAME, targetNameInput.value);
    });

    function loadFromStorage() {
        if (localStorage.getItem(STORAGE_VER) !== '2') {
            localStorage.removeItem(STORAGE_KEY_TARGET);
            localStorage.removeItem(STORAGE_KEY_NAME);
            localStorage.removeItem(STORAGE_KEY_TOTAL);
            localStorage.setItem(STORAGE_VER, '2');
        }
        const savedIso = localStorage.getItem(STORAGE_KEY_TARGET);
        const savedName = localStorage.getItem(STORAGE_KEY_NAME);
        const savedTotal = localStorage.getItem(STORAGE_KEY_TOTAL);

        if (savedName) {
            targetNameInput.value = savedName;
        }

        if (savedIso) {
            const date = new Date(savedIso);
            if (!isNaN(date.getTime())) {
                const totalSec = savedTotal ? parseInt(savedTotal, 10) : undefined;
                setTarget(date, totalSec);
                datetimePicker.value = toDatetimeLocalString(date);
                checkPresetMatch(date);
                return;
            }
        }

        setTarget(null);
    }

    function checkPresetMatch(date) {
        if (!date || Object.keys(presetData).length === 0) return;
        let matched = null;
        for (const [key, cfg] of Object.entries(presetData)) {
            const presetDate = getPresetDate(cfg);
            if (presetDate && Math.abs(presetDate.getTime() - date.getTime()) < 60000) {
                matched = key;
                break;
            }
        }
        highlightPreset(matched);
    }

    loadFromStorage();
    loadPresets();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            tick();
        }
    });

    console.log('⏳ 精确倒计时已就绪！');
    console.log('   - 精确到秒，实时更新');
    console.log('   - 支持自定义目标时间');
    console.log('   - 支持多个快捷预设');
    console.log('   - 数据自动保存到本地存储');
    console.log('   - 秒数变化带脉冲动画');
})();
