# Expenses

A personal expense tracker — log spending, view summaries, and explore analytics.

**[Live Demo →](https://v0-expense-tracking-app-gilt.vercel.app/)**

<a href="https://vercel.com/new/clone?repository-url=https://github.com/sethusrinivasan/ExpenseTracker&env=DATABASE_URL&envDescription=Neon%20Postgres%20connection%20string.%20Get%20it%20from%20https://console.neon.tech&envLink=https://neon.tech"><img src="https://vercel.com/button" alt="Deploy with Vercel" height="44" /></a>&nbsp;
<a href="https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/sethusrinivasan/ExpenseTracker"><img src="https://img.shields.io/badge/Deploy%20to%20AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="Deploy to AWS" height="44" /></a>&nbsp;

<a href="https://railway.com/new/template?template=https://github.com/sethusrinivasan/ExpenseTracker&envs=DATABASE_URL&DATABASE_URLDesc=Neon%20Postgres%20connection%20string"><img src="https://railway.com/button.svg" alt="Deploy on Railway" height="28" /></a>&nbsp;
<a href="https://render.com/deploy?repo=https://github.com/sethusrinivasan/ExpenseTracker"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="28" /></a>&nbsp;
<a href="https://portal.azure.com/#create/Microsoft.StaticApp"><img src="https://img.shields.io/badge/Azure-0078D4?style=flat-square&logo=microsoftazure&logoColor=white" alt="Deploy to Azure" height="28" /></a>&nbsp;
<a href="https://deploy.cloud.run/?git_repo=https://github.com/sethusrinivasan/ExpenseTracker"><img src="https://img.shields.io/badge/GCP-4285F4?style=flat-square&logo=googlecloud&logoColor=white" alt="Deploy to GCP" height="28" /></a>

> Built with [Next.js 15](https://nextjs.org/), [Neon Postgres](https://neon.tech/), [shadcn/ui](https://ui.shadcn.com/), [Recharts](https://recharts.org/). Developed with AI assistance (v0 + Kiro).

## Local Development

Requires [Docker](https://docs.docker.com/get-docker/). Nothing installs on your machine.

```bash
cp .env.example .env        # fill in a password
make up                     # starts app + postgres
```

Open **http://localhost:3000** (or `http://<server-ip>:3000` if running remotely).

```bash
make logs / make down / make restart
```

## Deployment

All platforms need a [Neon](https://neon.tech/) `DATABASE_URL`. Click a button above, set the env var, then run the migration once:

```bash
psql $DATABASE_URL -f scripts/001_create_expenses_table.sql
```

| Platform | Where to set `DATABASE_URL` |
|---|---|
| Vercel | Prompted during clone setup |
| Railway | Service → Variables |
| Render | Service → Environment |
| AWS Amplify | App → Environment variables |

## Optional Auth

GitHub and Google OAuth are supported via [Auth.js](https://authjs.dev/). Uncomment and fill in the relevant vars in `.env`:

```env
AUTH_SECRET=          # openssl rand -base64 32
GITHUB_ID=            # github.com/settings/developers
GITHUB_SECRET=
GOOGLE_ID=            # console.cloud.google.com/apis/credentials
GOOGLE_SECRET=
```

Callback URLs: `http://localhost:3000/api/auth/callback/github` and `.../google`.
