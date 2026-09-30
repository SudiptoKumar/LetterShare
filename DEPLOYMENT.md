# Deployment

## Vercel
- Root Directory: repository root, the directory containing `package.json`.
- Framework: Next.js
- Install Command: `npm install --include=dev`
- Build Command: `npm run vercel-build`
- Node: 22

## Netlify
- Root directory: repository root, the directory containing `package.json`.
- Build command: `npm run build`
- Publish directory: `.next`
- Node: 22

## Important
The Git repository must contain `package.json` at the selected root. Vercel will report `No Next.js version detected` if its Root Directory points at a folder that does not contain this file.
