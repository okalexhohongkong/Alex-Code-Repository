import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";

const projectRoot = resolve(".");
const scanRoot = resolve(process.argv[2] || ".");
const outputDir = resolve(projectRoot, "界面原型-v1");
const batchReportDir = resolve(projectRoot, "批次报告");
const maxFiles = Number(process.env.MAX_SCAN_FILES || 20000);

const ignoredDirs = new Set([".git", "node_modules", ".cache", "dist", "build", "备份快照", "批次报告"]);
const ignoredFiles = new Set([".DS_Store", "archive-index.json", "archive-index-data.js"]);
const skippedEntries = [];
const maxSkippedExamples = 50;
let skippedCount = 0;
let truncated = false;

const categoryByExt = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "heic", "tif", "tiff", "bmp", "svg"],
  design: ["psd", "ai", "eps", "indd", "sketch"],
  video: ["mp4", "mov", "avi", "mkv", "m4v", "wmv", "flv"],
  audio: ["mp3", "m4a", "wav", "aac", "flac", "aiff"],
  email: ["eml", "msg"],
  ppt: ["ppt", "pptx", "key"],
  word: ["doc", "docx", "txt", "md", "rtf", "pages"],
  excel: ["xls", "xlsx", "csv", "tsv", "numbers"],
  scan: ["pdf"],
  code: ["js", "mjs", "html", "css", "json", "sql", "py", "sh", "ts", "tsx", "jsx"],
  archive: ["zip", "rar", "7z", "tar", "gz", "dmg"],
};

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)}${units[index]}`;
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "未识别";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function topCount(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "未识别";
}

function batchPrefixFor(sourceType) {
  const pairs = [
    [/手机/, "MOB"],
    [/iPad|平板/, "TAB"],
    [/邮箱/, "MAIL"],
    [/云/, "CLOUD"],
    [/NAS|网盘/, "NAS"],
    [/U盘|移动硬盘|外接硬盘/, "USB"],
    [/SD卡|相机|摄像机/, "CARD"],
    [/不同主机|主机/, "PC"],
  ];
  return pairs.find(([pattern]) => pattern.test(sourceType))?.[1] || "LOCAL";
}

function tableRows(counts) {
  const rows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join("\n");
  return rows || "| 无 | 0 |";
}

async function readExistingBatchHistory(historyPath) {
  try {
    const content = await readFile(historyPath, "utf8");
    const match = content.match(/window\.HWS_SCAN_BATCH_HISTORY\s*=\s*(\[[\s\S]*\]);?\s*$/);
    return match ? JSON.parse(match[1]) : [];
  } catch {
    return [];
  }
}

function extensionOf(filePath) {
  return extname(filePath).replace(".", "").toLowerCase() || "unknown";
}

function safeRelativePath(filePath) {
  return relative(scanRoot, filePath) || basename(filePath);
}

function recordSkipped(filePath, reason) {
  skippedCount += 1;
  if (skippedEntries.length >= maxSkippedExamples) return;
  skippedEntries.push({
    relativePath: safeRelativePath(filePath),
    reason,
  });
}

function categoryFor(filePath) {
  const ext = extensionOf(filePath);
  const name = basename(filePath).toLowerCase();

  if (/制度|sop|规范|流程/.test(name)) return "policy";
  if (/示范|样板|范本|模板/.test(name)) return "template";
  if (/述职|年报|年度报告|经营报告/.test(name)) return "report";
  if (/年会|年度会议|会议纪要|会议文件/.test(name)) return "meeting";
  if (/合同|协议|采购|供应商/.test(name)) return "contract";
  if (/标书|投标|招标/.test(name)) return "bid";
  if (/方案|策划|提案|计划/.test(name)) return "proposal";
  if (/logo|标识|vi|视觉/.test(name)) return "logo";

  return Object.entries(categoryByExt).find(([, exts]) => exts.includes(ext))?.[0] || "document";
}

function typeConfig(category, ext, filePath) {
  const common = {
    format: ext.toUpperCase(),
    formatTags: [category, ext],
    type: "private",
    preview: "doc",
    workType: "文档/资料",
    functionRole: "本机索引/资料管理",
  };

  const map = {
    image: { workType: "图片/照片", type: "image", preview: "image", functionRole: "图片归档/视觉资料" },
    design: { workType: "画册/设计稿", type: "image", preview: "image", functionRole: "设计归档/视觉资料" },
    video: { workType: "视频/影视", type: "video", preview: "video", functionRole: "视频归档/媒体资料" },
    audio: { workType: "录音/音乐", type: "audio", preview: "audio", functionRole: "录音归档/转写候选" },
    email: { workType: "邮件", type: "private", preview: "doc", functionRole: "邮件归档/客户沟通" },
    ppt: { workType: "PPT", type: "finish", preview: "doc", functionRole: "方案归档/演示文稿" },
    word: { workType: "Word/文档", type: "finish", preview: "doc", functionRole: "文档归档/内容资料" },
    excel: { workType: "Excel/电子表格", type: "private", preview: "doc", functionRole: "表格归档/数据资料" },
    scan: { workType: "扫描件/PDF", type: "private", preview: "doc", functionRole: "扫描归档/文档资料" },
    code: { workType: "程序/代码", type: "private", preview: "doc", functionRole: "程序开发/技术资产" },
    archive: { workType: "压缩包/备份包", type: "private", preview: "doc", functionRole: "备份归档/资料包" },
    contract: { workType: "合同/扫描件", type: "private", preview: "doc", functionRole: "合同管理/法务资料" },
    bid: { workType: "标书/投标文件", type: "private", preview: "doc", functionRole: "投标/项目管理/商务资料" },
    proposal: { workType: "方案/提案", type: "finish", preview: "doc", functionRole: "策划/方案/项目资料" },
    logo: { workType: "标识/LOGO", type: "image", preview: "image", functionRole: "品牌设计/视觉资产" },
    meeting: { workType: "会议文件", type: "private", preview: "doc", functionRole: "会议归档/转写候选" },
    report: { workType: "述职/年度报告", type: "finish", preview: "doc", functionRole: "经营复盘/报告资料" },
    policy: { workType: "制度/SOP", type: "finish", preview: "doc", functionRole: "制度管理/流程规范" },
    template: { workType: "示范文档/模板", type: "finish", preview: "doc", functionRole: "知识沉淀/示范模板" },
  };

  const sensitive = /合同|财务|客户|证件|签证|移民|人事|采购|报价/.test(filePath);
  return {
    ...common,
    ...(map[category] || {}),
    level: inferSecurityLevel(filePath, category, sensitive),
    status: sensitive ? "本机索引-敏感候选" : "本机索引",
  };
}

function inferSecurityLevel(filePath, category, sensitive) {
  if (/绝密|密钥|私钥|客户名单|核心数据库|数据库备份|财务软件/.test(filePath)) return "L6";
  if (/核心|源码|系统备份|最高授权|股权|融资|战略/.test(filePath)) return "L5";
  if (/证件|签证|移民|人事档案|工资|流水|审计/.test(filePath)) return "L4";
  if (sensitive) return "L3";
  if (/内部|部门|会议|述职|制度/.test(filePath) || ["meeting", "policy", "report"].includes(category)) return "L2";
  if (/公开|外部流通|官网|新闻稿|宣传|发布/.test(filePath)) return "L0";
  return "L1";
}

function securityLevelName(level) {
  const names = {
    L0: "L0 外部流通",
    L1: "L1 普通",
    L2: "L2 内部",
    L3: "L3 敏感",
    L4: "L4 机密",
    L5: "L5 最高授权",
    L6: "L6 绝密",
  };
  return names[level] || "待定密级";
}

function inferProjectType(filePath, category) {
  if (category === "bid") return "投标/标书项目";
  if (category === "proposal") return "方案/提案项目";
  if (category === "meeting") return "会议/活动项目";
  if (category === "report") return "经营报告/述职项目";
  if (category === "policy") return "制度/流程项目";
  if (category === "template") return "示范模板项目";
  if (/年会|发布会|活动/.test(filePath)) return "会议/活动项目";
  if (/学习|培训|内部交流/.test(filePath)) return "内部学习项目";
  if (/广告片|视频|宣传片/.test(filePath)) return "媒体内容项目";
  return "自定义项目";
}

function inferAssetStage(filePath, category) {
  if (/残缺已补充|已补充/.test(filePath)) return "残缺已补充";
  if (/残缺|待补充|缺页|未完|半成品|待收尾/.test(filePath)) return "残缺待补充";
  if (["template", "policy"].includes(category)) return "完整已归档";
  if (/成片|终稿|定稿|交付|归档|完整/.test(filePath)) return "完整已归档";
  return "待人工确认";
}

function inferQualityLevel(filePath, category) {
  if (/经典制度/.test(filePath)) return "经典制度";
  if (category === "policy" || /惯例制度|制度|SOP|规范/.test(filePath)) return "惯例制度";
  if (category === "template" || /示范文档|样板|范本|模板/.test(filePath)) return "示范文档";
  if (/经典案例|经典作品|经典/.test(filePath)) return "经典案例";
  if (/优秀案例|优秀/.test(filePath)) return "优秀案例";
  if (/优质|高价值/.test(filePath)) return "优质作品";
  if (/残缺/.test(filePath)) return "残缺作品";
  return "常规作品";
}

function inferPeriodSearchText(fileStat, filePath) {
  const modified = fileStat.mtime;
  const year = modified.getFullYear();
  const month = modified.getMonth() + 1;
  const quarter = `Q${Math.floor((month - 1) / 3) + 1}`;
  const stages = [];
  if (/筹备|策划|计划|提案|方案/.test(filePath)) stages.push("筹备期");
  if (/执行|运营|发布会|拍摄|会议/.test(filePath)) stages.push("执行期");
  if (/交付|成片|归档|总结|复盘|报告/.test(filePath)) stages.push("交付归档期");
  return [String(year), `${year}-${String(month).padStart(2, "0")}`, quarter, ...stages].join(" / ");
}

function inferStorageProfile(filePath, rootPath) {
  const source = `${filePath} ${rootPath}`;
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

  if (/邮箱|企业邮箱|邮件导出|邮件备份|mailbox|mail export|\.eml$|\.msg$/i.test(source)) {
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

  if (/\/Volumes\//.test(filePath)) {
    const volumeName = filePath.split("/")[2] || "外接卷";
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

async function walk(dir, files = []) {
  if (files.length >= maxFiles) {
    truncated = true;
    return files;
  }

  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    recordSkipped(dir, `目录无法读取：${error.code || error.message}`);
    return files;
  }

  for (const entry of entries) {
    if (files.length >= maxFiles) {
      truncated = true;
      break;
    }
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name) || entry.name.startsWith(".")) continue;
      await walk(join(dir, entry.name), files);
      continue;
    }
    if (!entry.isFile() || ignoredFiles.has(entry.name) || entry.name.startsWith(".") || entry.name.endsWith(".log")) continue;
    files.push(join(dir, entry.name));
    if (files.length >= maxFiles) truncated = true;
  }
  return files;
}

function makeArchive(filePath, index, fileStat) {
  const relativePath = safeRelativePath(filePath);
  const ext = extensionOf(filePath);
  const category = categoryFor(filePath);
  const config = typeConfig(category, ext, filePath);
  const title = basename(filePath);
  const modifiedAt = fileStat.mtime.toISOString().slice(0, 10);
  const createdAt = fileStat.birthtime.toISOString().slice(0, 16).replace("T", " ");
  const projectName = basename(scanRoot);
  const assetStage = inferAssetStage(filePath, category);
  const qualityLevel = inferQualityLevel(filePath, category);
  const storageProfile = inferStorageProfile(filePath, scanRoot);

  return {
    id: `LOCAL-${String(index + 1).padStart(6, "0")}`,
    title,
    subtitle: `${config.workType} · ${formatSize(fileStat.size)} · ${relativePath}`,
    project: projectName,
    projectType: inferProjectType(filePath, category),
    company: "本机样本库",
    companyName: "本机样本库",
    companyType: "样本库/可自定义公司",
    department: "自动索引",
    departmentSystem: "集团标准建制/可自定义",
    author: "本机扫描",
    owner: "最高授权人",
    ownerLevel: "L5 最高授权人",
    employees: ["本机扫描", "最高授权人"],
    functionRole: config.functionRole,
    period: modifiedAt,
    periodSearchText: inferPeriodSearchText(fileStat, filePath),
    creatorCompany: "本机样本库",
    creatorDepartment: "自动索引",
    createdAt,
    workType: config.workType,
    format: config.format,
    formatTags: [...new Set([...config.formatTags, config.type, config.preview])],
    type: config.type,
    status: config.status,
    assetStage,
    qualityLevel,
    score: 60,
    grade: "B",
    level: config.level,
    securityLevelName: securityLevelName(config.level),
    ...storageProfile,
    preview: config.preview,
    path: filePath,
    relativePath,
    size: fileStat.size,
    sizeLabel: formatSize(fileStat.size),
    modifiedAt,
    summary: `本机只读扫描生成的索引记录。路径：${relativePath}。大小：${formatSize(fileStat.size)}。来源：${storageProfile.storageSourceType}。后续可补充公司类型、公司名称、部门建制、项目类型、作者、负责人等级、作品等级、密级和同步策略。`,
  };
}

const filePaths = await walk(scanRoot);
const archives = [];
let totalSize = 0;

for (const filePath of filePaths) {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) continue;
    totalSize += fileStat.size;
    archives.push(makeArchive(filePath, archives.length, fileStat));
  } catch (error) {
    recordSkipped(filePath, `文件信息无法读取：${error.code || error.message}`);
  }
}

const index = {
  generatedAt: new Date().toISOString(),
  root: scanRoot,
  rootLabel: basename(scanRoot),
  totalFiles: archives.length,
  totalSize,
  totalSizeLabel: formatSize(totalSize),
  maxFiles,
  truncated,
  skippedCount,
  skippedEntries,
  archives,
};

function makeBatchReport(indexData) {
  const generatedAt = indexData.generatedAt;
  const dateCode = generatedAt.slice(0, 16).replace(/[-:T]/g, "");
  const storageSourceCounts = countBy(indexData.archives, "storageSourceType");
  const accessModeCounts = countBy(indexData.archives, "accessMode");
  const workTypeCounts = countBy(indexData.archives, "workType");
  const formatCounts = countBy(indexData.archives, "format");
  const securityCounts = countBy(indexData.archives, "securityLevelName");
  const riskCounts = countBy(indexData.archives, "storageRisk");
  const sourceType = topCount(storageSourceCounts);
  const batchPrefix = process.env.HWS_BATCH_PREFIX || batchPrefixFor(sourceType);
  const batchId = process.env.HWS_BATCH_ID || `${batchPrefix}-${dateCode}`;
  const defaultSecurity = topCount(securityCounts);
  const summary = {
    batchId,
    generatedAt,
    root: indexData.root,
    rootLabel: indexData.rootLabel,
    sourceType,
    defaultSecurity,
    totalFiles: indexData.totalFiles,
    totalSize: indexData.totalSize,
    totalSizeLabel: indexData.totalSizeLabel,
    truncated: indexData.truncated,
    skippedCount: indexData.skippedCount,
    maxFiles: indexData.maxFiles,
    scanPolicy: "只读扫描，不移动、不删除、不改名真实文件。",
    nasGate: "本批次只生成索引和报告；完整采集到 NAS 暂存区需要授权。",
    aiGate: "L4-L6 默认不进入 AI 训练；图片人脸识别必须单独授权。",
    distributions: {
      storageSource: storageSourceCounts,
      accessMode: accessModeCounts,
      workType: workTypeCounts,
      format: formatCounts,
      security: securityCounts,
      risk: riskCounts,
    },
    skippedEntries: indexData.skippedEntries,
  };

  const publicSummary = {
    ...summary,
    root: undefined,
    skippedEntries: indexData.skippedEntries,
    hasPrivatePath: true,
  };
  delete publicSummary.root;

  const markdown = `# 黑卫士 AI 数字档案扫描批次报告

