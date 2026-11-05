import { computed, reactive, ref } from 'vue'
import { analyse, translate, type AnalyseResult, type Semantics, type TranslateResult } from './api'

export const semanticsOptions: { value: Semantics; label: string; description: string }[] = [
  { value: 'debug', label: 'debug', description: 'Arithmetic overflow panics, as in a debug build.' },
  { value: 'release', label: 'release', description: 'Arithmetic overflow wraps around, as in a release build.' },
  {
    value: 'unbounded',
    label: 'unbounded',
    description: 'Integers idealised to ℤ: no widths, no overflow.',
  },
]

export type VariantKey = `${Semantics}:${'raw' | 'simplified'}`

export const variantKey = (semantics: Semantics, raw: boolean): VariantKey =>
  `${semantics}:${raw ? 'raw' : 'simplified'}`

const allVariants = semanticsOptions.flatMap(({ value }) =>
  [false, true].map((raw) => ({ semantics: value, raw })),
)

/** Rewrite rules are the `lhs -> rhs` lines that are not `f :: A -> B` signatures. */
export function countRules(text: string): number {
  return text.split('\n').filter((line) => line.includes('->') && !line.includes('::')).length
}

/**
 * Translates a program under all six (semantics × raw) variants at once, so switching between them
 * afterwards is instant.
 */
export function useTranslations() {
  const results = reactive(new Map<VariantKey, TranslateResult>())
  const translatedSource = ref<string | null>(null)
  const pending = ref(0)
  const elapsed = ref<number | null>(null)
  let generation = 0

  async function runAll(source: string) {
    const run = ++generation
    results.clear()
    translatedSource.value = source
    pending.value = allVariants.length
    elapsed.value = null
    const started = performance.now()

    await Promise.allSettled(
      allVariants.map(async ({ semantics, raw }) => {
        let result: TranslateResult
        try {
          result = await translate(source, { semantics, raw })
        } catch (e) {
          result = { ok: false, status: 0, text: e instanceof Error ? e.message : String(e) }
        }
        if (run !== generation) return
        results.set(variantKey(semantics, raw), result)
        pending.value--
      }),
    )
    if (run === generation) elapsed.value = Math.round(performance.now() - started)
  }

  const loading = computed(() => pending.value > 0)

  return { results, translatedSource, loading, elapsed, runAll }
}

export type Verdict = 'YES' | 'MAYBE' | 'NO'

/** Cora's verdict is the first word of its first non-blank line. */
export function verdictOf(output: string): Verdict | null {
  const first = output.split('\n').find((line) => line.trim() !== '')
  const word = first?.trim().split(/\s+/)[0]
  return word === 'YES' || word === 'MAYBE' || word === 'NO' ? word : null
}

/**
 * Runs Cora on demand, one semantics at a time. Analyses are slow (seconds) and the server only
 * runs a couple at once, so unlike translations they are never fired off for every variant.
 */
export function useAnalyses() {
  const results = reactive(new Map<Semantics, AnalyseResult>())
  const running = reactive(new Set<Semantics>())
  let source: string | null = null
  let generation = 0

  /** Forgets every verdict; called whenever a new source is translated. */
  function reset(next: string) {
    generation++
    source = next
    results.clear()
    running.clear()
  }

  async function run(semantics: Semantics) {
    if (source === null || running.has(semantics)) return
    const run = generation
    running.add(semantics)
    let result: AnalyseResult
    try {
      result = await analyse(source, semantics)
    } catch (e) {
      result = { ok: false, status: 0, text: e instanceof Error ? e.message : String(e), millis: null }
    }
    if (run !== generation) return
    results.set(semantics, result)
    running.delete(semantics)
  }

  return { results, running, reset, run }
}
