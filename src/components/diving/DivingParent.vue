<script setup>
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import BaseDashboardCard from '../common/BaseDashboardCard.vue'
import SearchBar from '../common/SearchBar.vue'
import DivingCard from './DivingCard.vue'
import EnvironmentSummary from './EnvironmentSummary.vue'
import { forecastSpots } from '@/data/forecastSpots'
import { fetchKmaConditionsForSpots, getWindDirection } from '@/services/kmaApi'
import { fetchKhoaScubaSpots } from '@/services/khoaScubaApi'
import { fetchKhoaTidesForSpots } from '@/services/khoaTideApi'
import { fetchOpenWeather } from '@/services/openWeatherApi'

const router = useRouter()

// 검색어
const searchQuery = ref('')

// 기상특보 지역만 보기
const warningOnly = ref(false)

// 선택된 다이빙 포인트
const selectedDivingSpot = ref(null)

// 선택 안내 문구
const selectedSpotInfo = ref('')
const isLoadingConditions = ref(true)
const dataErrorMessage = ref('')

// 서비스형 목록 기능을 위한 Mockup 상태
const sortMode = ref('recommended')
const favoriteOnly = ref(false)
const summaryFilter = ref('all')
const favoriteSpotIds = ref(JSON.parse(localStorage.getItem('favoriteSpotIds') || '[]'))

// 실제 위치 권한 연동 전까지 사용하는 사용자 기준 Mockup 거리(km)
const distanceBySpot = ref({
  spot_01: 18.4,
  spot_02: 21.7,
  spot_03: 7.8,
  spot_04: 14.2,
  spot_05: 32.6,
  spot_06: 11.5,
})

// 백엔드 연동 전 실시간 인기순 동작을 보여주는 Mockup 조회 수
const popularityBySpot = ref({
  spot_01: 128,
  spot_02: 96,
  spot_03: 74,
  spot_04: 63,
  spot_05: 88,
  spot_06: 112,
})

const userLocation = ref(null)

let popularityTimer

// 한글 음절을 초성으로 변환해 'ㅈㅈ ㅁㅅ' 같은 검색을 지원
const initialConsonants = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
]

