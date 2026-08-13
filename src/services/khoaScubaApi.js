import axios from 'axios'
import { getSpotRegion } from '@/services/spotRegion'

const KHOA_API_PATH = '/khoa-api/GetFcstSkinScubaApiServicev2'

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_KHOA_API_KEY

  if (!apiKey) {
    throw new Error('.env.local에 VITE_KHOA_API_KEY를 설정해 주세요.')
  }

  try {
    return decodeURIComponent(apiKey.trim())
  } catch {
    return apiKey.trim()
  }
}

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const normalized = String(value).replace(/[^\d.-]/g, '')
  if (!normalized) return null
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

const average = (minimum, maximum) => {
  if (minimum === null) return maximum
  if (maximum === null) return minimum
  return Number(((minimum + maximum) / 2).toFixed(1))
}

const makeSpotId = (name, latitude, longitude) => {
  const source = `${name}-${latitude}-${longitude}`
  let hash = 0
  for (const character of source) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return `khoa_${hash.toString(36)}`
}

const getTimeLabel = (code) => {
  const value = String(code || '').toUpperCase()
  if (['AM', 'A', '1', '오전'].includes(value)) return '오전'
  if (['PM', 'P', '2', '오후'].includes(value)) return '오후'
  return value || '시간 구분 없음'
}

const normalizeItems = (data) => {
  const response = data?.response || data
  const header = response?.header || data?.header
  const resultCode = String(header?.resultCode ?? '00')
  if (!['00', '0', '200'].includes(resultCode)) {
    throw new Error(header?.resultMsg || '국립해양조사원 API 요청에 실패했습니다.')
  }

  const rawItems = response?.body?.items?.item ?? data?.body?.items?.item ?? []
  return Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []
}

const normalizeItem = (item) => {
  const name = String(item.skscExpcnRgnNm || '').trim()
  const latitude = toNumber(item.lat)
  const longitude = toNumber(item.lot)
  const minWaveHeight = toNumber(item.minWvhgt)
  const maxWaveHeight = toNumber(item.maxWvhgt)
  const minCurrentSpeed = toNumber(item.minCrsp)
  const maxCurrentSpeed = toNumber(item.maxCrsp)
  const minWaterTemperature = toNumber(item.minWtem)
  const maxWaterTemperature = toNumber(item.maxWtem)

  return {
    id: makeSpotId(name, latitude, longitude),
    name,
    region: getSpotRegion(latitude, longitude),
    latitude,
    longitude,
    forecastDate: String(item.predcYmd || ''),
    forecastPeriod: getTimeLabel(item.predcNoonSeCd),
    tideLabel: String(item.tdlvHrCn || '').trim() || '자료 없음',
    minWaveHeight,
    maxWaveHeight,
    waveHeight: average(minWaveHeight, maxWaveHeight),
    minCurrentSpeed,
    maxCurrentSpeed,
    currentSpeed: average(minCurrentSpeed, maxCurrentSpeed),
    minWaterTemperature,
    maxWaterTemperature,
    waterTemperature: average(minWaterTemperature, maxWaterTemperature),
    scubaScore: toNumber(item.lastScr),
    scubaIndex: String(item.totalIndex || '').trim() || null,
    source: '국립해양조사원 스킨스쿠버지수',
  }
}

const rowOrder = (spot) => {
  const period = spot.forecastPeriod === '오후' ? '2' : '1'
  return `${spot.forecastDate}${period}`
}

const fetchForecastRows = async () => {
  const response = await axios.get(KHOA_API_PATH, {
    params: {
      serviceKey: getApiKey(),
      type: 'json',
      pageNo: 1,
      numOfRows: 300,
    },
  })

  return normalizeItems(response.data)
    .map(normalizeItem)
    .filter((spot) => spot.name && spot.latitude !== null && spot.longitude !== null)
    .sort((first, second) => rowOrder(first).localeCompare(rowOrder(second)))
}

export const fetchKhoaScubaSpots = async () => {
  const rows = await fetchForecastRows()

  const firstForecastByPoint = new Map()
  rows.forEach((spot) => {
    if (!firstForecastByPoint.has(spot.id)) firstForecastByPoint.set(spot.id, spot)
  })

  const spots = [...firstForecastByPoint.values()]
  if (!spots.length) throw new Error('국립해양조사원에서 조회된 스킨스쿠버 포인트가 없습니다.')
  return spots
}

export const fetchKhoaScubaForecastForSpot = async (spot) => {
  const rows = await fetchForecastRows()
  return rows.filter(
    (row) => row.id === spot.id || row.name.includes(spot.name) || spot.name.includes(row.name),
  )
}
