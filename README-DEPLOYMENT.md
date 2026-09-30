# Letter Share Deployment

## Vercel

1. Import the repository into Vercel.
2. Keep the project root as `/`.
3. The included `vercel.json` selects the Next.js framework.
4. Set the Firebase environment variables in Project Settings → Environment Variables.
5. Deploy.

Build: `pnpm build`
Install: `pnpm install --frozen-lockfile`
Node: 22.x

## Netlify

1. Import the repository into Netlify.
2. Keep the site base directory at the repository root.
3. The included `netlify.toml` sets the Next.js build command and `.next` output.
4. Set the Firebase environment variables in Site configuration → Environment variables.
5. Deploy.

Build: `pnpm build`
Node: 22.x

## Required Firebase variables

Public client variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Server-only variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Optional:
- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`

The server-only credentials must never be prefixed with `NEXT_PUBLIC_`.

This ZIP is the Vercel-ready distribution.
