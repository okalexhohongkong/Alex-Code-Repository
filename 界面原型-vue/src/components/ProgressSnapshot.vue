<script setup>
import { CheckCircle2, GitBranch, LayoutPanelTop, Smartphone } from "@lucide/vue";

defineProps({
  items: {
    type: Array,
    required: true,
  },
  nextSteps: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <section class="workspace-section progress-section" aria-label="重构进度">
    <div class="section-heading">
      <div>
        <p class="eyebrow">开发进度</p>
        <h2>Vue 重构、响应式多端和 1500 行规则治理</h2>
      </div>
      <GitBranch :size="22" />
    </div>

    <div class="progress-grid">
      <article v-for="item in items" :key="item.label" class="progress-card">
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}%</strong>
        </div>
        <div class="progress-meter" aria-hidden="true">
          <span :style="{ width: `${item.value}%` }"></span>
        </div>
        <p>{{ item.status }}</p>
      </article>
    </div>

    <div class="next-step-strip">
      <div class="capability-pill">
        <LayoutPanelTop :size="17" />
        <span>组件化</span>
      </div>
      <div class="capability-pill">
        <Smartphone :size="17" />
        <span>响应式</span>
      </div>
      <div class="capability-pill">
        <CheckCircle2 :size="17" />
        <span>文件小于 1500 行</span>
      </div>
    </div>

    <ol class="next-step-list">
      <li v-for="step in nextSteps" :key="step">{{ step }}</li>
    </ol>
  </section>
</template>
