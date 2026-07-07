<script setup>
import { ref, watch } from "vue";
import { Bot, CloudCog, DatabaseBackup, LockKeyhole } from "@lucide/vue";

const props = defineProps({
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

const localSections = ref([]);
const policyLevels = ["L1 普通", "L3 保密", "L4 最高机密", "L6 绝密"];

watch(
  () => props.sections,
  (sections) => {
    localSections.value = sections.map((section) => ({ ...section }));
  },
  { immediate: true },
);

function recordPolicyChange(section, fieldName) {
  section.changeLedger = `修改台账：${section.title} 已更新 ${fieldName}，不保存真实密钥`;
}

function togglePolicy(section) {
  section.enabled = !section.enabled;
  section.status = section.enabled ? "已启用" : "已停用";
  recordPolicyChange(section, "启用状态");
}
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
      <article v-for="section in localSections" :key="section.title" class="settings-card">
        <component :is="iconMap[section.title]" :size="22" />
        <div>
          <strong>{{ section.title }}</strong>
          <span>{{ section.status }}</span>
        </div>
        <p>{{ section.description }}</p>
        <div class="settings-policy-grid">
          <label>
            <span>策略等级</span>
            <select v-model="section.policyLevel" @change="recordPolicyChange(section, '策略等级')">
              <option v-for="level in policyLevels" :key="level">{{ level }}</option>
            </select>
          </label>
          <label>
            <span>审批要求</span>
            <input v-model="section.approvalRequirement" type="text" @change="recordPolicyChange(section, '审批要求')" />
          </label>
          <label>
            <span>责任人</span>
            <input v-model="section.owner" type="text" @change="recordPolicyChange(section, '责任人')" />
          </label>
          <button type="button" @click="togglePolicy(section)">
            {{ section.enabled ? "停用策略" : "启用策略" }}
          </button>
        </div>
        <small>{{ section.changeLedger }}</small>
        <small>{{ section.secretHandling || "不保存真实密钥" }}</small>
        <div class="settings-tags">
          <span v-for="item in section.items" :key="item">{{ item }}</span>
        </div>
      </article>
    </div>
  </section>
</template>
