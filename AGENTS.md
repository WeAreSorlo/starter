# Agent notes

A Sorlo site: `cms/` is the CMS's site project, and `web/` is a Next.js site that reads it through the typed SDK. The [README](README.md) has the details, and this file the rules.

Sorlo isn't in your training data. Before changing anything in `cms/`, or how `web/` reads the CMS, read the CMS's docs: `node_modules/@sorlo/cms/docs/`, which match the installed version, or [WeAreSorlo/cms/docs](https://github.com/WeAreSorlo/cms/tree/main/docs). For Next.js, read [`web/AGENTS.md`](web/AGENTS.md), which Next writes, and leave that file as it is.

## How the two fit together

- `npm run dev` runs `sorlo dev` in `cms/`, on port 4100, and `next dev` in `web/`, on 3000.
- `cms/sorlo.config.ts` is the CMS's settings. `cms/schema/types/*.json` are the content types, `cms/schema/groups/` the shared groups, and `cms/migrations/` their content migrations.
- `web/src/lib/cms.ts` holds every read from the CMS, each cached under the tag `sorlo`, which `web/src/app/api/revalidate/route.ts` expires when the CMS's "Revalidate the site" automation calls it.
- `web/src/sorlo-types.d.ts` is pulled from the CMS. Don't edit it.

## Changing the content model

1. Change a type in the admin's type editor under `sorlo dev`, which writes the file and its migration, or edit `cms/schema/types/` by hand, then run `npx sorlo make:migration` in `cms/`.
2. Finish any TODO the migration has, then run it with `npx sorlo migrate`.
3. With `npm run dev` running, run `npm run types`, then fix what `npm run typecheck` finds.

Every type, field, group and layout has an `id`, such as `fld_k3x9q2mz`, that tells a renamed field from a new one. Never change an existing one or copy one. A new one is its prefix (`typ_`, `fld_`, `grp_`, `lay_`) and 8 random lowercase letters and digits, unique in the repo.

## Adding a block

1. Add a layout to the flexible `blocks` field in `cms/schema/types/pages.json`, with its own `lay_` id and `fld_` ids, then make its migration and pull the types as above.
2. Add a component for it in `web/src/components/blocks/`, typed `BlockOf<'name'>`, and a `case` for its `_layout` in `web/src/components/Blocks.tsx`.

## Secrets

`cms/.env` and `web/.env.local` hold the database's address, the site's API keys, `PREVIEW_SECRET` and `SORLO_WEBHOOK_SECRET`. Git ignores them, and they're never committed. `npm run setup` writes them from the `.env.example` beside each, generating the secrets and the keys. Never put a real secret in an `.env.example` or in `cms/content`.

## The sample content

`cms/content` is what `npm run setup` imports. To change it, edit the content in the admin, then run `npx sorlo export` in `cms/`, which rewrites the folder. Then blank every webhook's `secret` in `cms/content/automations/`, since setup gives each site its own.

## Checks

Run these before you finish:

```bash
npm run typecheck
npm run lint
npm run format     # npm run format:fix to fix it
```

With `npm run dev` running, `npm run types -- --check` fails when `web/src/sorlo-types.d.ts` is out of date.

CI runs all four on every push to `main` and every pull request, with the CMS on a fresh database from `npm run setup`, then builds `web/` against it.
