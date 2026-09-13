# InstaVue – debug VueJS app in an instant

Chrome extension that works like an X-ray for a Vue 2 application: click the
toolbar icon and it overlays every component on the page, lets you browse the
component tree, and inspect / edit props, data, computed, injected, `$route`
and Vuex getters – even on production builds without Vue Devtools hooks.

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
| `src/**` (all `.js` and `.vue` files) | **Original source**, byte-for-byte as embedded in the v2.3 source map |
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

`popup-old.js` is the previous Manifest V2 injector kept for reference; it is
not referenced by the manifest.
