<script setup>
import ActivateButton from './ActivateButton.vue'

defineProps({
  extension: { type: Object, required: true },
})
</script>

<template>
  <section class="hero">
    <p class="hero__eyebrow">
      Playground · works with
      <span v-for="framework in extension.frameworks" :key="framework" class="chip">{{ framework }}</span>
    </p>
    <h1 class="hero__title">{{ extension.name }}</h1>
    <p class="hero__tagline">{{ extension.tagline }}</p>
    <p class="hero__description">{{ extension.description }}</p>

    <div class="hero__actions">
      <ActivateButton />
      <a :href="extension.storeUrl" target="_blank" rel="noopener" class="button button--ghost">Get the extension</a>
    </div>

    <p class="hero__hint">
      This page is a Vue 3 app. Activate {{ extension.name }} without installing anything, then hover around,
      pick <code>App</code> in the panel and double-click a value - the name above included.
    </p>
  </section>
</template>
