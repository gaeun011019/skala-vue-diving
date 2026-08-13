<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { forecastSpots } from '@/data/forecastSpots'
import {
  fetchKmaMarineObservation,
  fetchKmaWaveForecast,
  getWindDirection,
} from '@/services/kmaApi'
import { fetchOpenWeather } from '@/services/openWeatherApi'
import { fetchKhoaTidesForSpots } from '@/services/khoaTideApi'
import { fetchKhoaScubaForecastForSpot } from '@/services/khoaScubaApi'
import { getCachedScubaSpots, loadScubaSpotCatalog } from '@/services/scubaSpotCatalog'
import { formatSpotDisplayName } from '@/services/spotRegion'

const route = useRoute()
const cachedSpots = getCachedScubaSpots()
const availableSpots = ref(cachedSpots.length ? cachedSpots : forecastSpots)
const requestedSpotId = availableSpots.value.some((spot) => spot.id === route.query.spot)
  ? route.query.spot
  : availableSpots.value[0].id

const selectedSpotId = ref(requestedSpotId)
const selectedDateIndex = ref(0)
const selectedTimeIndex = ref(0)
const selectedLayer = ref('wind')
const isPlaying = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const kmaErrorMessage = ref('')
const weatherData = ref(null)
const marineObservation = ref(null)
const waveByTime = ref({})
const marineByTime = ref({})
const tideByDate = ref({})
const scubaForecastRows = ref([])
const mapElement = ref(null)
const mapZoom = ref(6)
let playbackTimer
let forecastMap
let spotMarker

const mapLayers = computed(() => [
  { value: 'wind', label: '바람', available: true },
  { value: 'wave', label: '파도', available: Object.keys(waveByTime.value).length > 0 },
  { value: 'rain', label: '강수', available: true },
])

const selectedSpot = computed(() =>
  availableSpots.value.find((spot) => spot.id === selectedSpotId.value),
)
const dates = computed(() => weatherData.value?.days || [])
const dailyForecast = computed(() => dates.value[selectedDateIndex.value]?.forecasts || [])
const selectedForecast = computed(() => {
  const forecast = dailyForecast.value[selectedTimeIndex.value] || dailyForecast.value[0] || null
  if (!forecast) return null

  const marine = marineByTime.value[`${forecast.date}T${forecast.time}`]

  return {
    ...forecast,
    waveHeight: waveByTime.value[`${forecast.date}T${forecast.time}`] ?? null,
    wavePeriod: marine?.wavePeriod ?? null,
    waveDirection: marine?.waveDirection ?? null,
    waveDetailSource: marine ? '해상 예보구역 기준' : '예보 자료 없음',
  }
})

const compactDate = (value) => String(value || '').replaceAll('-', '')

const selectedTide = computed(() => tideByDate.value[dates.value[selectedDateIndex.value]?.value])

const selectedScubaForecast = computed(() => {
  if (!selectedForecast.value) return null
  const period = Number(selectedForecast.value.time.slice(0, 2)) < 12 ? '오전' : '오후'
  const date = compactDate(selectedForecast.value.date)
  return scubaForecastRows.value.find(
    (row) => compactDate(row.forecastDate) === date && row.forecastPeriod === period,
  )
})

const currentLevel = computed(() => {
  const speed = selectedScubaForecast.value?.maxCurrentSpeed
  if (!Number.isFinite(speed)) return { label: '예보 자료 없음', className: 'unknown' }
  if (speed < 0.3) return { label: '잔잔', className: 'normal' }
  if (speed < 0.7) return { label: '보통', className: 'normal' }
  if (speed < 1) return { label: '강함', className: 'warning' }
  return { label: '매우 강함', className: 'danger' }
})

const dailySummaries = computed(() =>
  dates.value.map((day) => {
    const maximumWind = Math.max(...day.forecasts.map((forecast) => forecast.wind))
    const maximumRain = Math.max(...day.forecasts.map((forecast) => forecast.rain))
    const waves = day.forecasts
      .map((forecast) => waveByTime.value[`${forecast.date}T${forecast.time}`])
      .filter(Number.isFinite)
    const maximumWave = waves.length ? Math.max(...waves) : null
    const level =
      maximumWind >= 8 || maximumRain >= 70 || maximumWave >= 2
        ? 'danger'
        : maximumWind >= 6 || maximumRain >= 50 || maximumWave >= 1.5
          ? 'warning'
          : 'normal'
    return {
      level,
      label: level === 'danger' ? '주의' : level === 'warning' ? '확인 필요' : '무난',
    }
  }),
)

const formatWaveDirection = (degree) => {
  if (!Number.isFinite(degree)) return '자료 없음'
  return getWindDirection(degree)
}

const mapLayerStyle = computed(() => {
  const forecast = selectedForecast.value
  if (!forecast) return {}

  return {
    '--flow-angle': `${forecast.windDegree + 180}deg`,
    '--wind-duration': `${Math.max(0.7, 3.2 - forecast.wind * 0.22)}s`,
    '--rain-opacity': Math.max(0.12, forecast.rain / 100),
    '--rain-duration': `${Math.max(0.55, 1.25 - forecast.rain * 0.006)}s`,
    '--wave-scale': Math.max(0.65, Math.min(2.4, forecast.waveHeight || 0.7)),
    '--wave-duration': `${Math.max(0.8, 2.5 - (forecast.waveHeight || 0.5) * 0.45)}s`,
  }
})

const layerSummary = computed(() => {
  const forecast = selectedForecast.value
  if (!forecast) return ''
  if (selectedLayer.value === 'rain') {
    return `강수확률 ${forecast.rain}% · ${forecast.rainAmount}mm`
  }
  if (selectedLayer.value === 'wave') {
    if (forecast.waveHeight === null) return '파고 자료 없음'
    const details = [`유의파고 ${forecast.waveHeight}m`]
    if (forecast.wavePeriod !== null) details.push(`파주기 ${forecast.wavePeriod}초`)
    if (forecast.waveDirection !== null)
      details.push(`파향 ${formatWaveDirection(forecast.waveDirection)}`)
    return details.join(' · ')
  }
  return `${forecast.direction}풍 ${forecast.wind}m/s`
})

const conditionLevel = computed(() => {
  const forecast = selectedForecast.value
  if (!forecast) return 'unknown'
  if (forecast.wind >= 8 || forecast.rain >= 70 || forecast.waveHeight >= 2) return 'danger'
  if (forecast.wind >= 6 || forecast.rain >= 50 || forecast.waveHeight >= 1.5) return 'warning'
  return 'normal'
})

