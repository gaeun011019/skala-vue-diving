import axios from 'axios'

const KMA_API_PREFIX = '/kma-api'
const GRID_WIDTH = 149
const GRID_HEIGHT = 253
const KST_OFFSET = 9 * 60 * 60 * 1000
const cache = new Map()

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_KMA_API_KEY
  if (!apiKey) throw new Error('.env.local에 VITE_KMA_API_KEY를 설정해 주세요.')
  return apiKey
}

const requestText = async (path, params = {}, cacheKey = '') => {
  const request = async () => {
    const response = await axios.get(`${KMA_API_PREFIX}${path}`, {
      params: { ...params, authKey: getApiKey() },
      responseType: 'text',
      transformResponse: [(value) => value],
    })
    return String(response.data || '')
  }
  if (!cacheKey) return request()
  if (!cache.has(cacheKey)) cache.set(cacheKey, request())
  return cache.get(cacheKey)
}

const getDataLines = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > -90 ? number : null
}

const pad = (value) => String(value).padStart(2, '0')

const formatTime = (date, useKst = false) => {
  const target = useKst ? new Date(date.getTime() + KST_OFFSET) : date
  return `${target.getUTCFullYear()}${pad(target.getUTCMonth() + 1)}${pad(target.getUTCDate())}${pad(
    target.getUTCHours(),
  )}${pad(target.getUTCMinutes())}`
}

