<script setup>
import { computed } from "vue";
import { Coins, Filter, Search, SlidersHorizontal } from "@lucide/vue";

const props = defineProps({
  query: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  modes: {
    type: Array,
    required: true,
  },
  activeCategory: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:query", "update:mode"]);

const categoryLabel = computed(() => props.activeCategory?.title || "全部档案");
</script>

<template>
  <section class="search-command" aria-label="档案搜索中心">
    <div class="search-input-wrap">
      <Search :size="21" />
      <input
        :value="query"
        type="search"
        placeholder="搜索标题、密级、预览规则、部门或修改人"
        @input="emit('update:query', $event.target.value)"
      />
    </div>

    <div class="mode-row" role="group" aria-label="搜索模式">
      <button
        v-for="item in modes"
        :key="item"
        :class="{ active: item === mode }"
        type="button"
        @click="emit('update:mode', item)"
      >
        <SlidersHorizontal v-if="item === '精准搜索'" :size="16" />
        <Filter v-else :size="16" />
        <span>{{ item }}</span>
      </button>
    </div>

    <div class="billing-chip" aria-label="查询计费">
      <Coins :size="18" />
      <span>积分兑换</span>
      <strong>{{ categoryLabel }}</strong>
    </div>
  </section>
</template>
