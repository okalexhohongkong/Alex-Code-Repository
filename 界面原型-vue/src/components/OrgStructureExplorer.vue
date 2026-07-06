<script setup>
import { computed, ref } from "vue";
import { Building2, FileSearch, GitBranch, Upload } from "@lucide/vue";

const props = defineProps({
  units: {
    type: Array,
    required: true,
  },
  historicalImports: {
    type: Array,
    required: true,
  },
});

const orgQuery = ref("");

const filteredUnits = computed(() => {
  const query = orgQuery.value.trim().toLowerCase();
  if (!query) {
    return props.units;
  }
  return props.units.filter((unit) => `${unit.name} ${unit.owner} ${unit.scope}`.toLowerCase().includes(query));
});
</script>

<template>
  <section class="workspace-section org-section" aria-label="公司的组织架构">
    <div class="section-heading">
      <div>
        <p class="eyebrow">公司的组织架构</p>
        <h2>按部门查文档，历史组织架构图由人事部门导入</h2>
      </div>
      <GitBranch :size="22" />
    </div>

    <label class="org-search">
      <FileSearch :size="18" />
      <input v-model="orgQuery" type="search" placeholder="搜索部门、负责人、职责范围" />
    </label>

    <div class="org-grid">
      <article v-for="unit in filteredUnits" :key="unit.id" class="org-card">
        <div class="org-card-title">
          <Building2 :size="18" />
          <strong>{{ unit.name }}</strong>
        </div>
        <p>{{ unit.scope }}</p>
        <dl>
          <div><dt>负责人</dt><dd>{{ unit.owner }}</dd></div>
          <div><dt>文档数</dt><dd>{{ unit.documentCount.toLocaleString("zh-CN") }}</dd></div>
          <div><dt>高密文件</dt><dd>{{ unit.highSecurityCount.toLocaleString("zh-CN") }}</dd></div>
        </dl>
        <button type="button">{{ unit.quickQuery || "按部门查文档" }}</button>
      </article>
    </div>

    <div class="historical-imports" aria-label="历史组织架构图">
      <div class="mini-heading">
        <Upload :size="17" />
        <strong>历史组织架构图 / 人事部门导入</strong>
      </div>
      <div class="import-list">
        <span v-for="item in historicalImports" :key="`${item.period}-${item.fileType}`">
          {{ item.period }} · {{ item.fileType }} · {{ item.status }}
        </span>
      </div>
    </div>
  </section>
</template>
