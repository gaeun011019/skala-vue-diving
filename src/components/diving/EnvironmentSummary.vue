<script setup>
defineProps({
  activeFilter: {
    type: String,
    default: 'all',
  },
  totalCount: {
    type: Number,
    required: true,
  },
  filteredCount: {
    type: Number,
    required: true,
  },
  warningCount: {
    type: Number,
    required: true,
  },
  highWaveCount: {
    type: Number,
    required: true,
  },
  strongWindCount: {
    type: Number,
    required: true,
  },
})

defineEmits(['select-filter'])
</script>

<template>
  <section class="summary-section">
    <button
      type="button"
      class="summary-card"
      :class="{ active: activeFilter === 'all' }"
      @click="$emit('select-filter', 'all')"
    >
      <span>전체 포인트</span>
      <strong>{{ totalCount }}곳</strong>
    </button>

    <button
      type="button"
      class="summary-card"
      :class="{ active: activeFilter === 'search' }"
      @click="$emit('select-filter', 'search')"
    >
      <span>검색 결과</span>
      <strong>{{ filteredCount }}곳</strong>
    </button>

    <button
      type="button"
      class="summary-card warning"
      :class="{ active: activeFilter === 'warning' }"
      @click="$emit('select-filter', 'warning')"
    >
      <span>특보 지역</span>
      <strong>{{ warningCount }}곳</strong>
    </button>

    <button
      type="button"
      class="summary-card wave"
      :class="{ active: activeFilter === 'wave' }"
      @click="$emit('select-filter', 'wave')"
    >
      <span>높은 파고</span>
      <strong>{{ highWaveCount }}곳</strong>
    </button>

    <button
      type="button"
      class="summary-card wind"
      :class="{ active: activeFilter === 'wind' }"
      @click="$emit('select-filter', 'wind')"
    >
      <span>강풍 지역</span>
      <strong>{{ strongWindCount }}곳</strong>
    </button>
  </section>
</template>

<style scoped>
.summary-section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  border-color: #9bcaca;
  box-shadow: var(--shadow-md);
}

.summary-card.active {
  border-color: var(--sea-600);
  box-shadow:
    0 0 0 3px rgb(10 150 148 / 12%),
    var(--shadow-md);
}

.summary-card::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: #b9d9dc;
  content: '';
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  margin-bottom: 6px;
  color: var(--ink-500);
  font-size: 12px;
}

.summary-card strong {
  color: var(--ink-900);
  font-size: 21px;
  font-weight: 800;
}

.summary-card.warning {
  background: #fffafa;
}

.summary-card.warning::before {
  background: #e17474;
}

.summary-card.warning strong {
  color: #b24141;
}

.summary-card.wave::before {
  background: #5b9fc7;
}

.summary-card.wind::before {
  background: #4aa383;
}

@media (max-width: 700px) {
  .summary-section {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
