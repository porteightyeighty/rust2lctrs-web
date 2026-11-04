export interface Sample {
  name: string
  origin: string
  source: string
}

export const samples: Sample[] = [
  {
    name: 'sum',
    origin: 'benchmarks/sum.rs',
    source: `fn sum(a: i8, b: i8) -> i8 {
    let x: i8 = a + b;
    x
}
`,
  },
  {
    name: 'count down',
    origin: 'benchmarks/count_down.rs',
    source: `fn count_down(mut n: i32) {
    while n > 0 {
        n = n - 1;
    }
}
`,
  },
  {
    name: 'even/odd',
    origin: 'benchmarks/even_odd.rs',
    source: `fn is_even(n: i8) -> bool {
    if n == 0 {
        return true;
    }
    return is_odd(n - 1);
}

fn is_odd(n: i8) -> bool {
    if n == 0 {
        return false;
    }
    return is_even(n - 1);
}
`,
  },
  {
    name: 'McCarthy 91',
    origin: 'benchmarks/mccarthy.rs',
    source: `fn mccarthy(n: i32) -> i32 {
    if n <= 100 {
        return mccarthy(mccarthy(n + 11));
    }
    n - 10
}
`,
  },
  {
    name: 'endless while',
    origin: 'benchmarks/endless_while.rs',
    source: `fn endless_while() {
    while true {}
}
`,
  },
]
