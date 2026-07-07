import { readFile, stat } from "node:fs/promises";

const requiredFiles = [
  "界面原型-vue/index.html",
  "界面原型-vue/vite.config.js",
  "界面原型-vue/src/main.js",
  "界面原型-vue/src/App.vue",
  "界面原型-vue/src/data/dashboard.js",
  "界面原型-vue/src/components/AppHeader.vue",
  "界面原型-vue/src/components/SidebarNav.vue",
  "界面原型-vue/src/components/SearchCommand.vue",
  "界面原型-vue/src/components/QuickCategoryGrid.vue",
  "界面原型-vue/src/components/DocumentPreview.vue",
  "界面原型-vue/src/components/OrgStructureExplorer.vue",
  "界面原型-vue/src/components/AccessPolicyMatrix.vue",
  "界面原型-vue/src/components/LocalIndexPanel.vue",
  "界面原型-vue/src/components/SettingsHub.vue",
  "界面原型-vue/src/components/ImportExportGovernance.vue",
  "界面原型-vue/src/components/QueryBillingPanel.vue",
  "界面原型-vue/src/components/ApprovalWorkflowPanel.vue",
  "界面原型-vue/src/components/AuditLedgerPanel.vue",
  "界面原型-vue/src/components/ProgressSnapshot.vue",
  "界面原型-vue/src/styles/tokens.css",
  "界面原型-vue/src/styles/base.css",
  "界面原型-vue/src/styles/responsive.css",
];

const requiredText = [
  ["界面原型-vue/index.html", ["黑卫士 AI 数字档案管理系统", "viewport", "src/main.js"]],
  ["界面原型-vue/src/main.js", ["createApp", "App.vue", "tokens.css", "responsive.css"]],
  ["界面原型-vue/src/App.vue", ["SidebarNav", "AppHeader", "SearchCommand", "QuickCategoryGrid", "DocumentPreview", "OrgStructureExplorer", "AccessPolicyMatrix", "LocalIndexPanel", "SettingsHub", "ImportExportGovernance", "QueryBillingPanel", "ApprovalWorkflowPanel", "AuditLedgerPanel", "ProgressSnapshot", "selectedIndexDepartment", "selectIndexDepartment", "authorizeShortcut", "toggleCategoryHidden"]],
  ["界面原型-vue/src/data/dashboard.js", ["BG AI DAMS", "老板个人档案", "家庭档案", "公司档案", "在职档案", "离职档案", "经典作品", "合同案例", "模糊搜索", "精准搜索", "全文搜索", "积分兑换", "双人共同查看", "摄像头", "防偷拍水印", "水印", "董事会办公室", "历史组织架构图", "L6 绝密", "不可浏览", "公众浏览防偷拍", "AI 接入", "平台接入", "备份容灾", "导入必须查毒", "导出分级授权", "查询付费", "积分余额", "查看审批", "下载审批", "导出审批", "自动索引", "计费流水", "扣费前余额", "扣费后余额", "密级加权", "待审批", "已通过", "被驳回", "需双人复核", "授权等级", "可见范围", "授权台账", "快捷按钮权限", "审计详情台账", "动作类型", "操作者", "审批状态", "授权打开", "策略等级", "审批要求", "责任人", "修改台账", "不保存真实密钥"]],
  ["界面原型-vue/src/components/AppHeader.vue", ["brand.enName", "brand.acronym"]],
  ["界面原型-vue/src/components/SidebarNav.vue", ["section.items", "nav-section-list"]],
  ["界面原型-vue/src/components/SearchCommand.vue", ["modes", "update:mode", "积分兑换"]],
  ["界面原型-vue/src/components/QuickCategoryGrid.vue", ["授权打开", "隐藏", "新增快捷按钮", "授权等级", "可见范围", "授权台账", "快捷按钮权限", "authorize-shortcut", "permissionLedger"]],
  ["界面原型-vue/src/components/DocumentPreview.vue", ["selectedDocument.controls", "control.includes", "授权查看", "分级导出"]],
  ["界面原型-vue/src/components/OrgStructureExplorer.vue", ["公司的组织架构", "按部门查文档", "历史组织架构图", "人事部门导入", "select-department", "索引联动"]],
  ["界面原型-vue/src/components/AccessPolicyMatrix.vue", ["分级授权查看下载", "公众浏览防偷拍", "不可浏览", "双人共同查看"]],
  ["界面原型-vue/src/components/LocalIndexPanel.vue", ["本机索引只读展示", "archive-index-data.js", "路径脱敏", "hasLocalPath", "关键词搜索", "密级筛选", "格式筛选", "filteredArchives", "selectedDepartment", "部门筛选", "departmentOptions", "组织架构联动", "本机索引部门"]],
  ["界面原型-vue/src/components/SettingsHub.vue", ["系统设置", "AI 接入", "平台接入", "备份容灾", "加密文件策略", "策略等级", "审批要求", "责任人", "修改台账", "不保存真实密钥", "togglePolicy", "recordPolicyChange"]],
  ["界面原型-vue/src/components/ImportExportGovernance.vue", ["导入必须查毒", "导出分级授权", "双人授权", "台账留痕"]],
  ["界面原型-vue/src/components/QueryBillingPanel.vue", ["查询积分兑换", "查询付费", "积分余额", "扣费规则", "计费流水", "扣费前余额", "扣费后余额", "密级加权"]],
  ["界面原型-vue/src/components/ApprovalWorkflowPanel.vue", ["权限审批流程", "查看审批", "下载审批", "导出审批", "双人共同查看", "审批状态机", "状态筛选", "statusFilter", "filteredSteps"]],
  ["界面原型-vue/src/components/AuditLedgerPanel.vue", ["审计详情台账", "动作类型", "操作者", "密级", "审批状态", "actionFilter", "filteredEntries", "查看", "下载", "导出", "授权打开"]],
  ["界面原型-vue/src/components/ProgressSnapshot.vue", ["Vue 重构", "响应式", "1500 行"]],
  ["界面原型-vue/src/styles/responsive.css", ["@media", "max-width: 900px", "max-width: 390px", "grid-template-columns", "overflow-wrap", "permission-ledger", "audit-filter-row", "settings-policy-grid"]],
];

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const file of requiredFiles) {
  await stat(file);
}

for (const [file, needles] of requiredText) {
  const content = await readFile(file, "utf8");
  for (const needle of needles) {
    assertOk(content.includes(needle), `${file} 缺少：${needle}`);
  }
}

for (const file of requiredFiles.filter((path) => /\.(vue|js|css)$/.test(path))) {
  const content = await readFile(file, "utf8");
  const lineCount = content.split(/\r?\n/).length;
  assertOk(lineCount <= 1500, `${file} 当前 ${lineCount} 行，超过 1500 行规则。`);
}

console.log("Vue 原型检查通过：组件结构、响应式入口、快捷分类和 1500 行规则均已覆盖。");
