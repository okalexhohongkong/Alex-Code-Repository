<script setup>
import { EyeOff, KeyRound, Plus, ShieldCheck } from "@lucide/vue";

defineProps({
  categories: {
    type: Array,
    required: true,
  },
  activeId: {
    type: String,
    required: true,
  },
  showHidden: {
    type: Boolean,
    required: true,
  },
  permissionPresets: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["add-shortcut", "authorize-shortcut", "select-category", "toggle-hidden", "toggle-show-hidden"]);
</script>

<template>
  <section class="workspace-section quick-section" aria-label="数据库快捷分类">
    <div class="section-heading">
      <div>
        <p class="eyebrow">数据库快捷分类</p>
        <h2>按老板个人、家庭、公司、人员状态、作品和合同快速进入</h2>
      </div>
      <div class="section-tools">
        <button class="icon-text-button" type="button" @click="emit('add-shortcut')">
          <Plus :size="17" />
          <span>新增快捷按钮</span>
        </button>
        <button class="icon-button" type="button" :aria-pressed="showHidden" aria-label="显示或隐藏快捷按钮" @click="emit('toggle-show-hidden')">
          <EyeOff :size="18" />
        </button>
      </div>
    </div>

    <div class="quick-grid">
      <article
        v-for="category in categories"
        :key="category.id"
        :class="['quick-card', `tone-${category.tone}`, { active: category.id === activeId, muted: category.hidden }]"
        @click="emit('select-category', category.id)"
      >
        <div class="quick-card-head">
          <span>{{ category.title }}</span>
          <ShieldCheck v-if="category.id === activeId" :size="18" />
        </div>
        <p>{{ category.scope }}</p>
        <div class="quick-permission-grid" aria-label="快捷按钮权限">
          <span>授权等级：{{ category.permissionLevel || "L1 普通" }}</span>
          <span>可见范围：{{ category.visibleScope || "管理员可见" }}</span>
        </div>
        <div class="quick-card-foot">
          <strong>{{ category.count.toLocaleString("zh-CN") }}</strong>
          <button type="button" @click.stop="emit('toggle-hidden', category.id)">
            <EyeOff :size="15" />
            <span>隐藏</span>
          </button>
          <button type="button" @click.stop="emit('authorize-shortcut', category.id)">
            <KeyRound :size="15" />
            <span>{{ category.access || "授权打开" }}</span>
          </button>
        </div>
        <small>{{ category.permissionLedger || "授权台账：待记录" }}</small>
      </article>
    </div>

    <div class="permission-ledger" aria-label="授权台账">
      <div class="mini-heading">
        <KeyRound :size="17" />
        <strong>授权台账 / 快捷按钮权限</strong>
      </div>
      <div class="permission-preset-list">
        <span v-for="preset in permissionPresets" :key="preset">{{ preset }}</span>
      </div>
    </div>
  </section>
</template>
