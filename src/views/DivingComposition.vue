<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

// 검색어
const searchQuery = ref('')

// 선택한 다이빙 포인트
const selectedDivingSpot = ref(null)

// 선택 안내 문구
const selectedSpotInfo = ref('')

// 특보가 있는 포인트만 표시
const warningOnly = ref(false)

// 학습용 Mockup 데이터
const divingSpotList = ref([
  {
    id: 'spot_01',
    name: '제주 문섬',
    region: '제주',
    icon: '🐠',

    weather: '맑음',
    weatherIcon: '☀️',
    airTemp: 28,
    waterTemp: 25,

    waveHeight: 0.7,
    wavePeriod: 6,
    waveDirection: '남동',

    windSpeed: 4.2,
    windDirection: '남서',

    highTideTime: '08:40',
    lowTideTime: '14:55',

    currentSpeed: 0.4,
    currentDirection: '북동',

    warning: null,
    station: '마라도 해양기상부이',
    stationDistance: 12,
    observedAt: '2026-08-11 09:00',
  },
  {
    id: 'spot_02',
    name: '제주 섶섬',
    region: '제주',
    icon: '🐢',

    weather: '구름 조금',
    weatherIcon: '⛅',
    airTemp: 27,
    waterTemp: 24,

    waveHeight: 1.1,
    wavePeriod: 7,
    waveDirection: '남',

    windSpeed: 5.8,
    windDirection: '남동',

    highTideTime: '08:45',
    lowTideTime: '15:00',

    currentSpeed: 0.7,
    currentDirection: '동',

    warning: null,
    station: '서귀포 해양관측소',
    stationDistance: 8,
    observedAt: '2026-08-11 09:00',
  },
  {
    id: 'spot_03',
    name: '강릉 사천',
    region: '강릉',
    icon: '🐟',

    weather: '구름',
    weatherIcon: '☁️',
    airTemp: 26,
    waterTemp: 22,

    waveHeight: 1.3,
    wavePeriod: 8,
    waveDirection: '동',

    windSpeed: 7.1,
    windDirection: '북동',

    highTideTime: '09:15',
    lowTideTime: '15:30',

    currentSpeed: 0.8,
    currentDirection: '남',

    warning: '풍랑주의보',
    station: '강릉 파고부이',
    stationDistance: 6,
    observedAt: '2026-08-11 09:00',
  },
  {
    id: 'spot_04',
    name: '동해 대진',
    region: '동해',
    icon: '🌊',

    weather: '비',
    weatherIcon: '🌧️',
    airTemp: 24,
    waterTemp: 21,

    waveHeight: 1.7,
    wavePeriod: 9,
    waveDirection: '북동',

    windSpeed: 9.2,
    windDirection: '북',

    highTideTime: '09:25',
    lowTideTime: '15:42',

    currentSpeed: 1.1,
    currentDirection: '남서',

    warning: '풍랑주의보',
    station: '동해 해양기상부이',
    stationDistance: 15,
    observedAt: '2026-08-11 09:00',
  },
  {
    id: 'spot_05',
    name: '울진 왕돌초',
    region: '울진',
    icon: '🐡',

    weather: '맑음',
    weatherIcon: '🌞',
    airTemp: 29,
    waterTemp: 23,

    waveHeight: 0.8,
    wavePeriod: 6,
    waveDirection: '동',

    windSpeed: 3.8,
    windDirection: '남',

    highTideTime: '09:35',
    lowTideTime: '15:50',

    currentSpeed: 0.9,
    currentDirection: '북',

    warning: null,
    station: '울진 파고부이',
    stationDistance: 18,
    observedAt: '2026-08-11 09:00',
  },
  {
    id: 'spot_06',
    name: '부산 태종대',
    region: '부산',
    icon: '🐙',

    weather: '소나기',
    weatherIcon: '🌦️',
    airTemp: 27,
    waterTemp: 25,

    waveHeight: 1.0,
    wavePeriod: 7,
    waveDirection: '남',

    windSpeed: 6.3,
    windDirection: '남서',

    highTideTime: '08:55',
    lowTideTime: '15:12',

    currentSpeed: 0.8,
    currentDirection: '동',

    warning: '강풍주의보',
    station: '부산 해양기상부이',
    stationDistance: 10,
    observedAt: '2026-08-11 09:00',
  },
  {
    id: 'spot_07',
    name: '거제 구조라',
    region: '거제',
    icon: '🐬',

    weather: '맑음',
    weatherIcon: '☀️',
    airTemp: 28,
    waterTemp: 26,

    waveHeight: 0.6,
    wavePeriod: 5,
    waveDirection: '남동',

    windSpeed: 3.5,
    windDirection: '남',

    highTideTime: '09:05',
    lowTideTime: '15:20',

    currentSpeed: 0.3,
    currentDirection: '북동',

    warning: null,
    station: '거제도 해양관측소',
    stationDistance: 7,
    observedAt: '2026-08-11 09:00',
  },
  {
    id: 'spot_08',
    name: '포항 구룡포',
    region: '포항',
    icon: '⚠️',

    weather: '천둥·번개',
    weatherIcon: '⛈️',
    airTemp: 25,
    waterTemp: 23,

    waveHeight: 1.8,
    wavePeriod: 10,
    waveDirection: '북동',

    windSpeed: 10.5,
    windDirection: '북동',

    highTideTime: '09:40',
    lowTideTime: '16:00',

    currentSpeed: 1.2,
    currentDirection: '남서',

    warning: '풍랑주의보',
    station: '포항 파고부이',
    stationDistance: 9,
    observedAt: '2026-08-11 09:00',
  },
])

