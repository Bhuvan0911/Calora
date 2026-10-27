# Calora

A personal nutrition diary. Log what you ate, set calorie and macro goals, track weight, and read the week back as charts or a PDF.

**Live:** [calorie-tracker-ochre-eight.vercel.app](https://calorie-tracker-ochre-eight.vercel.app)  
**Demo:** [youtu.be/ZUAhar1ciLc](https://youtu.be/ZUAhar1ciLc)

The hosted service may take a moment to respond on the first visit after it has been idle.

## What you can do

- Create an account. Meals, goals, and weigh-ins stay private to that account.
- Set a daily calorie target, protein, carbs, fat, and an optional weight goal. Past reports keep the target that was in force on that day.
- Log breakfast, lunch, dinner, and snacks, with calories, macros, and any micronutrients you want to record.
- Add a meal from a form, a photo of a plate or label, a food-diary PDF, or a short conversation. You confirm a photo or PDF before it is saved.
- See today against your goal, including a logging streak and how many recent days landed close to target.
- Review entries by date, edit them, and delete them.
- Record one weigh-in a day and follow it over time.
- Open daily and weekly reports, then download the same numbers as a PDF.
- Ask Bite what still fits today. Bite can read the day. It does not write meals for you.

Photo reading, chat, and optional PDF analysis turn on only when their keys are set. The rest of Calora works without them.

## Stack

| | |
| --- | --- |
| Web | Next.js, React, TypeScript |
| API | Node.js, Express, Prisma |
| Data | Postgres |
| Hosting | Vercel for the web app, Render for the API, Neon for Postgres |

The browser talks to the web app. The API is the only process that uses the database.

## Run it locally

You need Node.js 20 or newer and a [Neon](https://console.neon.tech) Postgres database. In Neon, skip Auth and copy both connection strings. The pooled string is `DATABASE_URL`. The direct string is `DIRECT_URL`. Both should end with `?sslmode=require`.

Start the API:

```bash
cd server
cp .env.example .env
```

Fill in `DATABASE_URL`, `DIRECT_URL`, and a long random `JWT_SECRET`. Leave the model keys empty until you want those features.

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

In a second terminal, start the web app:

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, set a goal, and log a meal.

On Windows PowerShell, use `copy` instead of `cp`. Keep the two apps in separate terminals so the web app does not pick up the API port.

## Deploy

Secrets stay in the host dashboards. Commit `.env.example` only. Never commit `.env` or `.env.local`.

Deploy the API before the web app, so you have a public API address to give the site.

### 1. Database

Create a Neon project and copy the pooled and direct Postgres URLs, both with `sslmode=require`.

### 2. API on Render

Create a Web Service from this repository.

- Root directory: `server`
- Build: `npm ci --include=dev && npm run build`
- Start: `npm run start:prod`
- Health check: the path already set in `render.yaml`
- Do not set `PORT`. Render assigns it.
- Do not add a Render database. Calora uses Neon.

Set these environment variables:

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon direct URL |
| `JWT_SECRET` | A long random string |
| `CORS_ORIGIN` | Your Vercel site URL, no trailing slash. Add this after the site exists, then redeploy the API. |
| `AI_API_KEY` | Optional. Photo reading. |
| `GEMINI_API_KEY` | Optional. Chat, Bite, and deeper PDF reading. |

`render.yaml` lists the same names if you deploy with a Render Blueprint.

### 3. Web app on Vercel

Import this repository and set the root directory to `web`.

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com/api` |
| `API_UPSTREAM` | `https://<your-render-service>.onrender.com` |

These are read at build time. Redeploy the site after you change them.

Turn off Vercel Deployment Protection on production so visitors reach Calora’s own sign-in.

### 4. Connect the two

Set `CORS_ORIGIN` on Render to the Vercel URL, with no trailing slash, and redeploy the API. Sign up on the live site and log one meal to confirm the diary is writing.

## Tests

```bash
npm test
```

That runs the API unit tests and the API regression tests. The regression tests need Postgres, from `server/.env` locally or from the database service in GitHub Actions.
