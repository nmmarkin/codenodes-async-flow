---
# You can also start simply with 'default'
theme: seriph
colorSchema: light
# random image from a curated Unsplash collection by Anthony
# like them? see https://unsplash.com/collections/94734566/slidev
# background: https://cover.sli.dev
# background: https://images.unsplash.com/photo-1621188200014-0a4c30bbecd5
background: https://images.unsplash.com/photo-1589786682914-3e3d2c71ce43
# some information about your slides (markdown enabled)
title: Async flow control in Node.js
info: |
  ## CodeNodes event presentation
# apply unocss classes to the current slide
class: text-center
# https://sli.dev/features/drawing
drawings:
  persist: false
# slide transition: https://sli.dev/guide/animations.html#slide-transitions
# transition: slide-left
transition: slide-up
# enable MDC Syntax: https://sli.dev/features/mdc
mdc: true
---

# Async flow control

Managing async operations in Node.js goes beyond using promises and async/await

<style>
.slidev-layout  {
  text-shadow: 1px 1px 0px rgb(0, 0, 0);
}
.slidev-layout h1 + p  {
  font-size: 30px;
  width: 70%;
  margin: 0 auto;
  opacity: 0.6;
}
</style>

---
src: ./pages/02-introduction.md
hide: false
layout: two-cols-header
transition: slide-left
---
---
src: ./pages/03-agenda.md
hide: false
layout: two-cols-header
layoutClass: gap-16
---
---
src: ./pages/04-overview.md
hide: false
transition: slide-left
---
---
src: ./pages/05-dimensions.md
hide: false
---
---
src: ./pages/06-scenarios.md
hide: false
transition: slide-left
---
---
src: ./pages/07-boundaries.md
hide: false
---
---
src: ./pages/08-threads.md
hide: false
transition: slide-left
---
---
src: ./pages/09-streams.md
hide: false
---
---
src: ./pages/10-parallel-processing.md
hide: false
transition: slide-left
---
---
src: ./pages/11-conclusions.md
hide: false
---
---
src: ./pages/12-end.md
layout: two-cols-header
layoutClass: gap-x-8
hide: false
---
