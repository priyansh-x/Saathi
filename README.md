# Daily voice check-in

Voice product for Indian parents who live without their children in the house. The agent calls the parent on the phone they already own; the child gets a two-line briefing.

Built for the Bolna Symphony Buildathon and YC’s RFS on AI for the aging population. **Name is open.** Read the product, not the folder name.

## Read first

| Doc | What it is |
| --- | --- |
| [prd.md](./prd.md) | Full PRD: research, problem, flows, requirements, sources |
| [docs/architecture.md](./docs/architecture.md) | Repo layout, stack, Bolna boundary |
| [docs/user-flows.md](./docs/user-flows.md) | Click paths to implement |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to run and what not to invent |

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Bolna for live voice (optional until keys exist)
- No auth and no database in slice 1

## Run locally

```bash
npm install
cp .env.example .env.local   # optional; demo runs without Bolna
npm run dev
```

Dev server: [http://127.0.0.1:43147](http://127.0.0.1:43147)

```bash
npm run lint
npm run build
```

## Current slice

Repo and docs are in place. The web app is a scaffold with shadcn primitives. Implement against `prd.md` §10 and `docs/user-flows.md` — do not start from a blank product idea.

## Demo data

Use the fictional household in the PRD (Kamala Iyer, Coimbatore; child Ananya). Do not call a real parent without their consent.
