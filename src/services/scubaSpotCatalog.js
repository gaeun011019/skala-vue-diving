import { forecastSpots } from '@/data/forecastSpots'
import { fetchKhoaScubaSpots } from '@/services/khoaScubaApi'

const CACHE_KEY = 'seaGaniScubaSpots'

const isValidSpot = (spot) =>
  spot?.id && Number.isFinite(Number(spot.latitude)) && Number.isFinite(Number(spot.longitude))

const getMetadata = (spot) =>
  forecastSpots.find(
    (item) => item.name.includes(spot.name) || spot.name.includes(item.name.replace(/^\S+\s/, '')),
  )

const enrichApiSpots = (spots) =>
  spots.filter(isValidSpot).map((spot) => ({ ...getMetadata(spot), ...spot }))

export const getCachedScubaSpots = () => {
  try {
    const spots = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '[]')
    return Array.isArray(spots) ? spots.filter(isValidSpot) : []
  } catch {
    return []
  }
}

export const loadScubaSpotCatalog = async () => {
  try {
    const spots = enrichApiSpots(await fetchKhoaScubaSpots())
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(spots))
    return { spots, source: 'api', error: '' }
  } catch (error) {
    const cachedSpots = getCachedScubaSpots()
    if (cachedSpots.length) {
      return { spots: cachedSpots, source: 'cache', error: error.message || '' }
    }

    return {
      spots: forecastSpots,
      source: 'fallback',
      error: error.message || '스킨스쿠버 포인트를 불러오지 못했습니다.',
    }
  }
}
