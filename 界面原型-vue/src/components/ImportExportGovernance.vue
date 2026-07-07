<script setup>
import { ref, watch } from "vue";
import { FileInput, FileOutput, ListChecks, UsersRound } from "@lucide/vue";

const props = defineProps({
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

const localRules = ref([]);

watch(
  () => props.rules,
  (rules) => {
    localRules.value = rules.map((rule) => ({ ...rule }));
  },
  { immediate: true },
);

function simulateGovernanceStep(rule) {
  rule.governanceLedger = `治理台账：${rule.title} 已模拟执行，未触碰真实文件`;
}
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
      <article v-for="rule in localRules" :key="rule.title" class="governance-card">
        <component :is="iconMap[rule.title]" :size="22" />
        <strong>{{ rule.title }}</strong>
        <p>{{ rule.detail }}</p>
        <span>{{ rule.gate }}</span>
        <div class="governance-step-list">
          <small>执行步骤</small>
          <ol>
            <li v-for="step in rule.executionSteps" :key="step">{{ step }}</li>
          </ol>
        </div>
        <div class="governance-gate">
          <strong>审批门禁</strong>
          <span>{{ rule.approvalGate }}</span>
        </div>
        <p class="governance-ledger">{{ rule.governanceLedger }}</p>
        <p class="governance-boundary">{{ rule.simulationOnly || "仅模拟不执行真实动作" }}</p>
        <button type="button" @click="simulateGovernanceStep(rule)">模拟执行</button>
      </article>
    </div>
  </section>
</template>
