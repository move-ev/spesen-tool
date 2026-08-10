# Contributing

## Getting started

1. Clone the repositor to your local machine

   ```bash
   git clone https://github.com/zemio-co/zemio.git
   cd zemio
   ```

2. Install Node.js (LTS version recommended)

   > **Note:** This project is configured to use [nvm](https://github.com/nvm-sh/nvm) to manage the local Node.js version, as such this is simplest way to get you up and running.

   ```bash
   nvm install
   nvm use
   ```

3. Install [Bun](https://bun.sh) if you haven't already. This project pins `bun@1.3.14` via `packageManager` in `package.json`:

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

   Alternatively, use npm to install it:

   ```bash
   npm install -g bun
   ```

4. Install dependencies:

   ```bash
   bun install
   ```

5. Create a `.env` file in each of `apps/web`, `apps/api`, and `packages/db` by copying that directory's `.env.example` file, then fill in the values:
   - On Unix-based systems:

     ```bash
     for dir in apps/web apps/api packages/db; do cp -n "$dir/.env.example" "$dir/.env"; done
     ```

   - On Windows:
     ```bash
     for %d in (apps\web apps\api packages\db) do copy /Y %d\.env.example %d\.env
     ```

6. Start and migrate the database:

   ```bash
   docker compose up -d
   cd packages/db && bun run db:migrate
   ```

7. Start the development server:

   ```bash
   bun run dev
   ```