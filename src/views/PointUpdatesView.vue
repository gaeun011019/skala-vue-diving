<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { forecastSpots } from '@/data/forecastSpots'
import { getCachedScubaSpots, loadScubaSpotCatalog } from '@/services/scubaSpotCatalog'
import { formatSpotDisplayName } from '@/services/spotRegion'

const STORAGE_KEY = 'seaGaniPointUpdates'

const legacySpots = [
  { id: 'spot_01', name: '제주 문섬', region: '제주' },
  { id: 'spot_02', name: '제주 섶섬', region: '제주' },
  { id: 'spot_03', name: '강릉 사천', region: '강릉' },
  { id: 'spot_04', name: '동해 대진', region: '동해' },
  { id: 'spot_05', name: '울진 왕돌초', region: '울진' },
  { id: 'spot_06', name: '부산 태종대', region: '부산' },
]

const cachedSpots = getCachedScubaSpots()
const divingSpots = ref(cachedSpots.length ? cachedSpots : forecastSpots)

const initialUpdates = [
  {
    id: 1,
    spotId: 'spot_01',
    nickname: '문섬버디',
    visibility: '10~15m',
    wave: '잔잔해요',
    crowd: '보통',
    message: '수면은 잔잔하고 10m 아래부터 시야가 더 좋아요. 보트는 몇 팀 들어와 있습니다.',
    createdAt: '2026-08-12T13:20:00',
  },
  {
    id: 2,
    spotId: 'spot_03',
    nickname: '동해로그',
    visibility: '5~10m',
    wave: '조금 있어요',
    crowd: '여유',
    message: '입수 지점에 약한 너울이 있어요. 현지 숍 안내를 확인하고 들어가는 게 좋겠습니다.',
    createdAt: '2026-08-12T12:05:00',
  },
  {
    id: 3,
    spotId: 'spot_06',
    nickname: '부산다이버',
    visibility: '5m 미만',
    wave: '잔잔해요',
    crowd: '혼잡',
    message: '파도는 괜찮지만 시야가 흐린 편이고 주말이라 포인트 주변이 붐빕니다.',
    createdAt: '2026-08-12T10:48:00',
  },
]

const savedUpdates = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
const updates = ref(savedUpdates || initialUpdates)
const selectedFilter = ref('all')
const showForm = ref(false)

const form = ref({
  spotId: divingSpots.value[0]?.id || '',
  nickname: '',
  visibility: '모름',
  wave: '잔잔해요',
  crowd: '보통',
  message: '',
})

const filteredUpdates = computed(() => {
  if (selectedFilter.value === 'all') {
    return updates.value
  }

  return updates.value.filter((update) => update.spotId === selectedFilter.value)
})

const getSpot = (update) =>
  divingSpots.value.find((spot) => spot.id === update.spotId) ||
  legacySpots.find((spot) => spot.id === update.spotId) || {
    name: update.spotName || '알 수 없는 포인트',
    region: update.spotRegion || '지역 정보 없음',
  }

const formatDate = (dateValue) => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue))
}

const submitUpdate = async () => {
  if (!form.value.spotId) {
    ElMessage.warning('다이빙 포인트를 선택해 주세요.')
    return
  }
  if (!form.value.message.trim()) {
    ElMessage.warning('현장 상황을 입력해 주세요.')
    return
  }

  try {
    await ElMessageBox.confirm('작성한 현장 소식을 등록할까요?', '현장 소식 등록', {
      confirmButtonText: '등록',
      cancelButtonText: '취소',
      type: 'info',
      distinguishCancelAndClose: true,
    })
  } catch {
    return
  }

  const selectedSpot = divingSpots.value.find((spot) => spot.id === form.value.spotId)
  const newUpdate = {
    id: Date.now(),
    ...form.value,
    nickname: form.value.nickname.trim() || '익명 다이버',
    spotName: selectedSpot?.name || '',
    spotRegion: selectedSpot?.region || '',
    message: form.value.message.trim(),
    createdAt: new Date().toISOString(),
  }

  updates.value = [newUpdate, ...updates.value]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updates.value))
  showForm.value = false
  form.value.nickname = ''
  form.value.message = ''
  ElMessage.success('현장 소식이 등록되었습니다.')
}

