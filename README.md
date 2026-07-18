# MicroManus

An AI-powered deep research platform that acts as an autonomous agent. MicroManus searches the internet, reads sources, reasons through findings, and generates comprehensive reports with citations.

## Features
- **Autonomous Agent**: Thinks, searches, reasons, and iterates like a human researcher.
- **Deep Internet Search**: Synthesizes information from across the web.
- **PDF Reports**: Generates professional research reports.
- **Usage Analytics**: Tracks costs and tokens.
- **Bring Your Own Keys**: AES-256-GCM encrypted API key storage.
- **Multi-Model Support**: OpenAI, Anthropic, Kimi, and custom endpoints.
- **Pay as you go**: Stripe integration for purchasing credits.

## Setup
1. Copy `.env.example` to `.env` and fill in the values.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npx prisma generate`
4. Run the development server: `npm run dev`

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- TailwindCSS v4
- Prisma (PostgreSQL)
- Supabase (Auth & Database)
- Stripe
- Upstash Redis