const conditionText = computed(() => {
  if (conditionLevel.value === 'danger') return '기상 주의 요소 높음'
  if (conditionLevel.value === 'warning') return '기상 확인 필요'
  if (conditionLevel.value === 'normal') return '기상 특이사항 없음'
  return '자료 없음'
})

const notices = computed(() => {
  const forecast = selectedForecast.value
  if (!forecast) return []

  const items = []
  if (forecast.wind >= 8) items.push(`예상 풍속이 ${forecast.wind}m/s로 강합니다.`)
  else if (forecast.wind >= 6) items.push(`예상 풍속이 ${forecast.wind}m/s로 다소 강합니다.`)
  if (forecast.rain >= 70) items.push(`강수확률이 ${forecast.rain}%로 높습니다.`)
  else if (forecast.rain >= 50) items.push(`강수 가능성이 있어 현지 확인이 필요합니다.`)
  if (forecast.gust && forecast.gust >= 10)
    items.push(`돌풍이 최대 ${forecast.gust}m/s로 예상됩니다.`)
  if (forecast.waveHeight >= 2)
    items.push(`기상청 예상 유의파고가 ${forecast.waveHeight}m로 높습니다.`)
  else if (forecast.waveHeight >= 1.5)
    items.push(`기상청 예상 유의파고가 ${forecast.waveHeight}m입니다.`)
  if (!items.length) items.push('연결된 예보에서 설정 기준을 넘는 기상 항목이 없습니다.')
  if (forecast.waveHeight === null) items.push('선택 시간의 기상청 파고 예보값이 없습니다.')
  return items
})

const stopPlayback = () => {
  isPlaying.value = false
  window.clearInterval(playbackTimer)
}

const destroyForecastMap = () => {
  spotMarker = null
  forecastMap?.remove()
  forecastMap = null
  mapZoom.value = 6
}

const loadWeather = async () => {
  stopPlayback()
  destroyForecastMap()
  isLoading.value = true
  errorMessage.value = ''
  kmaErrorMessage.value = ''
  weatherData.value = null
  marineObservation.value = null
  waveByTime.value = {}
  marineByTime.value = {}
  tideByDate.value = {}
  scubaForecastRows.value = []
  selectedDateIndex.value = 0
  selectedTimeIndex.value = 0

  try {
    weatherData.value = await fetchOpenWeather(selectedSpot.value)

    const firstDate = weatherData.value.days[0]?.value
    const [observationResult, waveResult, scubaResult, tideResult] = await Promise.allSettled([
      fetchKmaMarineObservation(selectedSpot.value),
      fetchKmaWaveForecast(selectedSpot.value, weatherData.value.days[0]?.forecasts || []),
      fetchKhoaScubaForecastForSpot(selectedSpot.value),
      firstDate
        ? fetchKhoaTidesForSpots([selectedSpot.value], compactDate(firstDate))
        : Promise.resolve({}),
    ])

    if (observationResult.status === 'fulfilled') {
      marineObservation.value = observationResult.value
    }
    if (waveResult.status === 'fulfilled') {
      waveByTime.value = waveResult.value.waveByTime
      marineByTime.value = waveResult.value.marineByTime
    }
    if (scubaResult.status === 'fulfilled') scubaForecastRows.value = scubaResult.value
    if (tideResult.status === 'fulfilled' && firstDate) {
      tideByDate.value = {
        ...tideByDate.value,
        [firstDate]: tideResult.value[selectedSpot.value.id],
      }
    }

    const kmaFailures = [observationResult, waveResult].filter(
      (result) => result.status === 'rejected',
    )
    if (kmaFailures.length) {
      kmaErrorMessage.value = kmaFailures
        .map((result) => result.reason?.message || '기상청 자료 요청 실패')
        .join(' / ')
    }
  } catch (error) {
    const apiMessage = error.response?.data?.message
    errorMessage.value = apiMessage
      ? `OpenWeather 요청 실패: ${apiMessage}`
      : error.message || '날씨 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const loadSelectedDateWaves = async () => {
  const forecasts = dailyForecast.value
  if (!forecasts.length) return
  const date = dates.value[selectedDateIndex.value]?.value

  if (
    !forecasts.some(
      (forecast) => waveByTime.value[`${forecast.date}T${forecast.time}`] !== undefined,
    )
  ) {
    try {
      const result = await fetchKmaWaveForecast(selectedSpot.value, forecasts)
      waveByTime.value = { ...waveByTime.value, ...result.waveByTime }
      marineByTime.value = { ...marineByTime.value, ...result.marineByTime }
      kmaErrorMessage.value = ''
    } catch (error) {
      kmaErrorMessage.value = error.message || '기상청 파고 예보를 불러오지 못했습니다.'
    }
  }

  if (date && !tideByDate.value[date]) {
    try {
      const result = await fetchKhoaTidesForSpots([selectedSpot.value], compactDate(date))
      tideByDate.value = { ...tideByDate.value, [date]: result[selectedSpot.value.id] }
    } catch {
      tideByDate.value = { ...tideByDate.value, [date]: null }
    }
  }
}

const advanceForecast = () => {
  if (selectedTimeIndex.value < dailyForecast.value.length - 1) {
    selectedTimeIndex.value += 1
    return
  }

  selectedTimeIndex.value = 0
  selectedDateIndex.value =
    selectedDateIndex.value < dates.value.length - 1 ? selectedDateIndex.value + 1 : 0
}

const togglePlayback = () => {
  if (isPlaying.value) return stopPlayback()
  if (!selectedForecast.value) return

  isPlaying.value = true
  playbackTimer = window.setInterval(advanceForecast, 1300)
}

const selectDate = (index) => {
  stopPlayback()
  selectedDateIndex.value = index
  selectedTimeIndex.value = 0
}

const selectTime = (index) => {
  stopPlayback()
  selectedTimeIndex.value = index
}

const escapeMapLabel = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  )

const updateForecastMap = () => {
  if (!forecastMap || !selectedSpot.value) return
  const coordinates = [Number(selectedSpot.value.latitude), Number(selectedSpot.value.longitude)]
  forecastMap.setView(coordinates, 7)
  if (spotMarker) spotMarker.remove()
  spotMarker = L.marker(coordinates, {
    icon: L.divIcon({
      className: 'forecast-map-marker',
      html: `<span></span><strong>${escapeMapLabel(selectedSpot.value.name)}</strong>`,
      iconSize: [120, 34],
      iconAnchor: [12, 17],
    }),
  }).addTo(forecastMap)
}

const focusSelectedSpot = () => {
  if (!forecastMap || !selectedSpot.value) return
  forecastMap.invalidateSize()
  forecastMap.setView(
    [Number(selectedSpot.value.latitude), Number(selectedSpot.value.longitude)],
    11,
    { animate: false },
  )
}

