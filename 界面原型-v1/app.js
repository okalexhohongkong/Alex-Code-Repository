(() => {
  const config = window.HWS_ARCHIVE_CONFIG;
  const data = window.HWS_ARCHIVE_DATA;
  const localIndex = window.HWS_LOCAL_ARCHIVE_INDEX;
  const latestBatch = window.HWS_LATEST_SCAN_BATCH;
  const batchHistory = Array.isArray(window.HWS_SCAN_BATCH_HISTORY) ? window.HWS_SCAN_BATCH_HISTORY : [];
  const mergedIndex = window.HWS_MERGED_ARCHIVE_INDEX;

  if (!config || !data) {
    throw new Error("Archive prototype config or data is missing.");
  }

  const localArchives = Array.isArray(localIndex?.archives) ? localIndex.archives : [];
  const sourceArchives = localArchives.length ? localArchives : data.archives;
  const archives = sourceArchives.map(enrichArchive);
  const { finishItems } = data;
  const usingLocalIndex = localArchives.length > 0;
  const layoutStorageKeys = {
    menuOrder: "hws-archive-menu-order-v1",
    secondaryMenus: "hws-archive-secondary-menus-v1",
    menuModuleMap: "hws-archive-menu-module-map-v1",
    moduleLayouts: "hws-archive-module-layouts-v1",
    menuLayout: "hws-archive-menu-layout-v1",
  };
  const menuPositionOptions = ["left", "top", "right", "bottom"];
  const moduleSizeOptions = [
    { key: "compact", label: "等比-", icon: "minimize-2" },
    { key: "normal", label: "默认", icon: "rows-3" },
    { key: "wide", label: "变宽", icon: "stretch-horizontal" },
    { key: "long", label: "变长", icon: "stretch-vertical" },
    { key: "large", label: "等比+", icon: "maximize-2" },
  ];

  function readJson(key, fallback) {
    try {
      const text = localStorage.getItem(key);
      return text ? JSON.parse(text) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local persistence is a demo enhancement, not a hard dependency.
    }
  }

  function moduleIds() {
    return (config.moduleCatalog || []).map((item) => item.id);
  }

  function isValidModuleId(moduleId) {
    return moduleIds().includes(moduleId);
  }

  function normalizeModuleIdList(ids) {
    const valid = new Set(moduleIds());
    return Array.from(new Set((ids || []).filter((id) => valid.has(id))));
  }

  function loadMenuOrder() {
    const sections = (config.navItems || []).map((item) => item.section);
    const saved = Array.isArray(readJson(layoutStorageKeys.menuOrder, []))
      ? readJson(layoutStorageKeys.menuOrder, [])
      : [];
    return [...saved.filter((section) => sections.includes(section)), ...sections.filter((section) => !saved.includes(section))];
  }

  function normalizeMenuItem(item, index = 0) {
    if (typeof item === "string") {
      return {
        id: `item-${index}-${item}`,
        label: item,
        moduleId: "command",
        query: item,
      };
    }
    const label = item?.label || item?.title || `二级材料 ${index + 1}`;
    const moduleId = isValidModuleId(item?.moduleId) ? item.moduleId : "command";
    return {
      id: item?.id || `${moduleId}-${label}`,
      label,
      moduleId,
      query: item?.query ?? label,
    };
  }

  function normalizeSecondaryMenu(menu, navItem) {
    return {
      section: navItem.section,
      title: menu?.title || navItem.label,
      hint: menu?.hint || "已关联页面模块",
      items: (menu?.items || []).map((item, index) => normalizeMenuItem(item, index)),
    };
  }

  function loadSecondaryMenus() {
    const saved = Array.isArray(readJson(layoutStorageKeys.secondaryMenus, []))
      ? readJson(layoutStorageKeys.secondaryMenus, [])
      : [];
    const configured = Array.isArray(config.secondaryMenus) ? config.secondaryMenus : [];
    return (config.navItems || []).map((navItem) => {
      const base = configured.find((menu) => menu.section === navItem.section) || {};
      const savedMenu = saved.find((menu) => menu.section === navItem.section);
      return normalizeSecondaryMenu(savedMenu ? { ...base, ...savedMenu } : base, navItem);
    });
  }

  function loadMenuModuleMap() {
    const saved = readJson(layoutStorageKeys.menuModuleMap, {});
    const configured = config.menuModuleMap || {};
    return Object.fromEntries(
      (config.navItems || []).map((navItem) => {
        const moduleIdsForMenu = normalizeModuleIdList(saved?.[navItem.section] || configured[navItem.section]);
        return [navItem.section, moduleIdsForMenu.length ? moduleIdsForMenu : ["command"]];
      }),
    );
  }

  function loadModuleLayouts() {
    const saved = readJson(layoutStorageKeys.moduleLayouts, {});
    const validSizes = new Set(moduleSizeOptions.map((item) => item.key));
    return Object.fromEntries(
      (config.moduleCatalog || []).map((module) => {
        const size = validSizes.has(saved?.[module.id]?.size) ? saved[module.id].size : module.defaultSize || "normal";
        return [
          module.id,
          {
            size,
            locked: Boolean(saved?.[module.id]?.locked),
          },
        ];
      }),
    );
  }

  function loadMenuLayout() {
    const saved = readJson(layoutStorageKeys.menuLayout, {});
    return {
      position: menuPositionOptions.includes(saved?.position) ? saved.position : "left",
      collapsed: Boolean(saved?.collapsed),
    };
  }

  const state = {
    activeFilter: "all",
    activeWorkType: "all",
    activeSection: config.navItems?.find((item) => item.active)?.section || config.navItems?.[0]?.section || "dashboard",
    activeRole: config.roles?.[0]?.key || "owner",
    enabledModules: Object.fromEntries((config.modules || []).map((item) => [item.key, item.enabled !== false])),
    menuOrder: loadMenuOrder(),
    secondaryMenus: loadSecondaryMenus(),
    menuModuleMap: loadMenuModuleMap(),
    moduleLayouts: loadModuleLayouts(),
    menuLayout: loadMenuLayout(),
    dragPayload: null,
    selectedId: archives[0]?.id || "",
  };

  const dom = {
    appShell: document.querySelector("#appShell"),
    navList: document.querySelector("#navList"),
    menuSearchInput: document.querySelector("#menuSearchInput"),
    metricGrid: document.querySelector("#metricGrid"),
    roleSelect: document.querySelector("#roleSelect"),
    activeRoleName: document.querySelector("#activeRoleName"),
    roleScopeBadge: document.querySelector("#roleScopeBadge"),
    roleSummary: document.querySelector("#roleSummary"),
    moduleSummary: document.querySelector("#moduleSummary"),
    moduleToggleGrid: document.querySelector("#moduleToggleGrid"),
    permissionMatrix: document.querySelector("#permissionMatrix"),
    sectionSearchInput: document.querySelector("#sectionSearchInput"),
    secondaryMenuGrid: document.querySelector("#secondaryMenuGrid"),
    fileTypeCount: document.querySelector("#fileTypeCount"),
    fileTypeLibrary: document.querySelector("#fileTypeLibrary"),
    formulaDemoGrid: document.querySelector("#formulaDemoGrid"),
    layoutScopeBadge: document.querySelector("#layoutScopeBadge"),
    activeRouteTitle: document.querySelector("#activeRouteTitle"),
    activeRouteCount: document.querySelector("#activeRouteCount"),
    routeModuleMap: document.querySelector("#routeModuleMap"),
    secondaryWorkbenchList: document.querySelector("#secondaryWorkbenchList"),
    moduleWorkbenchList: document.querySelector("#moduleWorkbenchList"),
    keywordGrid: document.querySelector("#keywordGrid"),
    typeChipRow: document.querySelector("#typeChipRow"),
    quickFilterRow: document.querySelector("#quickFilterRow"),
    intakeSourceGrid: document.querySelector("#intakeSourceGrid"),
    intakeSelected: document.querySelector("#intakeSelected"),
    intakeWorkflow: document.querySelector("#intakeWorkflow"),
    batchHistoryStatus: document.querySelector("#batchHistoryStatus"),
    batchHistoryList: document.querySelector("#batchHistoryList"),
    sampleValidationStatus: document.querySelector("#sampleValidationStatus"),
    sampleValidationList: document.querySelector("#sampleValidationList"),
    sampleValidationForm: document.querySelector("#sampleValidationForm"),
    samplePreflightList: document.querySelector("#samplePreflightList"),
    sampleDecisionList: document.querySelector("#sampleDecisionList"),
    resultBody: document.querySelector("#resultBody"),
    searchInput: document.querySelector("#searchInput"),
    localIndexSearchInput: document.querySelector("#localIndexSearchInput"),
    clearLocalSearch: document.querySelector("#clearLocalSearch"),
    clearFieldSearch: document.querySelector("#clearFieldSearch"),
    formatInput: document.querySelector("#formatInput"),
    voiceButton: document.querySelector("#voiceButton"),
    appearanceToggle: document.querySelector("#appearanceToggle"),
    appearancePanel: document.querySelector("#appearancePanel"),
    paletteRow: document.querySelector("#paletteRow"),
    accentColorInput: document.querySelector("#accentColorInput"),
    sidebarColorInput: document.querySelector("#sidebarColorInput"),
    pageColorInput: document.querySelector("#pageColorInput"),
    fontSelect: document.querySelector("#fontSelect"),
    fontSizeRange: document.querySelector("#fontSizeRange"),
    fontSizeValue: document.querySelector("#fontSizeValue"),
    resetAppearance: document.querySelector("#resetAppearance"),
    menuPositionControls: document.querySelector("#menuPositionControls"),
    menuCollapseToggle: document.querySelector("#menuCollapseToggle"),
    previewTitle: document.querySelector("#previewTitle"),
    previewLevel: document.querySelector("#previewLevel"),
    previewFrame: document.querySelector("#previewFrame"),
    previewMeta: document.querySelector("#previewMeta"),
    previewSummary: document.querySelector("#previewSummary"),
    permissionStrip: document.querySelector("#permissionStrip"),
    finishList: document.querySelector("#finishList"),
    tableHeadRow: document.querySelector(".archive-table thead tr"),
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function inferCompanyType(company = "") {
    if (company.includes("集团")) return "集团公司";
    if (company.includes("项目")) return "项目公司";
    if (company.includes("本机")) return "样本库";
    return `${company || "自定义公司"}类型`;
  }

  function inferProjectType(item) {
    const text = [item.project, item.title, item.workType, item.summary].join(" ");
    if (/标书|投标|招标/.test(text)) return "投标/标书项目";
    if (/发布会|年会|年度会议|会议/.test(text)) return "会议/活动项目";
    if (/述职|报告|经营|财务|数据/.test(text)) return "经营报告/数据项目";
    if (/PPT|提案|方案|策划/.test(text)) return "方案/提案项目";
    if (/录音|视频|影视|广告片/.test(text)) return "媒体内容项目";
    return "自定义项目";
  }

  function inferOwnerLevel(owner = "") {
    if (owner.includes("最高授权")) return "L5 最高授权人";
    if (/副总|分管/.test(owner)) return "L4 分管负责人";
    if (/部长|总监|负责人/.test(owner)) return "L3 部门负责人";
    if (/经理|主理|经办/.test(owner)) return "L2 项目负责人";
    return "L1 经办/协作人";
  }

  function inferPeriodSearchText(item) {
    const text = [item.period, item.title, item.project, item.summary].join(" ");
    const stages = [];
    if (/筹备|策划|计划|提案|方案/.test(text)) stages.push("筹备期");
    if (/执行|运营|发布会|拍摄|会议/.test(text)) stages.push("执行期");
    if (/交付|成片|归档|总结|复盘/.test(text)) stages.push("交付归档期");
    if (/Q1|一季度|01|02|03/.test(text)) stages.push("Q1/一季度");
    if (/Q2|二季度|04|05|06/.test(text)) stages.push("Q2/二季度");
    if (/Q3|三季度|07|08|09/.test(text)) stages.push("Q3/三季度");
    if (/Q4|四季度|10|11|12/.test(text)) stages.push("Q4/四季度");
    return [item.period, ...stages].filter(Boolean).join(" / ") || "待补周期阶段";
  }

  function inferAssetStage(item) {
    const text = [item.status, item.title, item.subtitle, item.summary].join(" ");
    if (/残缺已补充|已补充/.test(text)) return "残缺已补充";
    if (/残缺|缺少|缺预算|缺总结|待补充/.test(text)) return "残缺待补充";
    if (/半成品|待收尾/.test(text)) return "半成品待收尾";
    if (/完整|成片|交付版|归档/.test(text)) return "完整已归档";
    return "待人工确认";
  }

  function inferQualityLevel(item) {
    const text = [item.status, item.title, item.subtitle, item.summary, item.workType].join(" ");
    if (/经典制度|制度模板/.test(text)) return "经典制度";
    if (/惯例制度|制度|SOP|规范/.test(text)) return "惯例制度";
    if (/示范文档|样板|范本/.test(text)) return "示范文档";
    if (/经典案例|经典作品/.test(text)) return "经典案例";
    if (/优秀案例/.test(text)) return "优秀案例";
    if (/优质|高价值|S 级|A级|A 级/.test(text)) return "优质作品";
    if (/残缺/.test(text)) return "残缺作品";
    return "常规作品";
  }

  function clampScore(value, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function gradeFromScore(score) {
    if (score >= 90) return "S";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  }

  function inferCompletionScore(item) {
    const text = [item.assetStage, item.status, item.subtitle, item.summary].join(" ");
    if (/完整已归档|经典作品|品牌资产|投标归档|邮件归档|合同扫描件|成片|交付版/.test(text)) return 100;
    if (/完成度\s*([0-9]{1,3})/.test(text)) {
      return clampScore(text.match(/完成度\s*([0-9]{1,3})/)?.[1], item.score || 75);
    }
    if (/初稿待收尾|快收尾|缺结尾|缺案例/.test(text)) return 92;
    if (/录音转写|校对/.test(text)) return 83;
    if (/缺预算|缺总结|缺少|残缺待补充/.test(text)) return 82;
    if (/半成品|待收尾/.test(text)) return 78;
    return clampScore(item.score, 75);
  }

  function inferQualityScore(item) {
    return clampScore(item.qualityScore ?? item.score, 75);
  }

  function isAiRepairCandidate(item, completion) {
    const text = [item.assetStage, item.status, item.title, item.subtitle, item.summary].join(" ");
    const needsFinish = /半成品|待收尾|残缺|缺少|缺预算|缺总结|初稿|待补充|快收尾/.test(text);
    const isRestricted = ["L4", "L5", "L6"].includes(item.level);
    return completion >= 90 && needsFinish && !isRestricted;
  }

  function aiRepairLabel(item, completion) {
    if (isAiRepairCandidate(item, completion)) return "AI 可修复";
    if (completion >= 90) return "已接近完整";
    if (completion >= 75) return "先补结构";
    return "人工梳理";
  }

  function securityLevelName(level = "") {
    const map = {
      L0: "L0 外部流通",
      L1: "L1 普通",
      L2: "L2 内部",
      L3: "L3 敏感",
      L4: "L4 机密",
      L5: "L5 最高授权",
      L6: "L6 绝密",
    };
    return map[level] || level || "待定密级";
  }

  function inferStorageProfile(item) {
    const path = item.path || "";
    const source = [path, item.relativePath, item.sourcePathLabel, item.storageProvider].join(" ");
    if (/iCloud|Mobile Documents/.test(source)) {
      return {
        storageSourceType: "云端云盘",
        storageProvider: "iCloud Drive",
        accessMode: "本机同步目录",
        syncStrategy: "云端与本机双向同步",
        syncStatus: "需交叉校验",
        crossCheckPolicy: "云端清单 + 本机索引对账",
        storageRisk: "中",
        storageCostLevel: "中",
      };
    }
    if (/Dropbox|Google Drive|OneDrive|BaiduNetdisk|百度网盘|阿里云盘|坚果云|Nutstore|Tencent|腾讯微云|公有云|AWS|S3|OSS|COS/.test(source)) {
      return {
        storageSourceType: /公有云|AWS|S3|OSS|COS/.test(source) ? "公有云/对象存储" : "第三方云盘",
        storageProvider: "云盘同步目录",
        accessMode: /公有云|AWS|S3|OSS|COS/.test(source) ? "云端 API/同步目录" : "同步客户端/本机目录",
        syncStrategy: /公有云|AWS|S3|OSS|COS/.test(source) ? "低密级冷备 + 清单校验" : "云端主库 + 本机缓存",
        syncStatus: "需交叉校验",
        crossCheckPolicy: "文件清单、大小、修改时间、哈希抽检",
        storageRisk: "中高",
        storageCostLevel: "中",
      };
    }

    if (/Nextcloud|ownCloud|Seafile|私有云/.test(source)) {
      return {
        storageSourceType: "私有云",
        storageProvider: "私有云同步目录",
        accessMode: "同步客户端/内网或专线",
        syncStrategy: "私有云主库 + 本机缓存 + 定时校验",
        syncStatus: "需交叉校验",
        crossCheckPolicy: "私有云清单 + 本机索引 + 哈希抽检",
        storageRisk: "中",
        storageCostLevel: "中高",
      };
    }

    if (/iPhone|Android|手机|微信|相册|Pictures|Camera Roll|iPad|平板|tablet/i.test(source)) {
      const isTablet = /iPad|平板|tablet/i.test(source);
      return {
        storageSourceType: isTablet ? "iPad/平板" : "手机",
        storageProvider: isTablet ? "平板设备/同步目录" : "手机设备/同步目录",
        accessMode: "数据线/局域网投递/同步目录",
        syncStrategy: "授权后完整采集到 NAS 暂存区 + 去重分类",
        syncStatus: "待授权接入",
        crossCheckPolicy: "设备清单、照片视频数量、大小、修改时间对账",
        storageRisk: "中高",
        storageCostLevel: "中",
      };
    }

    if (/SD卡|存储卡|读卡器|相机|摄像机|单反|微单|录音笔|GoPro|DJI|Canon|Nikon|Sony|DCIM/i.test(source)) {
      return {
        storageSourceType: "SD卡/相机/摄像机",
        storageProvider: "影像采集介质",
        accessMode: "读卡器/数据线/采集站",
        syncStrategy: "先镜像保护 + NAS 素材暂存 + 抽帧识别",
        syncStatus: "待采集",
        crossCheckPolicy: "卡内清单、素材数量、大小、拍摄时间、哈希抽检",
        storageRisk: "高",
        storageCostLevel: "中",
      };
    }

    if (/邮箱|企业邮箱|邮件导出|mailbox|eml|msg/i.test(source)) {
      return {
        storageSourceType: "邮箱",
        storageProvider: "邮箱导出/附件库",
        accessMode: "EML/MSG 导出或授权 API",
        syncStrategy: "先导出清单和附件索引 + 高密级隔离",
        syncStatus: "待授权接入",
        crossCheckPolicy: "邮件数量、附件数量、发件人、时间段对账",
        storageRisk: "高",
        storageCostLevel: "中",
      };
    }

    if (/在线硬盘|长期在线|硬盘服务器|同主机多接口|多接口|硬盘柜|DAS|Thunderbolt|雷电|SATA|USB-C/.test(source)) {
      return {
        storageSourceType: "在线硬盘/同主机多接口硬盘",
        storageProvider: "本机直连硬盘服务器",
        accessMode: "本机直连/硬盘柜/多接口挂载",
        syncStrategy: "只读索引 + 本地快照 + 重要资料再同步",
        syncStatus: "在线可读",
        crossCheckPolicy: "卷名、路径、大小、修改时间、哈希抽检",
        storageRisk: "中",
        storageCostLevel: "中",
      };
    }

    if (/^\\\\|smb:|afp:|nfs:|\/Network\/|\/net\/|NAS|群晖|Synology|QNAP|局域网/.test(source)) {
      return {
        storageSourceType: "局域网网盘/NAS",
        storageProvider: "局域网共享存储",
        accessMode: "SMB/AFP/NFS",
        syncStrategy: "中心 NAS 索引 + 本机缓存",
        syncStatus: "待校验",
        crossCheckPolicy: "NAS 文件清单 + 本机索引 + 定时差异报告",
        storageRisk: "中",
        storageCostLevel: "中高",
      };
    }

    if (/\/Volumes\//.test(path)) {
      const volumeName = path.split("/")[2] || "外接卷";
      const isUsbLike = /USB|U盘|Untitled|NO NAME|KINGSTON|SanDisk|闪迪|移动/.test(volumeName);
      return {
        storageSourceType: isUsbLike ? "U盘/移动硬盘" : "外接硬盘/硬盘柜",
        storageProvider: volumeName,
        accessMode: "本机外接挂载",
        syncStrategy: "只读索引 + 手动备份 + 必要时云端同步",
        syncStatus: "在线可读",
        crossCheckPolicy: "挂载卷清单 + 本机索引 + 抽样打开",
        storageRisk: isUsbLike ? "中高" : "中",
        storageCostLevel: "低",
      };
    }

    if (/主机|MacBook|Mac mini|Windows|Linux|服务器|Server/.test(source)) {
      return {
        storageSourceType: "不同主机硬盘",
        storageProvider: "跨主机共享目录",
        accessMode: "远程挂载/共享目录",
        syncStrategy: "主机侧只读索引 + 汇总索引同步",
        syncStatus: "待校验",
        crossCheckPolicy: "主机索引清单 + 中央索引差异报告",
        storageRisk: "中",
        storageCostLevel: "中",
      };
    }

    return {
      storageSourceType: "本机硬盘",
      storageProvider: "当前主机",
      accessMode: "本机直连",
      syncStrategy: "只读索引 + 本地快照",
      syncStatus: "已索引",
      crossCheckPolicy: "本机路径、大小、修改时间校验",
      storageRisk: "低",
      storageCostLevel: "低",
    };
  }

  function enrichArchive(item) {
    const period = item.period || item.modifiedAt || "";
    const storageProfile = inferStorageProfile(item);
    const completionScore = clampScore(item.completionScore ?? inferCompletionScore(item), 75);
    const qualityScore = inferQualityScore(item);
    const repairCandidate = Boolean(item.aiRepairCandidate ?? isAiRepairCandidate(item, completionScore));
    return {
      ...item,
      companyType: item.companyType || inferCompanyType(item.company),
      companyName: item.companyName || item.company,
      departmentSystem: item.departmentSystem || "集团标准建制/可自定义",
      projectType: item.projectType || inferProjectType(item),
      creatorCompany: item.creatorCompany || item.company,
      creatorDepartment: item.creatorDepartment || item.department,
      createdAt: item.createdAt || item.modifiedAt || period,
      ownerLevel: item.ownerLevel || inferOwnerLevel(item.owner),
      periodSearchText: item.periodSearchText || inferPeriodSearchText(item),
      assetStage: item.assetStage || inferAssetStage(item),
      qualityLevel: item.qualityLevel || inferQualityLevel(item),
      completionScore,
      completionGrade: gradeFromScore(completionScore),
      qualityScore,
      qualityGrade: gradeFromScore(qualityScore),
      aiRepairCandidate: repairCandidate,
      aiRepairLabel: item.aiRepairLabel || aiRepairLabel(item, completionScore),
      securityLevelName: item.securityLevelName || securityLevelName(item.level),
      storageSourceType: item.storageSourceType || storageProfile.storageSourceType,
      storageProvider: item.storageProvider || storageProfile.storageProvider,
      accessMode: item.accessMode || storageProfile.accessMode,
      syncStrategy: item.syncStrategy || storageProfile.syncStrategy,
      syncStatus: item.syncStatus || storageProfile.syncStatus,
      crossCheckPolicy: item.crossCheckPolicy || storageProfile.crossCheckPolicy,
      storageRisk: item.storageRisk || storageProfile.storageRisk,
      storageCostLevel: item.storageCostLevel || storageProfile.storageCostLevel,
    };
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(normalized, 16);
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
  }

  function lightenHex(hex, amount = 0.88) {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    const mix = (channel) => Math.round(channel + (255 - channel) * amount);
    return `#${[mix(r), mix(g), mix(b)]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function darkenHex(hex, amount = 0.35) {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    const mix = (channel) => Math.max(0, Math.round(channel * (1 - amount)));
    return `#${[mix(r), mix(g), mix(b)]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function defaultAppearance() {
    const palette = config.appearance.palettes[0];
    const font = config.appearance.fonts[0];
    return {
      palette: palette.key,
      accent: palette.accent,
      sidebar: palette.sidebar,
      page: palette.page,
      font: font.key,
      fontSize: config.appearance.fontSize.default,
    };
  }

  function loadAppearance() {
    const defaults = defaultAppearance();
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem("hws-archive-appearance-v2") || "{}") };
    } catch {
      return defaults;
    }
  }

  function saveAppearance(settings) {
    try {
      localStorage.setItem("hws-archive-appearance-v2", JSON.stringify(settings));
    } catch {
      // The prototype should still work when browser storage is unavailable.
    }
  }

  function applyAppearance(settings, shouldSave = true) {
    const selectedFont =
      config.appearance.fonts.find((font) => font.key === settings.font) || config.appearance.fonts[0];
    const selectedPalette = config.appearance.palettes.find((palette) => palette.key === settings.palette);
    const sidebarActive =
      selectedPalette?.sidebarActive ||
      (settings.sidebar.toLowerCase() === "#ffffff" ? lightenHex(settings.accent) : lightenHex(settings.sidebar, 0.12));
    const root = document.documentElement;
    root.style.setProperty("--teal", settings.accent);
    root.style.setProperty("--teal-rgb", hexToRgb(settings.accent));
    root.style.setProperty("--teal-soft", lightenHex(settings.accent));
    root.style.setProperty("--sidebar", settings.sidebar);
    root.style.setProperty("--sidebar-2", sidebarActive);
    root.style.setProperty("--page", settings.page);
    root.style.setProperty("--font-ui", selectedFont.value);
    root.style.setProperty("--font-size-base", `${settings.fontSize}px`);

    dom.accentColorInput.value = settings.accent;
    dom.sidebarColorInput.value = settings.sidebar;
    dom.pageColorInput.value = settings.page;
    dom.fontSelect.value = settings.font;
    dom.fontSizeRange.value = settings.fontSize;
    dom.fontSizeValue.textContent = `${settings.fontSize}px`;

    dom.paletteRow.querySelectorAll(".palette-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.palette === settings.palette);
    });

    if (shouldSave) saveAppearance(settings);
  }

  function currentAppearance() {
    return {
      palette: dom.paletteRow.querySelector(".palette-button.active")?.dataset.palette || "custom",
      accent: dom.accentColorInput.value,
      sidebar: dom.sidebarColorInput.value,
      page: dom.pageColorInput.value,
      font: dom.fontSelect.value,
      fontSize: Number(dom.fontSizeRange.value),
    };
  }

  function renderConfigDrivenSections() {
    if (dom.roleSelect) {
      dom.roleSelect.innerHTML = (config.roles || [])
        .map((role) => `<option value="${escapeHtml(role.key)}">${escapeHtml(role.name)}</option>`)
        .join("");
      dom.roleSelect.value = state.activeRole;
    }

    renderNavList();

    const metrics = usingLocalIndex
      ? [
          {
            label: "本机索引文件",
            value: archives.length.toLocaleString("zh-CN"),
            note: `根目录：${localIndex.rootLabel || "已脱敏"}`,
          },
          { label: "索引体积", value: localIndex.totalSizeLabel || "--", note: `生成：${(localIndex.generatedAt || "").slice(0, 16).replace("T", " ")}` },
          {
            label: "扫描告警",
            value: localIndex.truncated ? "非全量" : String(localIndex.skippedCount || 0),
            note: localIndex.truncated ? "已达到扫描上限，需分批补扫" : "跳过文件/目录数量",
          },
          {
            label: "最新批次",
            value: latestBatch?.batchId || "真实索引",
            note: latestBatch?.defaultSecurity ? `默认密级：${latestBatch.defaultSecurity}` : "当前优先读取本机扫描结果",
          },
        ]
      : config.metrics;

    dom.metricGrid.innerHTML = metrics
      .map(
        (item) => `
          <article class="metric">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
            <small>${escapeHtml(item.note)}</small>
          </article>
        `,
      )
      .join("");

    dom.keywordGrid.innerHTML = config.fieldSearches
      .map(
        (item) => `
          <label class="field-search">
            <span>${escapeHtml(item.label)}</span>
            <input data-field="${escapeHtml(item.field)}" type="search" placeholder="${escapeHtml(item.placeholder)}" />
          </label>
        `,
      )
      .join("");

    dom.typeChipRow.innerHTML = config.workTypes
      .map(
        (item) => `
          <button class="type-chip ${item.active ? "active" : ""}" type="button" data-work-type="${escapeHtml(item.key)}">
            <i data-lucide="${escapeHtml(item.icon)}"></i>
            <span>${escapeHtml(item.label)}</span>
          </button>
        `,
      )
      .join("");

    dom.quickFilterRow.innerHTML = config.quickFilters
      .map(
        (item) => `
          <button class="filter-chip ${item.active ? "active" : ""}" type="button" data-filter="${escapeHtml(item.key)}">
            ${escapeHtml(item.label)}
          </button>
        `,
      )
      .join("");

    renderSecondaryMenus();
    renderSaasConsole();
    renderFileTypeLibrary();
    renderFormulaExamples();

    dom.intakeSourceGrid.innerHTML = config.intakeSources
      .map(
        (source) => `
          <button class="intake-card ${source.key === config.intakeSources[0]?.key ? "active" : ""}" type="button" data-intake-key="${escapeHtml(source.key)}">
            <span class="intake-icon"><i data-lucide="${escapeHtml(source.icon)}"></i></span>
            <span class="intake-copy">
              <strong>${escapeHtml(source.name)}</strong>
              <small>${escapeHtml(source.examples)}</small>
            </span>
            <span class="intake-meta">
              <b>${escapeHtml(source.status)}</b>
              <em>风险：${escapeHtml(source.risk)}</em>
            </span>
            <span class="intake-detail">
              <i>${escapeHtml(source.access)}</i>
              <i>${escapeHtml(source.target)}</i>
              <i>${escapeHtml(source.next)}</i>
            </span>
          </button>
        `,
      )
      .join("");

    renderSelectedIntake(config.intakeSources[0]);

    dom.intakeWorkflow.innerHTML = config.intakeWorkflow
      .map(
        (step) => `
          <div class="intake-step">
            <span>${escapeHtml(step.step)}</span>
            <strong>${escapeHtml(step.title)}</strong>
            <small>${escapeHtml(step.detail)}</small>
          </div>
        `,
      )
      .join("");

    renderBatchHistory();
    renderSampleValidation();

    dom.tableHeadRow.innerHTML = config.tableColumns
      .map((column) => `<th>${escapeHtml(column.label)}</th>`)
      .join("");

    dom.paletteRow.innerHTML = config.appearance.palettes
      .map(
        (palette) => `
          <button class="palette-button" type="button" data-palette="${escapeHtml(palette.key)}">
            <span class="swatch" style="background:${escapeHtml(palette.accent)}"></span>
            <span>${escapeHtml(palette.label)}</span>
          </button>
        `,
      )
      .join("");

    dom.fontSelect.innerHTML = config.appearance.fonts
      .map((font) => `<option value="${escapeHtml(font.key)}">${escapeHtml(font.label)}</option>`)
      .join("");

    dom.fontSizeRange.min = config.appearance.fontSize.min;
    dom.fontSizeRange.max = config.appearance.fontSize.max;
    arrangeModulesForSection();
    applyModuleLayouts();
    renderLayoutWorkbench();
  }

  function renderNavList() {
    if (!dom.navList) return;
    dom.navList.innerHTML = orderedNavItems()
      .map(
        (item) => `
          <button class="nav-item ${item.section === state.activeSection ? "active" : ""}" type="button" draggable="true" data-section="${escapeHtml(item.section)}">
            <i data-lucide="${escapeHtml(item.icon)}"></i>
            <span>${escapeHtml(item.label)}</span>
            <small>${escapeHtml(currentSecondaryMenu(item.section)?.items?.[0]?.label || "搜索")}</small>
          </button>
        `,
      )
      .join("");
    refreshIcons();
  }

  function orderedNavItems() {
    return (config.navItems || [])
      .slice()
      .sort((a, b) => state.menuOrder.indexOf(a.section) - state.menuOrder.indexOf(b.section));
  }

  function currentNavItem(section = state.activeSection) {
    return (config.navItems || []).find((item) => item.section === section) || config.navItems?.[0];
  }

  function currentSecondaryMenu(section = state.activeSection) {
    return state.secondaryMenus.find((menu) => menu.section === section);
  }

  function moduleCatalogItem(moduleId) {
    return (config.moduleCatalog || []).find((item) => item.id === moduleId);
  }

  function menuModules(section = state.activeSection) {
    const configured = state.menuModuleMap[section] || [];
    const fromSecondary = (currentSecondaryMenu(section)?.items || []).map((item) => item.moduleId);
    return normalizeModuleIdList([...configured, ...fromSecondary]);
  }

  function saveMenuOrder() {
    writeJson(layoutStorageKeys.menuOrder, state.menuOrder);
  }

  function saveSecondaryMenus() {
    writeJson(layoutStorageKeys.secondaryMenus, state.secondaryMenus);
  }

  function saveMenuModuleMap() {
    writeJson(layoutStorageKeys.menuModuleMap, state.menuModuleMap);
  }

  function saveModuleLayouts() {
    writeJson(layoutStorageKeys.moduleLayouts, state.moduleLayouts);
  }

  function saveMenuLayout() {
    writeJson(layoutStorageKeys.menuLayout, state.menuLayout);
  }

  function menuLayoutLabel(position) {
    return {
      left: "左侧",
      top: "顶部",
      right: "右侧",
      bottom: "底部",
    }[position] || "左侧";
  }

  function menuCollapseIcon() {
    if (state.menuLayout.position === "right") return state.menuLayout.collapsed ? "panel-left-open" : "panel-right-close";
    if (state.menuLayout.position === "top") return state.menuLayout.collapsed ? "panel-bottom-open" : "panel-top-close";
    if (state.menuLayout.position === "bottom") return state.menuLayout.collapsed ? "panel-top-open" : "panel-bottom-close";
    return state.menuLayout.collapsed ? "panel-right-open" : "panel-left-close";
  }

  function applyMenuLayout(shouldSave = true) {
    const position = menuPositionOptions.includes(state.menuLayout.position) ? state.menuLayout.position : "left";
    const collapsed = Boolean(state.menuLayout.collapsed);

    dom.appShell?.classList.remove(
      "menu-left",
      "menu-top",
      "menu-right",
      "menu-bottom",
      "menu-collapsed",
    );
    dom.appShell?.classList.add(`menu-${position}`);
    dom.appShell?.classList.toggle("menu-collapsed", collapsed);
    dom.appShell?.setAttribute("data-menu-position", position);

    dom.menuPositionControls?.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.menuPosition === position);
    });

    if (dom.menuCollapseToggle) {
      dom.menuCollapseToggle.classList.toggle("active", collapsed);
      dom.menuCollapseToggle.innerHTML = `
        <i data-lucide="${escapeHtml(menuCollapseIcon())}"></i>
        <span>${collapsed ? "展开菜单" : "折叠菜单"}</span>
      `;
      dom.menuCollapseToggle.setAttribute("aria-label", `${menuLayoutLabel(position)}菜单${collapsed ? "已折叠" : "已展开"}`);
    }

    if (shouldSave) saveMenuLayout();
    refreshIcons();
  }

  function currentRole() {
    return (config.roles || []).find((role) => role.key === state.activeRole) || config.roles?.[0];
  }

  function renderSecondaryMenus() {
    if (!dom.secondaryMenuGrid) return;
    const term = normalizeQuery(dom.sectionSearchInput?.value || dom.menuSearchInput?.value || "");
    const hasTerm = Boolean(term);
    const menus = state.secondaryMenus.filter((menu) => {
      const haystack = [
        menu.title,
        menu.hint,
        ...(menu.items || []).flatMap((item) => [item.label, item.query, moduleCatalogItem(item.moduleId)?.title]),
      ]
        .join(" ")
        .toLowerCase();
      if (!hasTerm && menu.section !== state.activeSection) return false;
      return !term || term.split(/\s+/).every((item) => haystack.includes(item));
    });

    dom.secondaryMenuGrid.innerHTML = menus
      .map(
        (menu) => `
          <article class="secondary-menu-card" data-section="${escapeHtml(menu.section)}">
            <div>
              <p class="eyebrow">${escapeHtml(menu.title)}</p>
              <h3>${escapeHtml(menu.hint)}</h3>
            </div>
            <label class="mini-search">
              <i data-lucide="search"></i>
              <input type="search" placeholder="${escapeHtml(menu.title)}内检索" aria-label="${escapeHtml(menu.title)}内检索" />
            </label>
            <div class="secondary-chip-row">
              ${(menu.items || [])
                .map(
                  (item) => `
                    <button type="button" data-section="${escapeHtml(menu.section)}" data-module-id="${escapeHtml(item.moduleId)}" data-query="${escapeHtml(item.query)}">
                      <span>${escapeHtml(item.label)}</span>
                      <em>${escapeHtml(moduleCatalogItem(item.moduleId)?.title || "页面模块")}</em>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </article>
        `,
      )
      .join("");
    refreshIcons();
  }

  function roleVisibilityForModule(module) {
    const role = state.activeRole;
    if (role === "owner" || role === "admin") return "可配置";
    if (role === "auditor") return module.key === "permission" || module.key === "archive" ? "审计可见" : "只读";
    if (role === "manager") return ["tenant", "archive", "permission", "ai", "media", "workflow"].includes(module.key) ? "部门可见" : "隐藏";
    if (role === "staff") return ["archive", "media", "ai"].includes(module.key) ? "本人可见" : "隐藏";
    return "只读";
  }

  function renderSaasConsole() {
    if (!dom.roleSummary) return;
    const role = currentRole();
    const modules = config.modules || [];
    const enabledCount = modules.filter((item) => state.enabledModules[item.key]).length;

    if (dom.activeRoleName) dom.activeRoleName.textContent = role?.name || "权限视角";
    if (dom.roleScopeBadge) dom.roleScopeBadge.textContent = `${role?.name || "当前角色"} · ${role?.scope || "默认范围"}`;
    if (dom.moduleSummary) dom.moduleSummary.textContent = `${enabledCount}/${modules.length} 个模块已启用`;

    dom.roleSummary.innerHTML = `
      <div class="section-mini-head">
        <div>
          <p class="eyebrow">当前权限视角</p>
          <h3>${escapeHtml(role?.name || "最高授权人")}</h3>
        </div>
        <span>${escapeHtml(role?.scope || "全局")}</span>
      </div>
      <div class="role-list">
        <strong>可操作</strong>
        ${(role?.can || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
      <div class="role-list blocked">
        <strong>限制</strong>
        ${(role?.blocked || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    `;

    dom.moduleToggleGrid.innerHTML = modules
      .map((module) => {
        const enabled = Boolean(state.enabledModules[module.key]);
        const visibility = roleVisibilityForModule(module);
        const disabled = state.activeRole !== "owner" && state.activeRole !== "admin";
        return `
          <article class="module-card ${enabled ? "enabled" : "disabled"} ${visibility === "隐藏" ? "limited" : ""}">
            <div class="module-card-head">
              <span><i data-lucide="${escapeHtml(module.icon)}"></i></span>
              <label class="switch" title="${disabled ? "当前角色只读" : "模块开关"}">
                <input type="checkbox" data-module-key="${escapeHtml(module.key)}" ${enabled ? "checked" : ""} ${disabled ? "disabled" : ""} />
                <i></i>
              </label>
            </div>
            <h3>${escapeHtml(module.title)}</h3>
            <p>${escapeHtml(module.desc)}</p>
            <div class="module-meta">
              <em>${escapeHtml(module.plan)}</em>
              <em>${escapeHtml(visibility)}</em>
            </div>
          </article>
        `;
      })
      .join("");

    renderPermissionMatrix();
    refreshIcons();
  }

  function renderPermissionMatrix() {
    if (!dom.permissionMatrix) return;
    const roles = config.roles || [];
    dom.permissionMatrix.innerHTML = `
      <div class="section-mini-head">
        <div>
          <p class="eyebrow">权限矩阵</p>
          <h3>角色、动作、密级和留痕边界</h3>
        </div>
        <span>点击顶部权限视角可切换</span>
      </div>
      <div class="matrix-table-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>动作</th>
              ${roles.map((role) => `<th class="${role.key === state.activeRole ? "active-role" : ""}">${escapeHtml(role.name)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${(config.permissionMatrix || [])
              .map(
                (row) => `
                  <tr>
                    <td>${escapeHtml(row.action)}</td>
                    ${roles
                      .map((role) => `<td class="${role.key === state.activeRole ? "active-role" : ""}">${escapeHtml(row[role.key] || "-")}</td>`)
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderFileTypeLibrary() {
    if (!dom.fileTypeLibrary) return;
    const groups = config.fileTypeGroups || [];
    const count = groups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
    if (dom.fileTypeCount) dom.fileTypeCount.textContent = `${count} 个格式关键词`;
    dom.fileTypeLibrary.innerHTML = groups
      .map(
        (group) => `
          <article class="file-type-group">
            <h3>${escapeHtml(group.title)}</h3>
            <div>
              ${(group.items || []).map((item) => `<button type="button" data-file-query="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}
            </div>
          </article>
        `,
      )
      .join("");
  }

  function renderFormulaExamples() {
    if (!dom.formulaDemoGrid) return;
    dom.formulaDemoGrid.innerHTML = (config.formulaExamples || [])
      .map(
        (item) => `
          <article class="formula-card">
            <h3>${escapeHtml(item.title)}</h3>
            <code>${escapeHtml(item.formula)}</code>
            <p>${escapeHtml(item.sample)}</p>
          </article>
        `,
      )
      .join("");
  }

  function moduleElement(moduleId) {
    return document.querySelector(`.managed-module[data-module-id="${moduleId}"]`);
  }

  function applyModuleLayouts() {
    document.querySelectorAll(".managed-module[data-module-id]").forEach((element) => {
      const moduleId = element.dataset.moduleId;
      const layout = state.moduleLayouts[moduleId] || { size: moduleCatalogItem(moduleId)?.defaultSize || "normal", locked: false };
      element.classList.remove("module-size-compact", "module-size-normal", "module-size-wide", "module-size-long", "module-size-large", "module-locked");
      element.classList.add(`module-size-${layout.size || "normal"}`);
      element.classList.toggle("module-locked", Boolean(layout.locked));
      element.dataset.locked = layout.locked ? "true" : "false";
    });
  }

  function arrangeModulesForSection(section = state.activeSection) {
    const parent = dom.appearancePanel?.parentElement;
    if (!parent) return;
    const activeModules = menuModules(section);
    const orderedModules = [...activeModules, ...moduleIds().filter((id) => !activeModules.includes(id))];
    let cursor = dom.appearancePanel;
    orderedModules.forEach((moduleId) => {
      const element = moduleElement(moduleId);
      if (!element || element.parentElement !== parent) return;
      parent.insertBefore(element, cursor.nextSibling);
      cursor = element;
    });
  }

  function scrollToModule(moduleId, shouldFocus = true) {
    const element = moduleElement(moduleId);
    if (!element) return;
    document.querySelectorAll(".module-highlight").forEach((item) => item.classList.remove("module-highlight"));
    menuModules().forEach((id) => moduleElement(id)?.classList.add("module-highlight"));
    element.classList.add("module-highlight-focus");
    window.setTimeout(() => element.classList.remove("module-highlight-focus"), 1600);
    if (shouldFocus) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function syncMenuModuleMapFromSecondary(section = state.activeSection) {
    const current = normalizeModuleIdList([
      ...(state.menuModuleMap[section] || []),
      ...((currentSecondaryMenu(section)?.items || []).map((item) => item.moduleId)),
    ]);
    state.menuModuleMap[section] = current;
  }

  function renderLayoutWorkbench() {
    if (!dom.moduleWorkbenchList) return;
    syncMenuModuleMapFromSecondary(state.activeSection);
    const navItem = currentNavItem();
    const secondaryMenu = currentSecondaryMenu();
    const modules = menuModules();
    if (dom.layoutScopeBadge) dom.layoutScopeBadge.textContent = navItem?.label || "当前菜单";
    if (dom.activeRouteTitle) dom.activeRouteTitle.textContent = `${navItem?.label || "当前菜单"} / ${secondaryMenu?.title || "二级材料"}`;
    if (dom.activeRouteCount) dom.activeRouteCount.textContent = `${modules.length} 个模块`;

    if (dom.routeModuleMap) {
      dom.routeModuleMap.innerHTML = `
        <div class="route-menu-dropzone" data-drop-section="${escapeHtml(state.activeSection)}">
          <strong>${escapeHtml(navItem?.label || "一级菜单")}</strong>
          <span>把二级材料拖到这里，归入当前一级菜单</span>
        </div>
        <div class="route-menu-bins">
          ${orderedNavItems()
            .map((item) => {
              const count = currentSecondaryMenu(item.section)?.items?.length || 0;
              return `
                <button class="${item.section === state.activeSection ? "active" : ""}" type="button" data-drop-section="${escapeHtml(item.section)}">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>${count} 个二级材料</span>
                </button>
              `;
            })
            .join("")}
        </div>
        <div class="route-module-chain">
          ${modules
            .map((moduleId, index) => {
              const module = moduleCatalogItem(moduleId);
              return `
                <button class="route-module-pill" type="button" data-module-id="${escapeHtml(moduleId)}">
                  <em>${index + 1}</em>
                  <span>${escapeHtml(module?.title || moduleId)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (dom.secondaryWorkbenchList) {
      dom.secondaryWorkbenchList.innerHTML = (secondaryMenu?.items || [])
        .map((item, index) => {
          const module = moduleCatalogItem(item.moduleId);
          return `
            <article class="workbench-item secondary-item" draggable="true" data-secondary-index="${index}" data-module-id="${escapeHtml(item.moduleId)}">
              <button class="drag-handle" type="button" aria-label="拖动二级材料"><i data-lucide="grip-vertical"></i></button>
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.query || item.label)}</span>
              </div>
              <button class="linked-module-chip" type="button" data-module-id="${escapeHtml(item.moduleId)}">${escapeHtml(module?.title || "页面模块")}</button>
            </article>
          `;
        })
        .join("");
    }

    dom.moduleWorkbenchList.innerHTML = modules
      .map((moduleId, index) => {
        const module = moduleCatalogItem(moduleId);
        const layout = state.moduleLayouts[moduleId] || { size: module?.defaultSize || "normal", locked: false };
        const locked = Boolean(layout.locked);
        return `
          <article class="workbench-item module-item ${locked ? "locked" : ""}" draggable="${locked ? "false" : "true"}" data-module-id="${escapeHtml(moduleId)}">
            <button class="drag-handle" type="button" aria-label="拖动页面模块" ${locked ? "disabled" : ""}><i data-lucide="${locked ? "lock" : "grip-vertical"}"></i></button>
            <div>
              <strong>${index + 1}. ${escapeHtml(module?.title || moduleId)}</strong>
              <span>${escapeHtml(module?.desc || "已关联到当前菜单")}</span>
            </div>
            <div class="module-size-actions" aria-label="模块尺寸控制">
              ${moduleSizeOptions
                .map(
                  (size) => `
                    <button class="${layout.size === size.key ? "active" : ""}" type="button" title="${escapeHtml(size.label)}" data-size="${escapeHtml(size.key)}" ${locked ? "disabled" : ""}>
                      <i data-lucide="${escapeHtml(size.icon)}"></i>
                      <span>${escapeHtml(size.label)}</span>
                    </button>
                  `,
                )
                .join("")}
              <button class="lock-toggle ${locked ? "active" : ""}" type="button" title="${locked ? "解锁模块" : "锁定模块"}" data-lock-toggle="true">
                <i data-lucide="${locked ? "lock" : "unlock"}"></i>
                <span>${locked ? "已锁" : "锁定"}</span>
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    applyModuleLayouts();
    renderNavList();
    refreshIcons();
  }

  function activateSection(section, options = {}) {
    if (!section || !currentNavItem(section)) return;
    state.activeSection = section;
    syncMenuModuleMapFromSecondary(section);
    arrangeModulesForSection(section);
    renderNavList();
    renderSecondaryMenus();
    renderLayoutWorkbench();

    const targetModuleId = options.moduleId || menuModules(section)[0];
    if (options.query !== undefined && dom.searchInput) {
      dom.searchInput.value = options.query;
      renderResults();
    }
    scrollToModule(targetModuleId, options.scroll !== false);
  }

  function reorderArray(items, fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
      return items;
    }
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  }

  function moveSecondaryItem(fromSection, fromIndex, toSection, toIndex = 0) {
    const sourceMenu = currentSecondaryMenu(fromSection);
    const targetMenu = currentSecondaryMenu(toSection);
    if (!sourceMenu || !targetMenu) return;
    const sourceItems = [...sourceMenu.items];
    const [moved] = sourceItems.splice(fromIndex, 1);
    if (!moved) return;
    sourceMenu.items = sourceItems;
    const targetItems = sourceMenu === targetMenu ? sourceItems : [...targetMenu.items];
    targetItems.splice(Math.max(0, Math.min(toIndex, targetItems.length)), 0, moved);
    targetMenu.items = targetItems;
    syncMenuModuleMapFromSecondary(fromSection);
    syncMenuModuleMapFromSecondary(toSection);
    saveSecondaryMenus();
    saveMenuModuleMap();
    renderSecondaryMenus();
    renderLayoutWorkbench();
  }

  function moveModuleInActiveMenu(fromModuleId, toModuleId) {
    const modules = menuModules();
    const fromIndex = modules.indexOf(fromModuleId);
    const toIndex = modules.indexOf(toModuleId);
    if (state.moduleLayouts[fromModuleId]?.locked || state.moduleLayouts[toModuleId]?.locked) return;
    state.menuModuleMap[state.activeSection] = reorderArray(modules, fromIndex, toIndex);
    saveMenuModuleMap();
    arrangeModulesForSection();
    renderLayoutWorkbench();
  }

  function normalizeQuery(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[，。、“”‘’：:；;,.]/g, " ");
  }

  function queryTerms(value) {
    return normalizeQuery(value)
      .split(/\s+/)
      .map((term) => term.replace(/^(找|看|查|搜索|播放)/, ""))
      .filter((term) => term.length >= 2);
  }

  function fieldInputs() {
    return Array.from(document.querySelectorAll(".field-search input"));
  }

  function archiveText(item) {
    return [
      item.title,
      item.subtitle,
      item.project,
      item.projectType,
      item.company,
      item.companyType,
      item.companyName,
      item.department,
      item.departmentSystem,
      item.author,
      item.owner,
      item.ownerLevel,
      item.employees?.join(" "),
      item.functionRole,
      item.creatorCompany,
      item.creatorDepartment,
      item.createdAt,
      item.periodSearchText,
      item.assetStage,
      item.qualityLevel,
      item.completionScore,
      item.qualityScore,
      item.aiRepairLabel,
      item.securityLevelName,
      item.storageSourceType,
      item.storageProvider,
      item.accessMode,
      item.syncStrategy,
      item.syncStatus,
      item.crossCheckPolicy,
      item.storageRisk,
      item.storageCostLevel,
      item.intakeSource,
      item.workType,
      item.period,
      item.format,
      item.formatTags?.join(" "),
      item.relativePath,
      item.sourcePathLabel,
      item.sizeLabel,
      item.modifiedAt,
      item.status,
      item.summary,
    ]
      .join(" ")
      .toLowerCase();
  }

  function quickFilterMatches(item) {
    if (state.activeFilter === "all") return true;
    if (state.activeFilter === "finish") {
      return item.type === "finish" || item.status.includes("收尾") || item.status.includes("半成品");
    }
    if (state.activeFilter === "classic") {
      return item.status.includes("经典") || item.grade === "S";
    }
    if (state.activeFilter === "audio") {
      return item.type === "audio" || item.preview === "audio" || item.formatTags?.includes("audio");
    }
    if (state.activeFilter === "video") {
      return item.type === "video" || item.preview === "video" || item.formatTags?.includes("video");
    }
    if (state.activeFilter === "private") {
      return ["L3", "L4", "L5", "L6"].includes(item.level);
    }
    return item.type === state.activeFilter;
  }

  function fieldMatches(item) {
    return fieldInputs().every((input) => {
      const value = normalizeQuery(input.value);
      if (!value) return true;

      if (input.dataset.field === "employee") {
        return [item.author, item.owner, ...(item.employees || [])]
          .join(" ")
          .toLowerCase()
          .includes(value);
      }

      return String(item[input.dataset.field] || "")
        .toLowerCase()
        .includes(value);
    });
  }

  function workTypeMatches(item) {
    if (state.activeWorkType === "all") return true;
    return (
      item.formatTags?.includes(state.activeWorkType) ||
      item.workType.toLowerCase().includes(state.activeWorkType)
    );
  }

  function formatMatches(item) {
    const formatTerm = normalizeQuery(dom.formatInput.value);
    if (!formatTerm) return true;
    return (
      item.format.toLowerCase().includes(formatTerm) ||
      item.workType.toLowerCase().includes(formatTerm) ||
      item.formatTags?.some((tag) => tag.includes(formatTerm))
    );
  }

  function localIndexMatches(item) {
    const localTerm = normalizeQuery(dom.localIndexSearchInput?.value || "");
    if (!localTerm) return true;

    const localHaystack = [
      item.title,
      item.subtitle,
      item.relativePath,
      item.sourcePathLabel,
      item.format,
      item.workType,
      item.periodSearchText,
      item.assetStage,
      item.qualityLevel,
      item.completionScore,
      item.qualityScore,
      item.aiRepairLabel,
      item.securityLevelName,
      item.storageSourceType,
      item.storageProvider,
      item.accessMode,
      item.syncStrategy,
      item.syncStatus,
      item.status,
      item.sizeLabel,
      item.modifiedAt,
    ]
      .join(" ")
      .toLowerCase();

    return localTerm
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => localHaystack.includes(term));
  }

  function getFilteredArchives() {
    const terms = queryTerms(dom.searchInput.value);

    return archives.filter((item) => {
      const haystack = archiveText(item);
      const queryMatch = !terms.length || terms.some((term) => haystack.includes(term));
      return (
        quickFilterMatches(item) &&
        queryMatch &&
        localIndexMatches(item) &&
        fieldMatches(item) &&
        workTypeMatches(item) &&
        formatMatches(item)
      );
    });
  }

  function tagClass(value) {
    if (value.includes("半成品") || value.includes("收尾")) return "finish";
    if (value.includes("经典")) return "classic";
    if (value.includes("制度") || value.includes("示范")) return "classic";
    if (value.includes("隐私")) return "private";
    if (value.includes("录音")) return "audio";
    return "video";
  }

  function renderCell(item, column) {
    if (column.key === "title") {
      return `
        <td>
          <div class="title-cell">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.subtitle)}</span>
          </div>
        </td>
      `;
    }

    if (column.key === "status") {
      return `<td><span class="tag ${tagClass(item.status)}">${escapeHtml(item.status)}</span></td>`;
    }

    if (column.key === "assetStage" || column.key === "qualityLevel") {
      return `<td><span class="tag ${tagClass(item[column.key])}">${escapeHtml(item[column.key])}</span></td>`;
    }

    if (column.key === "completionScore") {
      return `<td><span class="tag score-tag ${escapeHtml(item.completionGrade)}">${escapeHtml(item.completionScore)}%</span></td>`;
    }

    if (column.key === "qualityScore") {
      return `<td><span class="tag score-tag ${escapeHtml(item.qualityGrade)}">${escapeHtml(item.qualityScore)}</span></td>`;
    }

    if (column.key === "aiRepairLabel") {
      const tag = item.aiRepairCandidate ? "repair-ready" : item.completionScore >= 90 ? "classic" : "finish";
      return `<td><span class="tag ${tag}">${escapeHtml(item.aiRepairLabel)}</span></td>`;
    }

    if (column.key === "score") {
      return `<td><span class="tag ${escapeHtml(item.grade)}">${escapeHtml(item.grade)} · ${escapeHtml(item.score)}</span></td>`;
    }

    if (column.key === "level") {
      return `<td><span class="tag ${escapeHtml(item.level)}">${escapeHtml(item.level)}</span></td>`;
    }

    return `<td>${escapeHtml(item[column.key])}</td>`;
  }

  function renderResults() {
    const results = getFilteredArchives();
    dom.resultBody.innerHTML = "";

    if (!results.length) {
      state.selectedId = "";
      dom.resultBody.innerHTML = `
        <tr>
          <td colspan="${config.tableColumns.length}">
            <div class="empty-state">当前条件下没有匹配档案</div>
          </td>
        </tr>
      `;
      renderEmptyPreview();
      return;
    }

    const selected = results.find((item) => item.id === state.selectedId) || results[0];
    state.selectedId = selected.id;

    results.forEach((item) => {
      const row = document.createElement("tr");
      row.dataset.id = item.id;
      row.className = item.id === state.selectedId ? "selected" : "";
      row.innerHTML = config.tableColumns.map((column) => renderCell(item, column)).join("");
      row.addEventListener("click", () => {
        state.selectedId = item.id;
        renderResults();
      });
      dom.resultBody.appendChild(row);
    });

    renderPreview(selected);
  }

  function renderEmptyPreview() {
    dom.previewTitle.textContent = "没有匹配档案";
    dom.previewLevel.textContent = "--";
    dom.previewSummary.textContent = "当前检索条件下没有匹配档案，请清空条件或更换项目、公司、部门、员工、类型或格式关键词。";
    dom.previewFrame.className = "preview-frame doc-preview";
    dom.previewFrame.innerHTML = `
      <div class="video-stage">
        <button id="playButton" class="play-button" type="button" aria-label="无预览" disabled>
          <i data-lucide="file-search"></i>
        </button>
        <div>
          <strong>暂无可预览内容</strong>
          <span>请调整筛选条件后再查看档案详情</span>
        </div>
      </div>
    `;
    dom.previewMeta.innerHTML = "";
    dom.permissionStrip.innerHTML = `
      <button class="primary-action" type="button" disabled>无可复制路径</button>
      <button class="secondary-action" type="button" disabled>无关联资料</button>
    `;
    refreshIcons();
  }

  function renderPreview(item) {
    dom.previewTitle.textContent = item.title;
    dom.previewLevel.textContent = item.level;
    dom.previewSummary.textContent = item.summary;
    dom.previewFrame.className = `preview-frame ${item.preview}-preview`;

    const mediaLabel = {
      video: "视频/视觉预览",
      audio: "录音波形和转写",
      doc: "文档 PDF 预览",
      image: "图片墙预览",
    }[item.preview];

    dom.previewFrame.innerHTML = `
      <div class="video-stage">
        <button id="playButton" class="play-button" type="button" aria-label="播放预览">
          <i data-lucide="${item.preview === "doc" ? "file-text" : "play"}"></i>
        </button>
        <div>
          <strong>${escapeHtml(mediaLabel)}</strong>
          <span>${escapeHtml(item.id)} · ${escapeHtml(item.format)} · ${escapeHtml(item.status)}</span>
        </div>
      </div>
    `;

    const metaItems = [
      `项目：${item.project}`,
      `项目类型：${item.projectType}`,
      `公司：${item.company}`,
      `公司类型：${item.companyType}`,
      `部门：${item.department}`,
      `部门建制：${item.departmentSystem}`,
      `作者：${item.author}`,
      `负责人：${item.owner}`,
      `负责人等级：${item.ownerLevel}`,
      `职能：${item.functionRole}`,
      `周期：${item.period}`,
      `周期阶段搜索：${item.periodSearchText}`,
      `创建时间：${item.createdAt}`,
      `作品类型：${item.workType}`,
      `完整状态：${item.assetStage}`,
      `作品等级：${item.qualityLevel}`,
      `完成度评分：${item.completionScore}%`,
      `作品水准评分：${item.qualityScore}`,
      `AI 修复候选：${item.aiRepairLabel}`,
      `格式：${item.format}`,
      `存储来源：${item.storageSourceType}`,
      `存储名称：${item.storageProvider}`,
      `接入方式：${item.accessMode}`,
      `同步策略：${item.syncStrategy}`,
      `同步状态：${item.syncStatus}`,
      `交叉校验：${item.crossCheckPolicy}`,
      `存储风险：${item.storageRisk}`,
      `成本等级：${item.storageCostLevel}`,
      `密级说明：${item.securityLevelName}`,
    ];

    if (item.sizeLabel) metaItems.push(`大小：${item.sizeLabel}`);
    if (item.modifiedAt) metaItems.push(`修改：${item.modifiedAt}`);
    if (item.relativePath) metaItems.push(`路径：${item.relativePath}`);

    dom.previewMeta.innerHTML = metaItems
      .map((text) => `<span class="meta-chip">${escapeHtml(text)}</span>`)
      .join("");

    const playButton = document.querySelector("#playButton");
    playButton.addEventListener("click", () => {
      const icon = playButton.querySelector("i");
      playButton.setAttribute("aria-label", "预览中");
      playButton.classList.add("is-playing");
      if (icon) icon.setAttribute("data-lucide", "pause");
      refreshIcons();
    });

    renderPermissionActions(item);

    refreshIcons();
  }

  function renderPermissionActions(item) {
    const hasLocalPath = Boolean(item.hasLocalPath || item.localId || item.path);
    const copyLabel = item.relativePath || item.sourcePathLabel || item.id;
    dom.permissionStrip.innerHTML = hasLocalPath
      ? `
          <button id="copyPathButton" class="primary-action" type="button">复制相对路径</button>
          <button id="openFolderButton" class="secondary-action" type="button">打开所在位置申请</button>
        `
      : `
          <button class="primary-action" type="button">申请复制</button>
          <button class="secondary-action" type="button">查看关联资料</button>
        `;

    if (!hasLocalPath) return;

    const copyPathButton = document.querySelector("#copyPathButton");
    const openFolderButton = document.querySelector("#openFolderButton");

    copyPathButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyLabel);
        copyPathButton.textContent = "相对路径已复制";
      } catch {
        copyPathButton.textContent = "请手动复制相对路径";
      }
    });

    openFolderButton.addEventListener("click", async () => {
      openFolderButton.textContent = "正在请求打开";
      try {
        const response = await fetch(`/api/reveal?id=${encodeURIComponent(item.localId || item.id)}`, { method: "POST" });
        const result = await response.json();
        openFolderButton.textContent = result.ok ? "已请求打开位置" : "打开申请被拒绝";
      } catch {
        openFolderButton.textContent = "打开申请需本地服务";
      }
    });
  }

  function renderFinishList() {
    dom.finishList.innerHTML = finishItems
      .map((item) => {
        const completion = clampScore(item.completionScore ?? inferCompletionScore(item), 75);
        const quality = clampScore(item.qualityScore ?? item.score, 75);
        const repairLabel = item.aiRepairLabel || aiRepairLabel(item, completion);
        const repairReady = isAiRepairCandidate(item, completion);
        return `
          <div class="finish-item">
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.detail)}</p>
              <div class="finish-meta">
                <span class="${repairReady ? "ready" : ""}">${escapeHtml(repairLabel)}</span>
                <span>完成度 90% 以上优先 AI 收尾</span>
              </div>
            </div>
            <div class="score-stack" aria-label="完成度和作品水准评分">
              <div class="score-badge ${escapeHtml(gradeFromScore(completion))}">
                <small>完成度</small>
                <strong>${escapeHtml(completion)}%</strong>
              </div>
              <div class="score-badge ${escapeHtml(gradeFromScore(quality))}">
                <small>水准</small>
                <strong>${escapeHtml(quality)}</strong>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function topDistributionName(distribution = {}) {
    return Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "未识别";
  }

  function renderBatchHistory() {
    if (!dom.batchHistoryList) return;
    const batches = batchHistory.length ? batchHistory : latestBatch ? [latestBatch] : [];
    if (dom.batchHistoryStatus) {
      dom.batchHistoryStatus.textContent = batches.length ? `已记录 ${batches.length} 个批次` : "等待批次";
    }

    if (!batches.length) {
      dom.batchHistoryList.innerHTML = `
        <div class="batch-empty">
          <strong>暂无扫描批次</strong>
          <span>双击桌面“黑卫士AI只读扫描文件夹.command”后，会在这里显示批次历史。</span>
        </div>
      `;
      return;
    }

    const mergedCard = mergedIndex
      ? `
        <article class="batch-card merged">
          <div class="batch-card-head">
            <strong>多目录合并索引</strong>
            <em>${escapeHtml(mergedIndex.sourceCount || 0)} 个来源</em>
          </div>
          <div class="batch-card-grid">
            <span><b>合并文件</b>${escapeHtml(mergedIndex.totalFiles || 0)}</span>
            <span><b>总体积</b>${escapeHtml(mergedIndex.totalSizeLabel || "--")}</span>
            <span><b>重复跳过</b>${escapeHtml(mergedIndex.duplicateCount || 0)}</span>
            <span><b>扫描告警</b>${mergedIndex.truncated ? "有上限截断" : `跳过 ${escapeHtml(mergedIndex.skippedCount || 0)} 项`}</span>
          </div>
        </article>
      `
      : "";

    dom.batchHistoryList.innerHTML = [
      ...batches.map((batch) => {
        const risk = topDistributionName(batch.distributions?.risk);
        const workType = topDistributionName(batch.distributions?.workType);
        return `
          <article class="batch-card">
            <div class="batch-card-head">
              <strong>${escapeHtml(batch.batchId)}</strong>
              <em>${escapeHtml((batch.generatedAt || "").slice(0, 16).replace("T", " "))}</em>
            </div>
            <div class="batch-card-grid">
              <span><b>来源</b>${escapeHtml(batch.sourceType || batch.rootLabel || "未识别")}</span>
              <span><b>文件数量</b>${escapeHtml(batch.totalFiles || 0)}</span>
              <span><b>总体积</b>${escapeHtml(batch.totalSizeLabel || "--")}</span>
              <span><b>默认密级</b>${escapeHtml(batch.defaultSecurity || "待复核")}</span>
              <span><b>主要类型</b>${escapeHtml(workType)}</span>
              <span><b>风险</b>${escapeHtml(risk)}</span>
            </div>
            <p>${escapeHtml(batch.scanPolicy || "只读扫描，不移动、不删除、不改名真实文件。")}</p>
          </article>
        `;
      }),
      mergedCard,
    ].join("");
  }

  function renderSampleValidation() {
    if (!dom.sampleValidationList) return;
    const checklist = Array.isArray(config.sampleValidationChecklist) ? config.sampleValidationChecklist : [];
    const fields = Array.isArray(config.sampleValidationFields) ? config.sampleValidationFields : [];
    const preflightChecks = Array.isArray(config.samplePreflightChecks) ? config.samplePreflightChecks : [];
    const decisions = Array.isArray(config.sampleResultDecisions) ? config.sampleResultDecisions : [];
    if (dom.sampleValidationStatus) {
      dom.sampleValidationStatus.textContent = checklist.length
        ? `${checklist.length} 步流程 · ${fields.length} 项登记 · ${preflightChecks.length} 项检查 · ${decisions.length} 个结果`
        : "等待流程";
    }

    dom.sampleValidationList.innerHTML = checklist
      .map(
        (item) => `
          <article class="validation-card">
            <div class="validation-step">${escapeHtml(item.step)}</div>
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.gate)}</p>
              <div class="validation-meta">
                <span><b>责任人</b>${escapeHtml(item.owner)}</span>
                <span><b>输出物</b>${escapeHtml(item.output)}</span>
              </div>
            </div>
          </article>
        `,
      )
      .join("");

    if (!dom.sampleValidationForm) return;
    dom.sampleValidationForm.innerHTML = `
      <div class="sample-form-head">
        <div>
          <p class="eyebrow">点验登记模板</p>
          <h3>真实样本接入前，先把这张表填完整</h3>
        </div>
        <span>未填完整不进入全量扫描</span>
      </div>
      <div class="sample-field-grid">
        ${fields
          .map(
            (field) => `
              <span>
                <b>${escapeHtml(field.label)}</b>
                ${escapeHtml(field.value)}
              </span>
            `,
          )
          .join("")}
      </div>
    `;

    if (!dom.samplePreflightList) return;
    dom.samplePreflightList.innerHTML = `
      <div class="sample-form-head">
        <div>
          <p class="eyebrow">扫描前检查清单</p>
          <h3>这些关口未通过，不进入真实扫描</h3>
        </div>
        <span>先点验，再扩大</span>
      </div>
      <div class="preflight-grid">
        ${preflightChecks
          .map(
            (check) => `
              <article class="preflight-card">
                <strong>${escapeHtml(check.title)}</strong>
                <p>${escapeHtml(check.detail)}</p>
                <em>${escapeHtml(check.status)}</em>
              </article>
            `,
          )
          .join("")}
      </div>
    `;

    if (!dom.sampleDecisionList) return;
    dom.sampleDecisionList.innerHTML = `
      <div class="sample-form-head">
        <div>
          <p class="eyebrow">点验结果判定表</p>
          <h3>样本跑完以后，只能进入这几个结果</h3>
        </div>
        <span>结果决定下一步</span>
      </div>
      <div class="decision-grid">
        ${decisions
          .map(
            (decision) => `
              <article class="decision-card ${escapeHtml(decision.color)}">
                <strong>${escapeHtml(decision.result)}</strong>
                <p>${escapeHtml(decision.rule)}</p>
                <em>${escapeHtml(decision.next)}</em>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderSelectedIntake(source) {
    if (!source || !dom.intakeSelected) return;

    dom.intakeSelected.innerHTML = `
      <div class="intake-selected-main">
        <span class="intake-icon large"><i data-lucide="${escapeHtml(source.icon)}"></i></span>
        <div>
          <p class="eyebrow">当前采集入口</p>
          <h3>${escapeHtml(source.name)}进入 NAS 的第一步</h3>
          <p>${escapeHtml(source.next)}</p>
        </div>
      </div>
      <div class="intake-selected-grid">
        <span><b>来源例子</b>${escapeHtml(source.examples)}</span>
        <span><b>接入方式</b>${escapeHtml(source.access)}</span>
        <span><b>归集位置</b>${escapeHtml(source.target)}</span>
        <span><b>状态/风险</b>${escapeHtml(source.status)} · ${escapeHtml(source.risk)}</span>
      </div>
      <div class="intake-batch-panel">
        <div class="intake-batch-head">
          <strong>真实接入批次控制</strong>
          <em>建议批次：${escapeHtml(source.batchPrefix || "SRC")}-${new Date().getFullYear()}-001</em>
        </div>
        <div class="intake-batch-grid">
          <span><b>扫描范围</b>${escapeHtml(source.scanScope || "待确认")}</span>
          <span><b>默认密级</b>${escapeHtml(source.securityDefault || "待人工确认")}</span>
          <span><b>扫描前确认</b>${escapeHtml(source.precheck || "确认来源、负责人和授权范围")}</span>
          <span><b>扫描报告</b>${escapeHtml(source.report || "输出数量、体积、格式、风险和失败条目")}</span>
          <span><b>NAS 入口</b>${escapeHtml(source.nasGate || "授权后进入 NAS 暂存区")}</span>
          <span><b>AI 候选边界</b>${escapeHtml(source.aiGate || "高密级默认不进 AI")}</span>
        </div>
      </div>
    `;
    refreshIcons();
  }

  function setActiveButton(container, selector, dataName, value) {
    container.querySelectorAll(selector).forEach((button) => {
      button.classList.toggle("active", button.dataset[dataName] === value);
    });
  }

  function resetFilters() {
    dom.searchInput.value = "";
    fieldInputs().forEach((input) => {
      input.value = "";
    });
    dom.formatInput.value = "";
    if (dom.localIndexSearchInput) dom.localIndexSearchInput.value = "";
    document.querySelectorAll(".local-shortcut").forEach((button) => button.classList.remove("active"));
    state.activeWorkType = "all";
    state.activeFilter = "all";
    setActiveButton(dom.typeChipRow, ".type-chip", "workType", "all");
    setActiveButton(dom.quickFilterRow, ".filter-chip", "filter", "all");
    renderResults();
  }

  function bindLayoutWorkbenchEvents() {
    dom.navList?.addEventListener("dragstart", (event) => {
      const button = event.target.closest(".nav-item");
      if (!button) return;
      state.dragPayload = { type: "nav", section: button.dataset.section };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", button.dataset.section || "");
      button.classList.add("dragging");
    });

    dom.navList?.addEventListener("dragend", () => {
      state.dragPayload = null;
      dom.navList.querySelectorAll(".dragging").forEach((item) => item.classList.remove("dragging"));
    });

    dom.navList?.addEventListener("dragover", (event) => {
      if (state.dragPayload?.type !== "nav") return;
      const button = event.target.closest(".nav-item");
      if (!button) return;
      event.preventDefault();
    });

    dom.navList?.addEventListener("drop", (event) => {
      if (state.dragPayload?.type !== "nav") return;
      const button = event.target.closest(".nav-item");
      if (!button) return;
      event.preventDefault();
      const fromIndex = state.menuOrder.indexOf(state.dragPayload.section);
      const toIndex = state.menuOrder.indexOf(button.dataset.section);
      state.menuOrder = reorderArray(state.menuOrder, fromIndex, toIndex);
      saveMenuOrder();
      renderNavList();
      renderLayoutWorkbench();
    });

    dom.routeModuleMap?.addEventListener("click", (event) => {
      const moduleButton = event.target.closest(".route-module-pill");
      if (moduleButton) {
        scrollToModule(moduleButton.dataset.moduleId);
        return;
      }
      const bin = event.target.closest("[data-drop-section]");
      if (!bin) return;
      activateSection(bin.dataset.dropSection);
    });

    dom.routeModuleMap?.addEventListener("dragover", (event) => {
      if (state.dragPayload?.type !== "secondary") return;
      const bin = event.target.closest("[data-drop-section]");
      if (!bin) return;
      event.preventDefault();
      bin.classList.add("drop-active");
    });

    dom.routeModuleMap?.addEventListener("dragleave", (event) => {
      event.target.closest("[data-drop-section]")?.classList.remove("drop-active");
    });

    dom.routeModuleMap?.addEventListener("drop", (event) => {
      if (state.dragPayload?.type !== "secondary") return;
      const bin = event.target.closest("[data-drop-section]");
      if (!bin) return;
      event.preventDefault();
      bin.classList.remove("drop-active");
      moveSecondaryItem(state.dragPayload.section, state.dragPayload.index, bin.dataset.dropSection, 0);
      activateSection(bin.dataset.dropSection, { scroll: false });
    });

    dom.secondaryWorkbenchList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-module-id]");
      if (!button) return;
      scrollToModule(button.dataset.moduleId);
    });

    dom.secondaryWorkbenchList?.addEventListener("dragstart", (event) => {
      const item = event.target.closest(".secondary-item");
      if (!item) return;
      state.dragPayload = {
        type: "secondary",
        section: state.activeSection,
        index: Number(item.dataset.secondaryIndex),
      };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.secondaryIndex || "0");
      item.classList.add("dragging");
    });

    dom.secondaryWorkbenchList?.addEventListener("dragend", () => {
      state.dragPayload = null;
      dom.secondaryWorkbenchList.querySelectorAll(".dragging").forEach((item) => item.classList.remove("dragging"));
    });

    dom.secondaryWorkbenchList?.addEventListener("dragover", (event) => {
      if (state.dragPayload?.type !== "secondary") return;
      const item = event.target.closest(".secondary-item");
      if (!item) return;
      event.preventDefault();
    });

    dom.secondaryWorkbenchList?.addEventListener("drop", (event) => {
      if (state.dragPayload?.type !== "secondary") return;
      const item = event.target.closest(".secondary-item");
      if (!item) return;
      event.preventDefault();
      moveSecondaryItem(state.dragPayload.section, state.dragPayload.index, state.activeSection, Number(item.dataset.secondaryIndex));
    });

    dom.moduleWorkbenchList?.addEventListener("click", (event) => {
      const row = event.target.closest(".module-item");
      if (!row) return;
      const moduleId = row.dataset.moduleId;
      const sizeButton = event.target.closest("button[data-size]");
      const lockButton = event.target.closest("button[data-lock-toggle]");
      if (sizeButton) {
        if (state.moduleLayouts[moduleId]?.locked) return;
        state.moduleLayouts[moduleId] = {
          ...(state.moduleLayouts[moduleId] || {}),
          size: sizeButton.dataset.size,
          locked: false,
        };
        saveModuleLayouts();
        applyModuleLayouts();
        renderLayoutWorkbench();
        scrollToModule(moduleId, false);
        return;
      }
      if (lockButton) {
        const current = state.moduleLayouts[moduleId] || {};
        state.moduleLayouts[moduleId] = {
          size: current.size || moduleCatalogItem(moduleId)?.defaultSize || "normal",
          locked: !current.locked,
        };
        saveModuleLayouts();
        applyModuleLayouts();
        renderLayoutWorkbench();
        return;
      }
      scrollToModule(moduleId);
    });

    dom.moduleWorkbenchList?.addEventListener("dragstart", (event) => {
      const item = event.target.closest(".module-item");
      if (!item || state.moduleLayouts[item.dataset.moduleId]?.locked) return;
      state.dragPayload = { type: "module", moduleId: item.dataset.moduleId };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.moduleId || "");
      item.classList.add("dragging");
    });

    dom.moduleWorkbenchList?.addEventListener("dragend", () => {
      state.dragPayload = null;
      dom.moduleWorkbenchList.querySelectorAll(".dragging").forEach((item) => item.classList.remove("dragging"));
    });

    dom.moduleWorkbenchList?.addEventListener("dragover", (event) => {
      if (state.dragPayload?.type !== "module") return;
      const item = event.target.closest(".module-item");
      if (!item || state.moduleLayouts[item.dataset.moduleId]?.locked) return;
      event.preventDefault();
    });

    dom.moduleWorkbenchList?.addEventListener("drop", (event) => {
      if (state.dragPayload?.type !== "module") return;
      const item = event.target.closest(".module-item");
      if (!item) return;
      event.preventDefault();
      moveModuleInActiveMenu(state.dragPayload.moduleId, item.dataset.moduleId);
    });
  }

  function bindAppearanceEvents() {
    dom.appearanceToggle.addEventListener("click", () => {
      const isHidden = dom.appearancePanel.hidden;
      dom.appearancePanel.hidden = !isHidden;
      dom.appearanceToggle.setAttribute("aria-expanded", String(isHidden));
    });

    dom.paletteRow.addEventListener("click", (event) => {
      const button = event.target.closest(".palette-button");
      if (!button) return;
      const palette = config.appearance.palettes.find((item) => item.key === button.dataset.palette);
      if (!palette) return;
      applyAppearance({
        ...currentAppearance(),
        palette: palette.key,
        accent: palette.accent,
        sidebar: palette.sidebar,
        page: palette.page,
      });
    });

    [dom.accentColorInput, dom.sidebarColorInput, dom.pageColorInput].forEach((input) => {
      input.addEventListener("input", () => {
        applyAppearance({ ...currentAppearance(), palette: "custom" });
      });
    });

    dom.fontSelect.addEventListener("change", () => {
      applyAppearance(currentAppearance());
    });

    dom.fontSizeRange.addEventListener("input", () => {
      applyAppearance(currentAppearance());
    });

    dom.resetAppearance.addEventListener("click", () => {
      applyAppearance(defaultAppearance());
    });

    dom.menuPositionControls?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-menu-position]");
      if (!button) return;
      state.menuLayout.position = button.dataset.menuPosition;
      applyMenuLayout();
    });

    dom.menuCollapseToggle?.addEventListener("click", () => {
      state.menuLayout.collapsed = !state.menuLayout.collapsed;
      applyMenuLayout();
    });
  }

  function bindEvents() {
    dom.roleSelect?.addEventListener("change", () => {
      state.activeRole = dom.roleSelect.value;
      renderSaasConsole();
      renderResults();
    });

    dom.menuSearchInput?.addEventListener("input", () => {
      const term = normalizeQuery(dom.menuSearchInput.value);
      dom.navList.querySelectorAll(".nav-item").forEach((button) => {
        const text = button.textContent.toLowerCase();
        button.hidden = Boolean(term) && !term.split(/\s+/).every((item) => text.includes(item));
      });
      if (dom.sectionSearchInput) dom.sectionSearchInput.value = dom.menuSearchInput.value;
      renderSecondaryMenus();
    });

    dom.sectionSearchInput?.addEventListener("input", renderSecondaryMenus);

    dom.navList.addEventListener("click", (event) => {
      const button = event.target.closest(".nav-item");
      if (!button) return;
      activateSection(button.dataset.section);
    });

    dom.secondaryMenuGrid?.addEventListener("click", (event) => {
      const chip = event.target.closest(".secondary-chip-row button");
      if (!chip) return;
      activateSection(chip.dataset.section || state.activeSection, {
        moduleId: chip.dataset.moduleId,
        query: chip.dataset.query ?? chip.textContent.trim(),
      });
    });

    dom.secondaryMenuGrid?.addEventListener("input", (event) => {
      const input = event.target.closest(".mini-search input");
      if (!input) return;
      dom.searchInput.value = input.value;
      renderResults();
    });

    dom.moduleToggleGrid?.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-module-key]");
      if (!input) return;
      state.enabledModules[input.dataset.moduleKey] = input.checked;
      renderSaasConsole();
    });

    dom.fileTypeLibrary?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-file-query]");
      if (!button) return;
      dom.formatInput.value = button.dataset.fileQuery || button.textContent.trim();
      renderResults();
    });

    dom.quickFilterRow.addEventListener("click", (event) => {
      const button = event.target.closest(".filter-chip");
      if (!button) return;
      state.activeFilter = button.dataset.filter;
      setActiveButton(dom.quickFilterRow, ".filter-chip", "filter", state.activeFilter);
      renderResults();
    });

    dom.typeChipRow.addEventListener("click", (event) => {
      const button = event.target.closest(".type-chip");
      if (!button) return;
      state.activeWorkType = button.dataset.workType;
      setActiveButton(dom.typeChipRow, ".type-chip", "workType", state.activeWorkType);
      renderResults();
    });

    dom.intakeSourceGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".intake-card");
      if (!button) return;
      const source = config.intakeSources.find((item) => item.key === button.dataset.intakeKey);
      dom.intakeSourceGrid.querySelectorAll(".intake-card").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderSelectedIntake(source);
    });

    document.querySelectorAll(".segmented button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".segmented button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
    });

    dom.searchInput.addEventListener("input", renderResults);
    dom.localIndexSearchInput?.addEventListener("input", () => {
      document.querySelectorAll(".local-shortcut").forEach((button) => button.classList.remove("active"));
      renderResults();
    });
    dom.clearLocalSearch?.addEventListener("click", () => {
      dom.localIndexSearchInput.value = "";
      document.querySelectorAll(".local-shortcut").forEach((button) => button.classList.remove("active"));
      renderResults();
    });
    document.querySelectorAll(".local-shortcut").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".local-shortcut").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        dom.localIndexSearchInput.value = button.dataset.localQuery || "";
        renderResults();
      });
    });
    dom.keywordGrid.addEventListener("input", renderResults);
    dom.formatInput.addEventListener("input", renderResults);
    dom.clearFieldSearch.addEventListener("click", resetFilters);

    dom.voiceButton.addEventListener("click", () => {
      dom.voiceButton.classList.toggle("listening");
      dom.voiceButton.querySelector("span").textContent = dom.voiceButton.classList.contains("listening")
        ? "聆听中"
        : "语音";
    });

    bindLayoutWorkbenchEvents();
    bindAppearanceEvents();
  }

  renderConfigDrivenSections();
  applyAppearance(loadAppearance(), false);
  applyMenuLayout(false);
  bindEvents();
  renderResults();
  renderFinishList();
  refreshIcons();
})();
