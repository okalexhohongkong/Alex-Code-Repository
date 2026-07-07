<script setup>
import { Coins, CreditCard, ReceiptText, WalletCards } from "@lucide/vue";

defineProps({
  account: {
    type: Object,
    required: true,
  },
  ledger: {
    type: Array,
    required: true,
  },
  rules: {
    type: Array,
    required: true,
  },
});

function formatPoints(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}
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
      <div><Coins :size="18" /><span>积分余额</span><strong>{{ formatPoints(account.balance) }}</strong></div>
      <div><CreditCard :size="18" /><span>{{ account.paymentMode }}</span><strong>已开启</strong></div>
      <div><ReceiptText :size="18" /><span>扣费规则</span><strong>{{ account.debitPolicy }}</strong></div>
    </div>

    <div class="billing-rule-grid">
      <article v-for="rule in rules" :key="rule.title" class="billing-rule-card">
        <strong>{{ rule.title }}</strong>
        <span>{{ rule.cost }}</span>
        <p>{{ rule.scene }}</p>
      </article>
    </div>

    <div class="billing-ledger" aria-label="计费流水">
      <div class="mini-heading">
        <ReceiptText :size="17" />
        <strong>计费流水</strong>
      </div>
      <div class="billing-ledger-table">
        <div class="billing-ledger-row billing-ledger-head">
          <span>查询类型</span>
          <span>密级加权</span>
          <span>扣费积分</span>
          <span>扣费前余额</span>
          <span>扣费后余额</span>
        </div>
        <div v-for="item in ledger" :key="item.id" class="billing-ledger-row">
          <strong>{{ item.queryType }}</strong>
          <span>{{ item.securityLevel }} · {{ item.securityWeight }}</span>
          <span>{{ formatPoints(item.pointCost) }}</span>
          <span>{{ formatPoints(item.balanceBefore) }}</span>
          <span>{{ formatPoints(item.balanceAfter) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