const initializeMap = () => {
  if (!mapElement.value || forecastMap) return
  forecastMap = L.map(mapElement.value, {
    zoomControl: true,
    minZoom: 5,
    maxBounds: [
      [29.5, 119],
      [43, 137],
    ],
    maxBoundsViscosity: 0.7,
  }).setView([36.3, 127.8], 6)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(forecastMap)
  forecastMap.on('zoomend', () => {
    mapZoom.value = forecastMap.getZoom()
  })
  updateForecastMap()
}

const initializeForecast = async () => {
  const requestedId = route.query.spot
  const catalog = await loadScubaSpotCatalog()
  availableSpots.value = catalog.spots
  const nextSpotId = catalog.spots.some((spot) => spot.id === requestedId)
    ? requestedId
    : catalog.spots[0]?.id
  if (nextSpotId === selectedSpotId.value) {
    updateForecastMap()
    await loadWeather()
  } else selectedSpotId.value = nextSpotId
}

watch(selectedSpotId, (next, previous) => {
  if (next && previous !== undefined) {
    loadWeather()
    updateForecastMap()
  }
})
watch(selectedDateIndex, loadSelectedDateWaves)
watch(selectedForecast, async (forecast) => {
  if (!forecast || forecastMap) return
  await nextTick()
  initializeMap()
})
onMounted(() => {
  initializeForecast()
})
onUnmounted(() => {
  stopPlayback()
  destroyForecastMap()
})
</script>

