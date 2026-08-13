<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <main class="not-found-page">
    <section class="not-found-card">
      <div class="icon">🌊❓</div>

      <p class="code">404</p>

      <h1>페이지를 찾을 수 없습니다.</h1>

      <p>요청하신 주소가 존재하지 않거나 아직 개발되지 않은 페이지입니다.</p>

      <button type="button" @click="goHome">다이빙 대시보드로 이동</button>
    </section>
  </main>
</template>

<style scoped>
.not-found-page {
  display: grid;
  min-height: calc(100vh - 100px);
  place-items: center;
  padding: 20px;
}

.not-found-card {
  width: min(100%, 450px);
  padding: 45px 30px;
  box-sizing: border-box;
  border: 1px solid #d9e4e8;
  border-radius: 16px;
  background: white;
  box-shadow: 0 12px 30px rgb(0 60 80 / 12%);
  text-align: center;
}

.icon {
  font-size: 65px;
}

.code {
  margin: 12px 0 0;
  color: #0090a0;
  font-size: 18px;
  font-weight: bold;
}

.not-found-card h1 {
  margin: 10px 0;
}

.not-found-card > p:last-of-type {
  color: #60798a;
  line-height: 1.6;
}

.not-found-card button {
  margin-top: 15px;
  padding: 12px 20px;
  border: 0;
  border-radius: 22px;
  background: #008da1;
  color: white;
  cursor: pointer;
  font-weight: bold;
}
</style>
