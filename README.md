# rust2lctrs-web

A browser demo for [rust2lctrs](https://github.com/porteightyeighty/rust2lctrs): paste a small Rust
program and see the LCTRS the translator produces.

Vue 3 + TypeScript, built with Vite. No router, store or UI library.

## Local development

The frontend calls a `rust2lctrs` server that serves `POST /v1/translate`. Build and start one from
the translator repo:

```sh
./mvnw package
java -cp target/rust2lctrs-0.4.0.jar project.web.Demo
```

Then, in this repo:

```sh
npm install
npm run dev
```

Vite proxies `/v1` to `http://localhost:8080`, so no CORS setup is needed locally.

## API

`POST /v1/translate?semantics=debug|release|unbounded&raw=1`, body is Rust source, response is plain
text:

| Status | Body |
|---|---|
| `200` | the LCTRS |
| `422` | one out-of-scope diagnostic per line |
| `400` | the syntax error message |
| `413` | request body over 64 KiB |

## Configuration

| Variable | Effect |
|---|---|
| `VITE_API_BASE` | Base URL of the API. Empty by default, which means same origin (the dev proxy). Vite bakes it in at build time, so changing it needs a rebuild. |

## Build

```sh
npm run build   # vue-tsc type check, then vite build to dist/
```