<template>
  <main class="forecast-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">DIVING FORECAST</p>
        <h1>다이빙 예보</h1>
        <p>이번 주 다이빙 계획을 위해 날짜와 시간대별 예보를 비교하세요.</p>
      </div>

      <div
        class="data-state"
        :class="{ connected: weatherData && (marineObservation || Object.keys(waveByTime).length) }"
      >
        <span></span>
        {{
          weatherData && (marineObservation || Object.keys(waveByTime).length)
            ? 'OpenWeather · 기상청 실제 데이터'
            : weatherData
              ? 'OpenWeather 연결 · 기상청 확인 필요'
              : '데이터 연결 확인 중'
        }}
      </div>
    </header>

    <section class="control-panel" aria-label="예보 조회 조건">
      <label>
        다이빙 포인트
        <select v-model="selectedSpotId">
          <option v-for="spot in availableSpots" :key="spot.id" :value="spot.id">
            {{ formatSpotDisplayName(spot) }}
          </option>
        </select>
      </label>
    </section>

    <section v-if="isLoading" class="request-state" aria-live="polite">
      <span class="loading-spinner"></span>
      <strong>OpenWeather 예보를 불러오는 중입니다.</strong>
      <p>현재 날씨와 5일·3시간 예보를 함께 조회하고 있어요.</p>
    </section>

    <section v-else-if="errorMessage" class="request-state error" role="alert">
      <strong>날씨 정보를 불러오지 못했습니다.</strong>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadWeather">다시 불러오기</button>
    </section>

    <section v-else-if="weatherData" class="forecast-layout">
      <div class="forecast-main">
        <div class="date-tabs" role="tablist" aria-label="예보 날짜">
          <button
            v-for="(date, index) in dates"
            :key="date.value"
            type="button"
            :class="{ active: selectedDateIndex === index }"
            @click="selectDate(index)"
          >
            <strong>{{ date.label }}</strong>
            <span>{{ date.weekday }}</span>
            <em :class="dailySummaries[index].level">{{ dailySummaries[index].label }}</em>
          </button>
        </div>

        <section class="timeline-card">
          <header class="section-heading">
            <div>
              <span>시간대별 예보</span>
              <h2>{{ selectedSpot.name }}</h2>
            </div>
            <small>시간을 선택하면 상세 수치가 변경됩니다.</small>
          </header>

          <div class="timeline" role="list">
            <button
              v-for="(forecast, index) in dailyForecast"
              :key="forecast.id"
              type="button"
              :class="{ active: selectedTimeIndex === index }"
              @click="selectTime(index)"
            >
              <time>{{ forecast.time }}</time>
              <span class="weather-symbol" :class="{ rain: forecast.rain >= 60 }"></span>
              <strong>{{ forecast.temperature }}°</strong>
              <small>{{ forecast.weather }}</small>
              <em>
                {{
                  waveByTime[`${forecast.date}T${forecast.time}`] !== undefined
                    ? `파고 ${waveByTime[`${forecast.date}T${forecast.time}`]}m`
                    : `풍속 ${forecast.wind}m/s`
                }}
              </em>
            </button>
          </div>
        </section>

        <section v-if="selectedForecast" class="detail-card">
          <header class="section-heading detail-heading">
            <div>
              <span>{{ dates[selectedDateIndex].label }} {{ selectedForecast.time }}</span>
              <h2>{{ selectedForecast.weather }}</h2>
            </div>
            <span class="condition-badge" :class="conditionLevel">{{ conditionText }}</span>
          </header>

          <div class="forecast-category-grid">
            <article class="forecast-category weather-category">
              <header>
                <span>날씨</span>
                <small>OpenWeather 예보</small>
              </header>
              <dl>
                <div>
                  <dt>기온</dt>
                  <dd>{{ selectedForecast.temperature }}°C</dd>
                </div>
                <div>
                  <dt>강수확률</dt>
                  <dd>{{ selectedForecast.rain }}%</dd>
                </div>
              </dl>
            </article>

            <article class="forecast-category wind-category">
              <header>
                <span>바람</span>
                <small>OpenWeather 예보</small>
              </header>
              <dl>
                <div>
                  <dt>풍속</dt>
                  <dd>{{ selectedForecast.wind }}m/s</dd>
                </div>
                <div>
                  <dt>풍향</dt>
                  <dd>{{ selectedForecast.direction }}풍</dd>
                </div>
              </dl>
            </article>

            <article class="forecast-category wave-category">
              <header>
                <span>파도</span>
                <small>기상청 자료</small>
              </header>
              <dl>
                <div>
                  <dt>유의파고</dt>
                  <dd>
                    {{ selectedForecast.waveHeight ?? '-'
                    }}{{ selectedForecast.waveHeight === null ? '' : 'm' }}
                  </dd>
                </div>
                <div>
                  <dt>파주기</dt>
                  <dd>
                    {{ selectedForecast.wavePeriod ?? '-'
                    }}{{ selectedForecast.wavePeriod === null ? '' : '초' }}
                  </dd>
                </div>
                <div>
                  <dt>파향</dt>
                  <dd>{{ formatWaveDirection(selectedForecast.waveDirection) }}</dd>
                </div>
              </dl>
              <small class="category-source">{{ selectedForecast.waveDetailSource }}</small>
            </article>

            <article class="forecast-category ocean-category">
              <header>
                <span>물때와 조류</span>
                <small>국립해양조사원 예보</small>
              </header>
              <dl>
                <div>
                  <dt>물때</dt>
                  <dd>{{ selectedScubaForecast?.tideLabel || '예보 자료 없음' }}</dd>
                </div>
                <div>
                  <dt>조류 강도</dt>
                  <dd>
                    <b class="current-level" :class="currentLevel.className">
                      {{ currentLevel.label }}
                    </b>
                  </dd>
                </div>
              </dl>
              <small v-if="selectedScubaForecast" class="category-source">
                최대 예상 유속 {{ selectedScubaForecast.maxCurrentSpeed ?? '-' }}m/s 기준
              </small>
            </article>
          </div>

          <div class="forecast-tide-events">
            <div>
              <strong>선택 날짜 만조·간조</strong>
              <small v-if="selectedTide">
                {{ selectedTide.station }} · 포인트에서 약 {{ selectedTide.stationDistance }}km
              </small>
            </div>
            <ul v-if="selectedTide?.events.length">
              <li v-for="event in selectedTide.events" :key="event.id" :class="event.type">
                <span>{{ event.type === 'high' ? '만조' : '간조' }}</span>
                <strong>{{ event.time }}</strong>
                <small>{{ event.height === null ? '' : `${event.height}cm` }}</small>
              </li>
            </ul>
            <p v-else>선택 날짜의 조석 예보 자료가 없습니다.</p>
          </div>
        </section>
      </div>

      <aside class="forecast-aside">
        <section class="map-card">
          <header class="map-card-heading">
            <div>
              <span>예보 지도</span>
              <strong>{{ selectedSpot.name }}</strong>
            </div>
            <time>{{ dates[selectedDateIndex].label }} {{ selectedForecast.time }}</time>
          </header>

          <div class="layer-tabs" aria-label="지도 예보 항목">
            <button
              v-for="layer in mapLayers"
              :key="layer.value"
              type="button"
              :disabled="!layer.available"
              :class="{ active: selectedLayer === layer.value }"
              :title="
                layer.available ? `${layer.label} 예보 보기` : '선택 날짜의 기상청 파고 자료 없음'
              "
              @click="layer.available && (selectedLayer = layer.value)"
            >
              {{ layer.label }}
            </button>
          </div>

          <div class="map-view-toolbar">
            <span>OpenStreetMap 국내 지도 · 확대 {{ mapZoom }}단계</span>
            <div>
              <button type="button" @click="focusSelectedSpot">선택 포인트 확대</button>
            </div>
          </div>

          <div
            class="map-preview"
            :class="[`layer-${selectedLayer}`, { playing: isPlaying }]"
            :style="mapLayerStyle"
            aria-label="다이빙 포인트 예보 지도 미리보기"
          >
            <div ref="mapElement" class="forecast-map-base"></div>

            <div v-if="selectedLayer === 'wind'" class="wind-layer" aria-hidden="true">
              <i v-for="number in 15" :key="number"></i>
            </div>

            <div v-else-if="selectedLayer === 'wave'" class="wave-layer" aria-hidden="true">
              <i v-for="number in 4" :key="number"></i>
            </div>

            <div v-else class="rain-layer" aria-hidden="true">
              <i v-for="number in 24" :key="number"></i>
            </div>

            <div class="layer-value">
              <span>{{ mapLayers.find((layer) => layer.value === selectedLayer).label }}</span>
              <strong>{{ layerSummary }}</strong>
            </div>

            <div v-if="selectedLayer === 'wave'" class="wave-legend">
              <span></span>
              파고 높이를 파문 강도로 표현했어요
              <small>실제 파향 표현 아님</small>
            </div>
          </div>

          <div class="playback-control">
            <button
              type="button"
              class="play-button"
              :aria-label="isPlaying ? '예보 재생 일시정지' : '시간대별 예보 재생'"
              @click="togglePlayback"
            >
              {{ isPlaying ? 'Ⅱ' : '▶' }}
            </button>

            <div class="playback-timeline">
              <div class="playback-label">
                <strong>{{ selectedForecast.time }}</strong>
                <span>{{ isPlaying ? '예보 재생 중' : '재생하여 변화 보기' }}</span>
              </div>
              <div class="progress-track">
                <span
                  :style="{
                    width: `${(selectedTimeIndex / Math.max(1, dailyForecast.length - 1)) * 100}%`,
                  }"
                ></span>
                <button
                  v-for="(forecast, index) in dailyForecast"
                  :key="forecast.id"
                  type="button"
                  :class="{ active: selectedTimeIndex === index }"
                  :style="{
                    left: `${(index / Math.max(1, dailyForecast.length - 1)) * 100}%`,
                  }"
                  :aria-label="`${forecast.time} 예보 보기`"
                  @click="selectTime(index)"
                ></button>
              </div>
            </div>
          </div>

          <p>
            바람·강수는 OpenWeather, 파고는 기상청 예보를 반영합니다. 파주기·파향의 예보값은
            포인트가 속한 해상 예보구역 기준이며, 없으면 가까운 해양부이의 현재 관측값을 표시합니다.
          </p>
        </section>

        <section class="observation-card">
          <header>
            <div>
              <span>해양 현재 관측</span>
              <strong>{{ marineObservation?.observedAt || '기상청 자료 없음' }}</strong>
            </div>
            <small>기상청 해양기상부이</small>
          </header>
          <dl>
            <div>
              <dt>유의파고</dt>
              <dd>
                {{ marineObservation?.waveHeight ?? '-'
                }}{{
                  marineObservation?.waveHeight !== null &&
                  marineObservation?.waveHeight !== undefined
                    ? 'm'
                    : ''
                }}
              </dd>
            </div>
            <div>
              <dt>수온</dt>
              <dd>
                {{ marineObservation?.waterTemperature ?? '-'
                }}{{
                  marineObservation?.waterTemperature !== null &&
                  marineObservation?.waterTemperature !== undefined
                    ? '°C'
                    : ''
                }}
              </dd>
            </div>
            <div>
              <dt>파주기</dt>
              <dd>
                {{ marineObservation?.wavePeriod ?? '-'
                }}{{
                  marineObservation?.wavePeriod !== null &&
                  marineObservation?.wavePeriod !== undefined
                    ? '초'
                    : ''
                }}
              </dd>
            </div>
            <div>
              <dt>파향</dt>
              <dd>{{ formatWaveDirection(marineObservation?.waveDirection) }}</dd>
            </div>
          </dl>
          <p v-if="marineObservation" class="station-caption">
            {{ marineObservation.station }} · 포인트에서 약 {{ marineObservation.distance }}km ·
            {{ getWindDirection(marineObservation.windDirection) }}풍
          </p>
        </section>

        <section class="notice-card" :class="conditionLevel">
          <span>선택 시간 주의 항목</span>
          <ul>
            <li v-for="notice in notices" :key="notice">{{ notice }}</li>
          </ul>
          <p>입수 여부는 기상특보와 현지 다이빙숍 안내를 함께 확인해 판단하세요.</p>
        </section>
      </aside>
    </section>

    <section class="source-notice">
      <strong>{{ kmaErrorMessage ? '일부 데이터 확인 필요' : '실시간 데이터 연결' }}</strong>
      <p>
        날씨·기온·강수·바람은 OpenWeather, 예상 파고와 파랑 정보는 기상청 API 자료입니다.
        파주기·파향은 포인트가 속한 해상 예보구역의 시간대별 값을 우선 사용하고, 없으면 포인트
        찾기와 동일하게 가장 가까운 해양기상부이의 현재 관측값을 표시합니다. 조류와 물때는 포함되지
        않으며, 예보만으로 입수 여부를 판단하지 마세요.
      </p>
      <small v-if="kmaErrorMessage">기상청 연결 메시지: {{ kmaErrorMessage }}</small>
    </section>
  </main>