const getInitialConsonants = (text) => {
  return [...text]
    .map((character) => {
      const code = character.charCodeAt(0)

      if (code >= 0xac00 && code <= 0xd7a3) {
        const index = Math.floor((code - 0xac00) / 588)
        return initialConsonants[index]
      }

      return character.toLowerCase()
    })
    .join('')
}

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

    waterTemperatures: [
      { depth: 0, temp: 25 },
      { depth: 10, temp: 23 },
      { depth: 20, temp: 21 },
      { depth: 30, temp: 19 },
    ],

    waveHeight: 0.7,
    wavePeriod: 6,
    waveDirection: '남동',

    windSpeed: 4.2,
    windDirection: '남서',

    warning: null,

    station: '마라도 해양기상부이',
    stationDistance: 12,
    observedAt: '2026-08-12 09:00',

    tide: {
      tideNumber: 7,
      lunarDate: '음력 6월 30일',

      events: [
        {
          id: 'spot_01_tide_01',
          type: 'low',
          label: '간조',
          time: '03:43',
          height: -190,
        },
        {
          id: 'spot_01_tide_02',
          type: 'high',
          label: '만조',
          time: '09:04',
          height: 136,
        },
        {
          id: 'spot_01_tide_03',
          type: 'low',
          label: '간조',
          time: '15:26',
          height: -224,
        },
        {
          id: 'spot_01_tide_04',
          type: 'high',
          label: '만조',
          time: '22:07',
          height: 285,
        },
      ],
    },

    current: {
      speed: 0.4,
      direction: '북동',
      strength: 89,
    },
  },

  {
    id: 'spot_02',
    name: '제주 섶섬',
    region: '제주',
    icon: '🐢',

    weather: '구름 조금',
    weatherIcon: '⛅',
    airTemp: 27,

    waterTemperatures: [
      { depth: 0, temp: 24 },
      { depth: 10, temp: 22 },
      { depth: 20, temp: 20 },
      { depth: 30, temp: 18 },
    ],

    waveHeight: 1.1,
    wavePeriod: 7,
    waveDirection: '남',

    windSpeed: 5.8,
    windDirection: '남동',

    warning: null,

    station: '서귀포 해양관측소',
    stationDistance: 8,
    observedAt: '2026-08-12 09:00',

    tide: {
      tideNumber: 7,
      lunarDate: '음력 6월 30일',

      events: [
        {
          id: 'spot_02_tide_01',
          type: 'low',
          label: '간조',
          time: '03:48',
          height: -175,
        },
        {
          id: 'spot_02_tide_02',
          type: 'high',
          label: '만조',
          time: '09:10',
          height: 128,
        },
        {
          id: 'spot_02_tide_03',
          type: 'low',
          label: '간조',
          time: '15:31',
          height: -210,
        },
        {
          id: 'spot_02_tide_04',
          type: 'high',
          label: '만조',
          time: '22:13',
          height: 270,
        },
      ],
    },

    current: {
      speed: 0.7,
      direction: '동',
      strength: 82,
    },
  },

  {
    id: 'spot_03',
    name: '강릉 사천',
    region: '강릉',
    icon: '🐟',

    weather: '구름',
    weatherIcon: '☁️',
    airTemp: 26,

    waterTemperatures: [
      { depth: 0, temp: 22 },
      { depth: 10, temp: 20 },
      { depth: 20, temp: 18 },
      { depth: 30, temp: 16 },
    ],

    waveHeight: 1.3,
    wavePeriod: 8,
    waveDirection: '동',

    windSpeed: 7.1,
    windDirection: '북동',

    warning: '풍랑주의보',

    station: '강릉 파고부이',
    stationDistance: 6,
    observedAt: '2026-08-12 09:00',

    tide: {
      tideNumber: 7,
      lunarDate: '음력 6월 30일',

      events: [
        {
          id: 'spot_03_tide_01',
          type: 'low',
          label: '간조',
          time: '04:15',
          height: -22,
        },
        {
          id: 'spot_03_tide_02',
          type: 'high',
          label: '만조',
          time: '10:02',
          height: 34,
        },
        {
          id: 'spot_03_tide_03',
          type: 'low',
          label: '간조',
          time: '16:30',
          height: -18,
        },
        {
          id: 'spot_03_tide_04',
          type: 'high',
          label: '만조',
          time: '22:45',
          height: 40,
        },
      ],
    },

    current: {
      speed: 0.8,
      direction: '남',
      strength: 75,
    },
  },

  {
    id: 'spot_04',
    name: '동해 대진',
    region: '동해',
    icon: '🌊',

    weather: '비',
    weatherIcon: '🌧️',
    airTemp: 24,

    waterTemperatures: [
      { depth: 0, temp: 21 },
      { depth: 10, temp: 19 },
      { depth: 20, temp: 17 },
      { depth: 30, temp: 15 },
    ],

    waveHeight: 1.7,
    wavePeriod: 9,
    waveDirection: '북동',

    windSpeed: 9.2,
    windDirection: '북',

    warning: '풍랑주의보',

    station: '동해 해양기상부이',
    stationDistance: 15,
    observedAt: '2026-08-12 09:00',

    tide: {
      tideNumber: 7,
      lunarDate: '음력 6월 30일',

      events: [
        {
          id: 'spot_04_tide_01',
          type: 'low',
          label: '간조',
          time: '04:20',
          height: -20,
        },
        {
          id: 'spot_04_tide_02',
          type: 'high',
          label: '만조',
          time: '10:10',
          height: 37,
        },
        {
          id: 'spot_04_tide_03',
          type: 'low',
          label: '간조',
          time: '16:38',
          height: -16,
        },
        {
          id: 'spot_04_tide_04',
          type: 'high',
          label: '만조',
          time: '22:53',
          height: 43,
        },
      ],
    },

    current: {
      speed: 1.1,
      direction: '남서',
      strength: 91,
    },
  },

  {
    id: 'spot_05',
    name: '부산 태종대',
    region: '부산',
    icon: '🐙',

    weather: '소나기',
    weatherIcon: '🌦️',
    airTemp: 27,

    waterTemperatures: [
      { depth: 0, temp: 25 },
      { depth: 10, temp: 23 },
      { depth: 20, temp: 21 },
      { depth: 30, temp: 19 },
    ],

    waveHeight: 1,
    wavePeriod: 7,
    waveDirection: '남',

    windSpeed: 6.3,
    windDirection: '남서',

    warning: '강풍주의보',

    station: '부산 해양기상부이',
    stationDistance: 10,
    observedAt: '2026-08-12 09:00',

    tide: {
      tideNumber: 7,
      lunarDate: '음력 6월 30일',

      events: [
        {
          id: 'spot_05_tide_01',
          type: 'low',
          label: '간조',
          time: '03:55',
          height: -68,
        },
        {
          id: 'spot_05_tide_02',
          type: 'high',
          label: '만조',
          time: '09:35',
          height: 98,
        },
        {
          id: 'spot_05_tide_03',
          type: 'low',
          label: '간조',
          time: '15:58',
          height: -74,
        },
        {
          id: 'spot_05_tide_04',
          type: 'high',
          label: '만조',
          time: '22:20',
          height: 110,
        },
      ],
    },

    current: {
      speed: 0.8,
      direction: '동',
      strength: 86,
    },
  },

  {
    id: 'spot_06',
    name: '거제 구조라',
    region: '거제',
    icon: '🐬',

    weather: '맑음',
    weatherIcon: '☀️',
    airTemp: 28,

    waterTemperatures: [
      { depth: 0, temp: 26 },
      { depth: 10, temp: 24 },
      { depth: 20, temp: 22 },
      { depth: 30, temp: 20 },
    ],

    waveHeight: 0.6,
    wavePeriod: 5,
    waveDirection: '남동',

    windSpeed: 3.5,
    windDirection: '남',

    warning: null,

    station: '거제도 해양관측소',
    stationDistance: 7,
    observedAt: '2026-08-12 09:00',

    tide: {
      tideNumber: 7,
      lunarDate: '음력 6월 30일',

      events: [
        {
          id: 'spot_06_tide_01',
          type: 'low',
          label: '간조',
          time: '04:00',
          height: -75,
        },
        {
          id: 'spot_06_tide_02',
          type: 'high',
          label: '만조',
          time: '09:42',
          height: 105,
        },
        {
          id: 'spot_06_tide_03',
          type: 'low',
          label: '간조',
          time: '16:05',
          height: -82,
        },
        {
          id: 'spot_06_tide_04',
          type: 'high',
          label: '만조',
          time: '22:28',
          height: 116,
        },
      ],
    },

    current: {
      speed: 0.3,
      direction: '북동',
      strength: 79,
    },
  },
])

