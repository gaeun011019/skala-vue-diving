<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { divingSpots } from '@/data/divingSpots'
import { forecastSpots } from '@/data/forecastSpots'
import { fetchKmaConditionsForSpots, getWindDirection } from '@/services/kmaApi'
import { fetchKhoaScubaSpots } from '@/services/khoaScubaApi'
import { fetchKhoaTidesForSpots } from '@/services/khoaTideApi'
import { fetchOpenWeather } from '@/services/openWeatherApi'
import { fetchDepthTemperatures } from '@/services/copernicusApi'
import { formatSpotDisplayName } from '@/services/spotRegion'

import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()

const route = useRoute()
const router = useRouter()

const cachedSpot = (() => {
  try {
    const selected = JSON.parse(sessionStorage.getItem('seaGaniSelectedSpot') || 'null')
    return selected?.id === route.params.spotId ? selected : null
  } catch {
    return null
  }
})()
const baseSpot = ref(divingSpots.find((item) => item.id === route.params.spotId) || cachedSpot)
const spot = ref(null)
const isLoading = ref(true)
const dataError = ref('')
const depthTemperatureError = ref('')
const isDepthTemperatureLoading = ref(false)
const DEPTH_TEMPERATURE_CACHE_HOURS = 3
const tideHourMarks = [0, 3, 6, 9, 12, 15, 18, 21, 24]

const tideTimePosition = (time = '00:00') => {
  const [hour, minute] = time.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0
  return Math.min(100, Math.max(0, ((hour * 60 + minute) / 1440) * 100))
}

const todayInKorea = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replaceAll('-', '')

const currentTimePosition = () => {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
  return tideTimePosition(time)
}

const getCurrentLevel = () => {
  const speed = spot.value?.maxCurrentSpeed ?? spot.value?.currentSpeed
  if (!Number.isFinite(speed)) return { label: '자료 없음', className: 'unknown' }
  if (speed < 0.3) return { label: '잔잔', className: 'calm' }
  if (speed < 0.7) return { label: '보통', className: 'moderate' }
  if (speed < 1) return { label: '강함', className: 'strong' }
  return { label: '매우 강함', className: 'very-strong' }
}

const getWeatherEmoji = (weatherCode) => {
  if (weatherCode >= 200 && weatherCode < 300) return '⛈️'
  if (weatherCode >= 300 && weatherCode < 600) return '🌧️'
  if (weatherCode >= 600 && weatherCode < 700) return '🌨️'
  if (weatherCode >= 700 && weatherCode < 800) return '🌫️'
  if (weatherCode === 800) return '☀️'
  return '☁️'
}

const getDepthTemperatureCache = (spotId) => {
  try {
    const cached = JSON.parse(localStorage.getItem(`seaGaniDepthTemperature:${spotId}`) || 'null')
    const maxAge = DEPTH_TEMPERATURE_CACHE_HOURS * 60 * 60 * 1000
    return cached && Date.now() - cached.savedAt < maxAge ? cached.data : null
  } catch {
    return null
  }
}

const loadDepthTemperature = async (meta) => {
  const cached = getDepthTemperatureCache(meta.id)
  if (cached) {
    spot.value = {
      ...spot.value,
      depthTemperatures: cached.temperatures || [],
      depthTemperatureSource: cached.source || '',
      depthTemperatureForecastTime: cached.forecastTime || '',
    }
    return
  }

  isDepthTemperatureLoading.value = true
  depthTemperatureError.value = ''
  try {
    const result = await fetchDepthTemperatures(meta)
    localStorage.setItem(
      `seaGaniDepthTemperature:${meta.id}`,
      JSON.stringify({ savedAt: Date.now(), data: result }),
    )
    spot.value = {
      ...spot.value,
      depthTemperatures: result.temperatures || [],
      depthTemperatureSource: result.source || '',
      depthTemperatureForecastTime: result.forecastTime || '',
    }
  } catch (error) {
    depthTemperatureError.value =
      error.message || 'Copernicus 수심별 수온 자료를 불러오지 못했습니다.'
  } finally {
    isDepthTemperatureLoading.value = false
  }
}