</template>

<style scoped>
.forecast-page {
  width: calc(100% - 40px);
  max-width: 1120px;
  margin: 0 auto;
  padding: 34px 0 70px;
  color: #182d3d;
}

.page-heading,
.control-panel,
.section-heading,
.observation-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.page-heading {
  padding: 8px 2px 25px;
  border-bottom: 1px solid #dfe7eb;
}

.eyebrow,
.section-heading span,
.map-card header span,
.observation-card header span,
.notice-card > span {
  margin: 0;
  color: #347da5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 4px 0 3px;
  font-size: clamp(30px, 4vw, 42px);
  font-weight: 800;
  letter-spacing: -0.045em;
}

.page-heading p:last-child {
  margin: 0;
  color: #6c7c88;
}

.data-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: 1px solid #d8e1e6;
  border-radius: 999px;
  background: white;
  color: #657784;
  font-size: 12px;
  font-weight: 700;
}

.data-state span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e2a23a;
}

.data-state.connected span {
  background: #2cad79;
  box-shadow: 0 0 0 4px rgb(44 173 121 / 12%);
}

.request-state {
  display: grid;
  min-height: 300px;
  margin-top: 18px;
  padding: 45px 24px;
  border: 1px solid #dfe7eb;
  border-radius: 15px;
  background: white;
  box-shadow: 0 5px 18px rgb(25 56 76 / 5%);
  color: #6d7f8b;
  text-align: center;
  place-content: center;
  justify-items: center;
}

.request-state strong {
  margin-top: 13px;
  color: #26475c;
  font-size: 16px;
}

.request-state p {
  max-width: 520px;
  margin: 5px 0 0;
  font-size: 12px;
}

.request-state button {
  margin-top: 15px;
  padding: 9px 14px;
  border: 0;
  border-radius: 8px;
  background: #173c62;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

.request-state.error {
  border-color: #ebd2d2;
  background: #fffbfb;
}

.loading-spinner {
  width: 31px;
  height: 31px;
  border: 3px solid #dce8ed;
  border-top-color: #347da5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.control-panel {
  margin-top: 20px;
  padding: 16px 18px;
  border: 1px solid #dfe7eb;
  border-radius: 15px;
  background: white;
  box-shadow: 0 5px 18px rgb(25 56 76 / 5%);
}

.control-panel label {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #5d707e;
  font-size: 13px;
  font-weight: 700;
}

.control-panel select {
  min-width: 250px;
  padding: 10px 38px 10px 12px;
  border: 1px solid #ccd9df;
  border-radius: 9px;
  background: #f8fafb;
  color: #1a3446;
  font: inherit;
  font-weight: 700;
}

.forecast-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  margin-top: 18px;
}

.date-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 7px;
  padding: 6px;
  border: 1px solid #dfe7eb;
  border-radius: 14px;
  background: white;
}

.date-tabs button {
  padding: 10px 8px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #71818c;
  cursor: pointer;
}

.date-tabs button strong,
.date-tabs button span {
  display: block;
}

.date-tabs button strong {
  color: #334d5e;
  font-size: 13px;
  font-weight: 800;
}

.date-tabs button span {
  margin-top: 1px;
  font-size: 11px;
}

.date-tabs button em {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 9px;
  font-style: normal;
  font-weight: 800;
}

.date-tabs button em.normal {
  background: #e9f6ef;
  color: #337254;
}

.date-tabs button em.warning {
  background: #fff4d9;
  color: #85651f;
}

.date-tabs button em.danger {
  background: #ffebeb;
  color: #a83d3d;
}

.date-tabs button.active {
  background: #173c62;
  color: #d8e8f3;
  box-shadow: 0 5px 14px rgb(23 60 98 / 18%);
}

.date-tabs button.active strong {
  color: white;
}

.date-tabs button.active em {
  box-shadow: 0 0 0 1px rgb(255 255 255 / 22%);
}

.timeline-card,
.detail-card,
.map-card,
.observation-card,
.notice-card {
  margin-top: 14px;
  padding: 20px;
  border: 1px solid #dfe7eb;
  border-radius: 15px;
  background: white;
  box-shadow: 0 5px 18px rgb(25 56 76 / 5%);
}

.section-heading h2 {
  margin: 2px 0 0;
  font-size: 20px;
  font-weight: 800;
}

.section-heading small {
  color: #84929b;
  font-size: 11px;
}

.timeline {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 7px;
  margin-top: 17px;
}

.timeline button {
  display: flex;
  align-items: center;
  flex-direction: column;
  min-width: 0;
  padding: 13px 6px;
  border: 1px solid #e4eaed;
  border-radius: 11px;
  background: #fafbfc;
  color: #526875;
  cursor: pointer;
  transition: 0.2s ease;
}

.timeline button:hover,
.timeline button.active {
  border-color: #70a8c6;
  background: #f2f8fb;
  box-shadow: 0 0 0 2px rgb(52 125 165 / 8%);
}

.timeline time {
  color: #637783;
  font-size: 12px;
  font-weight: 700;
}

.weather-symbol {
  position: relative;
  width: 27px;
  height: 27px;
  margin: 10px 0 7px;
  border-radius: 50%;
  background: #f1bd4c;
  box-shadow: 9px 5px 0 -3px #d5e1e8;
}

.weather-symbol.rain {
  border-radius: 12px;
  background: #91a9b8;
  box-shadow: none;
}

