# rust2lctrs-web

A browser demo for [rust2lctrs](https://github.com/porteightyeighty/rust2lctrs): paste a small Rust
program, see the LCTRS the translator produces, and ask [Cora](https://github.com/hezzel/cora)
whether it terminates.

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

Open <http://localhost:5173/rust2lctrs/demo/>. Vite proxies `/rust2lctrs/demo/v1` to `http://localhost:8080` (stripping `/rust2lctrs/demo`), so no
CORS setup is needed locally.

## API

`POST /v1/translate?semantics=debug|release|unbounded&raw=1`, body is Rust source, response is plain
text:

| Status | Body |
|---|---|
| `200` | the LCTRS |
| `422` | one out-of-scope diagnostic per line |
| `400` | the syntax error message |
| `413` | request body over 64 KiB |

`POST /v1/analyse?semantics=debug|release|unbounded` translates the same way and runs Cora on the
result. The page calls it only when *Check termination* is pressed, one semantics at a time.

| Status | Body |
|---|---|
| `200` | Cora's output; the first line is the verdict (`YES` or `MAYBE`) |
| `504` | Cora gave no answer within the server's time limit |
| `503` | the analyser is busy, or the server has no Cora install |
| `502` | Cora exited without a verdict |
| `400` / `413` / `422` | as for `/v1/translate` |

A local server without Cora answers `503`; set `CORA_BIN` (see the translator README) to try it.

## Configuration

| Variable | Effect |
|---|---|
| `VITE_API_BASE` | Base URL of the API. Defaults to the app's base path (`/rust2lctrs/demo`), so requests go to the same origin. Vite bakes it in at build time, so changing it needs a rebuild. |

## Build

```sh
npm run build   # vue-tsc type check, then vite build to dist/
```

## Deployment

Deployed on Railway at <https://mattport.com/rust2lctrs/demo/>. The `Dockerfile` builds `dist/` and serves it with
Caddy (`Caddyfile`), which also reverse-proxies `/rust2lctrs/demo/v1/*` (minus the `/rust2lctrs/demo` prefix) to the
rust2lctrs server over Railway's private network.

| Variable | Effect |
|---|---|
| `PORT` | Port Caddy listens on (default `8080`). |
| `API_UPSTREAM` | `host:port` of the rust2lctrs server, e.g. `${{r2l-api.RAILWAY_PRIVATE_DOMAIN}}:8080`. |

`mattport.com` itself belongs to a separate router service, which sends `/rust2lctrs/demo` and `/rust2lctrs/demo/*` here (and redirects the old `/r2l` paths)
with the path unchanged.
