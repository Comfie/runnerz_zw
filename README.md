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

## Railway Deploy

1. Create a Railway project.
2. Add a Postgres database.
3. Add a service from this Git repository.
4. Set all variables from `.env.example`.
5. Set the release command to:

```bash
npx prisma migrate deploy
```

The deployed app serves the event list at `/`. Payment remains off-platform in v1; organiser payment instructions live in each event's `paymentInfo`.