.weather-symbol.rain::after {
  position: absolute;
  right: 4px;
  bottom: -6px;
  left: 4px;
  height: 8px;
  background: repeating-linear-gradient(110deg, transparent 0 5px, #4c8fb5 5px 7px);
  content: '';
}

.timeline button > strong {
  color: #1c3b4e;
  font-size: 18px;
  font-weight: 800;
}

.timeline button > small {
  max-width: 100%;
  overflow: hidden;
  color: #71838e;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline button > em {
  margin-top: 8px;
  color: #39749a;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
}

.detail-heading {
  align-items: flex-end;
}

.condition-badge {
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.condition-badge.normal {
  background: #e9f6ef;
  color: #337254;
}

.condition-badge.warning {
  background: #fff4d9;
  color: #85651f;
}

.condition-badge.danger {
  background: #ffebeb;
  color: #a83d3d;
}

.forecast-category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 17px;
}

.forecast-category {
  overflow: hidden;
  border: 1px solid #e4eaed;
  border-radius: 13px;
  background: #fafbfc;
}

.forecast-category > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #e4eaed;
}

.forecast-category > header span {
  color: #214a64;
  font-size: 13px;
  font-weight: 800;
}

.forecast-category > header small,
.category-source {
  color: #91a0a8;
  font-size: 9px;
}

.weather-category > header {
  background: #f2f8fb;
}

.wind-category > header {
  background: #f3f8f5;
}

.wave-category > header {
  background: #eef7fa;
}

.ocean-category > header {
  background: #f5f3fa;
}

.forecast-category dl {
  margin: 0;
  padding: 5px 14px;
}

.forecast-category dl > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #e9eef0;
}

.forecast-category dl > div:last-child {
  border-bottom: 0;
}

.forecast-category dt {
  color: #71828d;
  font-size: 11px;
}

.forecast-category dd {
  margin: 0;
  color: #183a52;
  font-size: 15px;
  font-weight: 800;
  text-align: right;
}

.category-source {
  display: block;
  padding: 0 14px 12px;
  text-align: right;
}

.current-level {
  display: inline-block;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 11px;
}

.current-level.normal {
  background: #e9f6ef;
  color: #337254;
}

.current-level.warning {
  background: #fff4d9;
  color: #85651f;
}

.current-level.danger {
  background: #ffebeb;
  color: #a83d3d;
}

.current-level.unknown {
  background: #edf1f3;
  color: #71818c;
}

.forecast-tide-events {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid #e4eaed;
  border-radius: 13px;
  background: #fafbfc;
}

.forecast-tide-events > div > strong,
.forecast-tide-events > div > small {
  display: block;
}

.forecast-tide-events > div > strong {
  color: #214a64;
  font-size: 12px;
}

.forecast-tide-events > div > small,
.forecast-tide-events li small {
  margin-top: 3px;
  color: #91a0a8;
  font-size: 9px;
}

.forecast-tide-events ul {
  display: flex;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.forecast-tide-events li {
  min-width: 62px;
  padding: 7px 9px;
  border-radius: 9px;
  background: #eef6fa;
  text-align: center;
}

.forecast-tide-events li.low {
  background: #f3f2f8;
}

.forecast-tide-events li span,
.forecast-tide-events li strong,
.forecast-tide-events li small {
  display: block;
}

.forecast-tide-events li span {
  color: #71828d;
  font-size: 9px;
}

.forecast-tide-events li strong {
  margin-top: 2px;
  color: #183a52;
  font-size: 13px;
}

.forecast-tide-events > p {
  margin: 0;
  color: #84929b;
  font-size: 11px;
}

.forecast-aside > section:first-child {
  margin-top: 0;
}

.map-card header span,
.map-card header strong {
  display: block;
}

.map-card header strong {
  margin-top: 2px;
  font-size: 17px;
}

.map-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.map-card-heading time {
  padding: 5px 8px;
  border-radius: 7px;
  background: #edf4f8;
  color: #426e89;
  font-size: 10px;
  font-weight: 800;
}

.layer-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 14px;
  padding: 4px;
  border: 1px solid #dfe7eb;
  border-radius: 10px;
  background: #f5f8fa;
}

.layer-tabs button {
  padding: 7px 6px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #71828d;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
}

.layer-tabs button.active {
  background: white;
  box-shadow: 0 2px 8px rgb(25 56 76 / 9%);
  color: #245f83;
}

.layer-tabs button:disabled {
  color: #abb6bc;
  cursor: not-allowed;
  text-decoration: line-through;
}

