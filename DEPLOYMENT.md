# Letter Share Deployment

## Netlify
- Build command: `npm run build`
- Publish directory: `.next`
- Node.js: 22.x
- `netlify.toml` uses npm directly and does not require Corepack/pnpm.
- Configure the Firebase environment variables from `.env.example` in Netlify Site settings.

## Vercel
- Framework: Next.js
- Build command: `npm run build`
- Install command: `npm install --include=dev --no-audit --no-fund`
- Output directory: `.next`
- Node.js: 22.x
- Configure the Firebase environment variables from `.env.example` in Vercel Project Settings.

## Important
Do not upload `.env` or Firebase private credentials to GitHub. The Firebase Web SDK `NEXT_PUBLIC_*` values are intended for browser use; Admin credentials must remain server-side secrets.
