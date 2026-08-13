<script setup>
import { ref } from 'vue'

// 검색어
const searchQuery = ref('')

// 선택한 다이빙 포인트 안내 문구
const selectedMessage = ref('다이빙 포인트를 선택하거나 검색해 보세요.')

// 스쿠버다이빙 포인트 Mockup 데이터
const divingSpotList = ref([
  {
    id: 'spot_01',
    name: '제주 문섬',
    region: '제주',
    waterTemp: 26,
    visibility: 15,
    waveHeight: 0.7,
    status: '양호',
    icon: '🐠',
  },
  {
    id: 'spot_02',
    name: '제주 섶섬',
    region: '제주',
    waterTemp: 24,
    visibility: 12,
    waveHeight: 1.1,
    status: '주의',
    icon: '🐢',
  },
  {
    id: 'spot_03',
    name: '강릉 사천',
    region: '강릉',
    waterTemp: 21,
    visibility: 10,
    waveHeight: 0.9,
    status: '양호',
    icon: '🐟',
  },
  {
    id: 'spot_04',
    name: '동해 대진',
    region: '동해',
    waterTemp: 20,
    visibility: 8,
    waveHeight: 1.4,
    status: '주의',
    icon: '🌊',
  },
  {
    id: 'spot_05',
    name: '울진 왕돌초',
    region: '울진',
    waterTemp: 22,
    visibility: 18,
    waveHeight: 0.8,
    status: '양호',
    icon: '🐡',
  },
  {
    id: 'spot_06',
    name: '부산 태종대',
    region: '부산',
    waterTemp: 25,
    visibility: 9,
    waveHeight: 1.0,
    status: '양호',
    icon: '🐙',
  },
  {
    id: 'spot_07',
    name: '거제 구조라',
    region: '거제',
    waterTemp: 27,
    visibility: 14,
    waveHeight: 0.6,
    status: '매우 양호',
    icon: '🐬',
  },
  {
    id: 'spot_08',
    name: '포항 구룡포',
    region: '포항',
    waterTemp: 23,
    visibility: 7,
    waveHeight: 1.6,
    status: '입수 주의',
    icon: '⚠️',
  },
])

// 검색창 입력 처리
const handleSearchInput = (event) => {
  searchQuery.value = event.target.value
}

// 다이빙 포인트 카드 선택
const selectDivingSpot = (spot) => {
  selectedMessage.value = `${spot.name} 다이빙 포인트가 선택되었습니다.`
}

// 상세보기
const showDetail = (spot) => {
  window.alert(
    `🤿 ${spot.name} 다이빙 정보\n\n` +
      `지역: ${spot.region}\n` +
      `수온: ${spot.waterTemp}°C\n` +
      `수중 시야: ${spot.visibility}m\n` +
      `파고: ${spot.waveHeight}m\n` +
      `상태: ${spot.status}\n\n` +
      `※ 실제 입수 전 공식 해양기상 정보와 현지 다이빙숍의 안내를 확인하세요.`,
  )
}
</script>

<template>
  <main class="diving-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">SCUBA DIVING MOCKUP</p>
        <h1>🤿 스쿠버다이빙 포인트</h1>
        <p class="subtitle">국내 다이빙 포인트의 환경을 확인해 보세요.</p>
      </div>

      <div class="header-icon">🌊</div>
    </header>

    <section class="search-section">
      <label for="spot-search"> 🔍 다이빙 포인트 검색 </label>

      <input
        id="spot-search"
        :value="searchQuery"
        type="text"
        placeholder="지역 또는 포인트 이름 입력"
        @input="handleSearchInput"
      />

      <p>
        검색 중인 포인트:
        <strong>
          {{ searchQuery || '검색어 없음' }}
        </strong>
      </p>
    </section>

    <section class="diving-section">
      <div class="section-title">
        <h2>🗺️ 국내 다이빙 포인트 현황</h2>

        <span> 총 {{ divingSpotList.length }}곳 </span>
      </div>

      <article
        v-for="spot in divingSpotList"
        :key="spot.id"
        class="diving-card"
        @click="selectDivingSpot(spot)"
      >
        <div class="spot-main">
          <div class="spot-heading">
            <div>
              <h3>{{ spot.name }}</h3>
              <p>{{ spot.region }} 지역</p>
            </div>
          </div>

          <strong class="water-temperature"> {{ spot.waterTemp }}°C </strong>
        </div>

        <div class="diving-information">
          <div class="information-item">
            <span>👀 수중 시야</span>
            <strong>{{ spot.visibility }}m</strong>
          </div>

          <div class="information-item">
            <span>🌊 파고</span>
            <strong>{{ spot.waveHeight }}m</strong>
          </div>

          <div class="information-item">
            <span>📋 상태</span>
            <strong>{{ spot.status }}</strong>
          </div>
        </div>

        <div class="card-actions">
          <span v-if="spot.waterTemp >= 25" class="temperature-label warm"> ☀️ 따뜻한 수온 </span>

          <span v-else class="temperature-label cold"> 🧥 보온 장비 필요 </span>

          <button type="button" @click.stop="showDetail(spot)">상세보기</button>
        </div>
      </article>
    </section>

    <footer>
      <p>{{ selectedMessage }}</p>

      <small>
        본 화면의 정보는 Vue 학습을 위한 Mockup 데이터입니다. 실제 다이빙 판단에 사용하지 마세요.
      </small>
    </footer>
  </main>