.map-preview {
  position: relative;
  overflow: hidden;
  height: 280px;
  margin-top: 10px;
  border-radius: 11px;
  background:
    linear-gradient(rgb(70 142 183 / 9%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(70 142 183 / 9%) 1px, transparent 1px), #eaf5fa;
  background-size: 30px 30px;
  transition: background-color 0.35s ease;
}

.forecast-map-base {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: #eaf5fa;
}

.map-view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.map-view-toolbar > span {
  color: #718590;
  font-size: 10px;
}

.map-view-toolbar > div {
  display: flex;
  gap: 5px;
}

.map-view-toolbar button {
  padding: 6px 8px;
  border: 1px solid rgb(23 60 98 / 18%);
  border-radius: 7px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 3px 10px rgb(23 60 98 / 12%);
  color: #173c62;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.map-view-toolbar button:hover {
  background: white;
  border-color: #7fa9bd;
}

.map-preview :deep(.leaflet-control-zoom) {
  overflow: hidden;
  border: 1px solid rgb(23 60 98 / 16%);
  border-radius: 8px;
  box-shadow: 0 3px 10px rgb(23 60 98 / 12%);
}

.map-preview :deep(.leaflet-control-zoom a) {
  color: #173c62;
}

.map-preview :deep(.leaflet-control-attribution) {
  font-size: 9px;
}

.map-preview :deep(.forecast-map-marker) {
  display: flex;
  align-items: center;
  gap: 7px;
  width: max-content !important;
  border: 0;
  background: transparent;
}

.map-preview :deep(.forecast-map-marker span) {
  width: 14px;
  height: 14px;
  border: 3px solid white;
  border-radius: 50%;
  background: #ec6a58;
  box-shadow: 0 0 0 5px rgb(236 106 88 / 22%);
}

.map-preview :deep(.forecast-map-marker strong) {
  padding: 6px 9px;
  border-radius: 8px;
  background: #173c62;
  box-shadow: 0 6px 15px rgb(23 60 98 / 25%);
  color: white;
  font-size: 10px;
  white-space: nowrap;
}

.map-preview.layer-wave {
  background-color: #e4f2f8;
}

.map-preview.layer-rain {
  background-color: #dceaf0;
}

.wind-layer,
.wave-layer,
.rain-layer {
  position: absolute;
  z-index: 2;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.wind-layer {
  transform: rotate(var(--flow-angle));
}

.wind-layer i {
  position: absolute;
  left: -42px;
  width: 42px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgb(24 112 157 / 78%));
  opacity: 0.75;
  animation: wind-flow var(--wind-duration) linear infinite;
}

.wind-layer i::after {
  position: absolute;
  top: -2px;
  right: 0;
  width: 6px;
  height: 6px;
  border-top: 1px solid #18709d;
  border-right: 1px solid #18709d;
  content: '';
  transform: rotate(45deg);
}

.wind-layer i:nth-child(1) {
  top: 8%;
  animation-delay: -0.2s;
}
.wind-layer i:nth-child(2) {
  top: 17%;
  animation-delay: -1.1s;
}
.wind-layer i:nth-child(3) {
  top: 26%;
  animation-delay: -0.6s;
}
.wind-layer i:nth-child(4) {
  top: 35%;
  animation-delay: -1.7s;
}
.wind-layer i:nth-child(5) {
  top: 44%;
  animation-delay: -0.9s;
}
.wind-layer i:nth-child(6) {
  top: 53%;
  animation-delay: -2.1s;
}
.wind-layer i:nth-child(7) {
  top: 62%;
  animation-delay: -0.3s;
}
.wind-layer i:nth-child(8) {
  top: 71%;
  animation-delay: -1.4s;
}
.wind-layer i:nth-child(9) {
  top: 80%;
  animation-delay: -2.3s;
}
.wind-layer i:nth-child(10) {
  top: 89%;
  animation-delay: -0.8s;
}
.wind-layer i:nth-child(11) {
  top: 13%;
  animation-delay: -2.6s;
}
.wind-layer i:nth-child(12) {
  top: 31%;
  animation-delay: -2.9s;
}
.wind-layer i:nth-child(13) {
  top: 49%;
  animation-delay: -2.4s;
}
.wind-layer i:nth-child(14) {
  top: 67%;
  animation-delay: -2.7s;
}
.wind-layer i:nth-child(15) {
  top: 85%;
  animation-delay: -3s;
}

@keyframes wind-flow {
  from {
    transform: translateX(-20px);
  }
  to {
    transform: translateX(430px);
  }
}

.wave-layer i {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1.5px solid rgb(20 121 164 / 48%);
  border-radius: 50%;
  box-shadow: 0 0 14px rgb(33 143 184 / 8%);
  opacity: calc(0.18 + var(--wave-scale) * 0.11);
  transform: translate(-50%, -50%);
  animation: wave-ripple calc(var(--wave-duration) * 2.4) ease-in-out infinite;
}

.wave-layer i:nth-child(1) {
  width: 70px;
  height: 38px;
  animation-delay: -0.4s;
}
.wave-layer i:nth-child(2) {
  width: 135px;
  height: 74px;
  animation-delay: -1.2s;
}
.wave-layer i:nth-child(3) {
  width: 215px;
  height: 120px;
  animation-delay: -2s;
}
.wave-layer i:nth-child(4) {
  width: 310px;
  height: 178px;
  animation-delay: -2.8s;
}

@keyframes wave-ripple {
  0%,
  100% {
    opacity: calc(0.14 + var(--wave-scale) * 0.08);
    transform: translate(-50%, -50%) scale(0.96);
  }
  50% {
    opacity: calc(0.24 + var(--wave-scale) * 0.14);
    transform: translate(-50%, -50%) scale(calc(1 + var(--wave-scale) * 0.025));
  }
}

.wave-legend {
  position: absolute;
  z-index: 5;
  right: 10px;
  bottom: 20px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: 7px;
  padding: 7px 9px;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 8px;
  background: rgb(255 255 255 / 88%);
  color: #315f77;
  font-size: 9px;
  backdrop-filter: blur(5px);
}

.wave-legend > span {
  width: 20px;
  height: 8px;
  border-top: 2px solid #2580aa;
  border-radius: 50%;
}

.wave-legend small {
  grid-column: 2;
  color: #84949c;
  font-size: 8px;
}

.rain-layer {
  opacity: var(--rain-opacity);
}

.rain-layer i {
  position: absolute;
  top: -24px;
  width: 1px;
  height: 18px;
  background: linear-gradient(transparent, #2f82ad);
  animation: rain-fall var(--rain-duration) linear infinite;
  transform: rotate(14deg);
}

.rain-layer i:nth-child(1) {
  left: 4%;
  animation-delay: -0.1s;
}
.rain-layer i:nth-child(2) {
  left: 9%;
  animation-delay: -0.7s;
}
.rain-layer i:nth-child(3) {
  left: 14%;
  animation-delay: -0.3s;
}
.rain-layer i:nth-child(4) {
  left: 19%;
  animation-delay: -0.9s;
}
.rain-layer i:nth-child(5) {
  left: 24%;
  animation-delay: -0.5s;
}
.rain-layer i:nth-child(6) {
  left: 29%;
  animation-delay: -1.1s;
}
.rain-layer i:nth-child(7) {
  left: 34%;
  animation-delay: -0.2s;
}
.rain-layer i:nth-child(8) {
  left: 39%;
  animation-delay: -0.8s;
}
.rain-layer i:nth-child(9) {
  left: 44%;
  animation-delay: -0.4s;
}
.rain-layer i:nth-child(10) {
  left: 49%;
  animation-delay: -1s;
}
.rain-layer i:nth-child(11) {
  left: 54%;
  animation-delay: -0.6s;
}
.rain-layer i:nth-child(12) {
  left: 59%;
  animation-delay: -1.2s;
}
.rain-layer i:nth-child(13) {
  left: 64%;
  animation-delay: -0.15s;
}
.rain-layer i:nth-child(14) {
  left: 69%;
  animation-delay: -0.75s;
}
.rain-layer i:nth-child(15) {
  left: 74%;
  animation-delay: -0.35s;
}
.rain-layer i:nth-child(16) {
  left: 79%;
  animation-delay: -0.95s;
}
.rain-layer i:nth-child(17) {
  left: 84%;
  animation-delay: -0.55s;
}
.rain-layer i:nth-child(18) {
  left: 89%;
  animation-delay: -1.15s;
}
.rain-layer i:nth-child(19) {
  left: 94%;
  animation-delay: -0.25s;
}
.rain-layer i:nth-child(20) {
  left: 12%;
  animation-delay: -1.05s;
}
.rain-layer i:nth-child(21) {
  left: 32%;
  animation-delay: -0.45s;
}
.rain-layer i:nth-child(22) {
  left: 52%;
  animation-delay: -0.85s;
}
.rain-layer i:nth-child(23) {
  left: 72%;
  animation-delay: -0.65s;
}
.rain-layer i:nth-child(24) {
  left: 92%;
  animation-delay: -1.25s;
}

@keyframes rain-fall {
  from {
    transform: translateY(-20px) rotate(14deg);
  }
  to {
    transform: translateY(330px) rotate(14deg);
  }
}

.layer-value {
  position: absolute;
  z-index: 5;
  top: 12px;
  right: 12px;
  padding: 7px 9px;
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 8px;
  background: rgb(255 255 255 / 82%);
  box-shadow: 0 4px 12px rgb(25 56 76 / 8%);
  backdrop-filter: blur(6px);
}

.layer-value span,
.layer-value strong {
  display: block;
}

.layer-value span {
  color: #758893;
  font-size: 9px;
}

.layer-value strong {
  color: #244b64;
  font-size: 11px;
}

.coast {
  position: absolute;
  border-radius: 45% 55% 50% 50%;
  background: #dae2d5;
  box-shadow: inset -8px -7px 0 rgb(117 144 112 / 8%);
  transform: rotate(-18deg);
}

.coast-one {
  top: -34px;
  left: -55px;
  width: 190px;
  height: 285px;
}

.coast-two {
  right: -12px;
  bottom: -45px;
  width: 125px;
  height: 92px;
  transform: rotate(8deg);
}

.map-label {
  position: absolute;
  color: #7da5ba;
  font-size: 10px;
  letter-spacing: 2px;
}

.map-label.east {
  top: 45px;
  right: 35px;
}

.map-label.south {
  right: 85px;
  bottom: 28px;
}

.point-marker {
  position: absolute;
  z-index: 6;
  top: 48%;
  left: 49%;
  padding: 6px 9px;
  border-radius: 8px;
  background: #173c62;
  box-shadow: 0 6px 15px rgb(23 60 98 / 25%);
  color: white;
  font-size: 10px;
  font-weight: 800;
}

.point-marker span {
  position: absolute;
  top: 50%;
  left: -10px;
  width: 10px;
  height: 10px;
  border: 3px solid white;
  border-radius: 50%;
  background: #ec6a58;
  box-shadow: 0 0 0 4px rgb(236 106 88 / 20%);
  transform: translateY(-50%);
}

.playback-control {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 13px;
  padding: 11px 12px;
  border: 1px solid #e0e7eb;
  border-radius: 11px;
  background: #f8fafb;
}

.play-button {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: #173c62;
  box-shadow: 0 5px 12px rgb(23 60 98 / 20%);
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
}

.play-button:hover {
  background: #245f83;
}

.playback-timeline {
  min-width: 0;
  flex: 1;
}

.playback-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 9px;
}

.playback-label strong {
  color: #244b64;
  font-size: 12px;
}

.playback-label span {
  color: #82919a;
  font-size: 9px;
}

.progress-track {
  position: relative;
  height: 4px;
  border-radius: 999px;
  background: #d9e3e8;
}

.progress-track > span {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: inherit;
  background: #3d8db5;
  transition: width 0.35s ease;
}

.progress-track button {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  padding: 0;
  border: 2px solid white;
  border-radius: 50%;
  background: #b5c6cf;
  box-shadow: 0 0 0 1px #b5c6cf;
  cursor: pointer;
  transform: translate(-50%, -50%);
}

.progress-track button.active {
  width: 11px;
  height: 11px;
  background: #3d8db5;
  box-shadow: 0 0 0 2px rgb(61 141 181 / 18%);
}

.map-card > p {
  margin: 11px 0 0;
  color: #84949e;
  font-size: 10px;
  line-height: 1.5;
}

.observation-card header strong {
  display: block;
  margin-top: 1px;
  font-size: 14px;
}

.observation-card header small {
  padding: 4px 7px;
  border-radius: 6px;
  background: #eef4f6;
  color: #71818b;
  font-size: 10px;
}

.observation-card dl {
  margin: 13px 0 0;
}

.observation-card dl > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  border-top: 1px solid #edf1f3;
}

