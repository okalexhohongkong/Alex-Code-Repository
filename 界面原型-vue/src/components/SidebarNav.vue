<script setup>
import { Archive, Building2, LayoutDashboard, LockKeyhole, Settings } from "@lucide/vue";

defineProps({
  brand: {
    type: Object,
    required: true,
  },
  sections: {
    type: Array,
    required: true,
  },
});

const sectionIcons = [LayoutDashboard, Building2, LockKeyhole, Settings];
</script>

<template>
  <aside class="sidebar-nav" aria-label="系统主导航">
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">
        <Archive :size="22" />
      </div>
      <div>
        <strong>{{ brand.acronym }}</strong>
        <span>{{ brand.version }}</span>
      </div>
    </div>

    <nav class="nav-section-list">
      <section v-for="(section, index) in sections" :key="section.title" class="nav-section">
        <h2>
          <component :is="sectionIcons[index]" :size="17" />
          <span>{{ section.title }}</span>
        </h2>
        <button v-for="item in section.items" :key="item" type="button">
          {{ item }}
        </button>
      </section>
    </nav>
  </aside>
</template>
