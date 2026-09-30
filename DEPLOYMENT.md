# Letter Share Deployment

## Required Firebase configuration

Before the first production build, add these public Firebase variables in the hosting platform:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

These are browser configuration values and are expected to be present at **build time**. After changing them, trigger a new deployment.

Server-side Firebase Admin operations additionally require:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Never prefix Firebase Admin credentials with `NEXT_PUBLIC_`.

## Vercel

- Root Directory: repository root, the directory containing `package.json`.
- Framework: Next.js
- Install Command: `npm install --include=dev`
- Build Command: `npm run vercel-build`
- Node: 22.x

## Netlify

- Base directory: repository root, the directory containing `package.json`.
- Build command: `npm run build`
- Publish directory: `.next`
- Node: 22.x
- Netlify Next.js Runtime is pinned through `@netlify/plugin-nextjs`.

## Runtime protection

If the public Firebase variables are missing or Firebase initialization fails, Letter Share now displays a setup/error screen instead of throwing an unhandled client-side exception.
