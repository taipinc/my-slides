// Rendering/navigation reports only: this bridge exposes no file operations.
(() => {
  let last = ''
  let scheduled = false
  const report = () => {
    scheduled = false
    const error = document.querySelector('vite-error-overlay')
    const slide = document.querySelector('#slide-content .slidev-layout')
    if (!error && !slide) return
    const path = location.hash.startsWith('#/') ? location.hash.slice(1) : location.pathname
    const number = Number(path.split('/')[1]) || 1
    const bounds = document.querySelector('#slide-content')?.getBoundingClientRect()
    const state = JSON.stringify({
      type: error ? 'error' : 'rendered',
      slide: number,
      width: Math.round(bounds?.width || 0),
      height: Math.round(bounds?.height || 0),
    })
    if (state !== last) {
      last = state
      window.ipc.postMessage(state)
    }
  }
  const schedule = () => {
    if (!scheduled) {
      scheduled = true
      setTimeout(report, 150)
    }
  }
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true })
    new ResizeObserver(schedule).observe(document.documentElement)
    schedule()
  })
  addEventListener('hashchange', schedule)
  addEventListener('popstate', schedule)
  addEventListener('message', event => {
    if (event.source === window && event.origin === location.origin && event.data?.target === 'slidev' && event.data.navState)
      schedule()
  })
})()
