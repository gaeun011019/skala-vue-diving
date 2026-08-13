const coastalRegions = [
  ['강원 고성', 38.38, 128.47],
  ['강원 속초', 38.2, 128.59],
  ['강원 강릉', 37.75, 128.9],
  ['강원 동해', 37.52, 129.12],
  ['강원 삼척', 37.45, 129.17],
  ['경북 울릉', 37.49, 130.9],
  ['경북 울진', 36.99, 129.4],
  ['경북 영덕', 36.42, 129.37],
  ['경북 포항', 36.03, 129.38],
  ['울산', 35.54, 129.38],
  ['부산', 35.13, 129.05],
  ['경남 거제', 34.88, 128.62],
  ['경남 통영', 34.85, 128.43],
  ['경남 남해', 34.84, 127.89],
  ['전남 여수', 34.76, 127.66],
  ['전남 완도', 34.31, 126.75],
  ['전남 목포', 34.79, 126.38],
  ['전북 군산', 35.97, 126.71],
  ['충남 보령', 36.33, 126.61],
  ['충남 태안', 36.75, 126.3],
  ['인천', 37.46, 126.6],
]

const distanceSquared = (latitude, longitude, region) => {
  const latitudeScale = latitude - region[1]
  const longitudeScale = (longitude - region[2]) * Math.cos((latitude * Math.PI) / 180)
  return latitudeScale ** 2 + longitudeScale ** 2
}

export const getSpotRegion = (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '지역 정보 없음'

  if (latitude >= 33 && latitude <= 34 && longitude >= 126 && longitude <= 127) {
    return latitude < 33.38 ? '제주 서귀포' : '제주 제주시'
  }

  const nearest = coastalRegions.reduce((closest, region) =>
    distanceSquared(latitude, longitude, region) < distanceSquared(latitude, longitude, closest)
      ? region
      : closest,
  )

  return `${nearest[0]} 인근`
}

export const resolveSpotRegion = (spot) => {
  const region = String(spot?.region || '').trim()
  if (region && region !== '국립해양조사원 주요 포인트') return region
  return getSpotRegion(Number(spot?.latitude), Number(spot?.longitude))
}

export const formatSpotDisplayName = (spot) => {
  const name = String(spot?.name || '').trim()
  const region = resolveSpotRegion(spot)
  const regionLead = region.split(' ')[0]
  const pointName = name.startsWith(`${regionLead} `) ? name.slice(regionLead.length + 1) : name
  return `${region} · ${pointName}`
}
