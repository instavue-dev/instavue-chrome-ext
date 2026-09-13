<script setup>
import { ref, inject, onMounted, onBeforeUnmount } from 'vue'
import { activateInstaVue, watchInstaVue } from '../instavue'

const extension = inject('extension')
const active = ref(false)
const activations = ref(0)

let stopWatching = () => {}

onMounted(() => {
  stopWatching = watchInstaVue(value => { active.value = value })
})

onBeforeUnmount(() => stopWatching())

function activate() {
  activations.value++
  activateInstaVue()
}
</script>

<template>
  <button class="button button--primary" :disabled="active" @click="activate">
    <template v-if="active">✓ {{ extension.name }} is active - see the panel</template>
    <template v-else>Activate {{ extension.name }}</template>
  </button>
</template>
