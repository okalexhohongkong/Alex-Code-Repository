<script setup>
import { ref, watch } from "vue";
import { Camera, Clock3, Download, Eye, FileText, MousePointer2, ScanFace, ShieldCheck, Users } from "@lucide/vue";

const props = defineProps({
  documents: {
    type: Array,
    required: true,
  },
  selectedDocument: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["preview-audit", "select-document"]);
const activePreviewPolicy = ref({});
const controlPolicyList = ref([]);
const controlPolicyLedger = ref("策略台账：等待模拟切换，仅模拟策略不调用摄像头/人脸识别");

function policyTitleFor(control) {
  if (control.includes("摄像头")) {
    return "摄像头策略";
  }
  if (control.includes("人脸")) {
    return "人脸识别策略";
  }
  if (control.includes("水印")) {
    return "水印策略";
  }
  if (control.includes("鼠标")) {
    return "鼠标控制策略";
  }
  if (control.includes("双人")) {
    return "双人查看策略";
  }
  return `${control}策略`;
}

watch(
  () => props.selectedDocument,
  (document) => {
    activePreviewPolicy.value = {
      title: "预览授权策略联动",
      prerequisites: [],
      safetyBoundary: "预览安全边界：仅展示授权策略，不打开真实文件",
      previewAuditLedger: "预览授权台账：等待模拟动作",
      simulationOnly: "仅模拟授权不打开真实文件",
      ...(document.previewPolicy || {}),
    };
    controlPolicyList.value = document.controls.map((control) => ({
      label: policyTitleFor(control),
      source: control,
      enabled: true,
      guardrail: "仅模拟策略不调用摄像头/人脸识别",
    }));
    controlPolicyLedger.value = `策略台账：${document.title} 安全控制策略待模拟切换`;
  },
  { immediate: true },
);

function toggleControlPolicy(policy) {
  policy.enabled = !policy.enabled;
  const status = policy.enabled ? "已模拟启用" : "已模拟停用";
  controlPolicyLedger.value = `策略台账：${policy.label} ${status}，仅模拟策略不调用摄像头/人脸识别`;
}

function simulatePreviewAuthorization(actionLabel) {
  const isExport = actionLabel.includes("导出");
  const actionResult = isExport ? "已模拟分级导出，未导出真实文件" : "已模拟授权查看，未打开真实文件";
  activePreviewPolicy.value = {
    ...activePreviewPolicy.value,
    previewAuditLedger: `预览授权台账：${props.selectedDocument.title} ${actionResult}`,
  };
  emit("preview-audit", {
    actionType: isExport ? "预览导出" : "预览授权",
    actor: "预览授权模拟器",
    target: props.selectedDocument.title,
    securityLevel: props.selectedDocument.securityLevel,
    approvalStatus: isExport ? "待审批" : "已通过",
    device: "Vue 前端本地模拟",
    evidence: `${actionResult}；仅记录模拟审计不触碰真实文件`,
  });
}
</script>

<template>
  <section class="workspace-section preview-section" aria-label="档案预览与分级授权">
    <div class="section-heading">
      <div>
        <p class="eyebrow">预览与分级授权</p>
        <h2>高级文件进入双人查看、摄像头、人脸识别和防偷拍控制</h2>
      </div>
      <span :class="['risk-badge', selectedDocument.risk]">{{ selectedDocument.securityLevel }}</span>
    </div>

    <div class="preview-layout">
      <aside class="result-list" aria-label="搜索结果">
        <button
          v-for="document in documents"
          :key="document.id"
          :class="{ active: document.id === selectedDocument.id }"
          type="button"
          @click="emit('select-document', document.id)"
        >
          <FileText :size="17" />
          <span>{{ document.title }}</span>
          <small>{{ document.securityLevel }}</small>
        </button>
        <p v-if="documents.length === 0" class="empty-state">没有匹配结果</p>
      </aside>

      <article class="document-preview-card">
        <div class="document-title-row">
          <div>
            <p class="eyebrow">当前文档</p>
            <h3>{{ selectedDocument.title }}</h3>
          </div>
          <span :class="['preview-mode', selectedDocument.risk]">{{ selectedDocument.previewMode }}</span>
        </div>

        <div class="metadata-grid">
          <div><span>文档大小</span><strong>{{ selectedDocument.size }}</strong></div>
          <div><span>创建时间</span><strong>{{ selectedDocument.createdAt }}</strong></div>
          <div><span>修改时间</span><strong>{{ selectedDocument.modifiedAt }}</strong></div>
          <div><span>修改次数</span><strong>{{ selectedDocument.modifiedCount }}</strong></div>
          <div><span>修改人</span><strong>{{ selectedDocument.modifiedBy }}</strong></div>
          <div><span>修改电脑</span><strong>{{ selectedDocument.modifiedDevice }}</strong></div>
          <div><span>MAC地址</span><strong>{{ selectedDocument.macAddress }}</strong></div>
          <div><span>IP地址</span><strong>{{ selectedDocument.ipAddress }}</strong></div>
          <div><span>修改坐标</span><strong>{{ selectedDocument.coordinate }}</strong></div>
        </div>

        <div class="control-row" aria-label="安全控制">
          <span v-for="control in selectedDocument.controls" :key="control">
            <Users v-if="control.includes('双人')" :size="16" />
            <Camera v-else-if="control.includes('摄像头')" :size="16" />
            <ScanFace v-else-if="control.includes('人脸')" :size="16" />
            <MousePointer2 v-else-if="control.includes('鼠标')" :size="16" />
            <Clock3 v-else :size="16" />
            {{ control }}
          </span>
        </div>

        <div class="control-policy-grid" aria-label="摄像头/人脸/水印策略配置化">
          <article v-for="policy in controlPolicyList" :key="policy.label" class="control-policy-card">
            <strong>{{ policy.label }}</strong>
            <span>{{ policy.source }}</span>
            <small>{{ policy.guardrail }}</small>
            <button type="button" @click="toggleControlPolicy(policy)">
              模拟切换：{{ policy.enabled ? "启用" : "停用" }}
            </button>
          </article>
        </div>

        <p class="control-policy-ledger">{{ controlPolicyLedger }}</p>

        <div class="preview-policy-grid" aria-label="预览授权策略联动">
          <div class="preview-policy-panel">
            <strong>
              <ShieldCheck :size="16" />
              {{ activePreviewPolicy.title }}
            </strong>
            <small>授权前置条件</small>
            <ul>
              <li v-for="item in activePreviewPolicy.prerequisites" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="preview-policy-panel">
            <strong>预览安全边界</strong>
            <p>{{ activePreviewPolicy.safetyBoundary }}</p>
            <small>{{ activePreviewPolicy.simulationOnly }}</small>
          </div>
        </div>

        <p class="preview-audit-ledger">{{ activePreviewPolicy.previewAuditLedger }}</p>

        <div class="preview-actions">
          <button class="primary-action" type="button" @click="simulatePreviewAuthorization('授权查看')">
            <Eye :size="18" />
            <span>授权查看</span>
          </button>
          <button class="secondary-action" type="button" @click="simulatePreviewAuthorization('分级导出')">
            <Download :size="18" />
            <span>分级导出</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
