/**
 * 图标注册表 —— 统一风格 SVG 图标数据（仅存放动态渲染用到的图标）
 *
 * 绘制规范（所有图标共享，保证风格统一）：
 *   24×24 viewBox、fill="none"、stroke="currentColor"、
 *   stroke-width 1.7、stroke-linecap/linejoin = round
 * 上述属性由 script.js 的 makeIcon() 统一注入，这里每个条目只写内部路径。
 *
 * 扩展方式：新增一个分类图标 = 在此追加一条 "名字": '<path .../>'，
 * 然后在 data/resources.json 的分类里用同名 icon 字段引用即可，无需改动其它文件。
 */
window.ICONS = {
    film: '<rect x="2" y="3" width="20" height="18" rx="2.5"/><line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7.5" x2="7" y2="7.5"/><line x1="2" y1="16.5" x2="7" y2="16.5"/><line x1="17" y1="16.5" x2="22" y2="16.5"/><line x1="17" y1="7.5" x2="22" y2="7.5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    arrow: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
};