// 검색 및 특보 필터
const filteredDivingSpotList = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return divingSpotList.value.filter((spot) => {
    const matchesSearch =
      query === '' ||
      spot.name.toLowerCase().includes(query) ||
      spot.region.toLowerCase().includes(query)

    const matchesWarning = !warningOnly.value || spot.warning !== null

    return matchesSearch && matchesWarning
  })
})

// 평균 파고
const averageWaveHeight = computed(() => {
  const total = divingSpotList.value.reduce((sum, spot) => sum + spot.waveHeight, 0)

  return (total / divingSpotList.value.length).toFixed(1)
})

// 평균 수온
const averageWaterTemperature = computed(() => {
  const total = divingSpotList.value.reduce((sum, spot) => sum + spot.waterTemp, 0)

  return (total / divingSpotList.value.length).toFixed(1)
})

// 특보가 있는 포인트 개수
const warningSpotCount = computed(() => {
  return divingSpotList.value.filter((spot) => spot.warning !== null).length
})

// 선택한 포인트의 환경 주의 항목
const selectedSpotAlerts = computed(() => {
  const spot = selectedDivingSpot.value
  const alerts = []

  if (!spot) {
    return []
  }

  if (spot.warning) {
    alerts.push({
      icon: '🚨',
      message: `기상특보: ${spot.warning}`,
      level: 'danger',
    })
  }

  if (spot.waveHeight >= 1.5) {
    alerts.push({
      icon: '🌊',
      message: `높은 파고가 관측되었습니다. (${spot.waveHeight}m)`,
      level: 'danger',
    })
  } else if (spot.waveHeight >= 1) {
    alerts.push({
      icon: '🌊',
      message: `다소 높은 파고입니다. (${spot.waveHeight}m)`,
      level: 'warning',
    })
  }

  if (spot.windSpeed >= 8) {
    alerts.push({
      icon: '💨',
      message: `강한 바람이 관측되었습니다. (${spot.windSpeed}m/s)`,
      level: 'danger',
    })
  } else if (spot.windSpeed >= 6) {
    alerts.push({
      icon: '💨',
      message: `바람이 다소 강합니다. (${spot.windSpeed}m/s)`,
      level: 'warning',
    })
  }

  if (spot.currentSpeed >= 1) {
    alerts.push({
      icon: '🧭',
      message: `강한 조류가 예상됩니다. (${spot.currentSpeed}m/s)`,
      level: 'danger',
    })
  } else if (spot.currentSpeed >= 0.7) {
    alerts.push({
      icon: '🧭',
      message: `조류 흐름에 주의하세요. (${spot.currentSpeed}m/s)`,
      level: 'warning',
    })
  }

  if (spot.weather.includes('천둥')) {
    alerts.push({
      icon: '⛈️',
      message: '천둥·번개 예보가 있습니다.',
      level: 'danger',
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      icon: 'ℹ️',
      message: '현재 Mockup 설정 기준으로 표시할 주의 항목이 없습니다.',
      level: 'normal',
    })
  }

  return alerts
})

