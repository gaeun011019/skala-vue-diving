import axios from 'axios'

export const fetchDepthTemperatures = async (spot) => {
  try {
    const response = await axios.get('/api/water-temperature', {
      params: {
        lat: spot.latitude,
        lon: spot.longitude,
      },
      timeout: 60000,
    })

    if (!Array.isArray(response.data?.temperatures)) {
      throw new Error(
        'Copernicus 수온 API가 실행되지 않았습니다. 로컬에서는 npm run dev:full을 사용하세요.',
      )
    }

    return response.data
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(
        'Copernicus 응답이 60초 이상 지연되고 있습니다. 잠시 후 다시 확인해 주세요.',
        {
          cause: error,
        },
      )
    }
    throw new Error(error.response?.data?.message || error.message || '수심별 수온 요청 실패', {
      cause: error,
    })
  }
}
