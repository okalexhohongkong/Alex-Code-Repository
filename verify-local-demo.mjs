import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const indexPath = resolve("界面原型-v1/archive-index.json");
const reportPath = resolve("单机版验收报告.md");
const index = JSON.parse(await readFile(indexPath, "utf8"));

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "未识别";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function tableFromCounts(title, counts) {
  const rows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join("\n");
  return `## ${title}\n\n| 类型 | 数量 |\n|---|---:|\n${rows || "| 无 | 0 |"}\n`;
}

let existingFiles = 0;
for (const item of index.archives || []) {
  try {
    await stat(item.path);
    existingFiles += 1;
  } catch {
    // Missing files are reported in the summary below.
  }
}

const totalFiles = index.archives?.length || 0;
const formatCounts = countBy(index.archives || [], "format");
const workTypeCounts = countBy(index.archives || [], "workType");
const projectTypeCounts = countBy(index.archives || [], "projectType");
const assetStageCounts = countBy(index.archives || [], "assetStage");
const qualityLevelCounts = countBy(index.archives || [], "qualityLevel");
const levelCounts = countBy(index.archives || [], "level");
const securityLevelCounts = countBy(index.archives || [], "securityLevelName");
const storageSourceCounts = countBy(index.archives || [], "storageSourceType");
const accessModeCounts = countBy(index.archives || [], "accessMode");
const syncStrategyCounts = countBy(index.archives || [], "syncStrategy");
const syncStatusCounts = countBy(index.archives || [], "syncStatus");
const crossCheckPolicyCounts = countBy(index.archives || [], "crossCheckPolicy");
const storageRiskCounts = countBy(index.archives || [], "storageRisk");
const storageCostLevelCounts = countBy(index.archives || [], "storageCostLevel");
const status = totalFiles > 0 && existingFiles === totalFiles ? "通过" : "需复查";
const truncatedText = index.truncated ? "达到扫描上限，当前不是全量索引" : "未达到扫描上限";
const skippedRows = (index.skippedEntries || [])
  .map((item) => `| ${item.relativePath} | ${item.reason} |`)
  .join("\n");

const report = `# 黑卫士 AI 数字档案管理系统单机版验收报告

更新时间：${new Date().toISOString().slice(0, 16).replace("T", " ")}

## 验收结论

当前单机索引验收状态：${status}

| 项目 | 结果 |
|---|---:|
| 扫描根目录 | ${index.root} |
| 索引文件数 | ${totalFiles} |
| 可访问文件数 | ${existingFiles} |
| 总体积 | ${index.totalSizeLabel} |
| 扫描上限状态 | ${truncatedText} |
| 跳过条目数量 | ${index.skippedCount || 0} |
| 索引文件 | ${indexPath} |

## 扫描告警

| 项目 | 说明 |
|---|---|
| 扫描上限 | ${truncatedText} |
| 最大扫描文件数 | ${index.maxFiles || "未设置"} |
| 跳过目录/文件 | ${index.skippedCount || 0} |

${(index.skippedEntries || []).length ? `### 跳过条目示例\n\n| 相对路径 | 原因 |\n|---|---|\n${skippedRows}\n` : "### 跳过条目示例\n\n本次扫描未记录跳过条目。\n"}

${tableFromCounts("格式分布", formatCounts)}

${tableFromCounts("作品类型分布", workTypeCounts)}

${tableFromCounts("项目类型分布", projectTypeCounts)}

${tableFromCounts("完整状态分布", assetStageCounts)}

${tableFromCounts("作品等级分布", qualityLevelCounts)}

${tableFromCounts("密级分布", levelCounts)}

${tableFromCounts("密级说明分布", securityLevelCounts)}

${tableFromCounts("存储来源分布", storageSourceCounts)}

${tableFromCounts("接入方式分布", accessModeCounts)}

${tableFromCounts("同步策略分布", syncStrategyCounts)}

${tableFromCounts("同步状态分布", syncStatusCounts)}

${tableFromCounts("交叉校验分布", crossCheckPolicyCounts)}

${tableFromCounts("存储风险分布", storageRiskCounts)}

${tableFromCounts("成本等级分布", storageCostLevelCounts)}

## 已完成

- 只读扫描当前项目目录。
- 生成本地索引 JSON。
- 生成浏览器可读取的数据文件。
- 页面优先读取真实索引。
- 预览区显示路径、大小、修改时间。
- 预览区显示公司类型、项目类型、负责人等级、周期阶段搜索、完整状态、作品等级和密级说明。
- 预览区显示存储来源、存储名称、接入方式、同步策略、同步状态、交叉校验、存储风险和成本等级。
- 浏览器索引使用脱敏数据，不直接暴露本机完整路径。
- 文件入口支持复制相对路径，并通过档案编号申请打开所在位置。

## 下一步

- 由用户确认真实硬盘或样本档案目录。
- 对真实目录重新执行扫描。
- 根据真实文件路径补公司类型、公司名称、部门建制、项目类型、作者、负责人等级和周期阶段规则。
- 根据真实存储来源补云盘、NAS、局域网网盘、不同主机硬盘、外接硬盘和 U 盘的同步策略。
- 建立权限矩阵和备份快照策略。
`;

await writeFile(reportPath, report, "utf8");

console.log(`单机版验收：${status}`);
console.log(`索引文件数：${totalFiles}`);
console.log(`可访问文件数：${existingFiles}`);
console.log(`验收报告：${reportPath}`);
