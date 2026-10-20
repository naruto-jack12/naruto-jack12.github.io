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
        hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17.5 22v-4.086a2 2 0 0 0-.586-1.414L12 12l-4.914 4.5A2 2 0 0 0 6.5 17.914V22"/><path d="M6.5 2v4.086a2 2 0 0 0 .586 1.414L12 12l4.914-4.5A2 2 0 0 0 17.5 6.086V2"/>',
        calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
        check: '<path d="M5 13l4 4 10-11"/>',
        refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><path d="M20 3.5V8h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><path d="M4 20.5V16h4.5"/>',
        alert: '<path d="M12 3.5 21 19.5H3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="16.8" r="0.7" fill="currentColor" stroke="none"/>',
        sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 14.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
        gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M12 8S9.8 3.4 7.6 4 6.4 8 12 8zM12 8s2.2-4.6 4.4-4S17.6 8 12 8z"/>',
        tree: '<path d="M12 3l4 5.2h-2.2l3.2 4.2h-2.6l3.6 4.4H6l3.6-4.4H7l3.2-4.2H8z"/><line x1="12" y1="16.8" x2="12" y2="21"/><line x1="9" y1="21" x2="15" y2="21"/>',
        alarm: '<circle cx="12" cy="13.5" r="8"/><path d="M12 9.5v4l3 2"/><path d="M5 3.5 2.5 6M19 3.5 21.5 6"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
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
