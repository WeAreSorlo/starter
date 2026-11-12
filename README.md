# Sorlo starter

A small site on [Sorlo](https://github.com/WeAreSorlo/cms), the open-source, schema-driven CMS, with sample content that uses each of its features. It's two npm workspaces:

- **`cms/`**, the Sorlo site project: its settings, content types and sample content. `sorlo dev` serves the CMS's API and its admin.
- **`web/`**, a Next.js site that reads the CMS through the typed SDK: pages made of blocks, a blog, previews of drafts, and a contact form.

The sample content explains the starter from inside the site, so once it's running, its blog is a second guide.

## Getting started

You need Node 22.18 or later, as the CMS does, though Node 24 is what its image runs and what flydrive asks for, and Postgres, which Docker can run for you.

```bash
npm install
npm run db      # Postgres 17 in Docker, with the starter's database. Skip it to use your own
npm run setup   # the env files, the database, its migrations, the sample content and the site's keys
npm run dev     # the CMS at http://localhost:4100 and the site at http://localhost:3000
```

`npm run dev` prints a link, `No one has an account yet. Make the first at http://localhost:4100/admin/#/setup/…`. Open it, choose your name, email and password, and you're in the admin. The site at http://localhost:3000 already shows the sample content.

- **Your own Postgres:** copy `cms/.env.example` to `cms/.env` and point its `DATABASE_URL` at yours before `npm run setup`, which keeps a `cms/.env` that's there and creates the database if it's missing. `DATABASE_URL` in the environment works too, but then every command needs it.
- **Running setup again** leaves a site that has content as it is, since the samples only go into a site with none, and makes any key `web/.env.local` is missing. To start over, drop the database, or run `docker compose down -v` to remove the volume of `npm run db`, then `npm run db` and `npm run setup` again, which makes the keys afresh.
- **Another port for the site,** such as when something else has 3000, is `npm run dev -w web -- -p 3001` with `npm run dev -w cms` in another terminal. Change `WEB_URL` in `cms/.env` to match, and the URL of the "Revalidate the site" automation in the admin.

## What's where

| Path                         | What it's for                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`               | The two workspaces, and the scripts that run them together                                                                                 |
| `compose.yaml`               | Postgres for development, with credentials that only this machine can reach                                                                |
| `scripts/setup.ts`           | `npm run setup`                                                                                                                            |
| `cms/sorlo.config.ts`        | The CMS's settings: its database, where media goes, how email is sent, and where the Preview button goes                                   |
| `cms/schema/types/`          | The content types, one JSON file each. In `sorlo dev`, the admin's Content types page edits them                                           |
| `cms/schema/groups/seo.json` | The SEO fields that pages and posts share                                                                                                  |
| `cms/migrations/`            | Content migrations for changes to the types, and `.snapshot.json`, the types as the last migration left them                               |
| `cms/content/`               | The sample content, as `sorlo export` writes it, which `npm run setup` imports                                                             |
| `cms/Dockerfile`             | The CMS's image, for [deploying](#the-cms) it                                                                                              |
| `web/src/lib/cms.ts`         | Every read from the CMS, each cached until something is published                                                                          |
| `web/src/sorlo-types.d.ts`   | The content types and forms as TypeScript, which `npm run types` pulls from the CMS. It's what types the SDK's queries and results         |
| `web/src/app/`               | The routes: the home page, every other page by its address, the blog, and the two routes the CMS calls, `api/preview` and `api/revalidate` |
| `web/src/components/`        | A component for each block's layout in `blocks/`, put together by `Blocks.tsx`, and `CmsForm.tsx`, which renders a form with Sorlo Forms   |
| `cms/.env`, `web/.env.local` | Each app's settings and secrets, which setup writes from the `.env.example` beside each. Git ignores them                                  |

## The content model

- **Pages** are hierarchical, so a page can sit under another, and its address follows its parents' slugs, as About › Team is at `/about/team`. Each is a list of blocks, a flexible field whose layouts are a hero, text, an image, a call to action and a form. Each layout's `_layout` is a component in `web/src/components/blocks/`. The page whose slug is `home` is the site's `/`.
- **Posts** have a title, a date, an **author** (a relationship to an entry of **Authors**), a cover image, an excerpt and a Markdown body. A rich text field is coming to Sorlo, and the content migration that converts the bodies will join this guide when it does.
- **Settings** is a singleton, the site's name and navigation. It has no drafts, so every save goes live, which suits settings that editors expect to change at once.
- **SEO** is a shared group of a title, a description and a share image, which pages and posts use, so the two can't drift apart.
- **The Contact form** lives in the database rather than in `schema/`, since forms change in the admin. The Contact page's form block names it.
- **Two automations:** "Revalidate the site" calls the site's `/api/revalidate` whenever something is published, and "Email contact submissions" emails each one that isn't spam, which `sorlo dev` prints in its terminal.

## The editing loop

In the admin, **Save draft** keeps a change without touching the site, and **Publish** puts it live. Publishing runs "Revalidate the site", whose webhook reaches `web/`'s [`/api/revalidate`](web/src/app/api/revalidate/route.ts). It checks the request's signature with `SORLO_WEBHOOK_SECRET`, then expires the `sorlo` cache tag, under which [`web/src/lib/cms.ts`](web/src/lib/cms.ts) caches every read, so the next visit to any page reads the CMS again. One tag for everything is simplest, since the settings reach every page and blocks can link anywhere. A big site might tag each type instead, and expire only what a publish changed.

Changing the content model is a change to the code:

1. In `sorlo dev`, edit a type on the admin's **Content types** page, or a shared group on **Shared groups**. Saving writes its file in `cms/schema` and a content migration in `cms/migrations`, and shows what the migration does.
2. Finish any TODO the migration has, then run it on the **Migrations** page.
3. With `npm run dev` running, `npm run types` pulls `web/src/sorlo-types.d.ts`, and `npm run typecheck` shows where the site needs to follow the change.
4. Commit the schema, the migration and the types together. Each deploy's release step runs the migration.

[Content types](https://github.com/WeAreSorlo/cms/blob/main/docs/content-types.md) and [content migrations](https://github.com/WeAreSorlo/cms/blob/main/docs/content-migrations.md) in the CMS's docs have the rest.

`npx sorlo export`, run in `cms/`, writes the site's content over `cms/content`, as for a starter of your own, or for sharing content with a team. It holds every webhook's signing secret, which it names as it finishes, so keep such a folder private, or blank the secret before committing it.

## Previews

Every page and post in the admin has a **Preview** button, which opens its saved draft on the site in a new tab:

1. `previews` in [`cms/sorlo.config.ts`](cms/sorlo.config.ts) works out the entry's address on the site, its `uri` for a page and `/blog/<slug>` for a post, as `WEB_URL`'s `/api/preview` with `PREVIEW_SECRET` and the path in its query.
2. [`/api/preview`](web/src/app/api/preview/route.ts) checks the secret, takes only a path on the site, turns on Next's draft mode and goes to the path.
3. In draft mode, the site skips its cache and reads drafts with the preview key, `SORLO_PREVIEW_TOKEN`. A bar along the top says so, and **Exit preview** turns it off.

Preview shows what's saved, so save the draft first. Without `PREVIEW_SECRET` in `cms/.env`, or the host's environment, the admin has no Preview button. Setup writes the same random secret into both env files, and in production the two hosts need the same one. The preview key can read every draft, so it stays on the site's server.

## The contact form

The Contact page's form block holds the form's ID. [`FormBlock`](web/src/components/blocks/FormBlock.tsx) fetches its fields with `cms.form(id).get()`, and [`CmsForm`](web/src/components/CmsForm.tsx) renders them with Sorlo Forms, checks them as the visitor types, and sends them from the browser with the SDK's `submit()`. It sends no key, so each visitor counts against the CMS's rate limit alone. The CMS checks the values again, and when they don't pass, the 422's report shows on the fields. Submissions land in the form's inbox in the admin.

A change to the form's fields in the admin shows on the site within a few minutes, since changing a form publishes nothing to revalidate the site with.

## Settings and secrets

| Variable                | App  | What it holds                                                                                                    |
| ----------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | cms  | Postgres                                                                                                         |
| `APP_URL`               | cms  | The admin's public address, which emailed links and media files' addresses start from                            |
| `WEB_URL`               | cms  | The site's address, which the Preview button opens                                                               |
| `PREVIEW_SECRET`        | both | Preview addresses carry it, and `/api/preview` checks it                                                         |
| `S3_*`                  | cms  | A bucket for media, [below](#the-cms)                                                                            |
| `SMTP_URL`, `MAIL_FROM` | cms  | Email through any SMTP service, such as `smtps://user:password@smtp.example.com`                                 |
| Its provider's key      | cms  | The admin's AI assistant, [below](#the-ai-assistant)                                                             |
| `SORLO_URL`             | web  | The CMS's address, which the site reads and visitors' browsers send the form to                                  |
| `SORLO_TOKEN`           | web  | A key for what's live. Setup's has the `types` permission too, which `npm run types` needs, but the site doesn't |
| `SORLO_PREVIEW_TOKEN`   | web  | A key with the `preview` permission, for draft mode                                                              |
| `SORLO_WEBHOOK_SECRET`  | web  | The secret that "Revalidate the site" signs its requests with                                                    |

Without `SMTP_URL`, `sorlo dev` prints each email in its terminal, and production sends none, so the admin shows invite and reset links once, to pass on, rather than the host's logs keeping them.

`cms/content` holds no signing secret for "Revalidate the site", so setup gives the automation it imports a secret of the site's own, and writes it to `web/.env.local` as `SORLO_WEBHOOK_SECRET`.

### The AI assistant

The admin has an AI assistant once `ai` in `cms/sorlo.config.ts` has a provider, which `npm create sorlo` puts there when you choose one. It sends what it's asked about to the provider, billed to your account with it. A provider is a package, such as `@sorlo/ai-anthropic`, or your own, as the CMS's [assistant page](https://github.com/WeAreSorlo/cms/blob/main/docs/assistant.md) describes. To add one later, install its package from the site's root:

```bash
npm install @sorlo/ai-anthropic --workspace cms
```

Then pass its provider as `ai` in `cms/sorlo.config.ts`, such as `ai: anthropic()`, and set its key in `cms/.env`, and in production in the host's environment, under the name the package reads, such as `ANTHROPIC_API_KEY`.

## Deploying

The CMS and the site deploy separately: the CMS as a Docker image, with Postgres and a bucket, and the site to any host that runs Next.js.

### The CMS

Build its image from the repo's root, where the lockfile is:

```bash
docker build -f cms/Dockerfile -t example-cms .
```

- **Each deploy runs the migrations** before it takes traffic, from the new image, such as in Fly's `release_command` or Render's pre-deploy command: `../node_modules/.bin/sorlo migrate`. It exits 1 when a migration has a TODO left or fails, which stops the deploy.
- **The host provides** Postgres 17 as `DATABASE_URL`, HTTPS in front that sends `X-Forwarded-Proto`, `GET /health` as its health check, and a stop grace of 40 seconds, so a webhook in flight can finish. The CMS's [deploying page](https://github.com/WeAreSorlo/cms/blob/main/docs/deploying.md) has the details, and what to do behind a CDN.
- **Media goes to a bucket** once `S3_BUCKET` is set, with `S3_REGION`, `S3_KEY` and `S3_SECRET`, and `S3_ENDPOINT` for R2, MinIO and other services that speak S3. The bucket stays private, since the CMS serves every file itself. Without a bucket, files go to `/site/cms/storage`, which needs a volume and limits the CMS to one instance.
- **The environment** also holds `APP_URL`, `PREVIEW_SECRET` with `WEB_URL`, for email, `SMTP_URL` with `MAIL_FROM`, and for the assistant, its provider's key. In production, the CMS won't start with `PREVIEW_SECRET` and no `WEB_URL`, or `SMTP_URL` and no `MAIL_FROM`, rather than use development's.
- **The first account** is made with the link the server prints in its log, while nobody has one.

Then:

1. **For the sample content,** run `../node_modules/.bin/sorlo import` once from the image, with the bucket's settings, or the volume the server uses, so its files land where the server reads them. Its two automations need changing in step 3.
2. **On the admin's API keys page,** make the site's two keys: one with no permissions, for `SORLO_TOKEN`, and one with Preview, for `SORLO_PREVIEW_TOKEN`.
3. **On the Automations page,** give the site a webhook that revalidates it:
   - With the samples, "Revalidate the site" calls `http://localhost:3000`, which production's CMS refuses to call. Change its URL to `https://<your site>/api/revalidate`, save, and copy its signing secret to the site's `SORLO_WEBHOOK_SECRET`. Change "Email contact submissions" to send to your address rather than `hello@example.com`, or delete it.
   - Without them, make one: when Entry published, Entry unpublished and File updated, call a webhook at `https://<your site>/api/revalidate`, with its signing secret left empty, so saving makes one for `SORLO_WEBHOOK_SECRET`.

### The site

Any host that runs Next.js 16 can serve `web/`, such as one that builds it from this repo with `web` as its root folder. It needs `SORLO_URL`, `SORLO_TOKEN`, `SORLO_PREVIEW_TOKEN`, `PREVIEW_SECRET` and `SORLO_WEBHOOK_SECRET`.

- **Its build reads the CMS,** to render each page ahead of time, so deploy the CMS first, where the build can reach it.
- **Images** go through Next's optimizer, which takes files from `SORLO_URL`'s `/media/`. That's where media's addresses point when the CMS's `APP_URL` is the same address.
- **Each instance keeps its own cache.** With more than one, the webhook reaches only one of them, so such a host needs a shared cache handler, as Next's [self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting) describes.
- **Once the site has its address,** `forms.origins` and `delivery.origins` in `sorlo.config.ts` can name it, so other sites' scripts can't call those routes.

A page that isn't in the CMS gets the site's not-found page with a 200 status and `noindex`, since Next streams it after the page's first bytes, as its docs on Cache Components describe.

## Checks

```bash
npm run typecheck     # both workspaces and scripts/
npm run lint          # ESLint, with Next's rules
npm run format        # Prettier
npm run types -- --check  # with npm run dev running: fails when web/src/sorlo-types.d.ts is out of date
```

CI, in [`.github/workflows/ci.yml`](.github/workflows/ci.yml), runs all four on every push to `main` and every pull request: `npm ci` and the first three, then `npm run setup` against a Postgres 17 service, `npm run start -w cms` in the background, the types check, and a build of `web/` against the CMS, with the sample content. Setup makes the secrets and keys, so the repo needs none.

[Dependabot](.github/dependabot.yml) offers updates weekly, with Sorlo's packages together in one pull request, so each release of Sorlo arrives as one change for CI to check.
