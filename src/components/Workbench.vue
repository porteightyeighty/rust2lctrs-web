<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Semantics } from '../api'
import { samples } from '../samples'
import {
  countRules,
  semanticsOptions,
  useAnalyses,
  useTranslations,
  variantKey,
  verdictOf,
} from '../translations'
import AboutSection from './AboutSection.vue'
import CodeEditor from './CodeEditor.vue'

const showAbout = ref(false)
const sampleIndex = ref(0)
const source = ref(samples[0].source)
const semantics = ref<Semantics>('debug')
const raw = ref(false)
const copied = ref(false)

const { results, translatedSource, loading, runAll } = useTranslations()
const analyses = useAnalyses()
const showProof = ref(false)

const current = computed(() => results.get(variantKey(semantics.value, raw.value)))
const stale = computed(
  () => translatedSource.value !== null && source.value !== translatedSource.value,
)
const description = computed(
  () => semanticsOptions.find((o) => o.value === semantics.value)!.description,
)

const errorLabel = computed(() => {
  switch (current.value?.status) {
    case 400:
      return 'Syntax error'
    case 422:
      return 'Outside the supported fragment'
    case 413:
      return 'Input too large'
    case 0:
      return 'Could not reach the translator'
    default:
      return `Server error (${current.value?.status})`
  }
})

interface Segment {
  state: 'loading' | 'none' | 'error' | 'ok'
  rules?: number
  differs?: boolean
}

/** Per-semantics summary for the segmented control: rule count, and whether it differs from what's shown. */
const segments = computed(() => {
  const out = {} as Record<Semantics, Segment>
  for (const { value } of semanticsOptions) {
    const result = results.get(variantKey(value, raw.value))
    if (!result) out[value] = { state: loading.value ? 'loading' : 'none' }
    else if (!result.ok) out[value] = { state: 'error' }
    else
      out[value] = {
        state: 'ok',
        rules: countRules(result.text),
        differs: !!current.value?.ok && current.value.text !== result.text,
      }
  }
  return out
})

function run() {
  if (!source.value.trim()) return
  analyses.reset(source.value)
  showProof.value = false
  runAll(source.value)
}

const analysis = computed(() => analyses.results.get(semantics.value))
const analysing = computed(() => analyses.running.has(semantics.value))
const canAnalyse = computed(() => !!current.value?.ok && !stale.value && !analysing.value)

function checkTermination() {
  if (canAnalyse.value) analyses.run(semantics.value)
}

const seconds = (millis: number | null) =>
  millis === null ? '' : ` in ${(millis / 1000).toFixed(1)} s`

/** One line under the LCTRS header summarising what Cora said about the shown semantics. */
const verdict = computed(() => {
  const a = analysis.value
  if (!a) return null
  if (a.ok) {
    const v = verdictOf(a.text)
    if (v === 'YES')
      return { tone: 'yes', badge: 'YES', text: `Cora proved termination${seconds(a.millis)}.`, proof: true }
    if (v === 'NO')
      return { tone: 'no', badge: 'NO', text: `Cora proved non-termination${seconds(a.millis)}.`, proof: true }
    return {
      tone: 'maybe',
      badge: 'MAYBE',
      text: `Cora found no proof${seconds(a.millis)}. This does not mean the program loops.`,
      proof: true,
    }
  }
  switch (a.status) {
    case 504:
      return { tone: 'maybe', badge: 'TIMEOUT', text: a.text, proof: false }
    case 503:
      return { tone: 'error', badge: 'BUSY', text: a.text, proof: false }
    case 0:
      return { tone: 'error', badge: 'ERROR', text: 'Could not reach the analyser.', proof: false }
    default:
      return { tone: 'error', badge: 'ERROR', text: `Cora failed (${a.status}).`, proof: !!a.text }
  }
})

function pickSample() {
  source.value = samples[sampleIndex.value].source
  run()
}