const loadDetail = async () => {
  if (!baseSpot.value) {
    try {
      const apiSpots = await fetchKhoaScubaSpots()
      baseSpot.value = apiSpots.find((item) => item.id === route.params.spotId)
    } catch (error) {
      dataError.value = error.message || '스킨스쿠버 포인트를 불러오지 못했습니다.'
    }
  }
  if (!baseSpot.value) return (isLoading.value = false)

  const meta = forecastSpots.find((item) => item.id === baseSpot.value.id) || baseSpot.value
  spot.value = {
    ...baseSpot.value,
    ...meta,
    weather: baseSpot.value.weather || '불러오는 중',
    weatherIcon: baseSpot.value.weatherIcon || '·',
    airTemp: baseSpot.value.airTemp ?? null,
    waterTemperatures: [{ depth: 0, temp: baseSpot.value.waterTemperature ?? null }],
    waveHeight: baseSpot.value.waveHeight ?? null,
    wavePeriod: baseSpot.value.wavePeriod ?? null,
    waveDirection: baseSpot.value.waveDirection || '자료 없음',
    windSpeed: baseSpot.value.windSpeed ?? null,
    windDirection: baseSpot.value.windDirection || '자료 없음',
    warning: baseSpot.value.warning || null,
    station: baseSpot.value.station || '관측소 확인 중',
    stationDistance: baseSpot.value.stationDistance ?? null,
    depthTemperatures: [],
    observedAt:
      `${baseSpot.value.forecastDate || ''} ${baseSpot.value.forecastPeriod || ''}`.trim() ||
      '자료 확인 중',
  }
  isLoading.value = false
  loadDepthTemperature(meta)

  const [weatherResult, kmaResult, tideResult] = await Promise.allSettled([
    fetchOpenWeather(meta),
    fetchKmaConditionsForSpots([meta]),
    fetchKhoaTidesForSpots([meta]),
  ])
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null
  const kma = kmaResult.status === 'fulfilled' ? kmaResult.value[meta.id] : null
  const observation = kma?.observation
  const marine = kma?.marineForecast
  const tideForecast =
    tideResult.status === 'fulfilled' ? tideResult.value[meta.id] : baseSpot.value.tideForecast

  spot.value = {
    ...spot.value,
    weather: weather?.current.weather || '자료 없음',
    weatherIcon: weather ? getWeatherEmoji(weather.current.weatherCode) : '—',
    airTemp: weather?.current.temperature ?? null,
    waterTemperatures: [
      {
        depth: 0,
        temp:
          baseSpot.value.waterTemperature ??
          observation?.waterTemperature ??
          marine?.waterTemperature ??
          null,
      },
    ],
    waveHeight:
      baseSpot.value.waveHeight ??
      observation?.waveHeight ??
      marine?.waveHeight ??
      kma?.shortWave ??
      null,
    wavePeriod: observation?.wavePeriod ?? marine?.wavePeriod ?? null,
    waveDirection: getWindDirection(observation?.waveDirection ?? marine?.waveDirection),
    windSpeed: weather?.current.wind ?? observation?.windSpeed ?? marine?.windSpeed ?? null,
    windDirection:
      weather?.current.direction ||
      getWindDirection(observation?.windDirection ?? marine?.windDirection),
    warning: kma?.warning || null,
    station: observation?.station || '가까운 해양기상부이 자료 없음',
    stationDistance: observation?.distance ?? null,
    observedAt: observation?.observedAt || weather?.current.observedAt || '시각 정보 없음',
    tideForecast: tideForecast || null,
  }

  if (!weather || !kma) dataError.value = '일부 API 자료를 불러오지 못했습니다.'
}

onMounted(loadDetail)