const forecastSpotById = new Map(forecastSpots.map((spot) => [spot.id, spot]))

// API 응답 전에는 기존 예시 수치가 실제 데이터처럼 보이지 않도록 비웁니다.
divingSpotList.value = divingSpotList.value.map((spot) => ({
  ...spot,
  ...forecastSpotById.get(spot.id),
  weather: '불러오는 중',
  weatherIcon: '·',
  airTemp: null,
  waterTemperatures: [{ depth: 0, temp: null }],
  waveHeight: null,
  wavePeriod: null,
  waveDirection: '자료 없음',
  windSpeed: null,
  windDirection: '자료 없음',
  warning: null,
  station: '관측소 확인 중',
  stationDistance: null,
  observedAt: '자료 확인 중',
  liveData: false,
  tideAvailable: false,
  currentAvailable: false,
}))

const getWeatherEmoji = (weatherCode) => {
  if (weatherCode >= 200 && weatherCode < 300) return '⛈️'
  if (weatherCode >= 300 && weatherCode < 600) return '🌧️'
  if (weatherCode >= 600 && weatherCode < 700) return '🌨️'
  if (weatherCode >= 700 && weatherCode < 800) return '🌫️'
  if (weatherCode === 800) return '☀️'
  return '☁️'
}

const makeApiPointCard = (spot) => {
  const existing = divingSpotList.value.find(
    (item) => item.name.includes(spot.name) || spot.name.includes(item.name.replace(/^\S+\s/, '')),
  )
  const metadata = forecastSpots.find(
    (item) => item.name.includes(spot.name) || spot.name.includes(item.name.replace(/^\S+\s/, '')),
  )

  return {
    ...existing,
    ...metadata,
    ...spot,
    weather: '불러오는 중',
    weatherIcon: '·',
    airTemp: null,
    waterTemperatures: [{ depth: 0, temp: spot.waterTemperature }],
    wavePeriod: null,
    waveDirection: '자료 없음',
    windSpeed: null,
    windDirection: '자료 없음',
    warning: null,
    station: '관측소 확인 중',
    stationDistance: null,
    observedAt: `${spot.forecastDate} ${spot.forecastPeriod}`,
    tideAvailable: spot.tideLabel !== '자료 없음',
    currentAvailable: spot.currentSpeed !== null,
    current: {
      speed: spot.currentSpeed,
      minSpeed: spot.minCurrentSpeed,
      maxSpeed: spot.maxCurrentSpeed,
      direction: null,
    },
    liveData: true,
  }
}

