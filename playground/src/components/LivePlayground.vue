<script>
import Counter from './Counter.vue'
import TodoList from './TodoList.vue'

// Options API component with provide()
export default {
  name: 'LivePlayground',
  components: { Counter, TodoList },
  data() {
    return {
      theme: 'light',
    }
  },
  provide() {
    return {
      // reactive: TodoItem injects it
      theme: () => this.theme,
    }
  },
}
</script>

<template>
  <section id="playground" class="section">
    <div class="section__head">
      <h2>Live playground</h2>
      <label class="switch">
        <input v-model="theme" type="checkbox" true-value="dark" false-value="light" />
        dark cards
      </label>
    </div>
    <p class="muted">
      Two small components with their own state. Select one in the InstaVue panel and edit
      <code>count</code>, <code>step</code> or a todo's <code>text</code>.
    </p>

    <div class="playground" :class="'playground--' + theme">
      <Counter :start="5" />
      <TodoList />
    </div>
  </section>
</template>
