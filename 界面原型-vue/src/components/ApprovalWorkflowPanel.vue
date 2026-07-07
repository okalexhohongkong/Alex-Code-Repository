<script setup>
import { CheckCircle2, FileCheck2, FileDown, FileOutput, UsersRound } from "@lucide/vue";

defineProps({
  steps: {
    type: Array,
    required: true,
  },
});

const iconMap = {
  "查看审批": FileCheck2,
  "下载审批": FileDown,
  "导出审批": FileOutput,
  "双人共同查看": UsersRound,
};
</script>

<template>
  <section class="workspace-section approval-section" aria-label="权限审批流程">
    <div class="section-heading">
      <div>
        <p class="eyebrow">权限审批流程</p>
        <h2>查看审批、下载审批、导出审批和双人共同查看统一排队</h2>
      </div>
      <CheckCircle2 :size="22" />
    </div>

    <div class="approval-flow">
      <article v-for="step in steps" :key="step.title" class="approval-card">
        <component :is="iconMap[step.title]" :size="22" />
        <strong>{{ step.title }}</strong>
        <span>{{ step.owner }}</span>
        <p>{{ step.status }}</p>
      </article>
    </div>
  </section>
</template>
