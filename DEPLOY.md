# NEXA — Group 1 Deployment Guide
## From zero to live in ~45 minutes

---

## STEP 1 — Set up Supabase (10 min)

1. Go to **supabase.com** → Create account → New project
2. Name it `nexa` → choose a strong DB password → pick region closest to you (e.g. EU West)
3. Wait ~2 minutes for it to provision

4. Go to **SQL Editor** → New Query
5. Paste the entire contents of `database/schema.sql`
6. Click **Run** — you should see "Success, no rows returned"

7. Go to **Settings → API**
8. Copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

9. Go to **Authentication → URL Configuration**
10. Add Site URL: `https://your-domain.com` (or `http://localhost:3000` for dev)
11. Add Redirect URL: `https://your-domain.com/auth/callback`

---

## STEP 2 — Get your API keys (5 min)

### Anthropic (Claude API)
1. Go to **console.anthropic.com** → API Keys → Create Key
2. Copy the key → `ANTHROPIC_API_KEY`

### Stripe (payments — can skip for now, add when ready)
1. Go to **dashboard.stripe.com** → Developers → API Keys
2. Copy publishable key and secret key
3. Skip webhook setup until you're ready to go live

### Resend (email — can skip for now)
1. Go to **resend.com** → Create account → API Keys
2. Copy key → `RESEND_API_KEY`

---

## STEP 3 — Set up the project locally (5 min)

```bash
# 1. Create a GitHub repo called "nexa" at github.com
#    Then clone it locally:
git clone https://github.com/YOURUSERNAME/nexa.git
cd nexa

# 2. Copy all files from this package into that folder

# 3. Install dependencies
npm install

# 4. Create your local environment file
cp .env.example .env.local
# Open .env.local and fill in your Supabase + Anthropic keys

# 5. Copy the landing page to public folder
cp path/to/nexa_landing.html public/landing.html

# 6. Run locally
npm run dev
# → Opens at http://localhost:3000
```

**Test checklist locally:**
- [ ] `localhost:3000` redirects to `/landing` (landing page shows)
- [ ] `localhost:3000/auth/signup` shows signup form
- [ ] Can create an account (check Supabase → Authentication → Users)
- [ ] Confirmation email arrives (check spam)
- [ ] After confirming, redirected to `/onboarding`
- [ ] Can create a workspace
- [ ] Dashboard loads at `/dashboard`
- [ ] Nexa AI chat responds (requires Anthropic API key)

---

## STEP 4 — Deploy to Vercel (10 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project folder
vercel

# Follow prompts:
# - Link to your GitHub repo: Yes
# - Framework: Next.js (auto-detected)
# - Root directory: ./
# - Build command: next build (default)
# - Output dir: .next (default)
```

**OR use the Vercel dashboard (easier):**
1. Go to **vercel.com** → New Project
2. Import your GitHub repo
3. Framework: Next.js (auto-detected)
4. Click **Deploy**

**Add environment variables in Vercel:**
1. Vercel project → Settings → Environment Variables
2. Add ALL variables from `.env.example` with your real values
3. Redeploy after adding vars: `vercel --prod`

---

## STEP 5 — Connect your domain (10 min)

1. Buy domain at **Namecheap** or **Cloudflare** (e.g. nexaapp.com)
2. In Vercel → Project → Settings → Domains → Add domain
3. Follow Vercel's DNS instructions (usually add 2 DNS records)
4. Wait 5-30 minutes for DNS to propagate
5. Update Supabase:
   - Authentication → URL Configuration → Site URL: `https://yourdomain.com`
   - Add Redirect URL: `https://yourdomain.com/auth/callback`

---

## STEP 6 — Final checks

```bash
# Test production build locally before deploying:
npm run build
npm run start
```

**Production checklist:**
- [ ] Landing page loads at your domain
- [ ] Sign up flow works end to end
- [ ] Email confirmation arrives and redirects correctly
- [ ] Dashboard loads with user's name
- [ ] Nexa AI chat sends and receives messages
- [ ] Credits show as 200 (trial balance)
- [ ] All 7 sections are accessible (most show "Coming soon")

---

## WHAT YOU HAVE AFTER GROUP 1

```
✓ Landing page live at your domain
✓ /auth/signup — working signup with email confirmation
✓ /auth/login — working login
✓ /auth/callback — email confirmation handler
✓ /onboarding — workspace creation + brand upload (analysis stubbed)
✓ /dashboard — full shell: rail, topbar, chat panel
✓ /dashboard — home page with real data from Supabase
✓ /dashboard/studio (etc.) — all 7 sections (placeholders for now)
✓ /api/chat — Nexa AI connected to real Claude API
✓ Full database schema — all tables, RLS, indexes
✓ Credit system — balance tracked per workspace
✓ Activity log — every action recorded
```

## READY FOR GROUP 2

Next session we build:
- Nexa AI chat with full brand context + tool calls
- Studio section — real content generation (Claude for copy, Seedream for images)
- Strategy section — 30-day plan generation
- Real brand analysis during onboarding (not stubbed)
- Credit deduction on every generative action

---

## TROUBLESHOOTING

**"Cannot find module '@/lib/supabase/client'"**
→ Make sure tsconfig.json has `"paths": { "@/*": ["./*"] }`

**"Auth session missing" in middleware**
→ Make sure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set in .env.local

**Dashboard shows blank / redirects to login**
→ User might not be confirmed. Check Supabase → Auth → Users → confirm manually

**Chat returns error**
→ Check ANTHROPIC_API_KEY is set correctly and has credits

**Supabase RLS blocking queries**
→ Check that the `is_workspace_member` function was created (run schema.sql again)
