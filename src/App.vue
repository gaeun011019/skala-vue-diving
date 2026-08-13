<script setup>
import { RouterLink, RouterView } from 'vue-router'
import UnitToggler from '@/components/common/UnitToggler.vue'
import logo from '@/assets/logo.svg'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <RouterLink to="/" class="brand-link" aria-label="SEA GANI 홈">
          <img :src="logo" alt="SEA GANI" class="brand-logo" />
        </RouterLink>
      </div>

      <nav class="navigation">
        <RouterLink to="/"> 포인트 찾기 </RouterLink>

        <RouterLink to="/forecast"> 다이빙 예보 </RouterLink>

        <RouterLink to="/updates"> 현장 소식 </RouterLink>

        <RouterLink to="/safety"> 안전 가이드 </RouterLink>

        <RouterLink to="/about"> 서비스 소개 </RouterLink>

        <UnitToggler />
      </nav>
    </header>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: transparent;
}

.app-header {
  position: sticky;
  z-index: 100;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  min-height: 70px;
  padding: 10px max(24px, calc((100% - 1120px) / 2));
  border-bottom: 1px solid rgb(224 231 235 / 92%);
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 4px 20px rgb(18 38 63 / 4%);
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--sea-900);
}

.brand-link {
  display: flex;
  align-items: center;
  padding: 0 !important;
  background: transparent !important;
}

.brand-logo {
  display: block;
  width: 150px;
  height: 36px;
  object-fit: contain;
  object-position: left center;
}

.navigation {
  display: flex;
  align-items: center;
  gap: 3px;
}

.navigation a {
  position: relative;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--ink-700);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition:
    color 0.2s,
    background 0.2s;
}

.navigation a:hover {
  background: #f4f7f9;
  color: var(--sea-700);
}

.navigation a.router-link-exact-active {
  background: #eaf2f7;
  color: var(--sea-900);
  font-weight: 800;
}

.main-content {
  width: 100%;
}

@media (max-width: 700px) {
  .app-header {
    align-items: center;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px 9px;
  }

  .navigation {
    width: 100%;
    padding-bottom: 2px;
    overflow-x: auto;
  }

  .navigation a {
    flex: 0 0 auto;
    padding: 8px 9px;
    text-align: center;
    font-size: 12px;
  }
}
</style>
