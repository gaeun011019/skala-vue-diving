import axios from 'axios'

const API_BASE_URL = 'https://api.openweathermap.org/data/2.5'

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY

  if (!apiKey) {
    throw new Error('.env.local에 VITE_OPENWEATHER_API_KEY를 설정해 주세요.')
  }

  return apiKey
}

const toLocalDate = (unixTime, timezoneOffset) => new Date((unixTime + timezoneOffset) * 1000)

const getDateKey = (date) => date.toISOString().slice(0, 10)

const getTimeLabel = (date) =>
  `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`

const getWindDirection = (degree = 0) => {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return directions[Math.round(degree / 45) % 8]
}

const getDayLabel = (dateKey, index) => {
  if (index === 0) return '오늘'
  if (index === 1) return '내일'

  const [, month, day] = dateKey.split('-')
  return `${Number(month)}.${Number(day)}`
}

const getWeekday = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00+09:00`)
  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
}

const normalizeForecast = (item, timezoneOffset) => {
  const localDate = toLocalDate(item.dt, timezoneOffset)

  return {
    id: item.dt,
    date: getDateKey(localDate),
    time: getTimeLabel(localDate),
    weather: item.weather?.[0]?.description || '정보 없음',
    weatherCode: item.weather?.[0]?.id || 800,
    icon: item.weather?.[0]?.icon || '01d',
    temperature: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    humidity: item.main.humidity,
    pressure: item.main.pressure,
    rain: Math.round((item.pop || 0) * 100),
    rainAmount: item.rain?.['3h'] || 0,
    wind: Number(item.wind.speed.toFixed(1)),
    windDegree: item.wind.deg || 0,
    direction: getWindDirection(item.wind.deg),
    gust: item.wind.gust ? Number(item.wind.gust.toFixed(1)) : null,
    cloudiness: item.clouds?.all || 0,
  }
}

const groupForecastByDay = (items, timezoneOffset) => {
  const grouped = items.reduce((days, item) => {
    const forecast = normalizeForecast(item, timezoneOffset)
    if (!days[forecast.date]) days[forecast.date] = []
    days[forecast.date].push(forecast)
    return days
  }, {})

  return Object.entries(grouped)
    .slice(0, 5)
    .map(([date, forecasts], index) => ({
      value: date,
      label: getDayLabel(date, index),
      weekday: getWeekday(date),
      forecasts,
    }))
}

export const fetchOpenWeather = async ({ latitude, longitude }) => {
  const params = {
    lat: latitude,
    lon: longitude,
    appid: getApiKey(),
    units: 'metric',
    lang: 'kr',
  }

  const [currentResponse, forecastResponse] = await Promise.all([
    axios.get(`${API_BASE_URL}/weather`, { params }),
    axios.get(`${API_BASE_URL}/forecast`, { params }),
  ])

  const current = currentResponse.data
  const timezoneOffset = forecastResponse.data.city.timezone || current.timezone || 0
  const observedAt = toLocalDate(current.dt, timezoneOffset)

  return {
    locationName: current.name,
    fetchedAt: new Date(),
    current: {
      weather: current.weather?.[0]?.description || '정보 없음',
      weatherCode: current.weather?.[0]?.id || 800,
      icon: current.weather?.[0]?.icon || '01d',
      temperature: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      pressure: current.main.pressure,
      visibility: current.visibility ? Number((current.visibility / 1000).toFixed(1)) : null,
      wind: Number(current.wind.speed.toFixed(1)),
      windDegree: current.wind.deg || 0,
      direction: getWindDirection(current.wind.deg),
      observedAt: getTimeLabel(observedAt),
    },
    days: groupForecastByDay(forecastResponse.data.list, timezoneOffset),
  }
}
