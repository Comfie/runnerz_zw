# RunZW

RunZW is a Next.js PWA for discovering and registering for running events in Zimbabwe. Browsing is public; registration, organiser tools, and admin tools use passwordless OTP sign-in.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
npx auth secret
```

Set `DATABASE_URL` to your Postgres connection string. Set Resend and Twilio variables when you want live email and SMS OTP delivery.

3. Configure test database:

Create `.env.test` with a separate Postgres database URL whose database name contains `test`. Tests that hit the database delete rows during cleanup.

4. Apply the schema:

```bash
npx prisma migrate dev --name init
```

5. Run the app:

```bash
npm run dev
```

## Admin Bootstrap

The first user starts as `RUNNER`. Sign in once, then promote that user to `ADMIN`:

```bash
npx prisma studio
```

Set your `User.role` to `ADMIN`.

## Deployment

The app is hosted on **Vercel** and the Postgres database on **Railway**.

1. In Vercel project settings, set every variable from `.env.example`. `NEXT_PUBLIC_APP_URL` must be the public production URL (e.g. `https://runzw.co.zw`) — it is used as the metadata base, so WhatsApp/Facebook link previews break if it points at localhost.
2. Apply database migrations before deploying code that depends on them:

```bash
npx prisma migrate status   # confirm what is pending
npx prisma migrate deploy   # applies pending migrations only, never resets
```

Avoid `prisma migrate dev` against the Railway database — it can prompt to reset the schema on drift. To create a new migration without a local database, generate the SQL read-only and review it first:

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
```

## Time zone

All race times are Zimbabwe time (CAT, `Africa/Harare`, UTC+2, no daylight saving). Servers run in UTC, so never format dates with `toLocale*String([])` directly — use the helpers in `src/lib/format.ts` (`fmtDate`, `fmtTime`, `dateParts`, `parseLocalDateTime`, `toLocalInputValue`).

The deployed app serves the upcoming-race list at `/` (past races are hidden by default). Payment remains off-platform in v1; organiser payment instructions live in each event's `paymentInfo`.