const calculateDistance = (first, second) => {
  const radius = 6371
  const toRadians = (degree) => (degree * Math.PI) / 180
  const latitudeDistance = toRadians(second.latitude - first.latitude)
  const longitudeDistance = toRadians(second.longitude - first.longitude)
  const value =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDistance / 2) ** 2
  return Number((radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))).toFixed(1))
}

const updatePointDistances = () => {
  distanceBySpot.value = Object.fromEntries(
    divingSpotList.value.map((spot) => [
      spot.id,
      userLocation.value ? calculateDistance(userLocation.value, spot) : null,
    ]),
  )
}

const requestUserLocation = () => {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      userLocation.value = { latitude: coords.latitude, longitude: coords.longitude }
      updatePointDistances()
    },
    () => updatePointDistances(),
    { enableHighAccuracy: false, timeout: 7000, maximumAge: 10 * 60 * 1000 },
  )
}

const loadPointConditions = async () => {
  isLoadingConditions.value = true
  dataErrorMessage.value = ''

  let activeSpots
  try {
    const khoaSpots = await fetchKhoaScubaSpots()
    divingSpotList.value = khoaSpots.map(makeApiPointCard)
    activeSpots = divingSpotList.value
    sessionStorage.setItem('seaGaniScubaSpots', JSON.stringify(activeSpots))
  } catch (error) {
    activeSpots = forecastSpots
    dataErrorMessage.value = `스킨스쿠버 포인트 API: ${error.message}`
  }

  popularityBySpot.value = Object.fromEntries(
    activeSpots.map((spot) => [spot.id, popularityBySpot.value[spot.id] ?? 0]),
  )
  updatePointDistances()

  const [openWeatherResults, kmaResult, tideResult] = await Promise.all([
    Promise.allSettled(activeSpots.map((spot) => fetchOpenWeather(spot))),
    fetchKmaConditionsForSpots(activeSpots).catch((error) => {
      dataErrorMessage.value = [dataErrorMessage.value, error.message || '기상청 자료 요청 실패']
        .filter(Boolean)
        .join(' / ')
      return {}
    }),
    fetchKhoaTidesForSpots(activeSpots).catch((error) => {
      dataErrorMessage.value = [dataErrorMessage.value, `조석예보: ${error.message}`]
        .filter(Boolean)
        .join(' / ')
      return {}
    }),
  ])

  divingSpotList.value = divingSpotList.value.map((spot, index) => {
    const weatherResult = openWeatherResults[index]
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null
    const kma = kmaResult[spot.id] || {}
    const observation = kma.observation
    const marine = kma.marineForecast
    const tideForecast = tideResult[spot.id]
    const waterTemperature =
      spot.waterTemperature ?? observation?.waterTemperature ?? marine?.waterTemperature ?? null
    const waveHeight =
      spot.waveHeight ?? observation?.waveHeight ?? marine?.waveHeight ?? kma.shortWave ?? null
    const wavePeriod = observation?.wavePeriod ?? marine?.wavePeriod ?? null
    const waveDirectionDegree = observation?.waveDirection ?? marine?.waveDirection ?? null

    return {
      ...spot,
      weather: weather?.current.weather || '자료 없음',
      weatherIcon: weather ? getWeatherEmoji(weather.current.weatherCode) : '—',
      airTemp: weather?.current.temperature ?? null,
      windSpeed: weather?.current.wind ?? observation?.windSpeed ?? marine?.windSpeed ?? null,
      windDirection:
        weather?.current.direction ||
        getWindDirection(observation?.windDirection ?? marine?.windDirection),
      waterTemperatures: [{ depth: 0, temp: waterTemperature }],
      waveHeight,
      wavePeriod,
      waveDirection: getWindDirection(waveDirectionDegree),
      warning: kma.warning || null,
      station: observation?.station || '가까운 해양기상부이 자료 없음',
      stationDistance: observation?.distance ?? null,
      observedAt: observation?.observedAt || weather?.current.observedAt || '시각 정보 없음',
      liveData: Boolean(
        weather || observation || marine || (kma.shortWave !== null && kma.shortWave !== undefined),
      ),
      marineForecast: marine || null,
      tideAvailable: Boolean(tideForecast?.events.length || spot.tideLabel !== '자료 없음'),
      tideForecast: tideForecast || null,
    }
  })

  sessionStorage.setItem('seaGaniScubaSpots', JSON.stringify(divingSpotList.value))

  const failedWeatherCount = openWeatherResults.filter(
    (result) => result.status === 'rejected',
  ).length
  if (failedWeatherCount && !dataErrorMessage.value) {
    dataErrorMessage.value = `OpenWeather ${failedWeatherCount}개 포인트를 불러오지 못했습니다.`
  }
  isLoadingConditions.value = false
}

