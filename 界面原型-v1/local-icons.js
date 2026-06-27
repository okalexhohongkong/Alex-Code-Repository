(() => {
  const iconPaths = {
    "layout-dashboard": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>',
    "list-filter": '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>',
    blocks: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h7"/><path d="M17.5 14v7"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
    "git-branch": '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 15c0-5 12-4 12-9"/>',
    "building-2": '<path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M9 21v-5h3v5"/><path d="M8 7h1"/><path d="M12 7h1"/><path d="M8 11h1"/><path d="M12 11h1"/><path d="M17 9h2a1 1 0 0 1 1 1v11"/>',
    files: '<path d="M15 2H6a2 2 0 0 0-2 2v12"/><path d="M8 6h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>',
    "hard-drive": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 14h18"/><circle cx="8" cy="17" r="1"/>',
    "play-square": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10 8 6 4-6 4z"/>',
    sparkles: '<path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/><path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z"/>',
    "pen-tool": '<path d="m12 19 7-7 3 3-7 7z"/><path d="m18 13-7.5-7.5L2 14l7.5 7.5"/><circle cx="12" cy="12" r="2"/>',
    "brain-circuit": '<path d="M8 6a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4"/><path d="M16 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4"/><path d="M8 6a4 4 0 0 1 8 0"/><path d="M8 18a4 4 0 0 0 8 0"/><path d="M12 8v8"/><path d="M9 12h6"/>',
    "shield-check": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    "database-backup": '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3h1"/><path d="M19 16v5"/><path d="m16 18 3-3 3 3"/>',
    "grip-vertical": '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 15v2"/>',
    unlock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/><path d="M12 15v2"/>',
    "maximize-2": '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="M9 21H3v-6"/><path d="m3 21 7-7"/>',
    "minimize-2": '<path d="M4 14h6v6"/><path d="m10 14-7 7"/><path d="M20 10h-6V4"/><path d="m14 10 7-7"/>',
    "stretch-horizontal": '<path d="M4 12h16"/><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><rect x="9" y="5" width="6" height="14" rx="1"/>',
    "stretch-vertical": '<path d="M12 4v16"/><path d="m8 8 4-4 4 4"/><path d="m8 16 4 4 4-4"/><rect x="5" y="9" width="14" height="6" rx="1"/>',
    "rows-3": '<rect x="4" y="5" width="16" height="3" rx="1"/><rect x="4" y="11" width="16" height="3" rx="1"/><rect x="4" y="17" width="16" height="3" rx="1"/>',
    "panel-left-close": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="m16 10-3 2 3 2"/>',
    "panel-left-open": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="m13 10 3 2-3 2"/>',
    "panel-right-close": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/><path d="m8 10 3 2-3 2"/>',
    "panel-right-open": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/><path d="m11 10-3 2 3 2"/>',
    "panel-top-close": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="m10 16 2-3 2 3"/>',
    "panel-bottom-close": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 14h18"/><path d="m10 8 2 3 2-3"/>',
    "panel-top-open": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="m10 14 2 3 2-3"/>',
    "panel-bottom-open": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 14h18"/><path d="m10 10 2-3 2 3"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3.5 3H16a2 2 0 0 0-2 2v1.5c0 2-1 3.5-2 3.5z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    mic: '<path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v4"/>',
    smartphone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    tablet: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21h8"/><path d="M12 16v5"/>',
    cloud: '<path d="M17.5 19H8a5 5 0 1 1 1.4-9.8A6 6 0 0 1 21 12.5 3.5 3.5 0 0 1 17.5 19z"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h0"/><path d="M7 17h0"/>',
    usb: '<path d="M12 2v12"/><path d="M8 6l4-4 4 4"/><path d="M6 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2"/><path d="M12 16v6"/><circle cx="12" cy="22" r="1"/>',
    "sd-card": '<path d="M6 2h9l3 3v17H6z"/><path d="M9 2v5"/><path d="M12 2v5"/><path d="M15 2v5"/><path d="M9 17h6"/>',
    camera: '<path d="M14 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3z"/><circle cx="12" cy="13" r="4"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    pause: '<path d="M8 5h3v14H8z"/><path d="M13 5h3v14h-3z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    video: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 9 4-2v10l-4-2z"/>',
    "audio-lines": '<path d="M4 12h2"/><path d="M8 8v8"/><path d="M12 5v14"/><path d="M16 8v8"/><path d="M20 12h0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "file-signature": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 17c2-3 4 3 6 0 1-2 2-2 3-1"/>',
    "clipboard-list": '<path d="M9 3h6l1 2h3v16H5V5h3z"/><path d="M9 10h6"/><path d="M9 14h6"/><path d="M9 18h4"/>',
    "briefcase-business": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
    presentation: '<path d="M3 4h18"/><path d="M5 4v11h14V4"/><path d="m12 15-4 5"/><path d="m12 15 4 5"/>',
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    "file-type": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M9 17h6"/>',
    "file-search": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="11" cy="15" r="2.5"/><path d="m13 17 2 2"/>',
    "folder-search": '<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v4"/><path d="M3 8v10a2 2 0 0 0 2 2h7"/><circle cx="17" cy="17" r="3"/><path d="m20 20-1.5-1.5"/>',
    "table-2": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M8 5v14"/><path d="M15 5v14"/>',
    "scan-text": '<path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 10h10"/><path d="M7 14h7"/>',
    "drafting-compass": '<path d="m12 2 2 7"/><path d="m12 2-2 7"/><path d="M10 9h4"/><path d="m14 9 5 12"/><path d="m10 9-5 12"/><path d="M7 17h10"/>',
    "messages-square": '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 8h8"/><path d="M8 12h6"/>',
    "badge-check": '<path d="M12 2 9 5 5 5l-.5 4L2 12l2.5 3 .5 4h4l3 3 3-3h4l.5-4L22 12l-2.5-3-.5-4h-4z"/><path d="m9 12 2 2 4-4"/>',
    "code-2": '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    package: '<path d="m21 8-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  };

  function createIcon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = iconPaths[name] || iconPaths.layers;
    return svg;
  }

  window.lucide = {
    createIcons() {
      document.querySelectorAll("[data-lucide]").forEach((node) => {
        const name = node.getAttribute("data-lucide");
        const icon = createIcon(name);
        node.replaceWith(icon);
      });
    },
  };
})();
