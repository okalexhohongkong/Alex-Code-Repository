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

const visibleArchives = computed(() => indexSummary.value.archives.slice(0, 5));

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
