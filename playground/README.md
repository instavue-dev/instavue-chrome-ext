# InstaVue playground

A Vue 3 site that lets you try [InstaVue](../README.md) without installing the
extension: the **Activate InstaVue** button injects `insta-vue.js` +
`insta-vue.css` from the extension build into the page - exactly what the
extension's popup does through `chrome.scripting`.

All content is component state, so there is something to inspect and edit:

| Component | Style | State to look at |
|---|---|---|
| `App` | `<script setup>` | `extension` (name, tagline, version…), `features`, `steps` |
| `SiteHeader` | Options API | props `name`, `version`, `links`; data `scrolled`; computed `label` |
| `HeroSection` → `ActivateButton` | `<script setup>` | injected `extension`, `active`, `activations` |
| `FeatureGrid` → `FeatureCard` | Options API → `<script setup>` | `filter` / `visibleFeatures`; props `feature`, `index`, `expanded` |
| `HowItWorks` | Options API | `current`, `currentStep` |
| `LivePlayground` → `Counter`, `TodoList` → `TodoItem` | Options API, `setup()` | `theme` (provided), `count`/`step`/`history`, `items`/`remaining`, injected `theme` |

```sh
# in the repository root: build the extension first
npm run build

cd playground
npm install
npm run dev       # dev server, serves ../ext/insta-vue.{js,css} on the fly
npm run build     # static site in dist/ with the extension assets copied in
```

The Vite config enables `features.prodDevtools`, which keeps `<script setup>`
templates un-inlined in the production build so their state stays visible to
InstaVue - the staging setup described in [docs/vue3.md](../docs/vue3.md).
