# Expenses

A personal expense tracker built with Next.js and Neon Postgres. Log your spending, view summaries, and explore analytics — all in one clean interface.

**[Live Demo →](https://v0-expense-tracking-app-gilt.vercel.app/)**

<a href="https://vercel.com/new/clone?repository-url=https://github.com/sethusrinivasan/ExpenseTracker&env=DATABASE_URL&envDescription=Neon%20Postgres%20connection%20string.%20Get%20it%20from%20https://console.neon.tech&envLink=https://neon.tech"><img src="https://vercel.com/button" alt="Deploy with Vercel" height="44" /></a>&nbsp;
<a href="https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/sethusrinivasan/ExpenseTracker"><img src="https://img.shields.io/badge/Deploy%20to%20AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="Deploy to AWS" height="44" /></a>&nbsp;

<a href="https://railway.com/new/template?template=https://github.com/sethusrinivasan/ExpenseTracker&envs=DATABASE_URL&DATABASE_URLDesc=Neon%20Postgres%20connection%20string"><img src="https://railway.com/button.svg" alt="Deploy on Railway" height="28" /></a>&nbsp;
<a href="https://render.com/deploy?repo=https://github.com/sethusrinivasan/ExpenseTracker"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="28" /></a>&nbsp;
<a href="https://portal.azure.com/#create/Microsoft.StaticApp"><img src="https://img.shields.io/badge/Deploy%20to%20Azure-0078D4?style=flat-square&logo=microsoftazure&logoColor=white" alt="Deploy to Azure" height="28" /></a>&nbsp;
<a href="https://deploy.cloud.run/?git_repo=https://github.com/sethusrinivasan/ExpenseTracker"><img src="https://img.shields.io/badge/Deploy%20to%20GCP-4285F4?style=flat-square&logo=googlecloud&logoColor=white" alt="Deploy to GCP" height="28" /></a>

> This project was scaffolded and developed with the assistance of AI tools (v0 and Kiro).

## Features

- **Add expenses** — log amount, category, date, and an optional description
- **Overview** — see total spend, current month total, and average per transaction
- **Recent expenses** — a live list of your latest entries
- **Analytics** — pie chart by category, monthly bar chart trend, and a ranked category breakdown

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Neon](https://neon.tech/) — serverless Postgres
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- [Recharts](https://recharts.org/) for data visualisation
- [Vercel Analytics](https://vercel.com/analytics)

## Local Development (Docker)

The recommended way to run locally. All dependencies and build artifacts stay inside the container — nothing is installed on your machine.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose

### Setup

1. Clone the repo and copy the env template:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set a secure password:

   ```env
   POSTGRES_USER=expenses
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=expenses
   DATABASE_URL=postgres://expenses:your_secure_password@localhost:5432/expenses
   ```

3. Start the stack:

   ```bash
   make up
   ```

Once the containers are up, open the app in your browser:

- **Same machine:** [http://localhost:3000](http://localhost:3000)
- **Remote machine / server:** `http://<your-server-ip>:3000`

The database schema is applied automatically on first run.

Other useful commands:

```bash
make logs      # tail container logs
make down      # stop the stack
make restart   # restart containers
make ps        # show container status
```

> `.env` and `.env.local` are gitignored — secrets are never committed to the repo.

## Manual Setup (without Docker)

### Prerequisites

- Node.js 18+
- A running Postgres instance or a [Neon](https://neon.tech/) database

### Setup

1. Copy the env template and fill in your database URL:

   ```bash
   cp .env.example .env.local
   # edit .env.local and set DATABASE_URL
   ```

2. Run the setup script (installs deps + runs migration):

   ```bash
   bash scripts/setup.sh
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Project Structure

```
app/
  api/expenses/route.ts          # GET and POST endpoints
  page.tsx                       # Main tabbed UI
components/
  expense-form.tsx               # Add expense form
  expense-list.tsx               # Recent expenses list
  expense-summary.tsx            # Summary stat cards
  expense-analytics.tsx          # Charts and category breakdown
docker/
  docker-compose.yml             # Docker stack definition
  .dockerignore                  # Docker build exclusions
scripts/
  001_create_expenses_table.sql  # DB schema
  setup.sh                       # One-shot local setup script
.env.example                     # Safe env template (committed)
.env                             # Local secrets (gitignored)
Makefile                         # Shorthand commands for Docker
```

## Deployment

This project deploys with minimal effort on three platforms — all need only a [Neon](https://neon.tech/) `DATABASE_URL` and a GitHub connection.

| Platform | Effort | Notes |
|---|---|---|
| Vercel | Click button above | Prompts for `DATABASE_URL` during setup |
| Railway | Click button above | Set `DATABASE_URL` in project Variables tab |
| Render | Click button above | Set `DATABASE_URL` in Environment tab |

### Vercel
Click the deploy button — it will prompt you to enter `DATABASE_URL` before deploying.

### Railway
1. Click the deploy button and import the repo
2. Go to your service → **Variables** → add `DATABASE_URL` with your Neon connection string
3. Redeploy

### Render
1. Click the deploy button and connect the repo
2. During setup (or after, under **Environment**) add `DATABASE_URL` with your Neon connection string
3. Deploy

### After deploying (all platforms)
Run the database migration once against your Neon database:

```bash
psql $DATABASE_URL -f scripts/001_create_expenses_table.sql
```

Or paste `scripts/001_create_expenses_table.sql` directly into the [Neon SQL editor](https://console.neon.tech).
