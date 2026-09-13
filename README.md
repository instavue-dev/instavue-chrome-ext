# InstaVue – debug VueJS app in an instant

Chrome extension that works like an X-ray for a Vue application: click the
toolbar icon and it overlays every component on the page, lets you browse the
component tree, and inspect / edit props, data, setup state, computed,
injected, `$route` and Vuex getters – even on production builds without Vue
Devtools hooks.

Supports **Vue 2** and **Vue 3** (Options API, `setup()`, `<script setup>`),
both can be on the same page. See [docs/vue3.md](docs/vue3.md) for what a Vue 3
production build hides and how to expose it in a staging build.

Web Store: https://chromewebstore.google.com/detail/nbkmhgpijnbbmfdjpmnebmgkdoiocglc

## ⚠️ This is a restored codebase, not the original repository

The original sources were lost. Everything in `src/` was recovered from the
source map (`insta-vue.js.map`, which embedded `sourcesContent`) shipped with
the published **v2.3** build of the extension. Static extension files in
`public/` (`manifest.json`, `popup.html`, `popup.js`, `popup-old.js`,
`icon-128.png`) were taken verbatim from the same package.

What is original and what is reconstructed:

| Part | Status |
|---|---|
| `src/**` (all `.js` and `.vue` files) | **Original source**, byte-for-byte as embedded in the v2.3 source map (the initial commit; Vue 3 support was added on top afterwards) |
| `public/popup.html`, `popup.js`, `popup-old.js`, `icon-128.png` | **Original**, copied from the published package |
| `public/manifest.json` | Original content, re-formatted; the `key` and `update_url` fields that the Web Store injects were dropped |
| `package.json`, `vue.config.js`, `babel.config.js`, `.gitignore`, this README | **Reconstructed** – the build config was never in the bundle and was inferred from it |

The rebuilt bundle was verified against the published one: every `src/`
module (sources, compiled templates, style blocks) in the rebuilt source map is
identical to the published map, and the extension was smoke-tested on a Vue 2.7
page (component tree, canvas overlay, inspector, pin/ignore all work).

## Build

Requirements: Node 16+ (tested with Node 24), npm.

```sh
npm install
npm run build        # production build -> ext/
npm run serve        # rebuild on change (development mode)
npm run zip          # build + zip ext/ for the Web Store (source map excluded)
```

Then load `ext/` as an unpacked extension via `chrome://extensions` →
*Developer mode* → *Load unpacked*.

`ext/` is fully generated (it is git-ignored): `src/` is compiled into
`ext/insta-vue.js` + `ext/insta-vue.css`, and `public/` is copied in alongside.

## Playground site

`playground/` is a small Vue 3 site (Vite) that doubles as a demo: every piece
of content on it - extension name, feature list, steps, the counter and todo
widgets - is component state, and an **Activate InstaVue** button injects the
extension build into the page the same way the popup does, so no installed
extension is needed. Use it to try the tool or to reproduce issues.

```sh
npm run build              # the site serves ../ext/insta-vue.{js,css}
cd playground && npm install
npm run dev                # http://localhost:5173
npm run build              # static site in playground/dist, extension assets included
```

Or from the repo root: `npm run playground` / `npm run playground:build`.

Live: **https://instavue-dev.github.io/instavue-chrome-ext/** — deployed by
`.github/workflows/pages.yml` on every push to `main`.
The site is built with `features.prodDevtools` so `<script setup>` state stays
inspectable in the production build (see [docs/vue3.md](docs/vue3.md)).

## Known build caveats

These are consequences of reconstructing the toolchain; none affect
functionality, but be aware of them:

* **Old toolchain.** The published build was made with webpack 4 / Vue CLI
  (`cache-loader`, `(webpack)/buildin/*` shims appear in the map), so this repo
  pins `@vue/cli-service` 4.5 and webpack 4. On Node 17+ webpack 4 needs the
  legacy OpenSSL provider; the npm scripts already set
  `NODE_OPTIONS=--openssl-legacy-provider`. `npm install` prints a wall of
  deprecation warnings (Vue 2 is EOL, `request`, `@hapi/*`, …) – expected.
* **Not byte-identical output.** The bundle you build is ~234 KB vs ~277 KB
  for the published one. The difference is entirely in `node_modules` code:
  the original was built with a wider `browserslist` (it contains ~115 extra
  `core-js` polyfills and `@babel/runtime` class helpers, suggesting an
  IE11-era Vue CLI 3 default target). `browserslist` here is Vue CLI's
  `> 1%, last 2 versions, not dead`. Since this only ever runs inside Chrome,
  the smaller output is fine. The minified CSS also differs by one
  `transition` shorthand merge done by a newer cssnano.
* **Template whitespace.** The original build stripped whitespace-only text
  nodes but kept newlines inside text (the legacy `preserveWhitespace: false`
  compiler option, Vue CLI 3 default). `vue.config.js` sets that explicitly so
  the compiled render functions match the published ones exactly.
* **Dependency versions** were read from the bundle: Vue 2.7.16, Vuex 3.6.2,
  vuex-persist 2.x (the lodash-based line – 3.x switched to `deepmerge`),
  lodash 4.17.21, core-js 3.41. `path-browserify` / `process` are pulled in
  automatically by webpack 4's Node polyfills for the `path` import in
  `src/app/util/VueUtil.js`; if you ever migrate to webpack 5 you will need to
  add `path-browserify` explicitly.
* **No lockfile from the original project.** `package-lock.json` in this repo
  is from the restoration build.

## How it works

`popup.js` (MV3, `chrome.scripting`) injects `insta-vue.js` and
`insta-vue.css` into the active tab as page-context resources
(`web_accessible_resources`). `src/main.js` then mounts a Vue app with a
Vuex store (persisted to `localStorage` via `vuex-persist`) into a
`#insta_vue_container` node. `src/app/inject.js` walks the DOM (including
shadow roots) for `__vue__` roots, and `src/app/InstaVue.js` draws the
component overlay on a full-page `<canvas>` and handles hover/click
selection. `src/app/util/VueUtil.js` is adapted from the Vue Devtools backend
to extract instance state; `src/external/tree-view/` is an adapted
`vue-json-tree-view` used to render and edit that state.

Data collection is behind an adapter per framework
(`src/app/adapters/Vue2Adapter.js`, `Vue3Adapter.js`); the UI, overlay and
inspector only ever see `InstaComponent` objects. `Vue2Adapter` is the original
collection code (formerly `src/app/util/VueUtil.js`).

`popup-old.js` is the previous Manifest V2 injector kept for reference; it is
not referenced by the manifest.
