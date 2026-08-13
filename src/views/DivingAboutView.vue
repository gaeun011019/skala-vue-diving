<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <main class="about-page">
    <section class="about-hero">
      <span class="hero-icon">🌊</span>

      <div>
        <p class="eyebrow">ABOUT DIVE CONDITION</p>

        <h1>서비스 소개</h1>

        <p>다이빙 포인트의 해양환경 정보를 카테고리별로 확인하는 Vue 학습용 서비스입니다.</p>
      </div>
    </section>

    <section class="about-card">
      <h2>제공하는 정보</h2>

      <div class="feature-grid">
        <article>
          <span>🌡️</span>
          <h3>수심별 수온</h3>
          <p>0m부터 30m까지 10m 간격으로 수온을 보여줍니다.</p>
        </article>

        <article>
          <span>🌊</span>
          <h3>파도와 바람</h3>
          <p>파고·파주기·파향과 풍속·풍향을 확인할 수 있습니다.</p>
        </article>

        <article>
          <span>🌙</span>
          <h3>물때와 조류</h3>
          <p>몇 물인지와 만조·간조, 조류의 속도와 방향을 보여줍니다.</p>
        </article>

        <article>
          <span>🚨</span>
          <h3>주의 정보</h3>
          <p>특보와 높은 파고, 강풍, 강한 조류를 구분해서 표시합니다.</p>
        </article>
      </div>

      <div class="notice">
        <strong>⚠️ 중요 안내</strong>

        <p>
          현재 표시된 값은 Vue 학습을 위한 Mockup 데이터이며 실제 다이빙 판단에 사용할 수 없습니다.
        </p>
      </div>

      <button type="button" @click="goHome">대시보드로 돌아가기</button>
    </section>
  </main>
</template>

<style scoped>
.about-page {
  width: calc(100% - 40px);
  max-width: 900px;
  margin: 34px auto 70px;
}

.about-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 180px;
  padding: 34px 36px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: radial-gradient(circle at 92% 10%, rgb(58 139 183 / 10%), transparent 16rem), white;
  color: var(--ink-900);
  box-shadow: var(--shadow-sm);
}

.hero-icon {
  display: grid;
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  border-radius: 18px;
  background: var(--sea-50);
  font-size: 36px;
  place-items: center;
}

.eyebrow {
  margin: 0;
  color: var(--sea-700);
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1.5px;
}

.about-hero h1 {
  margin: 5px 0 8px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.about-hero p:last-child {
  margin: 0;
  color: var(--ink-500);
}

.about-card {
  margin-top: 20px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: white;
  box-shadow: var(--shadow-sm);
}

.about-card > h2 {
  margin-top: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-grid article {
  padding: 18px;
  border: 1px solid #e4eaed;
  border-radius: 12px;
  background: #fafbfc;
}

.feature-grid article > span {
  font-size: 30px;
}

.feature-grid h3 {
  margin: 10px 0 6px;
}

.feature-grid p {
  margin: 0;
  color: #60798a;
  line-height: 1.6;
}

.notice {
  margin-top: 18px;
  padding: 16px;
  border-radius: 10px;
  background: #fff4dc;
  color: #795c18;
}

.notice p {
  margin: 6px 0 0;
}

.about-card > button {
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  background: var(--sea-900);
  color: white;
  cursor: pointer;
  font-weight: bold;
}

.about-card > button:hover {
  background: var(--sea-700);
}

@media (max-width: 650px) {
  .about-page {
    width: calc(100% - 20px);
    margin: 20px auto;
  }

  .about-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
