<script setup>
import { Coins, CreditCard, ReceiptText, WalletCards } from "@lucide/vue";

defineProps({
  rules: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <section class="workspace-section billing-section" aria-label="查询积分兑换">
    <div class="section-heading">
      <div>
        <p class="eyebrow">查询积分兑换</p>
        <h2>所有查询进入查询付费和积分余额台账</h2>
      </div>
      <WalletCards :size="22" />
    </div>

    <div class="billing-summary">
      <div><Coins :size="18" /><span>积分余额</span><strong>12,680</strong></div>
      <div><CreditCard :size="18" /><span>查询付费</span><strong>已开启</strong></div>
      <div><ReceiptText :size="18" /><span>扣费规则</span><strong>按模式/密级</strong></div>
    </div>

    <div class="billing-rule-grid">
      <article v-for="rule in rules" :key="rule.title" class="billing-rule-card">
        <strong>{{ rule.title }}</strong>
        <span>{{ rule.cost }}</span>
        <p>{{ rule.scene }}</p>
      </article>
    </div>
  </section>
</template>
