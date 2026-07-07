<script setup>
import { computed, onMounted, ref } from "vue";
import { Database, FileSearch, ShieldCheck } from "@lucide/vue";

const indexSummary = ref({
  generatedAt: "",
  rootLabel: "未加载",
  totalFiles: 0,
  totalSizeLabel: "0B",
  archives: [],
});
const loadState = ref("读取中");
const indexQuery = ref("");
const securityFilter = ref("全部密级");
const formatFilter = ref("全部格式");

const securityOptions = computed(() => {
  const levels = new Set(indexSummary.value.archives.map((archive) => archive.securityLevelName).filter(Boolean));
  return ["全部密级", ...levels];
});

const formatOptions = computed(() => {
  const formats = new Set(indexSummary.value.archives.map((archive) => archive.format).filter(Boolean));
  return ["全部格式", ...formats];
});

const filteredArchives = computed(() => {
  const query = indexQuery.value.trim().toLowerCase();
  return indexSummary.value.archives.filter((archive) => {
    const haystack = `${archive.title || ""} ${archive.subtitle || ""} ${archive.summary || ""} ${archive.department || ""}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesSecurity = securityFilter.value === "全部密级" || archive.securityLevelName === securityFilter.value;
    const matchesFormat = formatFilter.value === "全部格式" || archive.format === formatFilter.value;
    return matchesQuery && matchesSecurity && matchesFormat;
  });
});

const visibleArchives = computed(() => filteredArchives.value.slice(0, 5));

function parseBrowserIndex(text) {
  const match = text.match(/window\.HWS_LOCAL_ARCHIVE_INDEX\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) {
    throw new Error("archive-index-data.js 格式不符合预期");
  }
  return JSON.parse(match[1]);
}

onMounted(async () => {
  try {
    const response = await fetch("/界面原型-v1/archive-index-data.js", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("archive-index-data.js 读取失败");
    }
    const text = await response.text();
    const parsed = parseBrowserIndex(text);
    indexSummary.value = {
      generatedAt: parsed.generatedAt || "",
      rootLabel: parsed.rootLabel || "本机索引",
      totalFiles: parsed.totalFiles || 0,
      totalSizeLabel: parsed.totalSizeLabel || "0B",
      archives: Array.isArray(parsed.archives) ? parsed.archives : [],
    };
    loadState.value = "已读取脱敏索引";
  } catch {
    loadState.value = "读取失败";
  }
});
</script>

<template>
  <section class="workspace-section local-index-section" aria-label="本机索引只读展示">
    <div class="section-heading">
      <div>
        <p class="eyebrow">本机索引只读展示</p>
        <h2>读取 archive-index-data.js，只展示路径脱敏后的档案摘要</h2>
      </div>
      <Database :size="22" />
    </div>

    <div class="index-summary-grid">
      <div><span>状态</span><strong>{{ loadState }}</strong></div>
      <div><span>根目录</span><strong>{{ indexSummary.rootLabel }}</strong></div>
      <div><span>文件数</span><strong>{{ indexSummary.totalFiles.toLocaleString("zh-CN") }}</strong></div>
      <div><span>总大小</span><strong>{{ indexSummary.totalSizeLabel }}</strong></div>
    </div>

    <div class="index-filter-row" aria-label="关键词搜索和筛选">
      <label>
        <span>关键词搜索</span>
        <input v-model="indexQuery" type="search" placeholder="标题、摘要、部门" />
      </label>
      <label>
        <span>密级筛选</span>
        <select v-model="securityFilter">
          <option v-for="level in securityOptions" :key="level">{{ level }}</option>
        </select>
      </label>
      <label>
        <span>格式筛选</span>
        <select v-model="formatFilter">
          <option v-for="format in formatOptions" :key="format">{{ format }}</option>
        </select>
      </label>
      <div>
        <span>匹配结果</span>
        <strong>{{ filteredArchives.length.toLocaleString("zh-CN") }}</strong>
      </div>
    </div>

    <div class="local-index-list">
      <article v-for="archive in visibleArchives" :key="archive.id" class="local-index-card">
        <div>
          <FileSearch :size="17" />
          <strong>{{ archive.title }}</strong>
        </div>
        <p>{{ archive.subtitle || archive.summary }}</p>
        <span><ShieldCheck :size="15" />路径脱敏 · hasLocalPath: {{ archive.hasLocalPath ? "服务端受控" : "无本地路径" }}</span>
      </article>
    </div>
  </section>
</template>
