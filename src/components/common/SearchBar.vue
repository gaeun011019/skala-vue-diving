<script setup>
defineProps({
  query: {
    type: String,
    required: true,
  },
  warningOnly: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update-query', 'update-warning-only'])

const handleInput = (event) => {
  emit('update-query', event.target.value)
}

const handleWarningChange = (event) => {
  emit('update-warning-only', event.target.checked)
}
</script>

<template>
  <div class="search-bar">
    <label for="spot-search">다이빙 포인트 검색</label>

    <div class="input-wrap">
      <span>⌕</span>
      <input
        id="spot-search"
        :value="query"
        type="text"
        placeholder="지역·포인트 검색 또는 초성 입력 (예: ㅈㅈ ㅁㅅ)"
        @input="handleInput"
      />
    </div>

    <p>
      검색 중인 포인트:
      <strong>{{ query || '전체 포인트' }}</strong>
    </p>

    <label class="filter-checkbox">
      <input :checked="warningOnly" type="checkbox" @change="handleWarningChange" />

      기상특보가 있는 포인트만 보기
    </label>
  </div>
</template>

<style scoped>
.search-bar > label:first-child {
  display: block;
  margin-bottom: 10px;
  color: var(--ink-900);
  font-size: 13px;
  font-weight: 800;
}

.search-bar input[type='text'] {
  width: 100%;
  padding: 14px 15px 14px 44px;
  box-sizing: border-box;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f8fafb;
  color: var(--ink-900);
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}

.input-wrap {
  position: relative;
}

.input-wrap > span {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 15px;
  color: var(--ink-500);
  font-size: 22px;
  transform: translateY(-55%);
}

.search-bar input[type='text']:focus {
  border-color: var(--sea-600);
  outline: none;
  background: white;
  box-shadow: 0 0 0 4px rgb(10 150 148 / 10%);
}

.search-bar p {
  margin: 10px 0 12px;
  color: var(--ink-500);
  font-size: 13px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  color: var(--ink-700);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.filter-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--sea-700);
}
</style>
