# Todo HQ Web

Todo HQ Web is a responsive task dashboard for organizing work by priority, status, category, client, and deadline. It includes focus tools, time tracking, drag-and-drop ordering, and portable JSON backups.

This repository is the public-facing version of Todo HQ. Do not add private client records, production credentials, or personal task data to it.

## Features

- Priority-based task board
- Add, edit, reorder, and delete task cards
- Status, category, client, and deadline tracking
- Focus mode with task checklists and notes
- Per-task time tracking
- Daily and monthly time summaries
- Client logo support
- JSON backup import and export
- CSV time-summary export
- Responsive layouts for desktop, laptop, tablet, and mobile screens

## Current data model

Task and client data is currently saved in the browser using `localStorage`.

This means:

- Data remains on the device and browser where it was created.
- Different browsers and devices do not automatically share data.
- Clearing browser storage can remove saved data.
- Reinstalling or redeploying the app does not migrate user data.
- Users should export JSON backups regularly.

Browser storage is appropriate for a demonstration or single-device installation. A public multi-user deployment should replace it with authenticated server-side storage before accepting real user data.

## Recommended production architecture

For persistent multi-device accounts, use:

- Next.js server routes or server actions
- Secure authentication and server-managed sessions
- PostgreSQL or another production database
- Per-user ownership checks for every task operation
- Input validation, rate limiting, HTTPS, and automated backups

The browser should communicate with the application server. It should never connect directly to the database or be trusted to establish record ownership.

## Local development

### Requirements

- Node.js 20.9 or newer
- npm

### Installation

```bash
git clone <repository-url>
cd todo-hq-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development server listens on all network interfaces, so it can also be tested from another device on the same trusted network.

## Available commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Create a production build before deployment:

```bash
npm run build
npm run start
```

## Configuration

The project uses:

- Next.js
- React
- TypeScript
- Tailwind CSS

If environment variables are introduced, document their names in `.env.example`. Never commit `.env`, `.env.local`, access tokens, database credentials, or other secrets.

## Backups

Use the application's JSON export feature to create a complete task backup. Keep exported backups outside the repository because they may contain private task and client information.

The CSV export contains time-tracking summaries and is intended for reporting rather than full restoration.

## Deployment notes

Before exposing the application publicly:

1. Replace all seed data with fictional examples.
2. Remove private images, client names, notes, and exported backups.
3. Verify that no credentials or environment files are tracked by Git.
4. Add authentication and server-side persistence if users need accounts or cross-device data.
5. Serve the application through HTTPS.
6. Configure monitoring and backups for any server-side database.

## Privacy and security

The current browser-local version does not provide user accounts, shared synchronization, or centralized recovery. Do not represent browser-local data as cloud-backed or permanently recoverable.

Any future multi-user backend must verify the authenticated user's ownership of every record on the server. A user ID submitted by the browser is not sufficient authorization.

## License

No license has been selected. Unless a license file is added, the source is not automatically licensed for redistribution or reuse.