const matchesSearchFilters = (spot) => {
  const query = searchQuery.value.trim().toLowerCase()
  const compactQuery = query.replace(/\s/g, '')
  const spotName = spot.name.toLowerCase()
  const spotRegion = spot.region.toLowerCase()
  const spotNameInitials = getInitialConsonants(spot.name)
  const spotRegionInitials = getInitialConsonants(spot.region)

  const matchesSearch =
    query === '' ||
    spotName.includes(query) ||
    spotRegion.includes(query) ||
    spotNameInitials.replace(/\s/g, '').includes(compactQuery) ||
    spotRegionInitials.replace(/\s/g, '').includes(compactQuery)

  const matchesWarning = !warningOnly.value || spot.warning !== null
  const matchesFavorite = !favoriteOnly.value || favoriteSpotIds.value.includes(spot.id)
  return matchesSearch && matchesWarning && matchesFavorite
}

const searchResultCount = computed(() => divingSpotList.value.filter(matchesSearchFilters).length)

const matchesSummaryFilter = (spot) => {
  if (summaryFilter.value === 'search') return matchesSearchFilters(spot)
  if (summaryFilter.value === 'warning') return spot.warning !== null
  if (summaryFilter.value === 'wave') return spot.waveHeight >= 1.5
  if (summaryFilter.value === 'wind') return spot.windSpeed >= 8
  return true
}

// 상단 현황 필터와 정렬이 반영된 목록
const filteredDivingSpotList = computed(() => {
  const filteredList = divingSpotList.value.filter((spot) => {
    return matchesSummaryFilter(spot)
  })

  return [...filteredList].sort((a, b) => {
    if (sortMode.value === 'distance') {
      return (
        (distanceBySpot.value[a.id] ?? Number.POSITIVE_INFINITY) -
        (distanceBySpot.value[b.id] ?? Number.POSITIVE_INFINITY)
      )
    }

    if (sortMode.value === 'popular') {
      return popularityBySpot.value[b.id] - popularityBySpot.value[a.id]
    }

    // 추천순: 안전한 환경을 우선하고 그다음 가까운 포인트를 표시
    const warningScore = (spot) => (spot.warning ? 1 : 0)
    return (
      warningScore(a) - warningScore(b) ||
      (a.waveHeight ?? Number.POSITIVE_INFINITY) - (b.waveHeight ?? Number.POSITIVE_INFINITY) ||
      (distanceBySpot.value[a.id] ?? Number.POSITIVE_INFINITY) -
        (distanceBySpot.value[b.id] ?? Number.POSITIVE_INFINITY)
    )
  })
})

const favoriteCount = computed(() => favoriteSpotIds.value.length)

