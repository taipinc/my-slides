import type { MarkdownTransformContext } from '@slidev/types'

function replaceAsciiArrows(context: MarkdownTransformContext) {
  const source = context.s.toString()
  const sections = source.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/)
  let offset = 0

  for (let index = 0; index < sections.length; index++) {
    const section = sections[index]

    if (index % 2 === 0) {
      const inlineSections = section.split(/(`[^`]*`)/)
      let inlineOffset = offset

      for (let inlineIndex = 0; inlineIndex < inlineSections.length; inlineIndex++) {
        const inlineSection = inlineSections[inlineIndex]

        if (inlineIndex % 2 === 0) {
          for (const match of inlineSection.matchAll(/->/g))
            context.s.overwrite(inlineOffset + match.index, inlineOffset + match.index + 2, '→')
        }

        inlineOffset += inlineSection.length
      }
    }

    offset += section.length
  }
}

export default () => ({
  pre: [replaceAsciiArrows],
})
