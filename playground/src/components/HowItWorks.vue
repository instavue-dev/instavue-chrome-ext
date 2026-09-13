<script>
// Options API component
export default {
  name: 'HowItWorks',
  props: {
    steps: { type: Array, required: true },
  },
  data() {
    return {
      current: 0,
    }
  },
  computed: {
    currentStep() {
      return this.steps[this.current] || null
    },
  },
  methods: {
    select(index) {
      this.current = index
    },
  },
}
</script>

<template>
  <section id="how" class="section">
    <h2>How it works</h2>

    <ol class="steps">
      <li v-for="(step, index) in steps" :key="step.title" :class="{ 'steps__item--active': index === current }" @mouseenter="select(index)" @click="select(index)">
        <span class="steps__number">{{ index + 1 }}</span>
        <div>
          <strong>{{ step.title }}</strong>
          <p>{{ step.text }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>