const goHome = () => {
  router.push('/')
}

const goNotFound = () => {
  router.replace({
    name: 'not-found',
  })
}
</script>

<template>
  <main class="detail-page">
    <button type="button" class="top-back-button" @click="goHome">← 포인트 찾기</button>

    <section v-if="isLoading" class="loading-detail">
      실제 관측·예보 자료를 불러오는 중입니다.
    </section>

    <template v-else-if="spot">
      <header class="detail-header">
        <div class="spot-title">
          <div>
            <p class="eyebrow">DIVING POINT DETAIL</p>

            <h1>{{ formatSpotDisplayName(spot) }}</h1>

            <p class="detail-purpose">오늘 또는 입수 직전, 현재 해양 상태를 확인하세요.</p>
            <p class="detail-observed-at">{{ spot.observedAt }} 기준</p>
          </div>
        </div>

        <div class="weather">
          <span>{{ spot.weatherIcon }}</span>

          <div>
            <strong>{{ spot.weather }}</strong>
            <small>{{ configStore.formatTemperature(spot.airTemp) }}</small>
          </div>
        </div>
      </header>

      <section v-if="spot.warning" class="warning-banner">
        🚨 현재 표시된 특보:
        <strong>{{ spot.warning }}</strong>
      </section>

      <p v-if="dataError" class="data-error">{{ dataError }}</p>

      <section v-if="spot.scubaIndex || Number.isFinite(spot.scubaScore)" class="detail-category">
        <h2>🤿 국립해양조사원 스킨스쿠버 지수</h2>
        <dl>
          <div v-if="spot.scubaIndex">
            <dt>지수</dt>
            <dd>{{ spot.scubaIndex }}</dd>
          </div>
          <div v-if="Number.isFinite(spot.scubaScore)">
            <dt>점수</dt>
            <dd>{{ spot.scubaScore }}점</dd>
          </div>
          <div>
            <dt>예측 시간</dt>
            <dd>{{ spot.forecastDate }} {{ spot.forecastPeriod }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="!spot.source" class="detail-category">
        <h2>🌡️ 해수면 수온</h2>

        <div class="temperature-grid">
          <div v-for="temperature in spot.waterTemperatures" :key="temperature.depth">
            <span>기상청 해양기상부이 해수면 관측</span>

            <strong>
              {{ configStore.formatTemperature(temperature.temp) }}
            </strong>
          </div>
        </div>
      </section>

      <section
        v-if="isDepthTemperatureLoading || spot.depthTemperatures?.length || depthTemperatureError"
        class="detail-category"
      >
        <h2>🤿 예상 수심별 수온</h2>

        <div v-if="isDepthTemperatureLoading" class="depth-temperature-loading">
          <span></span>
          <div>
            <strong>수심별 수온을 불러오는 중입니다.</strong>
            <small>기본 상세정보는 먼저 이용할 수 있어요.</small>
          </div>
        </div>

        <div v-else-if="spot.depthTemperatures?.length" class="temperature-grid">
          <div v-for="temperature in spot.depthTemperatures" :key="temperature.depth">
            <span>{{ temperature.depth === 0 ? '표층' : `${temperature.depth}m` }}</span>
            <strong>
              {{ temperature.temp === null ? '자료 없음' : `${temperature.temp}°C` }}
            </strong>
          </div>
        </div>

        <p
          v-if="!isDepthTemperatureLoading && spot.depthTemperatures?.length"
          class="temperature-note"
        >
          Copernicus Marine 해양모델 예측값(약 8~9km 해상도)입니다. 현장 실측값과 차이가 있을 수
          있습니다.
        </p>
        <p v-else-if="!isDepthTemperatureLoading" class="temperature-note">
          {{ depthTemperatureError }}
        </p>
      </section>

      <section class="category-grid">
        <article class="detail-category">
          <h2>🌊 파도</h2>

          <dl>
            <div>
              <dt>파고</dt>
              <dd>{{ spot.waveHeight === null ? '자료 없음' : `${spot.waveHeight}m` }}</dd>
            </div>

            <div>
              <dt>파주기</dt>
              <dd>{{ spot.wavePeriod === null ? '자료 없음' : `${spot.wavePeriod}초` }}</dd>
            </div>

            <div>
              <dt>파향</dt>
              <dd>{{ spot.waveDirection }}</dd>
            </div>
          </dl>
        </article>

        <article class="detail-category">
          <h2>💨 바람</h2>

          <dl>
            <div>
              <dt>풍속</dt>
              <dd>{{ spot.windSpeed === null ? '자료 없음' : `${spot.windSpeed}m/s` }}</dd>
            </div>

            <div>
              <dt>풍향</dt>
              <dd>{{ spot.windDirection }}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section class="detail-category">
        <h2>🌙 물때와 조류</h2>
        <dl>
          <div>
            <dt>물때</dt>
            <dd>{{ spot.tideLabel || '자료 없음' }}</dd>
          </div>
          <div>
            <dt>조류 강도</dt>
            <dd
              v-if="spot.currentSpeed !== null && spot.currentSpeed !== undefined"
              class="detail-current-strength"
            >
              <span>
                <b :class="getCurrentLevel().className">{{ getCurrentLevel().label }}</b>
                {{ spot.minCurrentSpeed ?? '-' }}~{{ spot.maxCurrentSpeed ?? '-' }}m/s
              </span>
              <small>최대 예상 유속 기준</small>
            </dd>
            <dd v-else>자료 없음</dd>
          </div>
        </dl>

        <div v-if="spot.tideForecast?.events.length" class="detail-tide-timeline-panel">
          <div class="detail-tide-heading">
            <p>
              <strong>{{ spot.tideForecast.station }}</strong> 조석 예보
              <span>포인트에서 약 {{ spot.tideForecast.stationDistance }}km</span>
            </p>
            <small>00:00부터 24:00까지</small>
          </div>

          <div class="detail-tide-timeline" aria-label="하루 만조·간조 시간표">
            <div
              v-for="hour in tideHourMarks"
              :key="hour"
              class="detail-tide-hour"
              :style="{ top: `${(hour / 24) * 100}%` }"
            >
              <span>{{ String(hour).padStart(2, '0') }}:00</span>
              <i></i>
            </div>
            <div class="detail-tide-axis"></div>
            <div
              v-if="spot.tideForecast.date === todayInKorea()"
              class="detail-tide-now"
              :style="{ top: `${currentTimePosition()}%` }"
            >
              <span>현재 시각</span>
            </div>
            <article
              v-for="event in spot.tideForecast.events"
              :key="event.id"
              class="detail-tide-event"
              :class="event.type"
              :style="{ top: `${tideTimePosition(event.time)}%` }"
            >
              <i></i>
              <div>
                <span>{{
                  event.type === 'high' ? '만조' : event.type === 'low' ? '간조' : '조석'
                }}</span>
                <strong>{{ event.time }}</strong>
                <small>{{
                  event.height === null ? '조위 자료 없음' : `예상 조위 ${event.height}cm`
                }}</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="station">
        <h2>📍 관측 기준</h2>

        <p>
          기준 관측소:
          <strong>{{ spot.station }}</strong>
        </p>

        <p>
          포인트와의 거리:
          {{ spot.stationDistance === null ? '자료 없음' : `약 ${spot.stationDistance}km` }}
        </p>

        <p>관측시각: {{ spot.observedAt }}</p>
      </section>

      <button type="button" class="back-button" @click="goHome">
        ← 다이빙 대시보드로 돌아가기
      </button>
    </template>

    <section v-else class="missing-spot">
      <span>🤿❓</span>
      <h1>포인트 정보를 찾을 수 없습니다.</h1>

      <button @click="goNotFound">안내 페이지로 이동</button>
    </section>
  </main>
</template>

<style scoped>
.detail-page {
  width: calc(100% - 40px);
  max-width: 1020px;
  margin: 0 auto;
  padding: 28px 0 70px;
  color: var(--ink-900);
}

.top-back-button {
  margin-bottom: 14px;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--sea-700);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.loading-detail,
.data-error {
  padding: 18px;
  border: 1px solid #d9e6ea;
  border-radius: 12px;
  background: #fff;
  color: #536b75;
  text-align: center;
}

.data-error {
  margin: 16px 0 0;
  border-color: #f1d5b9;
  background: #fff8f0;
  color: #9a5b20;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 150px;
  padding: 28px 30px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(circle at 92% 12%, rgb(58 139 183 / 11%), transparent 15rem), var(--surface);
  box-shadow: 0 8px 28px rgb(18 64 82 / 7%);
}

.spot-title,
.weather {
  display: flex;
  align-items: center;
  gap: 13px;
}

.eyebrow {
  margin: 0;
  color: var(--sea-700);
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1.5px;
}

.spot-title h1 {
  margin: 7px 0 8px;
  color: var(--ink-900);
  font-size: clamp(25px, 4vw, 34px);
  letter-spacing: -0.035em;
}

.detail-purpose,
.detail-observed-at {
  margin: 0;
  color: var(--ink-500);
  font-size: 13px;
}

.detail-observed-at {
  margin-top: 5px;
  font-size: 11px;
}

.weather {
  display: grid;
  grid-template-columns: auto minmax(72px, auto);
  align-items: center;
  justify-content: center;
  min-width: 190px;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e6ecee;
  border-radius: 13px;
  background: #f7f9fa;
}

.weather > span {
  display: block;
  font-size: 40px;
  line-height: 1;
}

.weather strong,
.weather small {
  display: block;
  color: var(--ink-900);
  line-height: 1.25;
  text-align: left;
}

.weather small {
  margin-top: 4px;
  color: var(--ink-500);
}

.warning-banner {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #f2c8cc;
  border-radius: 11px;
  background: #fff0f1;
  color: #a33c46;
}

.detail-category,
.station {
  margin-top: 16px;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 5px 18px rgb(10 47 61 / 5%);
}

.detail-category h2,
.station h2 {
  margin: 0 0 15px;
  color: var(--ink-900);
  font-size: 17px;
  letter-spacing: -0.02em;
}

.temperature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.temperature-grid > div {
  padding: 15px 12px;
  border: 1px solid #dcecef;
  border-radius: 11px;
  background: #f3f9fa;
  text-align: center;
}

.temperature-grid span,
.temperature-grid strong {
  display: block;
}

.temperature-note {
  margin: 10px 0 0;
  color: #60798a;
  font-size: 13px;
}

.depth-temperature-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #dcecef;
  border-radius: 11px;
  background: #f3f9fa;
}

