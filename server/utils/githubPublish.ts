import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com'
const GITHUB_REPO_OWNER = 'its-ash'
const GITHUB_REPO_NAME = 'post-agent'
const GITHUB_BRANCH = 'main'

/**
 * Commits and pushes newly generated post images to GitHub (if not already
 * pushed), then returns their raw.githubusercontent.com URLs. Meta's servers
 * fetch images over the public internet, so this must run before a post's
 * images are ever handed to publishToMeta.
 *
 * `imagePaths` are web-root-relative (e.g. "/generated/foo.png"), matching
 * files on disk at "public/generated/foo.png".
 *
 * Uses the local repo checkout the server process runs from — requires the
 * process to have push access (SSH key or credential helper already set up
 * for `git push`).
 */
export async function pushGeneratedImages(imagePaths: string[]): Promise<string[]> {
  const cwd = process.cwd()
  const repoRelativePaths = imagePaths.map(p => `public${p}`)

  if (repoRelativePaths.length) {
    await run('git', ['add', ...repoRelativePaths], { cwd })

    const { stdout: staged } = await run('git', ['diff', '--cached', '--name-only'], { cwd })
    if (staged.trim()) {
      await run('git', ['commit', '-m', `chore: add generated post images [skip ci]`], { cwd })
      await run('git', ['push', 'origin', GITHUB_BRANCH], { cwd })
    }
  }

  return repoRelativePaths.map(p => `${GITHUB_RAW_BASE}/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${p}`)
}
