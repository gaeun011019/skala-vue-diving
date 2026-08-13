<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { formatSpotDisplayName } from '@/services/spotRegion'

const configStore = useConfigStore()

const props = defineProps({
  spot: {
    type: Object,
    required: true,
  },

  selected: {
    type: Boolean,
    default: false,
  },

  alerts: {
    type: Array,
    default: () => [],
  },

  alertLevel: {
    type: String,
    default: 'normal',
  },
  distance: { type: Number, default: null },
  popularity: { type: Number, default: 0 },
  favorite: { type: Boolean, default: false },
})

const emit = defineEmits(['select-card', 'click-detail', 'click-forecast', 'toggle-favorite'])

const spotDisplayName = computed(() => formatSpotDisplayName(props.spot))

const handleCardClick = () => {
  emit('select-card')
}

const handleDetailClick = () => {
  emit('click-detail')
}
</script>

<template>
  <article class="diving-card" :class="{ selected }" @click="handleCardClick">
    <header class="spot-header">
      <div class="spot-title">
        <div>
          <h3>{{ spotDisplayName }}</h3>
          <p>
            {{ distance === null ? '위치 허용 시 거리 표시' : `내 위치에서 ${distance}km` }}
          </p>
        </div>
      </div>

      <div class="header-actions">
        <div class="popularity" title="최근 실시간 조회 수">
          <span class="live-dot"></span>
          {{ popularity }}명 관심
        </div>

        <button
          type="button"
          class="favorite-button"
          :class="{ active: favorite }"
          :aria-label="favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'"
          @click.stop="emit('toggle-favorite')"
        >
          {{ favorite ? '♥' : '♡' }}
        </button>
      </div>
    </header>

    <div class="weather-strip">
      <div class="weather-summary">
        <span class="weather-icon">
          {{ spot.weatherIcon }}
        </span>

        <div>
          <strong>{{ spot.weather }}</strong>
          <small>{{ configStore.formatTemperature(spot.airTemp) }}</small>
        </div>
      </div>
      <span class="condition-pill" :class="alertLevel">
        {{
          alertLevel === 'danger'
            ? '주의 항목 있음'
            : alertLevel === 'warning'
              ? '환경 확인 필요'
              : '특이사항 없음'
        }}
      </span>
    </div>

    <!-- 특보 -->
    <div class="card-actions">
      <span v-if="spot.warning" class="warning-label"> 🚨 {{ spot.warning }} </span>

      <span v-else class="normal-label"> ✅ 조회 기간 내 유효 특보 없음 </span>

      <div class="card-action-buttons">
        <button type="button" class="forecast-button" @click.stop="emit('click-forecast')">
          예보 보기
        </button>

        <button type="button" class="detail-button" @click.stop="handleDetailClick">
          전체 상세보기
        </button>
      </div>
    </div>

    <!-- 선택한 카드의 주의사항 -->
    <section v-if="selected" class="environment-alert" :class="alertLevel">
      <div class="alert-heading">
        <h4>📋 해양환경 주의 항목</h4>

        <span> {{ spot.observedAt }} 기준 </span>
      </div>

      <ul>
        <li v-for="alert in alerts" :key="alert.message">
          {{ alert.icon }}
          {{ alert.message }}
        </li>
      </ul>

      <div class="station-information">
        기준 관측소:
        <strong>{{ spot.station }}</strong>

        <span>
          {{
            spot.stationDistance === null
              ? '거리 자료 없음'
              : `포인트에서 약 ${spot.stationDistance}km`
          }}
        </span>
      </div>
    </section>
  </article>
</template>