onMounted(async () => {
  const catalog = await loadScubaSpotCatalog()
  divingSpots.value = catalog.spots
  if (!catalog.spots.some((spot) => spot.id === form.value.spotId)) {
    form.value.spotId = catalog.spots[0]?.id || ''
  }
})
</script>

<template>
  <main class="updates-page">
    <header class="updates-hero">
      <div>
        <p class="eyebrow">DIVER COMMUNITY</p>
        <h1>포인트 현장 소식</h1>
        <p>공식 관측자료와 함께, 현장에서 전하는 시야·파도·혼잡도를 확인하세요.</p>
      </div>

      <button type="button" @click="showForm = !showForm">
        {{ showForm ? '작성 취소' : '+ 현장 소식 올리기' }}
      </button>
    </header>

    <section class="safety-notice">
      <strong>정보 이용 안내</strong>
      <p>
        현장 소식은 사용자 제보이며 공식 관측자료가 아닙니다. 입수 전 기상특보와 현지 다이빙숍의
        안내를 반드시 확인하세요.
      </p>
    </section>

    <form v-if="showForm" class="update-form" @submit.prevent="submitUpdate">
      <div class="form-title">
        <div>
          <span>현장 공유</span>
          <h2>지금 포인트 상황은 어떤가요?</h2>
        </div>
        <small>현재는 과제용 브라우저 저장 방식입니다.</small>
      </div>

      <div class="form-grid">
        <label>
          다이빙 포인트
          <select v-model="form.spotId">
            <option v-for="spot in divingSpots" :key="spot.id" :value="spot.id">
              {{ formatSpotDisplayName(spot) }}
            </option>
          </select>
        </label>

        <label>
          닉네임
          <input
            v-model="form.nickname"
            type="text"
            maxlength="20"
            placeholder="비워두면 익명 다이버"
          />
        </label>

        <label>
          수중 시야
          <select v-model="form.visibility">
            <option>모름</option>
            <option>5m 미만</option>
            <option>5~10m</option>
            <option>10~15m</option>
            <option>15m 이상</option>
          </select>
        </label>

        <label>
          파도 상태
          <select v-model="form.wave">
            <option>잔잔해요</option>
            <option>조금 있어요</option>
            <option>높아요</option>
          </select>
        </label>

        <label>
          현장 혼잡도
          <select v-model="form.crowd">
            <option>여유</option>
            <option>보통</option>
            <option>혼잡</option>
          </select>
        </label>
      </div>

      <label class="message-field">
        현장 상황
        <textarea
          v-model="form.message"
          maxlength="300"
          placeholder="밖에서 본 바다 상황이나 파도, 시야, 주의할 점 등을 알려주세요."
        ></textarea>
        <span>{{ form.message.length }}/300</span>
      </label>

      <button type="submit" class="submit-button">소식 등록하기</button>
    </form>

    <section class="feed-section">
      <div class="feed-heading">
        <div>
          <p>LIVE REPORT</p>
          <h2>최근 현장 소식</h2>
        </div>

        <select v-model="selectedFilter" aria-label="포인트별 현장 소식 필터">
          <option value="all">전체 포인트</option>
          <option v-for="spot in divingSpots" :key="spot.id" :value="spot.id">
            {{ formatSpotDisplayName(spot) }}
          </option>
        </select>
      </div>

      <div v-if="filteredUpdates.length" class="update-list">
        <article v-for="update in filteredUpdates" :key="update.id" class="update-card">
          <header>
            <div>
              <strong>{{ formatSpotDisplayName(getSpot(update)) }}</strong>
            </div>
            <time>{{ formatDate(update.createdAt) }}</time>
          </header>

          <div class="condition-tags">
            <span>👀 시야 {{ update.visibility }}</span>
            <span>🌊 {{ update.wave }}</span>
            <span>👥 {{ update.crowd }}</span>
          </div>

          <p class="update-message">{{ update.message }}</p>

          <footer>
            <span class="avatar">{{ update.nickname.slice(0, 1) }}</span>
            {{ update.nickname }}
          </footer>
        </article>
      </div>

      <p v-else class="empty-message">선택한 포인트에 등록된 현장 소식이 없습니다.</p>
    </section>
  </main>
</template>

