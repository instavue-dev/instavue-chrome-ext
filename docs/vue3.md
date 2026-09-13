# Vue 3 support

InstaVue detects Vue 2 and Vue 3 apps on the same page and shows the
framework and version next to the title. The UI, overlay and inspector are
shared; only data collection differs, via `src/app/adapters/`:

| | `Vue2Adapter` | `Vue3Adapter` |
|---|---|---|
| Root discovery | `el.__vue__` | `el.__vue_app__` → `app._instance` (dev) or `container._vnode.component` (prod) |
| Tree walk | `instance.$children` | `instance.subTree` vnodes (components, fragments, Teleport, Suspense) |
| Root elements | `instance.$el` | all top-level element vnodes (multi-root components get a union rect and a `+n` label) |
| Element → component | `el.__vue__` | `el.__insta_vue__` set while walking; `el.__vueParentComponent` in dev |
| Name | `name`, `_componentTag`, `__file` | `name`, `__name`, `displayName`, registration name in the parent/app `components`, `__file` |
| State | props, data, computed, inject, `$route`, `$attrs` | props, `data()`, **setup state** (refs / reactive / `computed()`), options computed, inject, `$route`, `$attrs` |
| Write (dblclick a value) | `instance[key] = v` | `setupState[key] = v` (assigns through refs) or `proxy[key] = v` |

Everything in the Vue 3 column is read from properties the production
runtime always has (`__vue_app__`, `_vnode`, `subTree`, `parent`, `props`,
`data`, `setupState`, `proxy`), so InstaVue works on production builds too -
with the limits below.

## What a production build hides

Verified against Vue 3.5 / `@vitejs/plugin-vue` 6 / `vue-loader` 17:

1. **`<script setup>` state is gone.** In production the SFC compiler
   *inlines the template into `setup()`*, so bindings are closure variables
   and `setupState` is empty. InstaVue shows the component, its props and
   `$attrs`, but no refs / computed. Components using `setup()` with a
   returned object, or the Options API, are unaffected.
2. **Names** come from `name`, `__name` (always emitted for `<script setup>`
   SFCs, even in prod), or the name the component was registered under.
   Options-API SFCs with no `name` that are used through `import` + local
   registration keep their registration key; anything else is
   "Anonymous Component" (`__file` is dev-only by default).
3. **Hover after re-renders**: InstaVue maps elements to components once, at
   injection. In dev Vue also stamps `el.__vueParentComponent` on every
   element, which InstaVue uses as a fallback; in prod that fallback is
   missing, so after a component swaps its root element you need to
   re-inject (click the toolbar icon again).

## Staging builds: expose the internals

Vue's own opt-in for production devtools fixes all three. It turns template
inlining off, exposes `__file`, sets `app._instance` and
`el.__vueParentComponent`, at the cost of a slightly larger bundle and
un-inlined templates. Enable it for staging builds only.

### Vite (`@vitejs/plugin-vue`)

```js
// vite.config.js
import vue from '@vitejs/plugin-vue'

const staging = process.env.STAGING === '1'

export default {
  plugins: [
    vue({
      features: { prodDevtools: staging },   // = define __VUE_PROD_DEVTOOLS__
    }),
  ],
}
```

Build with `STAGING=1 vite build`. (Setting `define: { __VUE_PROD_DEVTOOLS__: 'true' }`
has the same effect; plugin-vue reads both.)

Verified: a `<script setup>` component that shows only `props` in a default
build shows `setup: count`, `computed: doubled` and accepts edits with
`features.prodDevtools: true`.

### webpack (`vue-loader`)

`vue-loader` always inlines `<script setup>` templates when it considers the
build production (`mode === 'production'` **or** `NODE_ENV=production`) and
has no switch for it, so a staging build needs a non-production mode and no
`NODE_ENV=production` in the environment:

```js
// webpack.config.js
const { DefinePlugin } = require('webpack')

module.exports = {
  mode: process.env.STAGING ? 'none' : 'production', // `none` keeps templates un-inlined; add TerserPlugin yourself if you still want minification
  module: {
    rules: [{
      test: /\.vue$/,
      loader: 'vue-loader',
      options: { exposeFilename: true },   // __file basename in prod -> component names
    }],
  },
  plugins: [
    new DefinePlugin({
      __VUE_PROD_DEVTOOLS__: JSON.stringify(!!process.env.STAGING),
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    }),
  ],
}
```

### Nuxt 3

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vite: { vue: { features: { prodDevtools: process.env.STAGING === '1' } } },
})
```

### Without touching the build

If you can't change the build, everything except the inlined `<script setup>`
state still works: tree, overlay, props, `data()`, `setup()`-returned state,
Options API computed, inject, `$route`. Give components an explicit `name`
(or rely on `__name` from `<script setup>`) to keep readable labels.
