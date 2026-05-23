# FactoryVoice

AI-powered customer assistant for small manufacturing businesses in India.

A field agent visits a factory, collects business data via a mobile web app, and generates an AI chatbot in 30 minutes — no Meta API, no app installs, no technical effort from the factory owner.

---

## How It Works

1. **Agent visits** the factory and fills a 6-section profile form on their phone
2. **AI generates** a custom system prompt (bot brain) from the factory data using Claude
3. **Agent sets up** a WhatsApp Business auto-reply with a unique chat link
4. **Buyers click** the link, enter their phone number, and chat with the AI
5. **Owner logs in** to the dashboard to view captured leads and chat history

---

## Three Interfaces

| Interface | URL | Users |
|---|---|---|
| Agent App | `/agent/login` | Field agents — data collection & bot setup |
| Customer Chat | `/chat/:slug` | Buyers — public, no login required |
| Owner Dashboard | `/owner/login` | Factory owners — leads, chats, profile editor |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **UI**: Tailwind CSS
- **Database + Auth**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude (Sonnet for brain generation, Haiku for chat)
- **Hosting**: Vercel
- **Auth**: Custom JWT (bcrypt PIN for agents, bcrypt password for owners)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/pkBunzoGit/factory-voice.git
cd factory-voice
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial.sql`
3. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from Settings → API

### 3. Get an Anthropic API key

Sign up at [console.anthropic.com](https://console.anthropic.com) and generate an API key.

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 5. Run the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Seed Test Accounts (Development Only)

**Create a test agent:**
```bash
curl -X POST http://localhost:3000/api/agent/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@test.com","name":"Test Agent","pin":"123456"}'
```

**Create a test owner** (after creating a factory via the agent app):
```bash
curl -X POST http://localhost:3000/api/owner/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@factory.com","name":"Mr. Owner","password":"test123","factory_id":"<factory-uuid>"}'
```

---

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add the 4 environment variables in **Settings → Environment Variables**
4. Deploy — auto-deploys on every `git push` thereafter

---

## Project Structure

```
src/
  app/
    agent/          # Agent App pages (login, dashboard, visit form, brain generation)
    owner/          # Owner Dashboard pages (login, dashboard)
    chat/[slug]/    # Public customer chat page
    api/            # All API routes
  components/
    ui/             # Button, Input, TextArea, Card
    forms/          # Multi-step form components for agent app
  lib/
    auth.ts         # JWT creation, verification, cookie management
    claude.ts       # Anthropic client and model config
    validators.ts   # Zod schemas for all forms and APIs
    types.ts        # TypeScript interfaces for DB tables
    supabase/       # Supabase client, server, and middleware helpers
supabase/
  migrations/       # SQL schema (run this first in Supabase SQL Editor)
  seed.sql          # Reference seed data
```

---

## AI Models Used

| Task | Model |
|---|---|
| Bot brain generation | `claude-sonnet-4-6` |
| Live customer chat | `claude-haiku-4-5-20251001` |

---

## Version

**v1.0 — Web-Chat Model**
No Meta API integration. No native app. Fully browser-based.