.depth-temperature-loading > span {
  width: 22px;
  height: 22px;
  border: 3px solid #cde3e8;
  border-top-color: var(--sea-600);
  border-radius: 50%;
  animation: temperature-spin 0.8s linear infinite;
}

.depth-temperature-loading strong,
.depth-temperature-loading small {
  display: block;
}

.depth-temperature-loading strong {
  font-size: 13px;
}

.depth-temperature-loading small {
  margin-top: 4px;
  color: var(--ink-500);
  font-size: 11px;
}

@keyframes temperature-spin {
  to {
    transform: rotate(360deg);
  }
}

.temperature-grid span {
  margin-bottom: 5px;
  color: #60798a;
  font-size: 12px;
}

.temperature-grid strong {
  color: #00779b;
  font-size: 19px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

dl {
  margin: 0;
}

dl > div {
  display: flex;
  justify-content: space-between;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
}

dl > div:last-child {
  border-bottom: 0;
}

dt {
  color: #60798a;
}

dd {
  margin: 0;
  font-weight: bold;
}

.detail-current-strength {
  text-align: right;
}

.detail-current-strength span,
.detail-current-strength small {
  display: block;
}

.detail-current-strength b {
  display: inline-block;
  margin-right: 5px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
}

.detail-current-strength small {
  margin-top: 5px;
  color: var(--ink-500);
  font-size: 11px;
  font-weight: normal;
}

.detail-current-strength .calm {
  background: #e4f5ef;
  color: #28745a;
}

.detail-current-strength .moderate {
  background: #e7f1f8;
  color: #316e92;
}

.detail-current-strength .strong {
  background: #fff1cc;
  color: #8a6410;
}

.detail-current-strength .very-strong {
  background: #ffe3e5;
  color: #a83642;
}

.station p {
  margin: 8px 0;
}

.detail-tide-timeline-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e8edef;
}

