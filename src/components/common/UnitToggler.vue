<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()
</script>

<template>
  <button type="button" class="unit-toggle" @click="configStore.toggleUnit">
    수온 단위: {{ configStore.unitSymbol }}
  </button>
</template>

<style scoped>
.unit-toggle {
  padding: 9px 13px;
  border: 1px solid #b9d8d8;
  border-radius: 999px;
  background: var(--sea-50);
  color: var(--sea-700);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.unit-toggle:hover {
  border-color: var(--sea-700);
  background: var(--sea-700);
  color: white;
}
</style>
