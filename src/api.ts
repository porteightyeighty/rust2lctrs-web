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

const base = import.meta.env.VITE_API_BASE ?? ''

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
