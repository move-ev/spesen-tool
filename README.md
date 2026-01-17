# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Getting Started

### Database Setup

This project uses PostgreSQL. The easiest way to get started is using Docker Compose:

1. Start the database:
   ```bash
   docker-compose up -d
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spesen_tool"
   BETTER_AUTH_SECRET="your-secret-key-here"
   BETTER_AUTH_GITHUB_CLIENT_ID="your-github-client-id"
   BETTER_AUTH_GITHUB_CLIENT_SECRET="your-github-client-secret"
   NODE_ENV="development"
   ```

3. Run database migrations:
   ```bash
   pnpm db:generate
   ```

4. (Optional) Open Prisma Studio to view your database:
   ```bash
   pnpm db:studio
   ```

To stop the database:
```bash
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v
```

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