生成时间：${generatedAt.slice(0, 16).replace("T", " ")}

## 批次结论

| 项目 | 结果 |
|---|---:|
| 批次编号 | ${batchId} |
| 扫描根目录 | ${indexData.root} |
| 浏览器显示名称 | ${indexData.rootLabel} |
| 主要来源 | ${sourceType} |
| 默认密级 | ${defaultSecurity} |
| 文件数量 | ${indexData.totalFiles} |
| 总体积 | ${indexData.totalSizeLabel} |
| 扫描上限 | ${indexData.truncated ? "达到上限，需分批补扫" : "未达到上限"} |
| 跳过条目 | ${indexData.skippedCount} |

## 安全边界

- ${summary.scanPolicy}
- ${summary.nasGate}
- ${summary.aiGate}

## 存储来源分布

| 类型 | 数量 |
|---|---:|
${tableRows(storageSourceCounts)}

## 接入方式分布

| 类型 | 数量 |
|---|---:|
${tableRows(accessModeCounts)}

## 作品类型分布

| 类型 | 数量 |
|---|---:|
${tableRows(workTypeCounts)}

## 格式分布

| 类型 | 数量 |
|---|---:|
${tableRows(formatCounts)}

## 密级分布

| 类型 | 数量 |
|---|---:|
${tableRows(securityCounts)}

