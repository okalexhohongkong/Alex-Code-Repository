<script setup>
import { Camera, Download, Eye, ShieldAlert, Users } from "@lucide/vue";

defineProps({
  policies: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <section class="workspace-section policy-section" aria-label="分级授权查看下载">
    <div class="section-heading">
      <div>
        <p class="eyebrow">分级授权查看下载</p>
        <h2>从普通文件到绝密文件，统一控制浏览、下载、摄像头和防偷拍</h2>
      </div>
      <ShieldAlert :size="22" />
    </div>

    <div class="policy-table" role="table" aria-label="受控文档权限策略">
      <div class="policy-row policy-head" role="row">
        <span role="columnheader">密级</span>
        <span role="columnheader">浏览</span>
        <span role="columnheader">导出下载</span>
        <span role="columnheader">摄像头/人脸</span>
        <span role="columnheader">防偷拍</span>
        <span role="columnheader">审批</span>
      </div>
      <div v-for="policy in policies" :key="policy.level" class="policy-row" role="row">
        <strong role="cell">{{ policy.level }}</strong>
        <span role="cell"><Eye :size="15" />{{ policy.browse }}</span>
        <span role="cell"><Download :size="15" />{{ policy.download }}</span>
        <span role="cell"><Camera :size="15" />{{ policy.camera }}</span>
        <span role="cell">{{ policy.watermark }}</span>
        <span role="cell"><Users :size="15" />{{ policy.approval }}</span>
      </div>
    </div>

    <p class="policy-note">公众浏览防偷拍、高密双人共同查看、绝密不可浏览，均作为策略项进入后续后台配置。</p>
  </section>
</template>