// 가장 높은 주의 단계
const selectedAlertLevel = computed(() => {
  const alerts = selectedSpotAlerts.value

  if (alerts.some((alert) => alert.level === 'danger')) {
    return 'danger'
  }

  if (alerts.some((alert) => alert.level === 'warning')) {
    return 'warning'
  }

  return 'normal'
})

// 카드 선택
const selectDivingSpot = (spot) => {
  selectedDivingSpot.value = spot

  selectedSpotInfo.value = `${spot.name}의 해양환경 정보를 선택했습니다.`
}

// 상세보기
const showDetail = (spot) => {
  window.alert(
    `🤿 ${spot.name} 해양환경 정보\n\n` +
      `날씨: ${spot.weather}\n` +
      `기온: ${spot.airTemp}°C\n` +
      `수온: ${spot.waterTemp}°C\n\n` +
      `파고: ${spot.waveHeight}m\n` +
      `파주기: ${spot.wavePeriod}초\n` +
      `파향: ${spot.waveDirection}\n\n` +
      `풍속: ${spot.windSpeed}m/s\n` +
      `풍향: ${spot.windDirection}\n\n` +
      `만조: ${spot.highTideTime}\n` +
      `간조: ${spot.lowTideTime}\n` +
      `조류: ${spot.currentSpeed}m/s · ${spot.currentDirection}\n\n` +
      `특보: ${spot.warning || '없음'}\n` +
      `기준 관측소: ${spot.station}\n` +
      `관측시각: ${spot.observedAt}\n\n` +
      `※ 실제 입수 여부는 공식 기상특보와 현지 전문가의 안내를 확인하세요.`,
  )
}

// 선택 포인트 감시
watch(selectedDivingSpot, (newSpot, oldSpot) => {
  if (!newSpot) {
    return
  }

  console.log('[watch] 선택 포인트 변경:', oldSpot?.name || '없음', '→', newSpot.name)
})

// 특보 필터 감시
watch(warningOnly, (newValue) => {
  console.log('[watch] 특보 지역만 보기:', newValue)
})

// 검색어 자동 감시
watchEffect(() => {
  console.log(`[watchEffect] 현재 검색어: ${searchQuery.value}`)
})
</script>

