export const brand = {
  acronym: "BG AI DAMS",
  cnName: "黑卫士 AI 数字档案管理系统",
  enName: "Black Guard AI Digital Archive Management System",
  version: "Vue 响应式重构版",
};

export const navSections = [
  {
    title: "档案总控",
    items: ["全网看板", "数据分布", "搜索中心", "预览授权", "导入导出"],
  },
  {
    title: "组织架构",
    items: ["公司的组织架构", "部门文档", "历史组织架构", "人事导入"],
  },
  {
    title: "权限与审计",
    items: ["分级授权", "双人共同查看", "查看台账", "积分兑换"],
  },
  {
    title: "系统设置",
    items: ["加密文件策略", "AI 接入", "平台接入", "备份容灾"],
  },
];

export const quickCategories = [
  {
    id: "owner",
    title: "老板个人档案",
    scope: "个人资产、决策手稿、重要证照",
    count: 1280,
    access: "授权打开",
    tone: "black",
  },
  {
    id: "family",
    title: "家庭档案",
    scope: "家庭合同、证件、影像和资产资料",
    count: 936,
    access: "家庭权限",
    tone: "green",
  },
  {
    id: "company",
    title: "公司档案",
    scope: "制度、业务、财务、项目与客户档案",
    count: 8420,
    access: "公司权限",
    tone: "blue",
  },
  {
    id: "active",
    title: "在职档案",
    scope: "在职人员、岗位、部门协作资料",
    count: 2146,
    access: "部门授权",
    tone: "cyan",
  },
  {
    id: "former",
    title: "离职档案",
    scope: "离职交接、历史项目、保密承诺",
    count: 584,
    access: "审计授权",
    tone: "amber",
  },
  {
    id: "works",
    title: "经典作品",
    scope: "方案、提案、案例、品牌资产",
    count: 678,
    access: "价值授权",
    tone: "red",
  },
  {
    id: "contracts",
    title: "合同案例",
    scope: "合同、回款、招采、争议处理",
    count: 1560,
    access: "法务授权",
    tone: "violet",
  },
  {
    id: "hidden-sample",
    title: "隐藏按钮样例",
    scope: "可自定义新增、隐藏、授权开放",
    count: 0,
    access: "隐藏",
    tone: "gray",
    hidden: true,
  },
];

export const searchModes = ["模糊搜索", "精准搜索", "全文搜索", "组织架构检索"];

export const documents = [
  {
    id: "doc-001",
    title: "集团年度经营核心参数表",
    categoryId: "company",
    securityLevel: "L6 绝密",
    risk: "critical",
    previewMode: "不可浏览，仅显示标题和审批路径",
    size: "86.4 MB",
    createdAt: "2024-11-18 09:24",
    modifiedAt: "2026-06-26 21:10",
    modifiedCount: 19,
    modifiedBy: "财务中心 / 王敏",
    modifiedDevice: "MacBook Pro 财务专机",
    macAddress: "受控读取",
    ipAddress: "10.8.12.46",
    coordinate: "上海总部 31.2304, 121.4737",
    controls: ["双人共同查看", "摄像头", "人脸识别", "鼠标控制", "防偷拍水印"],
  },
  {
    id: "doc-002",
    title: "经典作品：汽车品牌发布会全案",
    categoryId: "works",
    securityLevel: "L4 最高机密",
    risk: "high",
    previewMode: "带底纹浏览，禁止下载原件",
    size: "1.8 GB",
    createdAt: "2021-05-09 15:32",
    modifiedAt: "2025-12-04 10:18",
    modifiedCount: 43,
    modifiedBy: "品牌事业部 / Alex",
    modifiedDevice: "Windows 工作站 A17",
    macAddress: "受控读取",
    ipAddress: "172.16.6.29",
    coordinate: "北京项目室 39.9042, 116.4074",
    controls: ["双人共同查看", "摄像头", "人脸识别", "防偷拍水印"],
  },
  {
    id: "doc-003",
    title: "家庭资产保险合同清单",
    categoryId: "family",
    securityLevel: "L3 保密",
    risk: "medium",
    previewMode: "浏览全文，下载需家庭授权",
    size: "18.2 MB",
    createdAt: "2023-03-12 11:05",
    modifiedAt: "2026-03-19 08:46",
    modifiedCount: 8,
    modifiedBy: "家庭档案管理员",
    modifiedDevice: "iPad Pro",
    macAddress: "移动端不直接展示",
    ipAddress: "192.168.31.82",
    coordinate: "家庭网络",
    controls: ["水印", "查看台账"],
  },
  {
    id: "doc-004",
    title: "员工入职材料归档模板",
    categoryId: "active",
    securityLevel: "L1 普通",
    risk: "normal",
    previewMode: "普通文件无需摄像头，可浏览全文",
    size: "2.4 MB",
    createdAt: "2025-08-02 13:20",
    modifiedAt: "2026-02-01 17:06",
    modifiedCount: 3,
    modifiedBy: "人事部门 / 陈洁",
    modifiedDevice: "Windows HR-03",
    macAddress: "内网设备登记",
    ipAddress: "10.8.3.15",
    coordinate: "人事办公室",
    controls: ["查看台账"],
  },
];