const getLatestForecastCycle = () => {
  const now = new Date(Date.now() - 30 * 60 * 1000 + KST_OFFSET)
  const cycles = [2, 5, 8, 11, 14, 17, 20, 23]
  let cycleHour = [...cycles].reverse().find((hour) => hour <= now.getUTCHours())
  if (cycleHour === undefined) {
    now.setUTCDate(now.getUTCDate() - 1)
    cycleHour = 23
  }
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(cycleHour)}`
}

const getLatestMarineCycle = () => {
  const available = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const cycleHour = available.getUTCHours() >= 12 ? 12 : 0
  return `${available.getUTCFullYear()}${pad(available.getUTCMonth() + 1)}${pad(
    available.getUTCDate(),
  )}${pad(cycleHour)}`
}

const roundToMarineEffect = (date = new Date()) => {
  const result = new Date(date)
  result.setUTCMinutes(0, 0, 0)
  result.setUTCHours(Math.round(result.getUTCHours() / 3) * 3)
  return result
}

// 좌표 변환 API 장애 시 사용할 기상청 공식 동네예보 변환식입니다.
const latLonToGrid = (latitude, longitude) => {
  const RE = 6371.00877
  const GRID = 5.0
  const SLAT1 = 30.0
  const SLAT2 = 60.0
  const OLON = 126.0
  const OLAT = 38.0
  const XO = 43
  const YO = 136
  const DEGRAD = Math.PI / 180.0
  const re = RE / GRID
  const slat1 = SLAT1 * DEGRAD
  const slat2 = SLAT2 * DEGRAD
  const olon = OLON * DEGRAD
  const olat = OLAT * DEGRAD
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5)
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5)
  ro = (re * sf) / Math.pow(ro, sn)
  let ra = Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5)
  ra = (re * sf) / Math.pow(ra, sn)
  let theta = longitude * DEGRAD - olon
  if (theta > Math.PI) theta -= 2.0 * Math.PI
  if (theta < -Math.PI) theta += 2.0 * Math.PI
  theta *= sn
  return {
    x: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    y: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  }
}

export const fetchKmaGridCoordinates = async (spot) => {
  const fallback = latLonToGrid(spot.latitude, spot.longitude)
  const text = await requestText('/typ01/cgi-bin/url/nph-dfs_xy_lonlat', {
    lon: spot.longitude,
    lat: spot.latitude,
    help: 0,
  })
  const numbers = getDataLines(text)
    .at(-1)
    ?.split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite)
  const x = numbers?.[2]
  const y = numbers?.[3]
  return x >= 1 && x <= GRID_WIDTH && y >= 1 && y <= GRID_HEIGHT ? { x, y } : fallback
}

const parseGridResponse = (text) => {
  const values = text
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite)
  if (values.length < GRID_WIDTH * GRID_HEIGHT) {
    throw new Error('기상청 단기예보 격자 응답 형식을 확인할 수 없습니다.')
  }
  return values.slice(-GRID_WIDTH * GRID_HEIGHT)
}

const getGridValue = (values, grid) => {
  for (let radius = 0; radius <= 4; radius += 1) {
    const candidates = []
    for (let yOffset = -radius; yOffset <= radius; yOffset += 1) {
      for (let xOffset = -radius; xOffset <= radius; xOffset += 1) {
        if (Math.max(Math.abs(xOffset), Math.abs(yOffset)) !== radius) continue
        const x = grid.x + xOffset
        const y = grid.y + yOffset
        if (x < 1 || x > GRID_WIDTH || y < 1 || y > GRID_HEIGHT) continue
        const value = values[(y - 1) * GRID_WIDTH + (x - 1)]
        if (Number.isFinite(value) && value > -90) {
          candidates.push({ value, distance: Math.hypot(xOffset, yOffset) })
        }
      }
    }
    if (candidates.length) {
      return candidates.sort((first, second) => first.distance - second.distance)[0].value
    }
  }
  return null
}

const fetchShortGrid = async (effectDate, variable) => {
  const tmfc = getLatestForecastCycle()
  const tmef = formatTime(effectDate, true).slice(0, 10)
  const text = await requestText(
    '/typ01/cgi-bin/url/nph-dfs_shrt_grd',
    { tmfc, tmef, vars: variable },
    `short-${tmfc}-${tmef}-${variable}`,
  )
  return parseGridResponse(text)
}

const parseStations = (text) =>
  getDataLines(text)
    .map((line) => line.split(/\s+/))
    .filter((columns) => columns.length >= 9)
    .map((columns) => ({
      id: columns[0],
      longitude: Number(columns[1]),
      latitude: Number(columns[2]),
      name: columns[6],
    }))
    .filter((station) => Number.isFinite(station.latitude) && Number.isFinite(station.longitude))

const parseBuoys = (text) =>
  getDataLines(text)
    .map((line) => line.split(/\s+/))
    .filter((columns) => columns.length >= 17)
    .map((columns) => ({
      observedAt: columns[0],
      stationId: columns[1],
      windDirection: toNumber(columns[2]),
      windSpeed: toNumber(columns[3]),
      gust: toNumber(columns[4]),
      pressure: toNumber(columns[8]),
      humidity: toNumber(columns[9]),
      airTemperature: toNumber(columns[10]),
      waterTemperature: toNumber(columns[11]),
      maxWaveHeight: toNumber(columns[12]),
      waveHeight: toNumber(columns[13]),
      averageWaveHeight: toNumber(columns[14]),
      wavePeriod: toNumber(columns[15]),
      waveDirection: toNumber(columns[16]),
    }))

const distanceKm = (first, second) => {
  const radius = 6371
  const toRad = (degree) => (degree * Math.PI) / 180
  const latitudeDistance = toRad(second.latitude - first.latitude)
  const longitudeDistance = toRad(second.longitude - first.longitude)
  const a =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(toRad(first.latitude)) *
      Math.cos(toRad(second.latitude)) *
      Math.sin(longitudeDistance / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const formatObservationTime = (value) => {
  if (!/^\d{12}$/.test(value || '')) return value || '시각 정보 없음'
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)} ${value.slice(8, 10)}:${value.slice(10)}`
}

const fetchObservationTables = async () => {
  const [stationText, buoyText] = await Promise.all([
    requestText('/typ01/url/stn_inf.php', { inf: 'BUOY', stn: 0, help: 0 }, 'marine-stations'),
    requestText('/typ01/url/kma_buoy.php', { stn: 0, help: 0 }, 'marine-buoys'),
  ])
  return { stations: parseStations(stationText), observations: parseBuoys(buoyText) }
}

