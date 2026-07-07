<script setup>
import { computed, ref } from "vue";
import { CheckCircle2, FileCheck2, FileDown, FileOutput, UsersRound } from "@lucide/vue";

const props = defineProps({
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

const statusFilter = ref("全部状态");

const statusOptions = computed(() => ["全部状态", ...new Set(props.steps.map((step) => step.workflowStatus).filter(Boolean))]);

const filteredSteps = computed(() => {
  if (statusFilter.value === "全部状态") {
    return props.steps;
  }
  return props.steps.filter((step) => step.workflowStatus === statusFilter.value);
});
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

    <div class="approval-state-toolbar">
      <div>
        <strong>审批状态机</strong>
        <span>待审批 / 已通过 / 被驳回 / 需双人复核</span>
      </div>
      <label>
        <span>状态筛选</span>
        <select v-model="statusFilter">
          <option v-for="status in statusOptions" :key="status">{{ status }}</option>
        </select>
      </label>
    </div>

    <div class="approval-flow">
      <article v-for="step in filteredSteps" :key="step.title" class="approval-card">
        <component :is="iconMap[step.title] || CheckCircle2" :size="22" />
        <div class="approval-card-head">
          <strong>{{ step.title }}</strong>
          <em>{{ step.workflowStatus }}</em>
        </div>
        <span>{{ step.owner }}</span>
        <p>{{ step.status }}</p>
        <small>{{ step.nextAction }}</small>
        <b v-if="step.dualReviewRequired">双人共同查看</b>
      </article>
    </div>
  </section>
</template>