// 특보 지역 개수
const warningSpotCount = computed(() => {
  return divingSpotList.value.filter((spot) => spot.warning !== null).length
})

// 파고 1.5m 이상 지역 개수
const highWaveSpotCount = computed(() => {
  return divingSpotList.value.filter((spot) => spot.waveHeight >= 1.5).length
})

// 풍속 8m/s 이상 지역 개수
const strongWindSpotCount = computed(() => {
  return divingSpotList.value.filter((spot) => spot.windSpeed >= 8).length
})

// 포인트별 해양환경 주의사항 계산
const getEnvironmentAlerts = (spot) => {
  const alerts = []

  // 기상특보 확인
  if (spot.warning) {
    alerts.push({
      icon: '🚨',
      message: `기상특보: ${spot.warning}`,
      level: 'danger',
    })
  }

  // 파고 확인
  if (spot.waveHeight >= 1.5) {
    alerts.push({
      icon: '🌊',
      message: `높은 파고가 관측되었습니다. ` + `(${spot.waveHeight}m)`,
      level: 'danger',
    })
  } else if (spot.waveHeight >= 1) {
    alerts.push({
      icon: '🌊',
      message: `다소 높은 파고입니다. ` + `(${spot.waveHeight}m)`,
      level: 'warning',
    })
  }

  // 풍속 확인
  if (spot.windSpeed >= 8) {
    alerts.push({
      icon: '💨',
      message: `강한 바람이 관측되었습니다. ` + `(${spot.windSpeed}m/s)`,
      level: 'danger',
    })
  } else if (spot.windSpeed >= 6) {
    alerts.push({
      icon: '💨',
      message: `바람이 다소 강합니다. ` + `(${spot.windSpeed}m/s)`,
      level: 'warning',
    })
  }

  // 조류 확인
  if (spot.currentAvailable && spot.current.speed >= 1) {
    alerts.push({
      icon: '🧭',
      message: `강한 조류가 예상됩니다. ` + `(${spot.current.speed}m/s)`,
      level: 'danger',
    })
  } else if (spot.currentAvailable && spot.current.speed >= 0.7) {
    alerts.push({
      icon: '🧭',
      message: `조류 흐름에 주의하세요. ` + `(${spot.current.speed}m/s)`,
      level: 'warning',
    })
  }

  // 가장 깊은 수심의 수온 확인
  const deepestTemperature = spot.waterTemperatures[spot.waterTemperatures.length - 1]

  if (deepestTemperature.temp !== null && deepestTemperature.temp <= 18) {
    alerts.push({
      icon: '🥶',
      message:
        `${deepestTemperature.depth}m 수심의 ` + `수온이 ${deepestTemperature.temp}°C로 낮습니다.`,
      level: 'warning',
    })
  }

  // 주의사항이 없는 경우
  if (alerts.length === 0) {
    alerts.push({
      icon: 'ℹ️',
      message: spot.liveData
        ? '연결된 관측·예보에서 설정 기준을 넘는 주의 항목이 없습니다.'
        : '현재 불러온 실제 자료가 없어 상태를 판단할 수 없습니다.',
      level: 'normal',
    })
  }

  return alerts
}

// 가장 높은 경고 등급 계산
const getAlertLevel = (spot) => {
  const alerts = getEnvironmentAlerts(spot)

  if (alerts.some((alert) => alert.level === 'danger')) {
    return 'danger'
  }

  if (alerts.some((alert) => alert.level === 'warning')) {
    return 'warning'
  }

  return 'normal'
}

// 검색어 변경
const updateSearchQuery = (newQuery) => {
  searchQuery.value = newQuery
  summaryFilter.value = 'search'
}

// 특보 필터 변경
const updateWarningOnly = (newValue) => {
  warningOnly.value = newValue
  summaryFilter.value = 'search'
}

const toggleFavoriteOnly = () => {
  favoriteOnly.value = !favoriteOnly.value
  summaryFilter.value = 'search'
}

const toggleFavorite = (spotId) => {
  favoriteSpotIds.value = favoriteSpotIds.value.includes(spotId)
    ? favoriteSpotIds.value.filter((id) => id !== spotId)
    : [...favoriteSpotIds.value, spotId]

  localStorage.setItem('favoriteSpotIds', JSON.stringify(favoriteSpotIds.value))
}

