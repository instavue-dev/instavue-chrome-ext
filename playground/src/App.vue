<script setup>
import { reactive, provide } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import HeroSection from './components/HeroSection.vue'
import FeatureGrid from './components/FeatureGrid.vue'
import HowItWorks from './components/HowItWorks.vue'
import LivePlayground from './components/LivePlayground.vue'
import SiteFooter from './components/SiteFooter.vue'

// Everything on the page is rendered from this state. Activate InstaVue,
// select "App" in the panel and double-click any value to change it.
const extension = reactive({
  name: 'InstaVue',
  tagline: 'Debug a VueJS app in an instant',
  description: 'Like an X-ray for Vue applications: overlays every component on the page, shows its data and lets you edit it in place. Even in production.',
  version: '2.4',
  storeUrl: 'https://chromewebstore.google.com/detail/nbkmhgpijnbbmfdjpmnebmgkdoiocglc',
  repoUrl: 'https://github.com/instavue-dev/instavue-chrome-ext',
  frameworks: ['Vue 2', 'Vue 3'],
})

const features = reactive([
  {
    id: 'overlay',
    icon: '🩻',
    title: 'Component X-ray',
    description: 'Every component gets an outline and a label right on the page. Hover to highlight, click to select.',
    tags: ['Vue 2', 'Vue 3'],
  },
  {
    id: 'tree',
    icon: '🌳',
    title: 'Component tree',
    description: 'The whole hierarchy in a panel, with a filter, breadcrumbs to the parents and a switch to hide invisible components.',
    tags: ['Vue 2', 'Vue 3'],
  },
  {
    id: 'state',
    icon: '🔍',
    title: 'Props, data, computed, setup state',
    description: 'Inspect props, data(), setup() refs and reactive objects, computed values, injected values, $route and $attrs.',
    tags: ['Vue 2', 'Vue 3'],
  },
  {
    id: 'edit',
    icon: '✏️',
    title: 'Edit in place',
    description: 'Double-click a value to change it. The component re-renders immediately - no rebuild, no console.',
    tags: ['Vue 2', 'Vue 3'],
  },
  {
    id: 'pin',
    icon: '📌',
    title: 'Pin & ignore',
    description: 'Pin the components and variables you care about, hide the ones you do not. Remembered per site.',
    tags: ['Vue 2', 'Vue 3'],
  },
  {
    id: 'prod',
    icon: '🏭',
    title: 'Works in production',
    description: 'No devtools hook needed. Reads the runtime the way Vue itself does, so minified builds are inspectable too.',
    tags: ['Vue 2', 'Vue 3'],
  },
])

const steps = reactive([
  { title: 'Activate', text: 'Click the extension icon - or the button on this page, which injects the very same script.' },
  { title: 'Explore', text: 'Hover the page to highlight components, or pick one from the tree in the panel.' },
  { title: 'Inspect', text: 'Selected component shows its state grouped by kind: p = prop, d = data, s = setup, c = computed.' },
  { title: 'Modify', text: 'Double-click a value, enter a new one and watch the page update.' },
])

provide('extension', extension)
</script>

<template>
  <SiteHeader :name="extension.name" :version="extension.version" :links="{ store: extension.storeUrl, repo: extension.repoUrl }" />

  <main>
    <HeroSection :extension="extension" />
    <FeatureGrid :features="features" />
    <HowItWorks :steps="steps" />
    <LivePlayground />
  </main>

  <SiteFooter />
</template>