export const fetchKmaMarineObservation = async (spot) => {
  const { stations, observations } = await fetchObservationTables()
  const observationByStation = new Map(observations.map((item) => [item.stationId, item]))
  const nearest = stations
    .filter((station) => observationByStation.has(station.id))
    .map((station) => ({ ...station, distance: distanceKm(spot, station) }))
    .sort((first, second) => first.distance - second.distance)[0]
  if (!nearest) throw new Error('가까운 기상청 해양기상부이 관측값이 없습니다.')
  return {
    station: nearest.name,
    distance: Number(nearest.distance.toFixed(1)),
    ...observationByStation.get(nearest.id),
    observedAt: formatObservationTime(observationByStation.get(nearest.id).observedAt),
  }
}

const parseMarineForecast = (text) =>
  getDataLines(text)
    .map((line) => line.split(',').map((value) => value.trim()))
    .filter((columns) => /^\d{10}$/.test(columns[0] || '') && columns.length >= 19)
    .map((columns) => ({
      modelAt: columns[0],
      forecastAt: columns[1],
      largeZone: Number(columns[2]),
      smallZone: Number(columns[3]),
      waveHeight: toNumber(columns[12]),
      wavePeriod: toNumber(columns[13]),
      waveDirection: toNumber(columns[14]),
      windSpeed: toNumber(columns[15]),
      windDirection: toNumber(columns[16]),
      visibility: toNumber(columns[17]),
      rainAmount: toNumber(columns[18]),
      waterTemperature: toNumber(columns[19]),
      swell: columns[20] || null,
    }))

const fetchMarineForecastRows = async (spots, effectDate) => {
  const modelAt = getLatestMarineCycle()
  const forecastAt = formatTime(roundToMarineEffect(effectDate)).slice(0, 10)
  const largeZones = [...new Set(spots.map((spot) => spot.marineZone?.large).filter(Boolean))]
  if (!largeZones.length) return []
  const text = await requestText(
    '/typ06/url/marine_small_zone.php',
    {
      tma_fc: modelAt,
      tma_ef: forecastAt,
      Lzone: largeZones.join(','),
      Szone: '1,2,3,4,5,6,7,8,9',
      disp: 0,
      help: 0,
    },
    `marine-${modelAt}-${forecastAt}-${largeZones.join('-')}`,
  )
  return parseMarineForecast(text)
}

const warningNames = { W: '강풍', V: '풍랑', T: '태풍', O: '폭풍해일', N: '지진해일' }
const warningKeywords = {
  spot_01: ['제주도남부', '제주도남쪽', '제주'],
  spot_02: ['제주도남부', '제주도남쪽', '제주'],
  spot_03: ['강원중부앞바다', '동해중부', '강원'],
  spot_04: ['강원남부앞바다', '동해중부', '강원'],
  spot_05: ['부산앞바다', '남해동부', '부산'],
  spot_06: ['경남서부남해앞바다', '남해동부', '경남'],
}

const parseWarnings = (text) =>
  getDataLines(text)
    .map((line) => {
      const columns = line.includes(',') ? line.split(',') : line.split(/\s+/)
      const warningIndex = columns.findIndex((column) => warningNames[column.trim()])
      if (warningIndex < 0) return null
      return {
        raw: line.replace(/\s/g, ''),
        type: columns[warningIndex].trim(),
        level: columns[warningIndex + 1]?.trim(),
        command: columns[warningIndex + 2]?.trim(),
      }
    })
    .filter(Boolean)

const fetchWarnings = async () => {
  const end = new Date()
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
  const text = await requestText(
    '/typ01/url/wrn_met_data.php',
    {
      reg: 0,
      wrn: 'A',
      tmfc1: formatTime(start, true),
      tmfc2: formatTime(end, true),
      disp: 0,
      help: 0,
    },
    `warnings-${formatTime(end, true).slice(0, 8)}`,
  )
  return parseWarnings(text)
}