<template>
  <main class="diving-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">DIVING OCEAN CONDITION</p>

        <h1>🤿 다이빙 해양환경 정보</h1>

        <p>날씨·물때·파고·바람·조류·특보를 한눈에 확인해 보세요.</p>
      </div>

      <div class="header-summary">
        <span>평균 파고</span>
        <strong>{{ averageWaveHeight }}m</strong>
      </div>
    </header>

    <section class="search-section">
      <label for="spot-search"> 🔍 다이빙 포인트 검색 </label>

      <input
        id="spot-search"
        v-model="searchQuery"
        type="text"
        placeholder="지역 또는 포인트 이름 입력"
      />

      <p>
        검색 중인 포인트:
        <strong>
          {{ searchQuery || '전체 포인트' }}
        </strong>
      </p>

      <label class="filter-checkbox">
        <input v-model="warningOnly" type="checkbox" />

        기상특보가 있는 포인트만 보기
      </label>
    </section>

    <section class="summary-section">
      <div class="summary-card">
        <span>전체 포인트</span>
        <strong> {{ divingSpotList.length }}곳 </strong>
      </div>

      <div class="summary-card">
        <span>검색 결과</span>
        <strong> {{ filteredDivingSpotList.length }}곳 </strong>
      </div>

      <div class="summary-card">
        <span>평균 수온</span>
        <strong> {{ averageWaterTemperature }}°C </strong>
      </div>

      <div class="summary-card warning-summary">
        <span>특보 지역</span>
        <strong>{{ warningSpotCount }}곳</strong>
      </div>
    </section>

    <section class="diving-section">
      <h2>🗺️ 다이빙 포인트 현황</h2>

      <p v-if="filteredDivingSpotList.length === 0" class="no-result">
        검색 결과와 일치하는 포인트가 없습니다.
      </p>

      <div v-else class="diving-list">
        <article
          v-for="spot in filteredDivingSpotList"
          :key="spot.id"
          class="diving-card"
          :class="{
            selected: selectedDivingSpot?.id === spot.id,
          }"
          @click="selectDivingSpot(spot)"
        >
          <div class="spot-header">
            <div class="spot-title">
              <div>
                <h3>{{ spot.name }}</h3>
                <p>{{ spot.region }}</p>
              </div>
            </div>

            <div class="weather">
              <span>{{ spot.weatherIcon }}</span>

              <div>
                <strong>{{ spot.weather }}</strong>
                <small>{{ spot.airTemp }}°C</small>
              </div>
            </div>
          </div>

          <div class="environment-grid">
            <div class="information-item">
              <span>🌡️ 수온</span>
              <strong> {{ spot.waterTemp }}°C </strong>
            </div>

            <div class="information-item">
              <span>🌊 파고</span>
              <strong> {{ spot.waveHeight }}m </strong>
            </div>

            <div class="information-item">
              <span>⏱️ 파주기</span>
              <strong> {{ spot.wavePeriod }}초 </strong>
            </div>

            <div class="information-item">
              <span>💨 풍속</span>
              <strong> {{ spot.windSpeed }}m/s </strong>
            </div>

            <div class="information-item">
              <span>⬆️ 만조</span>
              <strong>
                {{ spot.highTideTime }}
              </strong>
            </div>

            <div class="information-item">
              <span>⬇️ 간조</span>
              <strong>
                {{ spot.lowTideTime }}
              </strong>
            </div>

            <div class="information-item">
              <span>🧭 조류</span>
              <strong> {{ spot.currentSpeed }}m/s </strong>
            </div>

            <div class="information-item">
              <span>📍 조류 방향</span>
              <strong>
                {{ spot.currentDirection }}
              </strong>
            </div>
          </div>

          <div class="card-actions">
            <span v-if="spot.warning" class="warning-label"> 🚨 {{ spot.warning }} </span>

            <span v-else class="normal-label"> ✅ 발표된 특보 없음 </span>

            <button type="button" @click.stop="showDetail(spot)">상세보기</button>
          </div>

          <div
            v-if="selectedDivingSpot?.id === spot.id"
            class="environment-alert"
            :class="selectedAlertLevel"
          >
            <div class="alert-heading">
              <h4>📋 해양환경 주의 항목</h4>

              <span> {{ spot.observedAt }} 기준 </span>
            </div>

            <ul>
              <li v-for="alert in selectedSpotAlerts" :key="alert.message">
                {{ alert.icon }}
                {{ alert.message }}
              </li>
            </ul>

            <div class="station-information">
              기준 관측소:
              <strong>{{ spot.station }}</strong>

              <span>
                포인트에서 약
                {{ spot.stationDistance }}km
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <footer>
      <p>
        {{ selectedSpotInfo || '다이빙 포인트를 선택해 보세요.' }}
      </p>

      <small>
        본 화면은 Vue 학습을 위한 Mockup입니다. 실제 입수 여부는 공식 기상특보, 현지 해상 상태와
        전문가의 안내를 종합해 판단하세요.
      </small>
    </footer>
  </main>
</template>