<style scoped>
.updates-page {
  width: calc(100% - 40px);
  max-width: 1020px;
  margin: 0 auto;
  padding: 32px 0 70px;
  color: var(--ink-900);
}
.updates-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  min-height: 190px;
  padding: 36px 38px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(circle at 92% 8%, rgb(58 139 183 / 10%), transparent 17rem), var(--surface);
  color: var(--ink-900);
  box-shadow: var(--shadow-sm);
}
.eyebrow,
.feed-heading p {
  margin: 0;
  color: var(--sea-700);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.6px;
}
.updates-hero h1 {
  margin: 6px 0 10px;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.updates-hero p:last-child {
  max-width: 610px;
  margin: 0;
  color: var(--ink-500);
}
.updates-hero button,
.submit-button {
  padding: 12px 18px;
  border: 1px solid var(--sea-900);
  border-radius: 10px;
  background: var(--sea-900);
  color: white;
  cursor: pointer;
  font-weight: 800;
  white-space: nowrap;
  transition:
    transform 0.2s,
    background 0.2s;
}
.updates-hero button:hover,
.submit-button:hover {
  transform: translateY(-1px);
  background: var(--sea-700);
}
.safety-notice,
.success-message {
  margin-top: 16px;
  padding: 14px 17px;
  border: 1px solid #eadfbf;
  border-radius: 12px;
  background: #fffaf0;
  color: #715d28;
}
.safety-notice p {
  display: inline;
  margin-left: 8px;
}
.update-form,
.feed-section {
  margin-top: 22px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.form-title,
.feed-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.form-title span,
.form-title small {
  color: var(--ink-500);
  font-size: 12px;
}
.form-title h2,
.feed-heading h2 {
  margin: 4px 0 0;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 20px;
}
label {
  color: var(--ink-700);
  font-size: 13px;
  font-weight: 700;
}
input,
select,
textarea {
  width: 100%;
  margin-top: 7px;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f8fafb;
  color: var(--ink-900);
  font: inherit;
}
input:focus,
select:focus,
textarea:focus {
  border-color: var(--sea-600);
  background: white;
  outline: 3px solid rgb(58 139 183 / 10%);
}
.message-field {
  position: relative;
  display: block;
  margin-top: 14px;
}
textarea {
  min-height: 110px;
  resize: vertical;
}
.message-field > span {
  position: absolute;
  right: 12px;
  bottom: 10px;
  color: #80919a;
  font-size: 11px;
}
.submit-button {
  width: 100%;
  margin-top: 14px;
  border: 0;
}
.success-message {
  background: #e8f7ee;
  color: #26724c;
}
.feed-heading p {
  color: var(--sea-700);
}
.feed-heading select {
  width: 190px;
  margin: 0;
}
.update-list {
  display: grid;
  gap: 13px;
  margin-top: 18px;
}
.update-card {
  padding: 20px;
  border: 1px solid #e0e8ea;
  border-radius: 14px;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.update-card:hover {
  border-color: #bdd6d6;
  box-shadow: var(--shadow-sm);
}
.update-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.update-card time {
  color: #80919a;
  font-size: 12px;
}
.condition-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
}
.condition-tags span {
  padding: 6px 9px;
  border-radius: 999px;
  border: 1px solid #dcebea;
  background: var(--sea-50);
  color: #3b676c;
  font-size: 12px;
}
.update-message {
  margin: 14px 0;
  color: var(--ink-700);
  line-height: 1.7;
}
.update-card footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e8eef0;
  color: #687e88;
  font-size: 12px;
}
.avatar {
  display: grid;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--sea-100);
  color: var(--sea-700);
  font-weight: 800;
  place-items: center;
}
.empty-message {
  margin: 22px 0 0;
  padding: 30px;
  border-radius: 11px;
  background: #f5f8f9;
  color: #728690;
  text-align: center;
}

@media (max-width: 700px) {
  .updates-page {
    width: calc(100% - 20px);
    padding-top: 18px;
  }
  .updates-hero,
  .form-title,
  .feed-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .updates-hero {
    padding: 25px 21px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .feed-heading select {
    width: 100%;
  }
  .safety-notice p {
    display: block;
    margin: 5px 0 0;
  }
}
</style>
