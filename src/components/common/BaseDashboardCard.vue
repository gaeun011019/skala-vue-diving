<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '📋',
  },
})
</script>

<template>
  <section class="dashboard-card">
    <header class="card-header">
      <h2>{{ icon }} {{ title }}</h2>
    </header>

    <div class="card-content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.dashboard-card {
  margin-top: 18px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.card-header {
  margin-bottom: 16px;
}

.card-header h2 {
  margin: 0;
  color: var(--ink-900);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.card-content {
  width: 100%;
}

@media (max-width: 700px) {
  .dashboard-card {
    padding: 18px;
    border-radius: 16px;
  }
}
</style>
