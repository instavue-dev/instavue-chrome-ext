<script>
// Options API component
export default {
  name: 'SiteHeader',
  props: {
    name: { type: String, required: true },
    version: { type: String, default: '' },
    links: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      scrolled: false,
    }
  },
  computed: {
    label() {
      return this.version ? `${this.name} v${this.version}` : this.name
    },
  },
  mounted() {
    this.onScroll = () => { this.scrolled = window.scrollY > 10 }
    window.addEventListener('scroll', this.onScroll, { passive: true })
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  },
}
</script>

<template>
  <header class="site-header" :class="{ 'site-header--scrolled': scrolled }">
    <a href="#" class="site-header__brand">
      <span class="site-header__logo">⚡</span>
      {{ label }}
    </a>
    <nav class="site-header__nav">
      <a href="#features">Features</a>
      <a href="#how">How it works</a>
      <a href="#playground">Playground</a>
      <a v-if="links.repo" :href="links.repo" target="_blank" rel="noopener">GitHub</a>
      <a v-if="links.store" :href="links.store" target="_blank" rel="noopener" class="button button--small">Install</a>
    </nav>
  </header>
</template>
