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
  const state = {
    activeFilter: "all",
    activeWorkType: "all",
    selectedId: archives[0]?.id || "",
  };

  const dom = {
    navList: document.querySelector("#navList"),
    metricGrid: document.querySelector("#metricGrid"),
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
      return { ...defaults, ...JSON.parse(localStorage.getItem("hws-archive-appearance") || "{}") };
    } catch {
      return defaults;
    }
  }

  function saveAppearance(settings) {
    try {
      localStorage.setItem("hws-archive-appearance", JSON.stringify(settings));
    } catch {
      // The prototype should still work when browser storage is unavailable.
    }
  }

  function applyAppearance(settings, shouldSave = true) {
    const selectedFont =
      config.appearance.fonts.find((font) => font.key === settings.font) || config.appearance.fonts[0];
    const root = document.documentElement;
    root.style.setProperty("--teal", settings.accent);
    root.style.setProperty("--teal-rgb", hexToRgb(settings.accent));
    root.style.setProperty("--teal-soft", lightenHex(settings.accent));
    root.style.setProperty("--sidebar", settings.sidebar);
    root.style.setProperty("--sidebar-2", lightenHex(settings.sidebar, 0.12));
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
    dom.navList.innerHTML = config.navItems
      .map(
        (item) => `
          <button class="nav-item ${item.active ? "active" : ""}" type="button" data-section="${escapeHtml(item.section)}">
            <i data-lucide="${escapeHtml(item.icon)}"></i>
            <span>${escapeHtml(item.label)}</span>
          </button>
        `,
      )
      .join("");

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
      `格式：${item.format}`,
      `存储来源：${item.storageSourceType}`,
      `存储名称：${item.storageProvider}`,
      `接入方式：${item.accessMode}`,
      `同步策略：${item.syncStrategy}`,
      `同步状态：${item.syncStatus}`,
      `交叉校验：${item.crossCheckPolicy}`,
      `存储风险：${item.storageRisk}`,
      `成本等级：${item.storageCostLevel}`,
      `评分：${item.grade} · ${item.score}`,
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
      .map(
        (item) => `
          <div class="finish-item">
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.detail)}</p>
            </div>
            <div class="score-badge ${escapeHtml(item.grade)}">${escapeHtml(item.grade)}<br />${escapeHtml(item.score)}</div>
          </div>
        `,
      )
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
  }

  function bindEvents() {
    dom.navList.addEventListener("click", (event) => {
      const button = event.target.closest(".nav-item");
      if (!button) return;
      dom.navList.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
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

    bindAppearanceEvents();
  }

  renderConfigDrivenSections();
  applyAppearance(loadAppearance(), false);
  bindEvents();
  renderResults();
  renderFinishList();
  refreshIcons();
})();