// 카드 선택
const selectDivingSpot = (spot) => {
  const isSameSpot = selectedDivingSpot.value?.id === spot.id

  if (isSameSpot) {
    selectedDivingSpot.value = null
    selectedSpotInfo.value = `${spot.name} 선택을 해제했습니다.`
    return
  }

  selectedDivingSpot.value = spot
  popularityBySpot.value[spot.id] = (popularityBySpot.value[spot.id] || 0) + 1
  selectedSpotInfo.value = `${spot.name}의 해양환경 정보를 선택했습니다.`
}

// 전체 상세보기
const showDetail = (spot) => {
  popularityBySpot.value[spot.id] = (popularityBySpot.value[spot.id] || 0) + 1
  sessionStorage.setItem('seaGaniSelectedSpot', JSON.stringify(spot))
  router.push({ name: 'diving-detail', params: { spotId: spot.id } })
}

const showForecast = (spot) => {
  sessionStorage.setItem('seaGaniSelectedSpot', JSON.stringify(spot))
  router.push({ name: 'diving-forecast', query: { spot: spot.id } })
}

onMounted(() => {
  requestUserLocation()
  loadPointConditions()
  popularityTimer = window.setInterval(() => {
    const spotIds = divingSpotList.value.map((spot) => spot.id)
    const randomId = spotIds[Math.floor(Math.random() * spotIds.length)]
    if (randomId) popularityBySpot.value[randomId] = (popularityBySpot.value[randomId] || 0) + 1
  }, 5000)
})

onUnmounted(() => window.clearInterval(popularityTimer))

// 선택 포인트 변경 감시
watch(selectedDivingSpot, (newSpot, oldSpot) => {
  if (!newSpot) {
    return
  }

  console.log('[watch] 선택 포인트 변경:', oldSpot?.name || '없음', '→', newSpot.name)
})

// 특보 필터 변경 감시
watch(warningOnly, (newValue) => {
  console.log('[watch] 특보 지역 필터:', newValue)
})

// 검색어 변경 자동 감시
watchEffect(() => {
  console.log(`[watchEffect] 검색어: ${searchQuery.value}`)
})
</script>

<template>
  <main class="diving-page">
    <header class="page-header">
      <div class="hero-copy">
        <p class="eyebrow">DIVING OCEAN CONDITION</p>

        <h1>다이빙 해양환경 정보</h1>

        <p>국내 주요 포인트의 바다 상태를 비교하고, 오늘 나에게 맞는 다이빙을 준비하세요.</p>
      </div>

      <div class="hero-status">
        <span class="live-dot"></span>
        {{
          isLoadingConditions ? '실제 데이터 불러오는 중' : '해양조사원 · OpenWeather · 기상청 연결'
        }}
      </div>
    </header>

    <BaseDashboardCard title="다이빙 포인트 검색" icon="🔍">
      <SearchBar
        :query="searchQuery"
        :warning-only="warningOnly"
        @update-query="updateSearchQuery"
        @update-warning-only="updateWarningOnly"
      />
    </BaseDashboardCard>

    <section class="list-toolbar" aria-label="다이빙 포인트 목록 설정">
      <div class="sort-tabs">
        <button
          v-for="option in [
            { value: 'recommended', label: '추천순' },
            { value: 'distance', label: '거리순' },
            { value: 'popular', label: '실시간 인기순' },
          ]"
          :key="option.value"
          type="button"
          :class="{ active: sortMode === option.value }"
          @click="sortMode = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <button
        type="button"
        class="favorite-filter"
        :class="{ active: favoriteOnly }"
        @click="toggleFavoriteOnly"
      >
        {{ favoriteOnly ? '♥' : '♡' }} 즐겨찾기 {{ favoriteCount }}
      </button>
    </section>

    <EnvironmentSummary
      :active-filter="summaryFilter"
      :total-count="divingSpotList.length"
      :filtered-count="searchResultCount"
      :warning-count="warningSpotCount"
      :high-wave-count="highWaveSpotCount"
      :strong-wind-count="strongWindSpotCount"
      @select-filter="summaryFilter = $event"
    />

    <BaseDashboardCard title="다이빙 포인트 현황" icon="🗺️">
      <p v-if="dataErrorMessage" class="data-error" role="status">
        일부 자료를 불러오지 못했습니다: {{ dataErrorMessage }}
      </p>

      <p v-if="filteredDivingSpotList.length === 0" class="no-result">
        검색 결과와 일치하는 포인트가 없습니다.
      </p>

      <div v-else class="diving-list">
        <DivingCard
          v-for="spot in filteredDivingSpotList"
          :key="spot.id"
          :spot="spot"
          :selected="selectedDivingSpot?.id === spot.id"
          :alerts="getEnvironmentAlerts(spot)"
          :alert-level="getAlertLevel(spot)"
          :distance="distanceBySpot[spot.id]"
          :popularity="popularityBySpot[spot.id]"
          :favorite="favoriteSpotIds.includes(spot.id)"
          @select-card="selectDivingSpot(spot)"
          @click-detail="showDetail(spot)"
          @click-forecast="showForecast(spot)"
          @toggle-favorite="toggleFavorite(spot.id)"
        />
      </div>
    </BaseDashboardCard>

    <footer>
      <p>
        {{ selectedSpotInfo || '다이빙 포인트를 선택해 보세요.' }}
      </p>

      <small>
        포인트·스쿠버지수·수온·파고·유속·물때는 국립해양조사원, 날씨는 OpenWeather,
        해양부이·파주기·특보는 기상청 API 자료입니다. 입수 전 현지 다이빙숍 안내도 함께 확인하세요.
      </small>
    </footer>
  </main>
