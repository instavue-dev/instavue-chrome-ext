import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Serves / bundles the extension build (../ext/insta-vue.{js,css}) next to the
// site so the page can inject it itself - no installed extension needed.
function instaVueAssets() {
  const extDir = path.resolve(__dirname, '../ext')
  const files = ['insta-vue.js', 'insta-vue.css']
  const missing = name => `${name} not found in ext/ - run "npm run build" in the repository root first`

  return {
    name: 'instavue-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = files.find(f => req.url.split('?')[0] === '/' + f)
        if (!name) return next()

        const file = path.join(extDir, name)
        if (!fs.existsSync(file)) {
          res.statusCode = 404
          res.end(missing(name))
          return
        }

        res.setHeader('Content-Type', name.endsWith('.css') ? 'text/css' : 'application/javascript')
        res.setHeader('Cache-Control', 'no-store')
        fs.createReadStream(file).pipe(res)
      })
    },
    generateBundle() {
      for (const name of files) {
        const file = path.join(extDir, name)
        if (!fs.existsSync(file)) throw new Error(missing(name))
        this.emitFile({ type: 'asset', fileName: name, source: fs.readFileSync(file) })
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [
    // prodDevtools keeps <script setup> templates un-inlined in the production
    // build, so InstaVue can still show setup state. See ../docs/vue3.md.
    vue({ features: { prodDevtools: true } }),
    instaVueAssets(),
  ],
})
