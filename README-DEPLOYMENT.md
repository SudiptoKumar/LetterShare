# Direct Deployment Setup

Letter Share is configured as a standard Next.js application for both Vercel and Netlify. Both packages use npm and Node 22, with the same application source.

## Firebase environment variables

Set all six `NEXT_PUBLIC_FIREBASE_*` variables before building. Set the three server-only Firebase Admin variables for verification/server actions. A redeploy is required after adding or changing environment variables because Next.js inlines public variables into the browser build.

If configuration is missing, the application now shows exactly which public variables are missing instead of the generic Next.js client exception.

This ZIP is the Netlify-specific package. Upload the repository root containing `package.json` and `netlify.toml`.