</template>

<style scoped>
.diving-page {
  width: calc(100% - 40px);
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 0 64px;
  box-sizing: border-box;
  color: var(--ink-900);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 190px;
  padding: 36px 38px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(circle at 94% 8%, rgb(58 139 183 / 10%), transparent 18rem), var(--surface);
  color: var(--ink-900);
  box-shadow: var(--shadow-sm);
}

.page-header::after {
  display: none;
}

.page-header h1 {
  margin: 7px 0 10px;
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.2;
}

.hero-copy,
.hero-status {
  position: static;
}

.hero-copy {
  max-width: 620px;
}

.hero-copy > p:last-child {
  color: var(--ink-500);
  font-size: 16px;
}

.hero-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid #d7e2e8;
  border-radius: 999px;
  background: #f5f8fa;
  color: #657985;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e2a23a;
  box-shadow: 0 0 0 5px rgb(226 162 58 / 13%);
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 18px 0 0;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.sort-tabs {
  display: flex;
  gap: 4px;
}

.sort-tabs button,
.favorite-filter {
  padding: 9px 14px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--ink-500);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: 0.2s ease;
}

.sort-tabs button.active {
  background: var(--sea-900);
  color: white;
  box-shadow: 0 4px 12px rgb(11 59 74 / 18%);
}

.favorite-filter {
  border: 1px solid #e5d2d7;
  color: #a3485e;
}

.favorite-filter.active {
  border-color: #db9cac;
  background: #fff4f6;
}

.page-header p:last-child {
  margin-bottom: 0;
}

.eyebrow {
  margin: 0;
  color: var(--sea-700);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.8px;
}

.diving-list {
  display: grid;
  gap: 14px;
}

.no-result {
  padding: 30px;
  color: #c23f3f;
  text-align: center;
}

.data-error {
  margin: 0 0 14px;
  padding: 11px 13px;
  border: 1px solid #ecd8bf;
  border-radius: 10px;
  background: #fffaf1;
  color: #8a642b;
  font-size: 12px;
}

footer {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #dce5ea;
  border-radius: 12px;
  background: #f2f6f8;
  color: #405b6c;
  text-align: center;
}

footer p {
  margin: 0 0 8px;
  font-weight: bold;
}

footer small {
  display: block;
  color: #748590;
  line-height: 1.5;
}

@media (max-width: 700px) {
  .diving-page {
    width: calc(100% - 20px);
    padding: 18px 0 40px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    min-height: auto;
    padding: 30px 23px;
  }

  .list-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .sort-tabs button {
    flex: 1;
    padding: 9px 5px;
    font-size: 12px;
  }
}
</style>
