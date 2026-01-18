# Contributing

## Getting started

1. Clone the repositor to your local machine

   ```bash
   git clone https://github.com/move-ev/spesen-app.git
   cd spesen-app
   ```

2. Install Node.js (LTS version recommended)

   > **Note:** This project is configured to use [nvm](https://github.com/nvm-sh/nvm) to manage the local Node.js version, as such this is simplest way to get you up and running.

   ```bash
   nvm install
   nvm use
   ```

3. Install pnpm if you haven't already:

   > Note: This project is configured to manage pnpm via corepack. Once installed, upon usage you'll be prompted to install the correct pnpm version

   Alternatively, use npm to install it:

   ```bash
   npm install -g pnpm
   ```

4. Install dependencies:

   ```bash
   pnpm install
   ```

5. Create a `.env` file by copying the `.env.example` file:
   - On Unix-based systems:

     ```bash
     cp -n .env.example .env
     ```

   - On Windows:
     ```bash
     copy /Y .env.example .env
     ```

6. Start and migrate the database:

   ```bash
   docker compose up -d
   pnpm db:migrate
   ```

7. Start the development server:

   ```bash
   pnpm dev
   ```