<style scoped>
.diving-page {
  width: calc(100% - 40px);
  max-width: 900px;
  margin: 40px auto;
  padding: 24px;
  box-sizing: border-box;
  color: #17324d;
  font-family: Arial, sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 25px;
  border-radius: 16px;
  background: linear-gradient(135deg, #005b82, #009f9d);
  color: white;
}

.page-header h1 {
  margin: 5px 0 8px;
  font-size: 30px;
}

.page-header p:last-child {
  margin-bottom: 0;
}

.eyebrow {
  margin: 0;
  color: #baf4ff;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1.5px;
}

.header-summary {
  min-width: 105px;
  padding: 14px;
  border-radius: 12px;
  background: rgb(255 255 255 / 18%);
  text-align: center;
}

.header-summary span,
.header-summary strong {
  display: block;
}

.header-summary span {
  margin-bottom: 5px;
  color: #d8f8ff;
  font-size: 12px;
}

.header-summary strong {
  font-size: 24px;
}

.search-section,
.diving-section {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid #cde1e8;
  border-radius: 12px;
  background: #f4fbfd;
}

.search-section > label:first-child {
  display: block;
  margin-bottom: 9px;
  font-weight: bold;
}

.search-section input[type='text'] {
  width: 100%;
  padding: 11px;
  box-sizing: border-box;
  border: 1px solid #a9c5d0;
  border-radius: 7px;
}

.search-section input[type='text']:focus {
  border-color: #007da5;
  outline: none;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
  cursor: pointer;
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.summary-card {
  padding: 15px;
  border-radius: 10px;
  background: #e7f5fa;
  text-align: center;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  margin-bottom: 6px;
  color: #60798a;
  font-size: 12px;
}

.summary-card strong {
  font-size: 21px;
}

.warning-summary {
  background: #ffeded;
  color: #b53232;
}

.diving-section h2 {
  margin-top: 0;
}

.diving-list {
  display: grid;
  gap: 14px;
}

.diving-card {
  padding: 17px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: white;
  box-shadow: 0 3px 9px rgb(0 75 100 / 8%);
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.diving-card:hover {
  transform: translateY(-2px);
  border-color: #65bed1;
}

.diving-card.selected {
  border-color: #008bb3;
  background: #f8feff;
}

.spot-header,
.spot-title,
.weather,
.card-actions {
  display: flex;
  align-items: center;
}

.spot-header,
.card-actions {
  justify-content: space-between;
}

.spot-title,
.weather {
  gap: 11px;
}

.spot-title h3 {
  margin: 0 0 4px;
}

.spot-title p {
  margin: 0;
  color: #60798a;
}

.weather > span {
  font-size: 30px;
}

.weather strong,
.weather small {
  display: block;
  text-align: right;
}

.weather small {
  margin-top: 3px;
  color: #60798a;
}

.environment-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
  margin-top: 16px;
}

.information-item {
  padding: 10px;
  border-radius: 8px;
  background: #eef8fa;
  text-align: center;
}

.information-item span,
.information-item strong {
  display: block;
}

.information-item span {
  margin-bottom: 5px;
  color: #60798a;
  font-size: 12px;
}

.card-actions {
  margin-top: 16px;
}

.warning-label,
.normal-label {
  padding: 7px 11px;
  border-radius: 7px;
  color: white;
  font-size: 13px;
}

.warning-label {
  background: #df4848;
}

.normal-label {
  background: #3d9b69;
}

.card-actions button {
  padding: 8px 13px;
  border: 1px solid #8aa9b7;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.environment-alert {
  margin-top: 16px;
  padding: 16px;
  border-radius: 10px;
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

.no-result {
  padding: 30px;
  color: #c23f3f;
  text-align: center;
}

footer {
  margin-top: 20px;
  padding: 16px;
  border-radius: 10px;
  background: #e5f7ef;
  color: #24664d;
  text-align: center;
}

footer p {
  margin: 0 0 8px;
  font-weight: bold;
}

footer small {
  display: block;
  color: #55776a;
  line-height: 1.5;
}

@media (max-width: 700px) {
  .diving-page {
    width: calc(100% - 20px);
    margin: 20px auto;
    padding: 12px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-section,
  .environment-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .alert-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
}
</style>
