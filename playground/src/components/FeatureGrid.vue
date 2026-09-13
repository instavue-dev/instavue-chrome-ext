<script>
import FeatureCard from './FeatureCard.vue'

// Options API component
export default {
  name: 'FeatureGrid',
  components: { FeatureCard },
  props: {
    features: { type: Array, required: true },
  },
  data() {
    return {
      filter: '',
    }
  },
  computed: {
    visibleFeatures() {
      const filter = this.filter.trim().toLowerCase()
      if (!filter) return this.features
      return this.features.filter(f => (f.title + ' ' + f.description).toLowerCase().includes(filter))
    },
  },
}
</script>

<template>
  <section id="features" class="section">
    <div class="section__head">
      <h2>What it does</h2>
      <input v-model="filter" type="search" placeholder="Filter features…" class="input" />
    </div>

    <div class="grid">
      <FeatureCard v-for="(feature, index) in visibleFeatures" :key="feature.id" :feature="feature" :index="index" />
    </div>
    <p v-if="!visibleFeatures.length" class="muted">Nothing matches "{{ filter }}".</p>
  </section>
</template>
