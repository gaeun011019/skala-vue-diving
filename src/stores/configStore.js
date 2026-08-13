import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  // state: 현재 선택한 온도 단위
  const unit = ref(localStorage.getItem('temperatureUnit') || 'celsius')

  // getter: 현재 단위의 기호
  const unitSymbol = computed(() => {
    return unit.value === 'celsius' ? '℃' : '℉'
  })

  // action: 섭씨와 화씨 전환
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'

    localStorage.setItem('temperatureUnit', unit.value)
  }

  // 화면에 표시할 온도로 변환
  function formatTemperature(celsiusTemperature) {
    if (celsiusTemperature === null || celsiusTemperature === undefined) return '자료 없음'

    if (unit.value === 'fahrenheit') {
      const fahrenheit = (celsiusTemperature * 9) / 5 + 32

      return `${Math.round(fahrenheit)}${unitSymbol.value}`
    }

    return `${celsiusTemperature}${unitSymbol.value}`
  }

  return {
    unit,
    unitSymbol,
    toggleUnit,
    formatTemperature,
  }
})
