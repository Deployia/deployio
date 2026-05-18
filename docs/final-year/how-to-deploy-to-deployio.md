# How to Deploy to Deployio

**One-page guide** · [deployio.tech](https://deployio.tech) · Final-year / developer reference

---

## What Deployio Does

Deployio connects to your Git repository (GitHub, GitLab, or Azure DevOps), discovers **Dockerfiles** in the tree, analyzes each service, and builds + hosts it as a container with a public URL (subdomain on `*.deployio.tech`).

**You need:** a Git repo, at least one valid **Dockerfile per service**, and environment variables your app needs at runtime.

**Deployio does not run `docker-compose.yml` as a single deploy.** Compose is advisory only — each service is deployed as its **own project** using its Dockerfile.

---

## Repository Layouts

### 1. Single service (one Dockerfile at repo root)

```
my-app/
├── Dockerfile          ← build context = repo root
├── package.json
└── src/
```

**Best for:** simple APIs, SPAs with a single container, Python/Node monoliths.

### 2. Multi-service (multiple Dockerfiles)

```
my-platform/
├── frontend/
│   └── Dockerfile      ← build context = frontend/
├── backend/
│   └── Dockerfile      ← build context = backend/
└── docker-compose.yml  ← optional; not used for deploy
```

**Rule:** Create **one Deployio project per Dockerfile**. Run the wizard twice (same repo, different Dockerfile path) for frontend and API.

Naming hints: `backend/Dockerfile` → suggested name like `my-repo-backend`; `Dockerfile.api` → label `api`.

### 3. Monorepo variants

| Pattern | Example path | Notes |
|--------|----------------|-------|
| Root Dockerfile | `Dockerfile` | Context = `.` |
| Service folder | `services/auth/Dockerfile` | Context = `services/auth/` — `COPY` paths must be **inside that folder** |
| Named variant | `Dockerfile.prod` | Discovered like any `Dockerfile.*` |

**Build context rule:** Deployio runs `docker build` with **context = the Dockerfile’s directory**, not always the repo root. If your Dockerfile does `COPY ../shared`, move shared files into that directory or adjust paths.

---

## Dockerfile Requirements

A Dockerfile is **valid for Deployio** when it contains:

- `FROM` (base image)
- `CMD` or `ENTRYPOINT` (how the container starts)

Recommended extras:

```dockerfile
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK ... CMD ... http://127.0.0.1:3000/health ...
```

| Signal | Why it matters |
|--------|----------------|
| `EXPOSE` | Helps auto-detect listening port |
| `ENV PORT` / app listens on `0.0.0.0` | Container must accept external traffic |
| `HEALTHCHECK` or `/health` route | Used for runtime health checks in project settings |
| `.env.example` next to Dockerfile | Env vars suggested during setup |

**Without a Dockerfile:** the wizard shows *Repository not deployable*. Add Dockerfiles in Git, or use Deployio Playground / AI generation, then commit and reconnect.

---

## Deploy in 7 Steps (Dashboard Wizard)

| Step | Action |
|------|--------|
| **1. Git provider** | Connect GitHub / GitLab / Azure DevOps under **Integrations** if the repo is private. |
| **2. Repository** | Pick the repo to deploy. |
| **3. Branch & settings** | Choose branch (e.g. `main`). |
| **4. Dockerfile** | Select **one** valid Dockerfile → one service / one project. |
| **5. Analysis** | Stack detection (Next, MERN, FastAPI, Flask, Django, Express, etc.), port hints, env template. |
| **6. Project configuration** | Name, port, health path, memory/CPU, **environment variables**. |
| **7. Review & create** | Confirm → project appears on the dashboard. |

Then open the project → **Deploy** → choose subdomain → watch live build logs.

---

## Environment Variables

Set in **step 6** or later on the project:

- **Runtime:** available when the container runs (`DATABASE_URL`, `API_KEY`, …).
- **Build-time:** passed as Docker build-args when the image is built (e.g. `NEXT_PUBLIC_*`).

Place `.env.example` in the **same directory as the Dockerfile** for better auto-suggestions.

---

## Multi-Service Checklist

1. Add a **Dockerfile per service** (frontend, API, worker).
2. Each Dockerfile: `FROM` + `CMD`/`ENTRYPOINT`, correct `COPY` for **its** folder context.
3. Create **project A** → select `frontend/Dockerfile` → deploy → note URL.
4. Create **project B** → same repo → select `backend/Dockerfile` → set `DATABASE_URL`, CORS, API URL pointing to A’s URL.
5. Ignore compose for hosting; use compose only for **local** dev if you want.

---

## After Deploy

- **URL:** `https://<subdomain>.deployio.tech`
- **Logs:** real-time on the deployment detail view
- **Redeploy:** new commit on the linked branch, or manual redeploy from the dashboard
- **Limits:** subdomain format = lowercase letters, numbers, hyphens; platform reserves some names

---

## Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| No Dockerfiles found | Add `Dockerfile` under 30 discovered paths; push to Git |
| Dockerfile invalid | Add `FROM` and `CMD` or `ENTRYPOINT` |
| Build fails `COPY failed` | Paths must exist inside Dockerfile directory (build context) |
| App unreachable | Bind to `0.0.0.0`, set `PORT` to match project port |
| Wrong stack / port | Set port and health path manually in step 6 |
| Compose-only repo | Add per-service Dockerfiles; one project each |

---

## LLM Prompt (copy for Cursor / ChatGPT / Claude)

Use this when you want an assistant to prepare a repo for Deployio:

```text
You are preparing a repository for Deployio (deployio.tech).

Constraints:
- Deployio deploys ONE container per project from ONE Dockerfile path in Git.
- docker-compose.yml is NOT executed for hosting; each service needs its own Dockerfile.
- Valid Dockerfile = contains FROM and (CMD or ENTRYPOINT).
- docker build context = the directory containing the chosen Dockerfile (not always repo root).
- COPY/ADD paths must exist inside that directory.
- Container must listen on 0.0.0.0; expose PORT via ENV and EXPOSE; add /health if possible.
- Multi-service: output one Dockerfile per service at sensible paths (e.g. frontend/Dockerfile, backend/Dockerfile).

Task: [describe app — stack, folders, ports, env vars]

Deliver:
1. Folder tree showing Dockerfile locations
2. Full content of each Dockerfile (production-ready, multi-stage if helpful)
3. .env.example per service directory
4. Short note on which Deployio projects to create and suggested env vars between services
5. Any COPY/context fixes if code lives outside a service folder
```

---

## Example (MERN, single container)

See `examples/deployio-mern/Dockerfile`: multi-stage React build + Express server on port **3000**, health check on `/api/health`.

---

*Deployio — Final Year Project Documentation · May 2026*