</template>

<style scoped>
.diving-page {
  width: calc(100% - 40px);
  max-width: 800px;
  margin: 40px auto;
  padding: 24px;
  box-sizing: border-box;
  color: #17324d;
  font-family: Arial, sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #006994, #00a6a6);
  color: white;
}

.page-header h1 {
  margin: 5px 0 8px;
  font-size: 30px;
}

.eyebrow {
  margin: 0;
  color: #baf4ff;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1.5px;
}

.subtitle {
  margin: 0;
  color: #e3fbff;
}

.header-icon {
  font-size: 55px;
}

.search-section,
.diving-section {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid #cde1e8;
  border-radius: 12px;
  background: #f4fbfd;
}

.search-section label {
  display: block;
  margin-bottom: 9px;
  font-weight: bold;
}

.search-section input {
  width: 100%;
  padding: 11px;
  box-sizing: border-box;
  border: 1px solid #a9c5d0;
  border-radius: 7px;
}

.search-section input:focus {
  border-color: #007da5;
  outline: none;
  box-shadow: 0 0 0 3px rgb(0 125 165 / 12%);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title h2 {
  margin: 0;
}

.section-title span {
  padding: 6px 10px;
  border-radius: 15px;
  background: #d9f2f6;
  color: #00667e;
  font-size: 13px;
}

.diving-card {
  margin-top: 14px;
  padding: 17px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: white;
  box-shadow: 0 3px 9px rgb(0 75 100 / 8%);
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.diving-card:hover {
  transform: translateY(-2px);
  border-color: #65bed1;
}

.spot-main,
.spot-heading,
.card-actions {
  display: flex;
  align-items: center;
}

.spot-main,
.card-actions {
  justify-content: space-between;
}

.spot-heading {
  gap: 12px;
}

.spot-heading h3 {
  margin: 0 0 4px;
}

.spot-heading p {
  margin: 0;
  color: #60798a;
}

.water-temperature {
  color: #00779b;
  font-size: 27px;
}

.diving-information {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  margin-top: 16px;
}

.information-item {
  padding: 10px;
  border-radius: 8px;
  background: #eef8fa;
  text-align: center;
}

.information-item span,
.information-item strong {
  display: block;
}

.information-item span {
  margin-bottom: 5px;
  color: #60798a;
  font-size: 12px;
}

.card-actions {
  margin-top: 16px;
}

.temperature-label {
  padding: 7px 11px;
  border-radius: 7px;
  color: white;
  font-size: 13px;
}

.warm {
  background: #ff8b4d;
}

.cold {
  background: #3e9bd4;
}

.card-actions button {
  padding: 8px 13px;
  border: 1px solid #8aa9b7;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.card-actions button:hover {
  background: #e5f7fa;
}

footer {
  margin-top: 20px;
  padding: 16px;
  border-radius: 10px;
  background: #e5f7ef;
  color: #24664d;
  text-align: center;
}

footer p {
  margin: 0 0 8px;
  font-weight: bold;
}

footer small {
  display: block;
  color: #55776a;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .diving-page {
    width: calc(100% - 20px);
    margin: 20px auto;
    padding: 12px;
  }

  .page-header {
    align-items: flex-start;
  }

  .header-icon {
    font-size: 38px;
  }

  .diving-information {
    grid-template-columns: 1fr;
  }
}
</style>
