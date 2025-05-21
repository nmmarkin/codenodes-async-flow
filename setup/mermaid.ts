import { defineMermaidSetup } from '@slidev/types'

export default defineMermaidSetup(() => {
  return {
    theme: 'default',
    themeCSS: `
      .section-edge-0:nth-child(1),
      .section-edge-0:nth-child(2),
      .section-edge-0:nth-child(3),
      .section-edge-0:nth-child(4), 
      .section-edge-0:nth-child(9),
      .section-edge-0:nth-child(10) {
        stroke: #ff9900 !important;
      }
      .highlight.section-0 rect, .highlight.section-0 path, .highlight.section-0 circle, .highlight.section-0 polygon, .highlight.section-0 path  {
        fill: #ffe0cc !important;
        stroke: #ff9900 !important;
        stroke-width: 5px !important;
      }`
  }
});