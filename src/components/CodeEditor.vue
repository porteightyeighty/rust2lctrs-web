<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { EditorState, Prec, type Extension } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { tags as t } from '@lezer/highlight'
import { rust } from '@codemirror/lang-rust'
import { lctrs } from '../lctrs-lang'

const props = defineProps<{
  modelValue: string
  language: 'rust' | 'lctrs'
  readonly?: boolean
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  run: []
}>()

const host = ref<HTMLDivElement>()
let view: EditorView | undefined

// Colours come from CSS custom properties so light/dark follow the page tokens.
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.modifier], color: 'var(--syn-keyword)' },
  { tag: [t.typeName, t.className], color: 'var(--syn-type)' },
  { tag: [t.number, t.bool, t.string], color: 'var(--syn-literal)' },
  { tag: [t.function(t.variableName), t.definition(t.variableName)], color: 'var(--syn-fn)' },
  { tag: t.special(t.variableName), color: 'var(--syn-special)', fontStyle: 'italic' },
  { tag: [t.operator, t.logicOperator, t.compareOperator, t.arithmeticOperator], color: 'var(--syn-op)' },
  { tag: t.separator, color: 'var(--accent)', fontWeight: '600' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--muted)', fontStyle: 'italic' },
  { tag: t.punctuation, color: 'var(--syn-punct)' },
])

const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent', color: 'var(--text)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', fontSize: '13.5px', lineHeight: '1.6', fontVariantLigatures: 'none' },
  '.cm-content': { padding: '12px 0', caretColor: 'var(--accent)' },
  '.cm-line': { padding: '0 16px 0 8px' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--faint)',
    border: 'none',
    paddingLeft: '8px',
  },
  '.cm-activeLine': { backgroundColor: 'var(--line-active)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--muted)' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--selection) !important',
  },
  '.cm-matchingBracket': { backgroundColor: 'var(--line-active)', outline: '1px solid var(--border)' },
})

function extensions(): Extension[] {
  const common: Extension[] = [
    lineNumbers(),
    drawSelection(),
    theme,
    syntaxHighlighting(highlight),
    props.language === 'rust' ? rust() : lctrs,
    EditorView.contentAttributes.of({ 'aria-label': props.label }),
    Prec.highest(
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            emit('run')
            return true
          },
        },
      ]),
    ),
  ]
  if (props.readonly) {
    return [
      ...common,
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      // Constraints run long: wrap rather than scroll sideways.
      EditorView.lineWrapping,
    ]
  }
  return [
    ...common,
    history(),
    highlightActiveLine(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
    }),
  ]
}

onMounted(() => {
  view = new EditorView({
    parent: host.value!,
    state: EditorState.create({ doc: props.modelValue, extensions: extensions() }),
  })
  // Line heights are measured on mount; re-measure once the web fonts have swapped in.
  document.fonts?.ready.then(() => view?.requestMeasure())
})

watch(
  () => props.modelValue,
  (value) => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    }
  },
)

onBeforeUnmount(() => view?.destroy())
</script>

<template>
  <div ref="host" class="code-editor" />
</template>
