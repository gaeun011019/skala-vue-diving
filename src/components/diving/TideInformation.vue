<script setup>
defineProps({
  tide: {
    type: Object,
    required: true,
  },

  current: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="tide-information">
    <div class="tide-summary">
      <div class="summary-item">
        <span>오늘의 물때</span>
        <strong>{{ tide.tideNumber }}물</strong>
      </div>

      <div class="summary-item">
        <span>음력 날짜</span>
        <strong>{{ tide.lunarDate }}</strong>
      </div>

      <div class="summary-item">
        <span>조류 세기</span>
        <strong>{{ current.strength }}%</strong>
      </div>
    </div>

    <div class="strength-section">
      <div class="strength-heading">
        <span>조류 세기</span>
        <strong>{{ current.strength }}%</strong>
      </div>

      <div class="strength-track">
        <div
          class="strength-value"
          :style="{
            width: `${current.strength}%`,
          }"
        ></div>
      </div>
    </div>

    <div class="tide-events">
      <article v-for="event in tide.events" :key="event.id" class="tide-event" :class="event.type">
        <div class="event-marker">
          <span v-if="event.type === 'high'"> ▲ </span>

          <span v-else>▼</span>
        </div>

        <div class="event-content">
          <span class="event-label">
            {{ event.label }}
          </span>

          <strong class="event-time">
            {{ event.time }}
          </strong>
        </div>

        <div class="event-height">
          <span>조위</span>

          <strong>
            {{ event.height > 0 ? '+' : '' }}
            {{ event.height }}cm
          </strong>
        </div>
      </article>
    </div>

    <div class="current-information">
      <div class="current-icon">🧭</div>

      <div>
        <span>조류 정보</span>

        <strong> {{ current.speed }}m/s · {{ current.direction }} 방향 </strong>
      </div>
    </div>

    <p class="notice">
      물때와 조류는 서로 관련되지만 서로 다른 정보입니다. 표시된 값은 학습용 Mockup 데이터입니다.
    </p>
  </section>
</template>

<style scoped>
.tide-information {
  margin-top: 12px;
}

.tide-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.summary-item {
  padding: 11px;
  border-radius: 8px;
  background: #f3f0ff;
  text-align: center;
}

.summary-item span,
.summary-item strong {
  display: block;
}

.summary-item span {
  margin-bottom: 5px;
  color: #756c91;
  font-size: 12px;
}

.summary-item strong {
  color: #44376c;
  font-size: 15px;
}

.strength-section {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f7f5ff;
}

.strength-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #534879;
  font-size: 13px;
}

.strength-track {
  height: 10px;
  overflow: hidden;
  border-radius: 10px;
  background: #ded8ef;
}

.strength-value {
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg, #7cd4c7, #ffd166, #ef6f6c);
  transition: width 0.3s;
}

.tide-events {
  position: relative;
  display: grid;
  gap: 9px;
  margin-top: 14px;
  padding-left: 14px;
}

.tide-events::before {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 27px;
  width: 2px;
  background: #d8d2e8;
  content: '';
}

.tide-event {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 1px solid transparent;
  border-radius: 9px;
}

.tide-event.high {
  border-color: #f1a2ad;
  background: #fff0f2;
}

.tide-event.low {
  border-color: #91b9eb;
  background: #eef6ff;
}

.event-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  font-size: 12px;
}

.high .event-marker {
  background: #d84a61;
}

.low .event-marker {
  background: #397bcc;
}

.event-content span,
.event-content strong,
.event-height span,
.event-height strong {
  display: block;
}

.event-label {
  margin-bottom: 3px;
  color: #66717c;
  font-size: 12px;
}

.event-time {
  font-size: 18px;
}

.event-height {
  text-align: right;
}

.event-height span {
  margin-bottom: 3px;
  color: #66717c;
  font-size: 11px;
}

.event-height strong {
  font-size: 13px;
}

.current-information {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 13px;
  border-radius: 9px;
  background: #e8f7f5;
}

.current-icon {
  font-size: 28px;
}

.current-information span,
.current-information strong {
  display: block;
}

.current-information span {
  margin-bottom: 4px;
  color: #54736e;
  font-size: 12px;
}

.current-information strong {
  color: #1e645a;
}

.notice {
  margin: 12px 0 0;
  color: #718079;
  font-size: 11px;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .tide-summary {
    grid-template-columns: 1fr;
  }
}
</style>