async function copy() {
  if (!current.value?.ok) return
  await navigator.clipboard.writeText(current.value.text)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

onMounted(run)
</script>

<template>
  <header class="topbar">
    <span class="brand">rust2lctrs</span>

    <div class="tools">
      <button type="button" class="btn primary" :disabled="loading" title="Ctrl+Enter" @click="run">
        {{ loading ? 'Translating…' : 'Translate' }}
      </button>

      <select v-model.number="sampleIndex" class="btn" aria-label="Example program" @change="pickSample">
        <option v-for="(sample, i) in samples" :key="sample.name" :value="i">
          {{ sample.name }}
        </option>
      </select>

      <div class="group" role="radiogroup" aria-label="Overflow semantics">
        <button
          v-for="option in semanticsOptions"
          :key="option.value"
          type="button"
          role="radio"
          class="btn"
          :aria-checked="semantics === option.value"
          :title="option.description"
          @click="semantics = option.value"
        >
          {{ option.label }}
          <span
            v-if="segments[option.value].differs"
            class="dot"
            title="Output differs from the one shown"
          />
        </button>
      </div>

      <label class="check">
        <input v-model="raw" type="checkbox" />
        Raw
      </label>
    </div>

    <a
      class="github"
      href="https://github.com/porteightyeighty/rust2lctrs"
      aria-label="rust2lctrs on GitHub"
      title="rust2lctrs on GitHub"
    >
      <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
        <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    </a>
  </header>

  <p class="intro">
    Translates integer and boolean Rust functions into LCTRSs and runs Cora to try to prove
    termination.
    <button
      type="button"
      class="about-toggle"
      :aria-expanded="showAbout"
      @click="showAbout = !showAbout"
    >
      What is this?
    </button>
  </p>

  <AboutSection v-if="showAbout" />

  <div class="panes">
    <section class="pane" aria-label="Rust source">
      <div class="pane-header">
        <span class="pane-title">Rust</span>
        <span class="pane-meta">{{
          source === samples[sampleIndex].source
            ? samples[sampleIndex].origin
            : `edited from ${samples[sampleIndex].origin}`
        }}</span>
      </div>
      <CodeEditor v-model="source" language="rust" label="Rust source" class="pane-body" @run="run" />
    </section>

    <section class="pane" aria-label="LCTRS output">
      <div class="pane-header">
        <span class="pane-title">LCTRS</span>
        <span v-if="stale" class="pane-meta stale" role="status">out of date, press Translate</span>
        <span v-else-if="current?.ok" class="pane-meta">{{ countRules(current.text) }} rules</span>
        <button
          type="button"
          class="btn small"
          :disabled="!canAnalyse"
          title="Run Cora on this LCTRS"
          @click="checkTermination"
        >
          {{ analysing ? 'Checking…' : analysis ? 'Check again' : 'Check termination' }}
        </button>
        <button type="button" class="btn small" :disabled="!current?.ok" @click="copy">
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <div v-if="verdict && current?.ok" class="verdict" :class="verdict.tone" role="status">
        <span class="badge">{{ verdict.badge }}</span>
        <span class="verdict-text">{{ verdict.text }}</span>
        <button v-if="verdict.proof" type="button" class="link" @click="showProof = !showProof">
          {{ showProof ? 'Show LCTRS' : 'Show Cora output' }}
        </button>
      </div>

      <pre v-if="current?.ok && showProof && verdict?.proof" class="pane-body proof">{{ analysis?.text }}</pre>
      <CodeEditor
        v-else-if="current?.ok"
        :model-value="current.text.replace(/\n$/, '')"
        language="lctrs"
        label="LCTRS output"
        readonly
        class="pane-body"
        :class="{ dimmed: stale }"
      />
      <div v-else-if="current" class="pane-body error" role="alert">
        <strong>{{ errorLabel }}</strong>
        <pre>{{ current.text || 'No details were returned.' }}</pre>
      </div>
      <div v-else class="pane-body placeholder">
        {{ loading ? 'Translating…' : 'Press Translate to see the LCTRS.' }}
      </div>

      <div class="pane-footer">
        <span><span class="mono">{{ semantics }}</span>: {{ description }}</span>
      </div>
    </section>
  </div>
</template>
