<script setup lang="ts">
import { ref } from 'vue'
import { translate, type Semantics } from './api'
import { samples } from './samples'

const source = ref(samples[0].source)
const semantics = ref<Semantics>('debug')
const raw = ref(false)
const result = ref('')
const error = ref('')
const loading = ref(false)

async function run() {
  loading.value = true
  error.value = ''
  try {
    const response = await translate(source.value, {
      semantics: semantics.value,
      raw: raw.value,
    })
    if (response.ok) {
      result.value = response.text
    } else {
      result.value = ''
      error.value = response.text || `HTTP ${response.status}`
    }
  } catch (e) {
    result.value = ''
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function copy() {
  navigator.clipboard.writeText(result.value)
}
</script>

<template>
  <header>
    <h1>rust2lctrs</h1>
    <p>Translate a small fragment of Rust into a Logically Constrained Term Rewriting System.</p>
  </header>

  <section class="about">
    <p>
      <strong>rust2lctrs</strong> translates a small fragment of Rust into a
      <em>Logically Constrained Term Rewriting System</em> (LCTRS): a rewriting formalism whose
      rules are guarded by logical constraints. Each function becomes a set of conditional rewrite
      rules over the program points, so an integer and boolean program can be studied as a rewrite
      system rather than as source code.
    </p>
    <p>
      Rewriting systems exist to be analysed: given this one,
      <a href="https://github.com/hezzel/cora">Cora</a> can attempt to prove that the original Rust
      program always terminates.
    </p>
    <p>
      This page is a demo of the translator alone. Paste Rust, choose a semantics, and the LCTRS
      comes back as text you can copy out. Nothing is analysed here, so it shows only what the
      translation produces, not whether a program terminates.
    </p>
    <p>
      Accepted: integer arithmetic on fixed-width types, booleans, <code>let</code>/<code>mut</code>,
      <code>if</code>/<code>else</code>, <code>while</code>, <code>loop</code>/<code>break</code>/<code>continue</code>
      and recursion. Anything else — <code>for</code>, floats, borrows, structs, enums, strings,
      macros — is rejected with a diagnostic rather than mistranslated.
    </p>
    <p>Source: <a href="https://github.com/porteightyeighty/rust2lctrs">rust2lctrs</a>.</p>
  </section>

  <section class="controls">
    <div class="samples">
      <button v-for="sample in samples" :key="sample.name" @click="source = sample.source">
        {{ sample.name }}
      </button>
    </div>
    <div class="options">
      <label><input v-model="semantics" type="radio" value="debug" /> debug</label>
      <label><input v-model="semantics" type="radio" value="release" /> release</label>
      <label><input v-model="semantics" type="radio" value="unbounded" /> unbounded</label>
      <label><input v-model="raw" type="checkbox" /> raw</label>
    </div>
    <button class="translate" :disabled="loading" @click="run">
      {{ loading ? 'Translating…' : 'Translate' }}
    </button>
    <p class="hint">
      debug: overflow panics · release: overflow wraps · unbounded: integers idealised to ℤ · raw:
      skip simplification
    </p>
  </section>

  <main class="layout">
    <section>
      <h2>Rust</h2>
      <textarea v-model="source" spellcheck="false" />
    </section>
    <section>
      <div class="result-header">
        <h2>LCTRS</h2>
        <button :disabled="!result" @click="copy">Copy</button>
      </div>
      <pre v-if="result">{{ result }}</pre>
      <p v-else class="placeholder">Translate to see the LCTRS.</p>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
    </section>
  </main>
</template>
