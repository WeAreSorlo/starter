// npm run setup: the env files, the database, its migrations, the sample content and the site's two keys, in that
// order. Run again on a site with content, it stops at the import, which loads the samples only into a site with none.
import { spawnSync } from 'node:child_process'
import type { SpawnSyncOptions } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
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
sorlo(['import'])

// A site that just took the samples is new, so any keys from an earlier database are gone with it
set(webEnv, 'SORLO_TOKEN', makeKey('Website', '--types'))
set(webEnv, 'SORLO_PREVIEW_TOKEN', makeKey('Previews', '--preview'))
console.log(`Made the site's keys, Website and Previews, in ${webEnv}.`)
console.log('\nDone. Run npm run dev, then open the link it prints to make the first account.')

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

// Runs the cms workspace's sorlo, stopping setup with its message if it fails
function sorlo(args: Array<string>, options: SpawnSyncOptions = { stdio: 'inherit' }) {
  const result = spawnSync('npm', ['exec', '--workspace', 'cms', '--', 'sorlo', ...args], {
    ...options,
    // npm is npm.cmd on Windows, which only a shell runs
    shell: process.platform === 'win32',
  })
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
