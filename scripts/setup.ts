// npm run setup: the env files, the database, its migrations, the sample content and the site's two keys, in that
// order. Run again, it leaves a site that has content as it is, and makes only the keys web/.env.local is missing.
import { spawnSync } from 'node:child_process'
import type { SpawnSyncOptions } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import pg from 'pg'

const cmsEnv = 'cms/.env'
const webEnv = 'web/.env.local'

for (const [example, file] of [
  ['cms/.env.example', cmsEnv],
  ['web/.env.example', webEnv],
]) {
  if (existsSync(file)) continue
  copyFileSync(example, file)
  console.log(`Wrote ${file} from ${example}.`)
}

// The CMS puts the secret in its preview links and the site checks it, so both files hold the same one
const cms = read(cmsEnv)
const secret = cms.PREVIEW_SECRET || read(webEnv).PREVIEW_SECRET || randomBytes(32).toString('hex')
set(cmsEnv, 'PREVIEW_SECRET', secret)
set(webEnv, 'PREVIEW_SECRET', secret)

// The environment wins over the file, as it does for sorlo itself
const databaseUrl = process.env.DATABASE_URL || cms.DATABASE_URL
if (!databaseUrl) fail(`Set DATABASE_URL in ${cmsEnv}.`)
await createDatabase(databaseUrl).catch((error) => {
  const { host } = new URL(databaseUrl)
  fail(
    error.code === 'ECONNREFUSED'
      ? `Postgres isn't answering at ${host}. Start it with npm run db, or point DATABASE_URL in ${cmsEnv} at yours.`
      : `Couldn't create the database: ${error.message}`,
  )
})

sorlo(['migrate'])

let imported = false
if (await hasContent(databaseUrl)) {
  console.log('The site has content already, so setup imports nothing.')
} else {
  // The samples' revalidate webhook gets a secret of the site's own, which only its .env.local knows
  const webhookSecret = read(webEnv).SORLO_WEBHOOK_SECRET || `whsec_${randomBytes(24).toString('base64')}`
  set(webEnv, 'SORLO_WEBHOOK_SECRET', webhookSecret)
  await importSamples(webhookSecret)
  imported = true
}

// Each key the site is missing, and both for a site the samples just went into, since keys from an earlier database
// aren't in it
const web = read(webEnv)
for (const [variable, name, permission] of [
  ['SORLO_TOKEN', 'Website', '--types'],
  ['SORLO_PREVIEW_TOKEN', 'Previews', '--preview'],
]) {
  if (web[variable] && !imported) continue
  set(webEnv, variable, makeKey(name, permission))
  console.log(`Made the key ${name}, as ${variable} in ${webEnv}.`)
}
if (!web.SORLO_WEBHOOK_SECRET && !imported) {
  console.log(`Copy the signing secret of the "Revalidate the site" automation into SORLO_WEBHOOK_SECRET in ${webEnv}.`)
}
console.log('\nDone. Run npm run dev, which prints a link for making the first account while nobody has one.')

// Whether the site has anything that sorlo import won't load the samples over, as it checks it
async function hasContent(url: string) {
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    const tables = ['entries', 'media', 'forms', 'automations'].map((table) => `EXISTS (SELECT 1 FROM ${table})`)
    const { rows } = await client.query(`SELECT ${tables.join(' OR ')} AS has`)
    return rows[0].has as boolean
  } finally {
    await client.end()
  }
}

// Imports cms/content through a copy whose webhooks without a secret take the site's, so its /api/revalidate can check
// their requests
async function importSamples(secret: string) {
  const folder = await mkdtemp(join(tmpdir(), 'sorlo-content-'))
  let status: number | null
  try {
    await cp('cms/content', folder, { recursive: true })
    const automations = join(folder, 'automations')
    for (const file of existsSync(automations) ? await readdir(automations) : []) {
      const automation = JSON.parse(await readFile(join(automations, file), 'utf8'))
      for (const action of automation.actions)
        if (action._layout === 'webhook' && !action.secret) action.secret = secret
      await writeFile(join(automations, file), JSON.stringify(automation, null, 2))
    }
    console.log('Importing cms/content, with the webhook secret in web/.env.local:')
    status = run(['import', folder]).status
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
  if (status !== 0) process.exit(status ?? 1)
}

// Creates the database DATABASE_URL names unless it's there, through the server's postgres database
async function createDatabase(url: string) {
  const database = new pg.Client({ connectionString: url })
  try {
    await database.connect()
    return
  } catch (error) {
    // Anything but "does not exist" is for the caller to explain
    if ((error as { code?: string }).code !== '3D000') throw error
  } finally {
    await database.end().catch(() => {})
  }

  const server = new URL(url)
  const name = decodeURIComponent(server.pathname.slice(1))
  server.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: server.href })
  await admin.connect()
  try {
    await admin.query(`CREATE DATABASE ${admin.escapeIdentifier(name)}`)
    console.log(`Created the database ${name}.`)
  } finally {
    await admin.end()
  }
}

// Runs the cms workspace's sorlo
function run(args: Array<string>, options: SpawnSyncOptions = { stdio: 'inherit' }) {
  return spawnSync('npm', ['exec', '--workspace', 'cms', '--', 'sorlo', ...args], {
    ...options,
    // npm is npm.cmd on Windows, which only a shell runs
    shell: process.platform === 'win32',
  })
}

// Runs the cms workspace's sorlo, stopping setup with its message if it fails
function sorlo(args: Array<string>, options?: SpawnSyncOptions) {
  const result = run(args, options)
  if (result.status !== 0) process.exit(result.status ?? 1)
  return result
}

// sorlo make:api-key asks for a name, then prints the key alone on its last line
function makeKey(name: string, permission: string) {
  const { stdout } = sorlo(['make:api-key', permission], {
    input: `${name}\n`,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
  })
  return String(stdout).trim().split('\n').at(-1)!
}

function read(file: string) {
  return parseEnv(readFileSync(file, 'utf8')) as Record<string, string | undefined>
}

// Sets a variable in an env file, in place of its line if it has one
function set(file: string, key: string, value: string) {
  const text = readFileSync(file, 'utf8')
  const line = new RegExp(`^${key}=.*$`, 'm')
  writeFileSync(
    file,
    line.test(text) ? text.replace(line, () => `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`,
  )
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}
