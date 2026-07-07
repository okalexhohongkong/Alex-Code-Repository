<script setup>
import { computed, ref } from "vue";
import { ClipboardList, ShieldAlert } from "@lucide/vue";

const props = defineProps({
  entries: {
    type: Array,
    required: true,
  },
  summary: {
    type: Object,
    required: true,
  },
});

const actionFilter = ref("全部动作");
const statusFilter = ref("全部状态");

const actionOptions = computed(() => ["全部动作", ...new Set(props.entries.map((entry) => entry.actionType))]);
const statusOptions = computed(() => ["全部状态", ...new Set(props.entries.map((entry) => entry.approvalStatus))]);

const filteredEntries = computed(() =>
  props.entries.filter((entry) => {
    const matchesAction = actionFilter.value === "全部动作" || entry.actionType === actionFilter.value;
    const matchesStatus = statusFilter.value === "全部状态" || entry.approvalStatus === statusFilter.value;
    return matchesAction && matchesStatus;
  }),
);
</script>

<template>
  <section class="workspace-section audit-section" aria-label="审计详情台账">
    <div class="section-heading">
      <div>
        <p class="eyebrow">审计详情台账</p>
        <h2>查看、下载、导出、授权打开统一留痕</h2>
      </div>
      <ClipboardList :size="22" />
    </div>

    <div class="audit-summary-grid">
      <div><span>总事件</span><strong>{{ summary.totalEvents.toLocaleString("zh-CN") }}</strong></div>
      <div><span>风险事件</span><strong>{{ summary.riskEvents.toLocaleString("zh-CN") }}</strong></div>
      <div><span>留存策略</span><strong>{{ summary.retentionPolicy }}</strong></div>
    </div>

    <div class="audit-filter-row">
      <label>
        <span>动作类型</span>
        <select v-model="actionFilter">
          <option v-for="action in actionOptions" :key="action">{{ action }}</option>
        </select>
      </label>
      <label>
        <span>审批状态</span>
        <select v-model="statusFilter">
          <option v-for="status in statusOptions" :key="status">{{ status }}</option>
        </select>
      </label>
      <div>
        <span>当前匹配</span>
        <strong>{{ filteredEntries.length.toLocaleString("zh-CN") }}</strong>
      </div>
    </div>

    <div class="audit-table" aria-label="审计详情列表">
      <div class="audit-row audit-head">
        <span>动作类型</span>
        <span>操作者</span>
        <span>对象</span>
        <span>密级</span>
        <span>审批状态</span>
        <span>证据</span>
      </div>
      <div v-for="entry in filteredEntries" :key="entry.id" class="audit-row">
        <strong>{{ entry.actionType }}</strong>
        <span>{{ entry.actor }}</span>
        <span>{{ entry.target }}</span>
        <span>{{ entry.securityLevel }}</span>
        <span><ShieldAlert :size="14" />{{ entry.approvalStatus }}</span>
        <small>{{ entry.happenedAt }} · {{ entry.device }} · {{ entry.evidence }}</small>
      </div>
    </div>
  </section>
</template>
