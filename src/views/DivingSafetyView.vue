<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const safetyChecklist = [
  {
    icon: '🚨',
    title: '기상특보 확인',
    message: '풍랑·강풍·태풍특보와 현지 통제 여부를 확인합니다.',
  },
  {
    icon: '🌊',
    title: '파도와 너울 확인',
    message: '파고뿐 아니라 파주기와 해안으로 들어오는 너울을 확인합니다.',
  },
  {
    icon: '💨',
    title: '풍속과 풍향 확인',
    message: '입수 지점과 출수 지점에 영향을 주는 바람을 확인합니다.',
  },
  {
    icon: '🌙',
    title: '물때와 조류 확인',
    message: '만조·간조 시각과 조류 속도·방향을 확인합니다.',
  },
  {
    icon: '🤝',
    title: '버디와 계획 공유',
    message: '최대 수심, 다이빙 시간과 비상 절차를 버디와 공유합니다.',
  },
  {
    icon: '🏪',
    title: '현지 전문가 확인',
    message: '최종 입수 여부는 현지 다이빙숍과 전문가의 안내를 따릅니다.',
  },
]

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <main class="safety-page">
    <header class="safety-header">
      <p class="eyebrow">DIVING SAFETY CHECKLIST</p>

      <h1>🛟 다이빙 전 안전 확인</h1>

      <p>해양환경 정보만으로 입수 여부를 결정하지 마세요.</p>
    </header>

    <section class="checklist">
      <article v-for="item in safetyChecklist" :key="item.title" class="checklist-item">
        <span>{{ item.icon }}</span>

        <div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.message }}</p>
        </div>
      </article>
    </section>

    <section class="official-links">
      <h2>공식 정보 확인</h2>

      <div>
        <a href="https://marine.kma.go.kr/mmis/" target="_blank" rel="noopener noreferrer">
          기상청 해양기상정보 확인
        </a>

        <a href="https://www.khoa.go.kr/" target="_blank" rel="noopener noreferrer">
          국립해양조사원 확인
        </a>
      </div>
    </section>

    <button type="button" class="home-button" @click="goHome">대시보드로 돌아가기</button>
  </main>
</template>

<style scoped>
.safety-page {
  width: calc(100% - 40px);
  max-width: 850px;
  margin: 34px auto 70px;
}

.safety-header {
  min-height: 180px;
  padding: 34px 36px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: radial-gradient(circle at 92% 8%, rgb(214 96 96 / 8%), transparent 16rem), white;
  color: var(--ink-900);
  box-shadow: var(--shadow-sm);
}

.eyebrow {
  margin: 0;
  color: #bb5555;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1.5px;
}

.safety-header h1 {
  margin: 5px 0 8px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.safety-header p:last-child {
  margin-bottom: 0;
  color: var(--ink-500);
}

.checklist {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: white;
  box-shadow: var(--shadow-sm);
}

.checklist-item > span {
  flex-shrink: 0;
  font-size: 34px;
}

.checklist-item h2 {
  margin: 0 0 6px;
  font-size: 17px;
}

.checklist-item p {
  margin: 0;
  color: #60798a;
}

.official-links {
  margin-top: 20px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #dce6eb;
  background: #f1f5f8;
}

.official-links h2 {
  margin-top: 0;
}

.official-links > div {
  display: flex;
  gap: 10px;
}

.official-links a {
  flex: 1;
  padding: 11px;
  border-radius: 8px;
  background: var(--sea-900);
  color: white;
  text-align: center;
  text-decoration: none;
}

.home-button {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  background: var(--sea-900);
  color: white;
  cursor: pointer;
}

@media (max-width: 650px) {
  .safety-page {
    width: calc(100% - 20px);
    margin: 20px auto;
  }

  .official-links > div {
    flex-direction: column;
  }
}
</style>
