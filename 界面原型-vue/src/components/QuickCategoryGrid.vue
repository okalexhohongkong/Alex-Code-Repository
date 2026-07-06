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
});

const emit = defineEmits(["add-shortcut", "select-category", "toggle-hidden", "toggle-show-hidden"]);
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
        <div class="quick-card-foot">
          <strong>{{ category.count.toLocaleString("zh-CN") }}</strong>
          <button type="button" @click.stop="emit('toggle-hidden', category.id)">
            <EyeOff :size="15" />
            <span>隐藏</span>
          </button>
          <button type="button" @click.stop>
            <KeyRound :size="15" />
            <span>{{ category.access || "授权打开" }}</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
