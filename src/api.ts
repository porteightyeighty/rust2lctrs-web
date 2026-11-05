export type Semantics = 'debug' | 'release' | 'unbounded'

export interface TranslateOptions {
  semantics: Semantics
  raw: boolean
}

export interface TranslateResult {
  ok: boolean
  status: number
  text: string
}

const base = import.meta.env.VITE_API_BASE ?? import.meta.env.BASE_URL.replace(/\/$/, '')

export async function translate(
  source: string,
  { semantics, raw }: TranslateOptions,
): Promise<TranslateResult> {
  const query = new URLSearchParams({ semantics, raw: raw ? '1' : '0' })
  const res = await fetch(`${base}/v1/translate?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: source,
  })
  return { ok: res.ok, status: res.status, text: await res.text() }
}

export interface AnalyseResult {
  ok: boolean
  status: number
  /** Cora's output on success (first line is the verdict), otherwise the server's explanation. */
  text: string
  /** Time Cora ran for, as reported by the server. */
  millis: number | null
}

/** Translates `source` and runs Cora on the result (`POST /v1/analyse`). */
export async function analyse(source: string, semantics: Semantics): Promise<AnalyseResult> {
  const query = new URLSearchParams({ semantics })
  const res = await fetch(`${base}/v1/analyse?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: source,
  })
  const millis = res.headers.get('X-Analysis-Millis')
  return { ok: res.ok, status: res.status, text: await res.text(), millis: millis ? Number(millis) : null }
}