.observation-card dt {
  color: #72828d;
  font-size: 12px;
}

.observation-card dd {
  margin: 0;
  color: #1c3a4c;
  font-size: 14px;
  font-weight: 800;
}

.station-caption {
  margin: 10px 0 0;
  padding-top: 10px;
  border-top: 1px solid #edf1f3;
  color: #758792;
  font-size: 10px;
  line-height: 1.5;
}

.notice-card {
  border-left: 3px solid #55a27b;
}

.notice-card.warning {
  border-left-color: #d5a440;
}

.notice-card.danger {
  border-left-color: #d46060;
}

.notice-card ul {
  margin: 12px 0;
  padding-left: 18px;
  color: #465e6d;
  font-size: 12px;
}

.notice-card li + li {
  margin-top: 6px;
}

.notice-card p {
  margin: 0;
  padding-top: 11px;
  border-top: 1px solid #e8edef;
  color: #87949c;
  font-size: 10px;
}

.source-notice {
  display: flex;
  gap: 15px;
  margin-top: 18px;
  padding: 15px 18px;
  border: 1px solid #dfe7eb;
  border-radius: 12px;
  background: #f1f5f7;
  color: #687984;
  font-size: 12px;
}

.source-notice strong {
  flex: 0 0 auto;
  color: #334d5e;
}

.source-notice p {
  margin: 0;
}

.source-notice small {
  color: #a45a43;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .forecast-layout {
    grid-template-columns: 1fr;
  }

  .forecast-aside {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .forecast-aside > section {
    margin-top: 0;
  }

  .map-card {
    grid-row: span 2;
  }
}

@media (max-width: 650px) {
  .forecast-page {
    width: calc(100% - 20px);
    padding-top: 20px;
  }

  .page-heading,
  .control-panel,
  .section-heading,
  .source-notice {
    align-items: flex-start;
    flex-direction: column;
  }

  .control-panel label {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
    gap: 6px;
  }

  .control-panel select {
    width: 100%;
    min-width: 0;
  }

  .date-tabs,
  .timeline {
    overflow-x: auto;
    display: flex;
  }

  .date-tabs button,
  .timeline button {
    flex: 0 0 90px;
  }

  .forecast-category-grid,
  .forecast-aside {
    grid-template-columns: repeat(2, 1fr);
  }

  .forecast-tide-events {
    align-items: flex-start;
    flex-direction: column;
  }

  .forecast-tide-events ul {
    overflow-x: auto;
    width: 100%;
  }

  .map-card {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}

@media (max-width: 430px) {
  .forecast-category-grid,
  .forecast-aside {
    grid-template-columns: 1fr;
  }

  .map-card {
    grid-column: auto;
  }
}
</style>
