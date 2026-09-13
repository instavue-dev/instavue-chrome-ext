<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  feature: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

const expanded = ref(false)
const shortDescription = computed(() => {
  const text = props.feature.description
  return text.length > 70 && !expanded.value ? text.slice(0, 70).trimEnd() + '…' : text
})
</script>

<template>
  <article class="card" :style="{ '--delay': index * 40 + 'ms' }" @click="expanded = !expanded">
    <div class="card__icon">{{ feature.icon }}</div>
    <h3 class="card__title">{{ feature.title }}</h3>
    <p class="card__text">{{ shortDescription }}</p>
    <div class="card__tags">
      <span v-for="tag in feature.tags" :key="tag" class="chip chip--muted">{{ tag }}</span>
    </div>
  </article>
</template>
