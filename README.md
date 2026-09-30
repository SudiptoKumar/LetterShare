# Letter Share

Letter Share is a Next.js web application for publishing and reading letters, interacting with authors, saving letters, messaging users, and managing community content. The application uses Firebase Authentication, Cloud Firestore, Firebase Storage, and Firebase Admin SDK for parts of the email-verification flow.

## Features

- Email/password authentication and Google sign-in.
- User registration with display name and username handling.
- Email verification flow with custom verification routing.
- Public letter feed with individual letter pages, comments, replies, reactions, views, and sharing.
- Saved letters/bookmarks.
- User profiles and profile editing.
- Real-time chat, conversations, direct messages, notifications, and online presence.
- Private letters between users.
- Content reporting and moderation tools.
- Admin area with dashboard, user management, letter management, moderation, analytics, drafts, and system settings.
- Firebase Storage uploads for letter images.
- Client-side Firestore offline persistence when supported by the browser.
- PWA manifest and bundled application icons.

## How It Works

The application is a Next.js App Router project. The browser uses Firebase Authentication for user sessions and Cloud Firestore for application data. Firebase Storage is used for uploaded media.

The email-verification flow uses Next.js API routes plus a server action backed by the Firebase Admin SDK. Firestore security rules are provided in `firestore.rules`.

Several parts of the interface use Firestore real-time listeners for messages, presence, activity, comments, and related UI updates.

## Project Structure

