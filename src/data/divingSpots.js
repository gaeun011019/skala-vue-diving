export const divingSpots = [
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
]