## 风险分布

| 类型 | 数量 |
|---|---:|
${tableRows(riskCounts)}
`;

  return { summary, publicSummary, markdown };
}

function sanitizeArchiveForBrowser(item) {
  const { path, ...publicItem } = item;
  return {
    ...publicItem,
    localId: item.id,
    hasLocalPath: Boolean(path),
    sourcePathLabel: item.relativePath,
  };
}

const browserIndex = {
  generatedAt: index.generatedAt,
  rootLabel: index.rootLabel,
  totalFiles: index.totalFiles,
  totalSize: index.totalSize,
  totalSizeLabel: index.totalSizeLabel,
  maxFiles: index.maxFiles,
  truncated: index.truncated,
  skippedCount: index.skippedCount,
  skippedEntries: index.skippedEntries,
  archives: archives.map(sanitizeArchiveForBrowser),
};
const batchReport = makeBatchReport(index);
const batchHistoryPath = join(outputDir, "archive-batch-history-data.js");
const existingBatchHistory = await readExistingBatchHistory(batchHistoryPath);
const batchHistory = [
  batchReport.publicSummary,
  ...existingBatchHistory.filter((item) => item.batchId !== batchReport.publicSummary.batchId),
].slice(0, 50);

await mkdir(outputDir, { recursive: true });
await mkdir(batchReportDir, { recursive: true });
await writeFile(join(outputDir, "archive-index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
await writeFile(
  join(outputDir, "archive-index-data.js"),
  `window.HWS_LOCAL_ARCHIVE_INDEX = ${JSON.stringify(browserIndex, null, 2).replace(/</g, "\\u003c")};\n`,
  "utf8",
);
await writeFile(
  join(outputDir, "archive-batch-data.js"),
  `window.HWS_LATEST_SCAN_BATCH = ${JSON.stringify(batchReport.publicSummary, null, 2).replace(/</g, "\\u003c")};\n`,
  "utf8",
);
await writeFile(
  batchHistoryPath,
  `window.HWS_SCAN_BATCH_HISTORY = ${JSON.stringify(batchHistory, null, 2).replace(/</g, "\\u003c")};\n`,
  "utf8",
);
await writeFile(join(batchReportDir, `${batchReport.summary.batchId}.json`), `${JSON.stringify(batchReport.summary, null, 2)}\n`, "utf8");
await writeFile(join(batchReportDir, `${batchReport.summary.batchId}.md`), batchReport.markdown, "utf8");

console.log(`本机只读扫描完成：${archives.length} 个文件，${formatSize(totalSize)}`);
if (truncated) console.log(`提示：已达到扫描上限 ${maxFiles}，当前索引不是全量。`);
if (skippedCount) console.log(`提示：跳过 ${skippedCount} 个无法读取的目录或文件，详情见索引元数据。`);
console.log(`索引文件：${join(outputDir, "archive-index.json")}`);
console.log(`页面数据：${join(outputDir, "archive-index-data.js")}`);
console.log(`批次摘要：${join(outputDir, "archive-batch-data.js")}`);
console.log(`批次历史：${batchHistoryPath}`);
console.log(`批次报告：${join(batchReportDir, `${batchReport.summary.batchId}.md`)}`);
