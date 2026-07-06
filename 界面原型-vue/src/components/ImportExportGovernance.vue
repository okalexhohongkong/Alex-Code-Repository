<script setup>
import { FileInput, FileOutput, ListChecks, UsersRound } from "@lucide/vue";

defineProps({
  rules: {
    type: Array,
    required: true,
  },
});

const iconMap = {
  "导入必须查毒": FileInput,
  "导出分级授权": FileOutput,
  "双人授权": UsersRound,
  "台账留痕": ListChecks,
};
</script>

<template>
  <section class="workspace-section governance-section" aria-label="导入导出治理">
    <div class="section-heading">
      <div>
        <p class="eyebrow">导入导出治理</p>
        <h2>导入杀毒、导出分级授权、双人授权和台账留痕进入统一流程</h2>
      </div>
    </div>

    <div class="governance-flow">
      <article v-for="rule in rules" :key="rule.title" class="governance-card">
        <component :is="iconMap[rule.title]" :size="22" />
        <strong>{{ rule.title }}</strong>
        <p>{{ rule.detail }}</p>
        <span>{{ rule.gate }}</span>
      </article>
    </div>
  </section>
</template>
