<script setup>
import { inject } from 'vue'

const extension = inject('extension')
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <span>{{ extension.name }} · {{ year }}</span>
    <span>
      <a :href="extension.repoUrl" target="_blank" rel="noopener">Source</a> ·
      <a :href="extension.storeUrl" target="_blank" rel="noopener">Chrome Web Store</a> ·
      <a href="https://enloop.md" target="_blank" rel="noopener">enloop.md — manage human context</a>
    </span>
  </footer>
</template>
