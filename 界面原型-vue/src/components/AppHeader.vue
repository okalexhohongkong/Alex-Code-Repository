<script setup>
import { Bell, MonitorSmartphone, Settings, ShieldCheck } from "@lucide/vue";

defineProps({
  brand: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <header class="app-header">
    <div class="brand-lockup">
      <div class="brand-emblem" aria-hidden="true">
        <span>BG</span>
        <small>AI</small>
      </div>
      <div>
        <p class="eyebrow">{{ brand.acronym }}</p>
        <h1>{{ brand.cnName }}</h1>
        <span>{{ brand.enName }}</span>
      </div>
    </div>

    <div class="header-actions" aria-label="顶部操作">
      <button class="icon-text-button" type="button">
        <MonitorSmartphone :size="18" />
        <span>多端预览</span>
      </button>
      <button class="icon-text-button strong" type="button">
        <ShieldCheck :size="18" />
        <span>最高授权人</span>
      </button>
      <button class="icon-button" type="button" aria-label="系统设置">
        <Settings :size="19" />
      </button>
      <button class="icon-button" type="button" aria-label="通知">
        <Bell :size="19" />
      </button>
    </div>
  </header>
</template>
