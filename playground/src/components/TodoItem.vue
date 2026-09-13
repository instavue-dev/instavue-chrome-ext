<script>
// Options API with props, inject, data and computed
export default {
  name: 'TodoItem',
  props: {
    todo: { type: Object, required: true },
    index: { type: Number, required: true },
  },
  inject: ['theme'],
  emits: ['remove'],
  data() {
    return {
      hovered: false,
    }
  },
  computed: {
    label() {
      return `${this.index + 1}. ${this.todo.text}`
    },
    currentTheme() {
      return this.theme()
    },
  },
}
</script>

<template>
  <li class="todo" :class="{ 'todo--done': todo.done, 'todo--hovered': hovered }" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <label>
      <input v-model="todo.done" type="checkbox" />
      <span>{{ label }}</span>
    </label>
    <button v-show="hovered" class="todo__remove" title="Remove" @click="$emit('remove', todo.id)">×</button>
  </li>
</template>