```text
.
├── actions/                 # Server actions for letter comments/replies
├── admin/                   # Existing admin-related repository files
├── app/                     # Next.js App Router pages and API routes
│   ├── api/                 # Email-verification API routes
│   ├── admin/               # Admin dashboard page
│   ├── chat/                # Real-time chat
│   ├── feed/                # Letter feed
│   ├── letters/[id]/        # Letter detail page
│   ├── messages/            # Conversations and direct messages
│   ├── profile/             # User profile
│   ├── saved/               # Saved letters
│   ├── settings/            # User settings
│   ├── verify-email/        # Email verification UI
│   └── ...                  # Authentication and utility pages
├── components/              # Shared UI and feature components
├── context/                 # Authentication context
├── contexts/                # Additional authentication context implementation
├── hooks/                   # React hooks
├── lib/                     # Firebase, auth, Firestore, and utility helpers
├── middleware/              # Firebase auth middleware helper
├── public/                  # Static assets, icons, and manifest
├── scripts/                 # Utility scripts such as icon generation
├── services/                # Presence, user, and username services
├── src/types/               # Role types
├── styles/                  # Additional global styles
├── types/                   # Domain types
├── utils/                   # Firestore, diagnostics, sharing, and verification utilities
├── firestore.rules          # Cloud Firestore security rules
├── middleware.ts            # Active Next.js middleware
├── next.config.mjs          # Next.js configuration
├── package.json             # Scripts and dependencies
├── pnpm-lock.yaml           # pnpm lockfile
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## Requirements

- Node.js compatible with the Next.js 14.2.16 application. Node 18+ is the practical baseline for this project.
- pnpm, because the repository includes `pnpm-lock.yaml`.
- A Firebase project with Authentication, Firestore, and Storage enabled.
- Firebase Admin credentials for the server-side email-verification flow.

## Installation and Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create `.env.local` in the project root. The repository ignores `.env*` files through `.gitignore`.

#### Client-side Firebase configuration

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

#### Firebase Admin configuration

These variables are used by `lib/firebase-admin.ts` and must only be available to the server:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The application converts escaped `\\n` sequences in `FIREBASE_PRIVATE_KEY` into real newlines when initializing the Admin SDK.

#### Optional emulator flag

`lib/firebase-init.ts` supports:

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

When that initializer is used in development, it targets Auth on `localhost:9099`, Firestore on `localhost:8080`, and Storage on `localhost:9199`.

### 3. Configure Firebase Authentication

Enable these sign-in methods in Firebase Authentication:

- Email/Password
- Google

Add the application's real hostname to Firebase Authentication's authorized domains. The repository currently includes `localhost`, `127.0.0.1`, and `letter-share.vercel.app` in `lib/firebase-config.ts`.

### 4. Configure Firestore and Storage

Create a Firestore database and enable Firebase Storage. Deploy or copy the rules from `firestore.rules` into the Firebase project's Firestore Rules configuration.

The application also expects a Firestore composite index for the `comments` collection using:

| Field | Order |
|---|---|
| `letterId` | Ascending |
| `createdAt` | Ascending |

### 5. Admin account

The current implementation identifies the administrator by the email address `admin@lettershare.com` in several application checks and in `firestore.rules`. Use that exact account for the existing admin path, or update every corresponding check consistently before changing the admin identity.

## Environment Variables and Secrets

| Variable | Used by | Required |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client | Yes |
| `FIREBASE_PROJECT_ID` | Firebase Admin SDK | Yes for server verification flow |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK | Yes for server verification flow |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK | Yes for server verification flow |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | Emulator support in `lib/firebase-init.ts` | Optional |

Do not commit `.env.local` or other environment files containing server credentials.

## Usage and Execution

### Development

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Production build

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

The configured Next.js build intentionally ignores TypeScript and ESLint build failures in `next.config.mjs`, so a successful production build should not be treated as a substitute for linting or type checking.

## Main Routes

| Route | Purpose |
|---|---|
| `/` | Landing page and authentication-aware routing |
| `/login` | Login with email/password or Google |
| `/register` | Account registration |
| `/feed` | Letter feed |
| `/letters/[id]` | Letter details, comments, reactions, and related actions |
| `/saved` | Saved letters |
| `/profile` | User profile |
| `/settings` | User settings |
| `/notifications` | Notifications UI |
| `/chat` | Real-time chat |
| `/messages` | Conversation list |
| `/messages/[conversationId]` | Individual conversation |
| `/admin` | Admin dashboard |
| `/auth-diagnostics` | Firebase authentication diagnostics |
| `/verify-email` | Email verification UI |
| `/verify-email/error` | Verification error UI |
| `/api/auth/action-handler` | Firebase action-code redirect handler |
| `/api/verify-email` | Email-verification redirect route |

## Configuration

Important project configuration is defined in:

- `next.config.mjs` for Next.js build and image behavior.
- `tailwind.config.ts` for Tailwind, fonts, colors, and animations.
- `components.json` for shadcn/ui aliases and settings.
- `tsconfig.json` for TypeScript and the `@/*` path alias.
- `public/manifest.json` for the PWA manifest.
- `firestore.rules` for Firestore access control.

The project does not include a Firebase CLI configuration file such as `firebase.json`.

## GitHub Actions and Deployment

No `.github/workflows` directory is included in this repository, so there is no repository-defined GitHub Actions pipeline to run or maintain.

The project is a standard Next.js application and can be deployed on a platform that supports Next.js. A deployment must provide the required Firebase environment variables and the corresponding Firebase project configuration.

For a custom deployment domain, update Firebase Authentication's authorized domains and the application's domain allow-list in `lib/firebase-config.ts` as needed.

## Testing

No automated test framework or `test` script is configured in `package.json`.

Use these repository checks before deployment:

```bash
pnpm lint
pnpm build
```

For functional verification, test at minimum:

1. Email/password registration and login.
2. Google sign-in.
3. Email verification.
4. Letter creation, editing, deletion, comments, replies, reactions, views, and saving.
5. Chat, conversations, direct messages, notifications, and presence.
6. Image uploads through Firebase Storage.
7. Admin access and moderation actions.

## Troubleshooting

### Firebase configuration errors

If the application reports missing Firebase configuration, confirm all six `NEXT_PUBLIC_FIREBASE_*` variables are present and restart the development server.

### Google sign-in fails

Check that Google sign-in is enabled in Firebase Authentication and that the current hostname is listed under Firebase Authentication authorized domains.

### Firestore permission errors

Verify that the rules from `firestore.rules` are deployed to the correct Firebase project and that the user is authenticated.

### Comment queries report a missing index

Create the `comments` composite index for `letterId` and `createdAt` described above, then wait for Firebase to finish building it.

### Email verification fails

Verify the three server-side Firebase Admin variables, especially the private key formatting, and make sure the deployed hostname is configured correctly in Firebase Authentication.

### Build passes but code still has type or lint problems

`next.config.mjs` sets both `ignoreDuringBuilds` and `ignoreBuildErrors` to `true`. Run `pnpm lint` separately and review TypeScript errors through your normal editor or TypeScript tooling.

## Maintenance

- Keep `package.json` and `pnpm-lock.yaml` synchronized when dependencies change.
- Review Firebase Authentication authorized domains whenever the deployment hostname changes.
- Keep `firestore.rules` aligned with any changes to Firestore collections or authorization behavior.
- Recheck the required Firestore indexes when adding filtered or ordered queries.
- Treat `FIREBASE_PRIVATE_KEY` and other Admin SDK credentials as server-only secrets.
- Verify both authentication paths and the email-verification flow after Firebase configuration changes.
- Run `pnpm lint` and `pnpm build` before production deployments.
- Review the admin email checks and Firestore `isAdmin()` rule together if administrator access changes.

## License

No license file is included in this repository.
