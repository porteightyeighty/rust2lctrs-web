import { StreamLanguage } from '@codemirror/language'

/**
 * Highlighting for the LCTRS text rust2lctrs emits, e.g.
 *   private u1 :: Int -> Int -> result
 *   u1(x, y) -> ret_Int(0) | (x < 0) ∨ (x > 9)
 */
interface State {
  signature: boolean
  constraint: boolean
}

export const lctrs = StreamLanguage.define<State>({
  name: 'lctrs',
  startState: () => ({ signature: false, constraint: false }),
  token(stream, state) {
    if (stream.sol()) {
      state.signature = /::/.test(stream.string)
      state.constraint = false
    }
    if (stream.eatSpace()) return null
    if (stream.match('::')) return 'keyword'
    if (stream.match('->')) return state.signature ? 'punctuation' : 'operator'
    if (stream.match('|')) {
      state.constraint = true
      return 'separator'
    }
    if (stream.match(/^[∧∨¬≤≥<>=+\-*/%]/)) return 'logicOperator'
    if (stream.match(/^-?\d+/)) return 'number'
    if (stream.match(/^[A-Za-z_][\w']*/)) {
      const word = stream.current()
      if (word === 'private' || word === 'true' || word === 'false') return 'keyword'
      if (state.signature) {
        return /^(Int|Bool|result)$/.test(word) ? 'typeName' : 'variableName.definition'
      }
      if (stream.peek() === '(') {
        if (word === 'err' || word.startsWith('ret_')) return 'variableName.special'
        return 'variableName.function'
      }
      if (word === 'err') return 'variableName.special'
      return 'variableName'
    }
    stream.next()
    return 'punctuation'
  },
})
