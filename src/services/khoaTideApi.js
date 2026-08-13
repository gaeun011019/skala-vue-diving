import axios from 'axios'

const TIDE_API_PATH = '/khoa-tide-api/GetTideFcstHghLwApiService'

// 주요 해안의 조석 예보지점입니다. 포인트 좌표에서 가장 가까운 지점을 선택합니다.
const tideStations = [
  { code: 'DT_0004', name: '제주', latitude: 33.527, longitude: 126.543 },
  { code: 'DT_0010', name: '서귀포', latitude: 33.24, longitude: 126.561 },
  { code: 'DT_0022', name: '성산포', latitude: 33.474, longitude: 126.927 },
  { code: 'DT_0023', name: '모슬포', latitude: 33.214, longitude: 126.251 },
  { code: 'DT_0005', name: '부산', latitude: 35.096, longitude: 129.035 },
  { code: 'DT_0029', name: '거제도', latitude: 34.801, longitude: 128.699 },
  { code: 'DT_0014', name: '통영', latitude: 34.827, longitude: 128.434 },
  { code: 'DT_0020', name: '울산', latitude: 35.501, longitude: 129.387 },
  { code: 'DT_0011', name: '후포', latitude: 36.677, longitude: 129.453 },
  { code: 'DT_0006', name: '묵호', latitude: 37.55, longitude: 129.116 },
  { code: 'DT_0012', name: '속초', latitude: 38.207, longitude: 128.594 },
  { code: 'DT_0016', name: '여수', latitude: 34.747, longitude: 127.765 },
  { code: 'DT_0027', name: '완도', latitude: 34.315, longitude: 126.759 },
  { code: 'DT_0007', name: '목포', latitude: 34.779, longitude: 126.375 },
]

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_KHOA_API_KEY
  if (!apiKey) throw new Error('.env.local에 VITE_KHOA_API_KEY를 설정해 주세요.')
  try {
    return decodeURIComponent(apiKey.trim())
  } catch {
    return apiKey.trim()
  }
}

const distanceKm = (first, second) => {
  const radius = 6371
  const toRadians = (degree) => (degree * Math.PI) / 180
  const latitudeDistance = toRadians(second.latitude - first.latitude)
  const longitudeDistance = toRadians(second.longitude - first.longitude)
  const value =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDistance / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

const nearestStation = (spot) =>
  tideStations
    .map((station) => ({ ...station, distance: distanceKm(spot, station) }))
    .sort((first, second) => first.distance - second.distance)[0]

const today = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}${values.month}${values.day}`
}

const normalizeItems = (data) => {
  const response = data?.response || data
  const header = response?.header || data?.header
  const resultCode = String(header?.resultCode ?? '00')
  if (!['00', '0', '200'].includes(resultCode)) {
    throw new Error(header?.resultMsg || '조석예보 API 요청에 실패했습니다.')
  }
  const item = response?.body?.items?.item ?? data?.body?.items?.item ?? []
  return Array.isArray(item) ? item : item ? [item] : []
}

const eventNames = {
  1: { type: 'high', label: '오전 만조' },
  2: { type: 'low', label: '오전 간조' },
  3: { type: 'high', label: '오후 만조' },
  4: { type: 'low', label: '오후 간조' },
}

const formatEvent = (item, station, index) => {
  const event = eventNames[Number(item.extrSe)] || { type: 'unknown', label: '조석' }
  const dateTime = String(item.predcDt || '')
  const timeMatch = dateTime.match(/(\d{2}):(\d{2})/)
  const compactMatch = dateTime.replace(/\D/g, '').match(/\d{8}(\d{2})(\d{2})/)
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : compactMatch ? `${compactMatch[1]}:${compactMatch[2]}` : dateTime
  return {
    id: `${station.code}-${dateTime}-${index}`,
    ...event,
    time,
    height: Number.isFinite(Number(item.predcTdlvVl)) ? Number(item.predcTdlvVl) : null,
  }
}

const fetchStationTides = async (station, reqDate) => {
  const response = await axios.get(TIDE_API_PATH, {
    params: {
      serviceKey: getApiKey(),
      type: 'json',
      pageNo: 1,
      numOfRows: 300,
      obsCode: station.code,
      reqDate,
    },
  })
  return normalizeItems(response.data)
    .map((item, index) => formatEvent(item, station, index))
    .sort((first, second) => first.time.localeCompare(second.time))
}

export const fetchKhoaTidesForSpots = async (spots, reqDate = today()) => {
  const stationBySpot = new Map(spots.map((spot) => [spot.id, nearestStation(spot)]))
  const uniqueStations = [...new Map([...stationBySpot.values()].map((item) => [item.code, item])).values()]
  const stationResults = await Promise.allSettled(
    uniqueStations.map(async (station) => ({ station, events: await fetchStationTides(station, reqDate) })),
  )
  const tideByStation = new Map(
    stationResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => [result.value.station.code, result.value]),
  )

  return Object.fromEntries(
    spots.map((spot) => {
      const station = stationBySpot.get(spot.id)
      const result = tideByStation.get(station.code)
      return [
        spot.id,
        {
          station: station.name,
          stationDistance: Number(station.distance.toFixed(1)),
          date: reqDate,
          events: result?.events || [],
        },
      ]
    }),
  )
}

