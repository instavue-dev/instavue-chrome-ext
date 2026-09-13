<script>
import { ref, reactive, computed } from 'vue'

// setup() returning state (inspectable even in a default production build)
export default {
  name: 'Counter',
  props: {
    start: { type: Number, default: 0 },
  },
  setup(props) {
    const count = ref(props.start)
    const step = ref(1)
    const history = reactive([])
    const double = computed(() => count.value * 2)
    const isEven = computed(() => count.value % 2 === 0)

    function change(direction) {
      count.value += direction * step.value
      history.push(count.value)
      if (history.length > 8) history.shift()
    }

    return { count, step, history, double, isEven, change }
  },
}
</script>

<template>
  <div class="widget">
    <h3 class="widget__title">Counter <small>setup()</small></h3>
    <div class="counter">
      <button class="button button--ghost" @click="change(-1)">−</button>
      <span class="counter__value" :class="{ 'counter__value--even': isEven }">{{ count }}</span>
      <button class="button button--ghost" @click="change(1)">+</button>
    </div>
    <p class="muted">double: {{ double }} · step: {{ step }}</p>
    <p class="muted counter__history">history: {{ history.length ? history.join(' → ') : '–' }}</p>
  </div>
</template>
