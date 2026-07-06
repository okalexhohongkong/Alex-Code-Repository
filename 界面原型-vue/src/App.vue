<script setup>
import { computed, ref } from "vue";
import AccessPolicyMatrix from "./components/AccessPolicyMatrix.vue";
import AppHeader from "./components/AppHeader.vue";
import DocumentPreview from "./components/DocumentPreview.vue";
import OrgStructureExplorer from "./components/OrgStructureExplorer.vue";
import ProgressSnapshot from "./components/ProgressSnapshot.vue";
import QuickCategoryGrid from "./components/QuickCategoryGrid.vue";
import SearchCommand from "./components/SearchCommand.vue";
import SidebarNav from "./components/SidebarNav.vue";
import {
  accessPolicies,
  brand,
  documents,
  historicalOrgImports,
  navSections,
  nextSteps,
  organizationUnits,
  progressItems,
  quickCategories,
  searchModes,
} from "./data/dashboard";

const activeCategoryId = ref("company");
const selectedDocumentId = ref(documents[0].id);
const query = ref("");
const searchMode = ref(searchModes[0]);
const showHidden = ref(false);
const localCategories = ref([...quickCategories]);

const visibleCategories = computed(() =>
  localCategories.value.filter((category) => showHidden.value || !category.hidden),
);

const activeCategory = computed(
  () => localCategories.value.find((category) => category.id === activeCategoryId.value) || localCategories.value[0],
);

const filteredDocuments = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();
  return documents.filter((document) => {
    const inCategory = !activeCategoryId.value || document.categoryId === activeCategoryId.value;
    const inQuery = !normalizedQuery || `${document.title} ${document.securityLevel} ${document.previewMode}`.toLowerCase().includes(normalizedQuery);
    return inCategory && inQuery;
  });
});

const selectedDocument = computed(
  () => filteredDocuments.value.find((document) => document.id === selectedDocumentId.value) || filteredDocuments.value[0] || documents[0],
);

function selectCategory(categoryId) {
  activeCategoryId.value = categoryId;
  const nextDocument = documents.find((document) => document.categoryId === categoryId);
  if (nextDocument) {
    selectedDocumentId.value = nextDocument.id;
  }
}

function addShortcut() {
  const customIndex = localCategories.value.filter((category) => category.id.startsWith("custom-")).length + 1;
  localCategories.value.push({
    id: `custom-${customIndex}`,
    title: `自定义按钮 ${customIndex}`,
    scope: "可按角色授权打开，也可以随时隐藏",
    count: 0,
    access: "授权打开",
    tone: "green",
  });
}

function toggleCategoryHidden(categoryId) {
  localCategories.value = localCategories.value.map((category) =>
    category.id === categoryId ? { ...category, hidden: !category.hidden } : category,
  );
}
</script>

<template>
  <div class="vue-app-shell">
    <SidebarNav :brand="brand" :sections="navSections" />

    <main class="vue-workspace">
      <AppHeader :brand="brand" />

      <SearchCommand
        v-model:query="query"
        v-model:mode="searchMode"
        :active-category="activeCategory"
        :modes="searchModes"
      />

      <section class="dashboard-grid" aria-label="档案工作台">
        <QuickCategoryGrid
          :active-id="activeCategoryId"
          :categories="visibleCategories"
          :show-hidden="showHidden"
          @add-shortcut="addShortcut"
          @select-category="selectCategory"
          @toggle-hidden="toggleCategoryHidden"
          @toggle-show-hidden="showHidden = !showHidden"
        />

        <DocumentPreview
          :documents="filteredDocuments"
          :selected-document="selectedDocument"
          @select-document="selectedDocumentId = $event"
        />

        <OrgStructureExplorer
          :historical-imports="historicalOrgImports"
          :units="organizationUnits"
        />

        <AccessPolicyMatrix :policies="accessPolicies" />

        <ProgressSnapshot :items="progressItems" :next-steps="nextSteps" />
      </section>
    </main>
  </div>
</template>
