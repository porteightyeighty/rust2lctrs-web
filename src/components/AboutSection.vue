<script setup lang="ts">
import { semanticsOptions } from '../translations'

const supported = [
  'i8 … i128, u8 … u128, bool',
  'let, let mut, assignment',
  'if / else, while, loop, break, continue, return',
  'function calls and recursion',
]
const unsupported = 'for loops, floats, borrows, structs, enums, strings, macros'
</script>

<template>
  <section class="about">
    <div>
      <h2>What is this?</h2>
      <p>
        rust2lctrs turns integer and boolean Rust functions into a Logically Constrained Term
        Rewriting System (LCTRS): rewrite rules guarded by arithmetic constraints, one per
        program point. <a href="https://github.com/hezzel/cora">Cora</a> can then try to prove
        the program terminates: press <em>Check termination</em> to run it on the server. YES
        means Cora found a proof; MAYBE means it did not, which is not a proof that the program
        loops.
      </p>
    </div>

    <div>
      <h2>Overflow semantics</h2>
      <dl>
        <template v-for="option in semanticsOptions" :key="option.value">
          <dt>{{ option.label }}</dt>
          <dd>{{ option.description }}</dd>
        </template>
      </dl>
      <p>Raw skips the simplification pass, so you see the rules as first generated.</p>
    </div>

    <div>
      <h2>Supported Rust</h2>
      <ul>
        <li v-for="item in supported" :key="item"><code>{{ item }}</code></li>
      </ul>
      <p class="muted">Not supported: {{ unsupported }}.</p>
    </div>
  </section>
</template>
