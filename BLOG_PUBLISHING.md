# Publishing Friday Notes

Every post uses the shared article layout. The comment composer, like count, and share menu appear inside each post, with an independent conversation identified by its canonical article path.

## Supabase setup (once)

1. Open the website's Supabase project.
2. In SQL Editor, paste and run `supabase/reader-conversations.sql` from this branch. It creates only the dedicated reader tables and functions; rerunning preserves existing reader data.
3. In Authentication → Sign In / Providers, enable anonymous sign-ins. This lets the browser create a guest session silently, with no email, password, Google, or GitHub prompt for readers. Use a dedicated project, or check existing authenticated policies before enabling this in a shared project.
4. Get the Project URL and **publishable key** from the project's Connect dialog or API settings. A legacy **anon** key also works. Put these two browser-public values in `_config.yml` as `supabase_url` and `supabase_publishable_key`.
5. Merge the branch and wait for the Pages deployment. Verify a comment and like from two separate browser sessions before announcing availability.

Never put a secret key, service_role key, database password, management token, or login credential in this repository.

## Reader experience

Visitors read comments without any guest account being created. The first comment or like creates a Supabase anonymous session, remembered in that browser. The heart changes state and the shared count updates after the server confirms the change. Clicking again removes that visitor's like. Comments appear immediately, newest first, with pagination for older comments. Failed submissions retain the draft. Sharing offers app destinations, Copy link, and the device's native share sheet when supported.

Each guest can like a post once per browser session. Clearing browser data or using a different device creates a new guest identity; this is not a verified unique-person count.

## Data access and moderation

Reader tables live in a private schema with row-level security enabled and no direct browser access. Public functions expose only names, comments, dates, and aggregate counts. Authenticated guest functions use the caller's verified identity, accept no caller-supplied author ID, and scope changes to that visitor. Comment submission is idempotent, limited to 2000 characters, 20 comments per visitor per day, with a 15-second gap across posts. Supabase's anonymous-auth limits still apply; per-user limits do not prevent a determined bot from creating more guest identities.

Moderate reader content through the project's SQL Editor with owner access. No browser user can alter other readers' comments or likes. Existing GitHub issue conversations remain archived in GitHub; they are not automatically imported.

## New posts

Create `_posts/YYYY-MM-DD-title.md` with title, category, date, and excerpt. The shared layout handles each new post automatically; no new issue, discussion, or database registration is needed. Keep the canonical article path stable so comments stay attached to the article.

## Verification

From this repository run `npm install --prefix tests`, then `npm test --prefix tests`. The database suite exercises the SQL in a real PostgreSQL engine (PGlite), including permissions, separate posts and visitors, duplicate requests, quotas, pagination, and migration reruns. The DOM suite verifies like/unlike states, retained drafts, safe comment rendering, and no navigation. A live-project test is still required after configuration; local tests do not prove a deployed Supabase connection.
