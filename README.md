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

Open <http://localhost:5173/r2l/>. Vite proxies `/r2l/v1` to `http://localhost:8080` (stripping `/r2l`), so no
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

## Configuration

| Variable | Effect |
|---|---|
| `VITE_API_BASE` | Base URL of the API. Defaults to the app's base path (`/r2l`), so requests go to the same origin. Vite bakes it in at build time, so changing it needs a rebuild. |

## Build

```sh
npm run build   # vue-tsc type check, then vite build to dist/
```

## Deployment

Deployed on Railway at <https://mattport.com/r2l/>. The `Dockerfile` builds `dist/` and serves it with
Caddy (`Caddyfile`), which also reverse-proxies `/r2l/v1/*` (minus the `/r2l` prefix) to the
rust2lctrs server over Railway's private network.

| Variable | Effect |
|---|---|
| `PORT` | Port Caddy listens on (default `8080`). |
| `API_UPSTREAM` | `host:port` of the rust2lctrs server, e.g. `${{r2l-api.RAILWAY_PRIVATE_DOMAIN}}:8080`. |

`mattport.com` itself belongs to a separate router service, which sends `/r2l` and `/r2l/*` here
with the path unchanged.
