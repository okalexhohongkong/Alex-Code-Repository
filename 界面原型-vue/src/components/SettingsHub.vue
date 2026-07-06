<script setup>
import { Bot, CloudCog, DatabaseBackup, LockKeyhole } from "@lucide/vue";

defineProps({
  sections: {
    type: Array,
    required: true,
  },
});

const iconMap = {
  "AI 接入": Bot,
  "平台接入": CloudCog,
  "备份容灾": DatabaseBackup,
  "加密文件策略": LockKeyhole,
};
</script>

<template>
  <section class="workspace-section settings-section" aria-label="系统设置">
    <div class="section-heading">
      <div>
        <p class="eyebrow">系统设置</p>
        <h2>AI 接入、平台接入、备份容灾、加密文件策略作为二级菜单管理</h2>
      </div>
    </div>

    <div class="settings-grid">
      <article v-for="section in sections" :key="section.title" class="settings-card">
        <component :is="iconMap[section.title]" :size="22" />
        <div>
          <strong>{{ section.title }}</strong>
          <span>{{ section.status }}</span>
        </div>
        <p>{{ section.description }}</p>
        <div class="settings-tags">
          <span v-for="item in section.items" :key="item">{{ item }}</span>
        </div>
      </article>
    </div>
  </section>
</template>