<style scoped>
.diving-card {
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 5px 18px rgb(10 47 61 / 5%);
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.diving-card:hover {
  transform: translateY(-1px);
  border-color: #9bcaca;
  box-shadow: var(--shadow-md);
}

.diving-card.selected {
  border-color: var(--sea-600);
  background: #fcfefe;
  box-shadow:
    0 0 0 3px rgb(10 150 148 / 10%),
    var(--shadow-md);
}

.khoa-ocean-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.khoa-ocean-grid > div {
  padding: 12px;
  border-radius: 10px;
  background: #f6f9fa;
}

.khoa-ocean-grid span,
.khoa-ocean-grid strong {
  display: block;
}

.khoa-ocean-grid span {
  margin-bottom: 4px;
  color: var(--ink-500);
  font-size: 12px;
}

.khoa-ocean-grid small {
  display: block;
  margin-top: 5px;
  color: var(--ink-500);
  font-size: 11px;
}

.current-strength b {
  display: inline-block;
  margin-right: 5px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
}

.current-strength .calm {
  background: #e4f5ef;
  color: #28745a;
}

.current-strength .moderate {
  background: #e7f1f8;
  color: #316e92;
}

.current-strength .strong {
  background: #fff1cc;
  color: #8a6410;
}

.current-strength .very-strong {
  background: #ffe3e5;
  color: #a83642;
}

.tide-timeline-panel {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}

.tide-station-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.tide-station-row p {
  margin: 0;
  color: var(--ink-500);
  font-size: 11px;
}

.tide-station-row p strong,
.tide-station-row p span {
  display: block;
}

.tide-station-row p strong {
  margin-bottom: 2px;
  color: var(--ink-900);
  font-size: 13px;
}

.tide-station-row > small {
  color: var(--ink-500);
  font-size: 10px;
}

.tide-timeline {
  position: relative;
  height: 430px;
  margin-left: 2px;
  overflow: visible;
}

.tide-axis {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 72px;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(#d7eaf3, #7ec8e5 48%, #c4e3ee);
}

.tide-hour {
  position: absolute;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
}

.tide-hour span {
  width: 54px;
  color: var(--ink-500);
  font-size: 10px;
  text-align: right;
}

.tide-hour i {
  flex: 1;
  margin-left: 17px;
  border-top: 1px dashed #e1eaed;
}

.tide-event {
  position: absolute;
  right: 0;
  left: 72px;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
}

.tide-event > i {
  z-index: 1;
  width: 13px;
  height: 13px;
  margin-left: -5px;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgb(18 90 125 / 12%);
}

.tide-event.high > i {
  background: #1580ad;
}

.tide-event.low > i {
  background: #56b5a4;
}

.tide-event > div {
  display: grid;
  grid-template-columns: 40px 48px 1fr;
  align-items: center;
  min-width: 190px;
  margin-left: 10px;
  padding: 9px 11px;
  border: 1px solid #e2ecef;
  border-radius: 11px;
  background: rgb(255 255 255 / 96%);
  box-shadow: 0 5px 16px rgb(26 67 84 / 8%);
}

.tide-event.high > div {
  border-left: 3px solid #1580ad;
}

.tide-event.low > div {
  border-left: 3px solid #56b5a4;
}

.tide-event span,
.tide-event small {
  color: var(--ink-500);
  font-size: 10px;
}

.tide-event strong {
  color: var(--ink-900);
  font-size: 13px;
}

.tide-event small {
  text-align: right;
}

.tide-now {
  position: absolute;
  right: 0;
  left: 72px;
  z-index: 2;
  border-top: 1px solid #f08b67;
}

.tide-now::before {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f08b67;
  content: '';
}

.tide-now span {
  position: absolute;
  top: -9px;
  right: 0;
  padding: 2px 6px;
  border-radius: 999px;
  background: #fff1ec;
  color: #c85e3b;
  font-size: 9px;
}

.spot-header,
.spot-title,
.weather-summary,
.card-actions {
  display: flex;
  align-items: center;
}

.header-actions,
.weather-strip {
  display: flex;
  align-items: center;
}

.header-actions {
  gap: 10px;
}

.popularity {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-500);
  font-size: 12px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #24ad7b;
  box-shadow: 0 0 0 4px rgb(36 173 123 / 10%);
}

.favorite-button {
  width: 38px;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: white;
  color: #93a4ab;
  cursor: pointer;
  font-size: 21px;
  transition: 0.2s ease;
}

.favorite-button:hover {
  border-color: #dda9b6;
  color: #c64d68;
}

.favorite-button.active {
  border-color: #f0c3cd;
  background: #fff1f4;
  color: #dc4163;
}

.weather-strip {
  justify-content: space-between;
  margin-top: 18px;
  padding: 13px 15px;
  border: 1px solid #e6ecee;
  border-radius: 12px;
  background: #f7f9fa;
}

.condition-pill {
  padding: 5px 9px;
  border-radius: 999px;
  background: #e5f4ed;
  color: #2d7555;
  font-size: 12px;
  font-weight: 700;
}

.condition-pill.warning {
  background: #fff4cf;
  color: #8a6711;
}

.condition-pill.danger {
  background: #ffe5e7;
  color: #aa3440;
}

.spot-header,
.card-actions {
  justify-content: space-between;
}

.spot-title,
.weather-summary {
  gap: 11px;
}

.spot-title h3 {
  margin: 0 0 4px;
  color: var(--ink-900);
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.spot-title p {
  margin: 0;
  color: var(--ink-500);
  font-size: 13px;
}

.weather-icon {
  font-size: 30px;
}

.weather-summary strong,
.weather-summary small {
  display: block;
  text-align: right;
}

.weather-summary small {
  margin-top: 3px;
  color: var(--ink-500);
}

.condition-category {
  margin-top: 12px;
  padding: 15px;
  border: 1px solid #e3eaec;
  border-radius: 12px;
  background: #fbfcfc;
}

.condition-category.temperature {
  border-left: 3px solid #4197ad;
}

.condition-category.wave {
  border-left: 3px solid #4e8fbd;
}

.condition-category.wind {
  border-left: 3px solid #4a9a7d;
}

.condition-category.tide {
  border-left: 3px solid #8176a8;
}

.category-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-heading > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-heading h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.category-heading small {
  color: var(--ink-500);
}

.category-icon {
  font-size: 20px;
}

.condition-grid,
.temperature-list {
  display: grid;
  gap: 9px;
  margin-top: 12px;
}

.three-columns {
  grid-template-columns: repeat(3, 1fr);
}

.two-columns {
  grid-template-columns: repeat(2, 1fr);
}

.temperature-list {
  grid-template-columns: repeat(4, 1fr);
}

.condition-item,
.temperature-item {
  padding: 10px 8px;
  border: 1px solid #e7edef;
  border-radius: 9px;
  background: white;
  text-align: center;
}

.condition-item span,
.condition-item strong,
.temperature-item span,
.temperature-item strong {
  display: block;
}

.condition-item span,
.temperature-item span {
  margin-bottom: 5px;
  color: var(--ink-500);
  font-size: 12px;
}

.tide-guide {
  margin: 12px 0 0;
  color: #756d8b;
  font-size: 13px;
}

.temperature-item strong {
  color: #16768b;
  font-size: 17px;
}

.toggle-button {
  padding: 6px 10px;
  border: 1px solid #c5bfd7;
  border-radius: 8px;
  background: white;
  color: #625682;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.toggle-button:hover {
  background: #f0ecfa;
}

.toggle-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.card-actions {
  margin-top: 16px;
}

.card-action-buttons {
  display: flex;
  gap: 7px;
}

.warning-label,
.normal-label {
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 13px;
}

.warning-label {
  background: #fff0f0;
  color: #b33f3f;
}

.normal-label {
  background: #e8f6ef;
  color: #2f7555;
}

.detail-button {
  padding: 9px 14px;
  border: 1px solid var(--sea-900);
  border-radius: 8px;
  background: var(--sea-900);
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.forecast-button {
  padding: 9px 14px;
  border: 1px solid #9bbdce;
  border-radius: 8px;
  background: #f3f8fb;
  color: #246b8e;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.forecast-button:hover {
  border-color: #4d91b3;
  background: #e9f4f9;
}

.detail-button:hover {
  background: var(--sea-700);
}

.environment-alert {
  margin-top: 16px;
  padding: 16px;
  border-radius: 12px;
}

.environment-alert.normal {
  border: 1px solid #9edbb1;
  background: #e8f8ed;
}

.environment-alert.warning {
  border: 1px solid #edcc70;
  background: #fff7dc;
}

.environment-alert.danger {
  border: 1px solid #ef9a9a;
  background: #ffeded;
}

.alert-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-heading h4 {
  margin: 0;
}

.alert-heading span {
  color: #60798a;
  font-size: 12px;
}

.environment-alert ul {
  margin: 13px 0;
  padding-left: 20px;
}

.environment-alert li {
  margin-top: 7px;
}

.station-information {
  padding-top: 11px;
  border-top: 1px solid rgb(0 0 0 / 10%);
  font-size: 13px;
}

.station-information span {
  margin-left: 8px;
  color: #60798a;
}

@media (max-width: 650px) {
  .khoa-ocean-grid {
    grid-template-columns: 1fr;
  }

  .temperature-list,
  .three-columns,
  .two-columns {
    grid-template-columns: repeat(2, 1fr);
  }

  .alert-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }

  .spot-header,
  .weather-strip,
  .card-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .detail-button {
    width: 100%;
  }

  .card-action-buttons {
    width: 100%;
  }

  .forecast-button {
    width: 100%;
  }
}
</style>