const findSpotWarning = (spot, warnings) => {
  const keywords = warningKeywords[spot.id] || [spot.region]
  const related = warnings.filter((warning) =>
    keywords.some((keyword) => warning.raw.includes(keyword.replace(/\s/g, ''))),
  )
  const latestByType = new Map()
  related.forEach((warning) => latestByType.set(warning.type, warning))
  const active = [...latestByType.values()].filter((warning) => warning.command !== '3')
  if (!active.length) return null
  return active
    .map((warning) => {
      const level = ['2', '경보'].includes(warning.level) ? '경보' : '주의보'
      return `${warningNames[warning.type]}${level}`
    })
    .join(' · ')
}

export const fetchKmaConditionsForSpots = async (spots) => {
  const effectDate = roundToMarineEffect(new Date())
  const [observationResults, gridResults, shortGridResult, marineRowsResult, warningsResult] =
    await Promise.all([
      Promise.allSettled(spots.map((spot) => fetchKmaMarineObservation(spot))),
      Promise.allSettled(spots.map((spot) => fetchKmaGridCoordinates(spot))),
      fetchShortGrid(effectDate, 'WAV').catch(() => null),
      fetchMarineForecastRows(spots, effectDate).catch(() => []),
      fetchWarnings().catch(() => []),
    ])

  return Object.fromEntries(
    spots.map((spot, index) => {
      const observation =
        observationResults[index].status === 'fulfilled' ? observationResults[index].value : null
      const grid =
        gridResults[index].status === 'fulfilled'
          ? gridResults[index].value
          : latLonToGrid(spot.latitude, spot.longitude)
      const shortWave = shortGridResult ? getGridValue(shortGridResult, grid) : null
      const marine = marineRowsResult.find(
        (row) =>
          row.largeZone === spot.marineZone?.large && row.smallZone === spot.marineZone?.small,
      )
      return [
        spot.id,
        {
          grid,
          observation,
          marineForecast: marine || null,
          shortWave: shortWave === null ? null : Number(shortWave.toFixed(1)),
          warning: findSpotWarning(spot, warningsResult),
        },
      ]
    }),
  )
}

const toForecastDate = (date, time) => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute))
}

export const fetchKmaWaveForecast = async (spot, forecasts) => {
  const grid = await fetchKmaGridCoordinates(spot).catch(() =>
    latLonToGrid(spot.latitude, spot.longitude),
  )
  const results = await Promise.allSettled(
    forecasts.map(async (forecast) => {
      const effectDate = toForecastDate(forecast.date, forecast.time)
      const [marineRows, shortGrid] = await Promise.all([
        fetchMarineForecastRows([spot], effectDate),
        fetchShortGrid(effectDate, 'WAV').catch(() => null),
      ])
      const marine = marineRows.find(
        (row) =>
          row.largeZone === spot.marineZone?.large && row.smallZone === spot.marineZone?.small,
      )
      const shortWave = shortGrid ? getGridValue(shortGrid, grid) : null
      return {
        key: `${forecast.date}T${forecast.time}`,
        waveHeight: marine?.waveHeight ?? shortWave,
        marine,
      }
    }),
  )

  const waveByTime = {}
  const marineByTime = {}
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return
    if (result.value.waveHeight !== null) {
      waveByTime[result.value.key] = Number(result.value.waveHeight.toFixed(1))
    }
    if (result.value.marine) marineByTime[result.value.key] = result.value.marine
  })
  if (!Object.keys(waveByTime).length) throw new Error('기상청 해양 예보값이 없습니다.')
  return { grid, waveByTime, marineByTime }
}

export const getWindDirection = (degree) => {
  if (degree === null || degree === undefined) return '정보 없음'
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return directions[Math.round(degree / 45) % 8]
}
