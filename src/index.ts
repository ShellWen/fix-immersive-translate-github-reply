function monkeyPatchCloneContents() {
  const originalCloneContents = Range.prototype.cloneContents
  Range.prototype.cloneContents = function () {
    const result = originalCloneContents.call(this)
    result.__MARK_AS_CLONED__ = true
    return result
  }
}

function monkeyPatchCreateNodeIterator() {
  const originalCreateNodeIterator = document.createNodeIterator
  document.createNodeIterator = function (root: Node, ...rest) {
    const nodeIterator = originalCreateNodeIterator.call(
      document,
      root,
      ...rest
    )
    if (root instanceof DocumentFragment && root.__MARK_AS_CLONED__) {
      const originalNextNode = nodeIterator.nextNode
      nodeIterator.nextNode = function () {
        const node = originalNextNode.call(nodeIterator)
        if (node instanceof HTMLElement) {
          if (node.getAttribute('data-immersive-translate-walked') !== null) {
            const wrappers = node.querySelectorAll(
              '[data-immersive-translate-translation-element-mark="1"]'
            ) as NodeListOf<HTMLElement>
            cleanupTranslationElements(...wrappers)
          }
        }
        return node
      }
    }
    return nodeIterator
  }
}

function monkeyPatchCreateDiv() {
  const originalCreateElement = document.createElement
  document.createElement = function (tagName: string) {
    const element = originalCreateElement.call(document, tagName)
    if (tagName === 'div') {
      const originalAppendChild = element.appendChild
      element.appendChild = function <T extends Node>(child: T): T {
        if (child instanceof DocumentFragment && child.__MARK_AS_CLONED__) {
          ;(element as HTMLDivElement).__MARK_AS_TARGET__ = true
        }
        return originalAppendChild.call(element, child) as T
      }
    }
    return element
  }
}

function cleanupTranslationElements(...wrappers: HTMLElement[]) {
  let count = 0
  wrappers.forEach((wrapper) => {
    count += 1
    wrapper.remove()
  })
  if (count > 0) {
    console.log(`Removed ${count} translation elements from the target node.`)
  }
}

function monkeyPatchCreateRange() {
  const originalCreateRange = document.createRange
  document.createRange = function () {
    const range = originalCreateRange.call(document)
    const originalSelectNodeContents = range.selectNodeContents
    range.selectNodeContents = function (node: Node) {
      originalSelectNodeContents.call(range, node)
      if (node instanceof HTMLDivElement && node.__MARK_AS_TARGET__) {
        const wrappers = node.querySelectorAll(
          '[data-immersive-translate-translation-element-mark="1"]'
        ) as NodeListOf<HTMLElement>
        cleanupTranslationElements(...wrappers)
      }
    }
    return range
  }
}

function main() {
  monkeyPatchCloneContents()
  monkeyPatchCreateNodeIterator()
  monkeyPatchCreateDiv()
  monkeyPatchCreateRange()
}

// Ensure that the main function is only executed once
if (!window.__ALREADY_MONKEY_PATCHED_IMMERSIVE_TRANSLATE_GITHUB_FIX__) {
  window.__ALREADY_MONKEY_PATCHED_IMMERSIVE_TRANSLATE_GITHUB_FIX__ = true
  main()
}
