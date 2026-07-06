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
  "界面原型-vue/src/components/ProgressSnapshot.vue",
  "界面原型-vue/src/styles/tokens.css",
  "界面原型-vue/src/styles/base.css",
  "界面原型-vue/src/styles/responsive.css",
];

const requiredText = [
  ["界面原型-vue/index.html", ["黑卫士 AI 数字档案管理系统", "viewport", "src/main.js"]],
  ["界面原型-vue/src/main.js", ["createApp", "App.vue", "tokens.css", "responsive.css"]],
  ["界面原型-vue/src/App.vue", ["SidebarNav", "AppHeader", "SearchCommand", "QuickCategoryGrid", "DocumentPreview", "OrgStructureExplorer", "AccessPolicyMatrix", "ProgressSnapshot"]],
  ["界面原型-vue/src/data/dashboard.js", ["BG AI DAMS", "老板个人档案", "家庭档案", "公司档案", "在职档案", "离职档案", "经典作品", "合同案例", "模糊搜索", "精准搜索", "全文搜索", "积分兑换", "双人共同查看", "摄像头", "防偷拍水印", "水印", "董事会办公室", "历史组织架构图", "L6 绝密", "不可浏览", "公众浏览防偷拍"]],
  ["界面原型-vue/src/components/AppHeader.vue", ["brand.enName", "brand.acronym"]],
  ["界面原型-vue/src/components/SidebarNav.vue", ["section.items", "nav-section-list"]],
  ["界面原型-vue/src/components/SearchCommand.vue", ["modes", "update:mode", "积分兑换"]],
  ["界面原型-vue/src/components/QuickCategoryGrid.vue", ["授权打开", "隐藏", "新增快捷按钮"]],
  ["界面原型-vue/src/components/DocumentPreview.vue", ["selectedDocument.controls", "control.includes", "授权查看", "分级导出"]],
  ["界面原型-vue/src/components/OrgStructureExplorer.vue", ["公司的组织架构", "按部门查文档", "历史组织架构图", "人事部门导入"]],
  ["界面原型-vue/src/components/AccessPolicyMatrix.vue", ["分级授权查看下载", "公众浏览防偷拍", "不可浏览", "双人共同查看"]],
  ["界面原型-vue/src/components/ProgressSnapshot.vue", ["Vue 重构", "响应式", "1500 行"]],
  ["界面原型-vue/src/styles/responsive.css", ["@media", "max-width: 900px", "grid-template-columns"]],
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
