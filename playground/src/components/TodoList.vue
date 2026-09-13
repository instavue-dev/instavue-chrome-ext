<script>
import TodoItem from './TodoItem.vue'

// Options API with data(), computed and a child component per item
export default {
  name: 'TodoList',
  components: { TodoItem },
  data() {
    return {
      title: 'Things to try',
      draft: '',
      items: [
        { id: 1, text: 'Hover a component on the page', done: false },
        { id: 2, text: 'Select App and edit extension.name', done: false },
        { id: 3, text: 'Pin the Counter component', done: false },
      ],
    }
  },
  computed: {
    remaining() {
      return this.items.filter(item => !item.done).length
    },
  },
  methods: {
    add() {
      const text = this.draft.trim()
      if (!text) return
      this.items.push({ id: Date.now(), text, done: false })
      this.draft = ''
    },
    remove(id) {
      this.items = this.items.filter(item => item.id !== id)
    },
  },
}
</script>

<template>
  <div class="widget">
    <h3 class="widget__title">{{ title }} <small>{{ remaining }} left</small></h3>
    <ul class="todos">
      <TodoItem v-for="(item, index) in items" :key="item.id" :todo="item" :index="index" @remove="remove" />
    </ul>
    <form class="todos__add" @submit.prevent="add">
      <input v-model="draft" class="input" placeholder="Add one…" />
      <button class="button button--ghost" type="submit">Add</button>
    </form>
  </div>
</template>
