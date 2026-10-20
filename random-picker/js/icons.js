/**
 * 统一风格的线性 SVG 图标注册表（替代界面里的 emoji）。
 * 约定：viewBox 0 0 24 24、fill=none、stroke=currentColor、stroke-width 1.7、圆角端点。
 * 静态图标在 HTML 用 <span class="ic" data-icon="名称"></span> 占位，加载后由 hydrateIcons 注入；
 * 动态图标在 JS 模板里用 iconHTML('名称') 生成字符串。新增图标只需往 ICONS 追加一条。
 */
(function () {
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var SVG_ATTRS = {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.7',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    };

    var ICONS = {
        target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
        moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-1 .8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-3.9-4-6.6-9-6.6z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>',
        food: '<path d="M3 2v6a2 2 0 0 0 4 0V2"/><path d="M5 8v14"/><path d="M17 2c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v11"/>',
        dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.1" fill="currentColor" stroke="none"/>',
        checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
        cup: '<path d="M6 9h12l-1 11a1.5 1.5 0 0 1-1.5 1.4H8.5A1.5 1.5 0 0 1 7 20L6 9z"/><line x1="4" y1="9" x2="20" y2="9"/><path d="M10 9V5h4v4"/><path d="M14 5l2-2"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        shuffle: '<path d="M16 3h5v5"/><path d="M4 20 20 4"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
        trash: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/><path d="M10 11v6M14 11v6"/>',
        list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none"/>',
        save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
        history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>',
        copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        check: '<path d="M5 13l4 4 10-11"/>',
        close: '<path d="M6 6l12 12M18 6L6 18"/>',
        pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'
    };

    window.ICONS = ICONS;

    function makeIcon(name, cls) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', cls ? ('icon-svg ' + cls) : 'icon-svg');
        Object.keys(SVG_ATTRS).forEach(function (k) { svg.setAttribute(k, SVG_ATTRS[k]); });
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = ICONS[name] || '';
        return svg;
    }

    function iconHTML(name, cls) {
        var attrs = Object.keys(SVG_ATTRS).map(function (k) { return k + '="' + SVG_ATTRS[k] + '"'; }).join(' ');
        var clsStr = cls ? ('icon-svg ' + cls) : 'icon-svg';
        return '<svg class="' + clsStr + '" ' + attrs + ' aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    }

    function hydrateIcons(root) {
        (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
            if (el.getAttribute('data-hydrated')) return;
            el.appendChild(makeIcon(el.getAttribute('data-icon'), el.getAttribute('data-icon-cls')));
            el.setAttribute('data-hydrated', '1');
        });
    }

    window.makeIcon = makeIcon;
    window.iconHTML = iconHTML;
    window.hydrateIcons = hydrateIcons;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { hydrateIcons(document); });
    } else {
        hydrateIcons(document);
    }
})();