export const organizationUnits = [
  {
    id: "board-office",
    name: "董事会办公室",
    owner: "最高授权人",
    documentCount: 418,
    highSecurityCount: 92,
    scope: "董事会决议、战略文件、重大授权记录",
    quickQuery: "按部门查文档",
  },
  {
    id: "finance-center",
    name: "财务中心",
    owner: "财务负责人",
    documentCount: 1260,
    highSecurityCount: 286,
    scope: "预算、回款、发票、税务、核心参数",
    quickQuery: "查财务文档",
  },
  {
    id: "brand-division",
    name: "品牌事业部",
    owner: "事业部负责人",
    documentCount: 2144,
    highSecurityCount: 168,
    scope: "作品、提案、客户案例、项目复盘",
    quickQuery: "查经典作品",
  },
  {
    id: "hr",
    name: "人事部门",
    owner: "HR 负责人",
    documentCount: 936,
    highSecurityCount: 74,
    scope: "在职档案、离职档案、历史组织架构图",
    quickQuery: "查人员档案",
  },
];

export const historicalOrgImports = [
  {
    period: "1998-2006",
    source: "人事部门导入",
    fileType: "历史组织架构图",
    status: "待 OCR 校验",
  },
  {
    period: "2007-2016",
    source: "人事部门导入",
    fileType: "部门岗位表",
    status: "可按部门查文档",
  },
  {
    period: "2017-2026",
    source: "组织架构系统同步",
    fileType: "当前组织架构",
    status: "已接入检索",
  },
];

export const accessPolicies = [
  {
    level: "L1 普通",
    browse: "浏览全文",
    download: "普通授权下载",
    camera: "不要求摄像头",
    watermark: "基础水印",
    approval: "本人或部门授权",
  },
  {
    level: "L2 普通受控",
    browse: "浏览全文",
    download: "分级授权下载",
    camera: "按策略开启",
    watermark: "动态水印",
    approval: "部门负责人审批",
  },
  {
    level: "L3 保密",
    browse: "带底纹浏览",
    download: "分级授权查看下载",
    camera: "摄像头开启",
    watermark: "公众浏览防偷拍",
    approval: "两级审批",
  },
  {
    level: "L4 最高机密",
    browse: "仅受控浏览",
    download: "禁止直接导出",
    camera: "人脸识别 + 鼠标控制",
    watermark: "强水印 + 防偷拍",
    approval: "双人共同查看",
  },
  {
    level: "L6 绝密",
    browse: "不可浏览",
    download: "禁止下载原件",
    camera: "摄像头、人脸识别全程开启",
    watermark: "仅标题和审批路径",
    approval: "至少 2 名最高授权人",
  },
];

export const settingsHubSections = [
  {
    title: "AI 接入",
    status: "待配置",
    description: "统一管理 Open cloud agent、Hermes agent、自定义 Agent 和模型权限。",
    items: ["模型供应商", "提示词模板", "禁训清单", "AI 修复候选"],
  },
  {
    title: "平台接入",
    status: "规划中",
    description: "对接 Windows、Mac、Linux、iOS、安卓、小程序、鸿蒙和后台服务。",
    items: ["端口清单", "角色终端", "统一登录", "审计回传"],
  },
  {
    title: "备份容灾",
    status: "原型中",
    description: "管理时间胶囊、克隆机、NAS 热备份、年度增量和视频冷存储。",
    items: ["三人会签", "增量备份", "恢复演练", "灾备台账"],
  },
  {
    title: "加密文件策略",
    status: "原型中",
    description: "把核心参数、红色重要文件和高密文档纳入统一加密策略。",
    items: ["核心参数文件", "红色重要文件", "水印策略", "查看授权"],
  },
];

export const importExportRules = [
  {
    title: "导入必须查毒",
    detail: "所有文件导入先进入隔离区，完成杀毒、格式识别、路径脱敏后再入库。",
    gate: "查毒通过后入库",
  },
  {
    title: "导出分级授权",
    detail: "普通文件按角色授权，高级文件需要分级审批，最高机密禁止直接导出原件。",
    gate: "按密级审批",
  },
  {
    title: "双人授权",
    detail: "高级文件、深度价值文件和绝密文件必须至少两名授权人同时确认查看。",
    gate: "双人共同查看",
  },
  {
    title: "台账留痕",
    detail: "查看、导入、导出、下载和外发均写入每日台账，后续接入积分兑换。",
    gate: "每日审计",
  },
];

export const progressItems = [
  { label: "Vue 重构", value: 32, status: "真实索引和治理组件推进" },
  { label: "响应式多端", value: 34, status: "组件布局继续补齐" },
  { label: "1500 行治理", value: 38, status: "新增 Vue 文件合规" },
  { label: "权限分级", value: 52, status: "策略和导入导出治理已组件化" },
];

export const nextSteps = [
  "把静态原型核心模块拆成 Vue 组件",
  "补齐移动端、平板端、桌面端布局断点",
  "接入真实索引数据的只读展示层",
  "将权限、摄像头、人脸识别做成可配置策略",
];