.detail-tide-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.detail-tide-heading p {
  margin: 0;
  color: #60798a;
  font-size: 12px;
}

.detail-tide-heading p strong,
.detail-tide-heading p span {
  display: block;
}

.detail-tide-heading p strong {
  margin-bottom: 3px;
  color: #173e50;
  font-size: 15px;
}

.detail-tide-heading > small {
  color: #78909c;
}

.detail-tide-timeline {
  position: relative;
  height: 600px;
  margin: 0 8px;
}

.detail-tide-axis {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 92px;
  width: 4px;
  border-radius: 99px;
  background: linear-gradient(#d7eaf3, #68bddf 48%, #bee1ec);
}

.detail-tide-hour {
  position: absolute;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
}

.detail-tide-hour span {
  width: 70px;
  color: #78909c;
  font-size: 11px;
  text-align: right;
}

.detail-tide-hour i {
  flex: 1;
  margin-left: 24px;
  border-top: 1px dashed #dfe9ec;
}

.detail-tide-event {
  position: absolute;
  right: 0;
  left: 92px;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
}

.detail-tide-event > i {
  z-index: 1;
  width: 16px;
  height: 16px;
  margin-left: -6px;
  border: 4px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgb(18 90 125 / 12%);
}

.detail-tide-event.high > i {
  background: #1580ad;
}

.detail-tide-event.low > i {
  background: #56b5a4;
}

.detail-tide-event > div {
  display: grid;
  grid-template-columns: 54px 68px minmax(120px, 1fr);
  align-items: center;
  width: min(430px, calc(100% - 28px));
  margin-left: 13px;
  padding: 13px 15px;
  border: 1px solid #e0eaed;
  border-radius: 13px;
  background: rgb(255 255 255 / 97%);
  box-shadow: 0 7px 20px rgb(26 67 84 / 9%);
}

.detail-tide-event.high > div {
  border-left: 4px solid #1580ad;
}

.detail-tide-event.low > div {
  border-left: 4px solid #56b5a4;
}

.detail-tide-event span,
.detail-tide-event small {
  color: #60798a;
  font-size: 12px;
}

.detail-tide-event strong {
  color: #173e50;
  font-size: 16px;
}

.detail-tide-event small {
  text-align: right;
}

.detail-tide-now {
  position: absolute;
  right: 0;
  left: 92px;
  z-index: 2;
  border-top: 1px solid #ef8662;
}

.detail-tide-now::before {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef8662;
  content: '';
}

.detail-tide-now span {
  position: absolute;
  top: -11px;
  right: 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: #fff0eb;
  color: #bd5838;
  font-size: 10px;
}

.back-button,
.missing-spot button {
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  background: var(--sea-900);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.missing-spot {
  padding: 50px;
  border-radius: 14px;
  background: white;
  text-align: center;
}

.missing-spot > span {
  font-size: 60px;
}

@media (max-width: 650px) {
  .detail-page {
    width: calc(100% - 20px);
    padding-top: 18px;
  }

  .detail-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .weather {
    width: 100%;
    justify-content: center;
  }

  .temperature-grid,
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
