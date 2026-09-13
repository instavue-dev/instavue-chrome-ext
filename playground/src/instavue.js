// Injects the InstaVue build into this page - the same thing the extension's
// popup.js does with chrome.scripting, minus the extension.

const CONTAINER_ID = 'insta_vue_container'

export function isInstaVueActive() {
  return !!document.getElementById(CONTAINER_ID)
}

export function activateInstaVue() {
  if (isInstaVueActive()) {
    return
  }

  if (!document.querySelector('link[data-instavue]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${import.meta.env.BASE_URL}insta-vue.css`
    link.dataset.instavue = ''
    document.head.appendChild(link)
  }

  // A fresh <script> element runs the bundle again, which mounts a new panel
  document.querySelectorAll('script[data-instavue]').forEach(s => s.remove())
  const script = document.createElement('script')
  script.src = `${import.meta.env.BASE_URL}insta-vue.js?t=${Date.now()}`
  script.dataset.instavue = ''
  document.head.appendChild(script)
}

/**
 * Calls `callback(active)` now and whenever the InstaVue panel appears or is closed.
 * Returns a function that stops watching.
 */
export function watchInstaVue(callback) {
  let last = isInstaVueActive()
  callback(last)

  const observer = new MutationObserver(() => {
    const active = isInstaVueActive()
    if (active !== last) {
      last = active
      callback(active)
    }
  })
  observer.observe(document.body, { childList: true })

  return () => observer.disconnect()
}
