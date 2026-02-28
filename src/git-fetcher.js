import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Clone a GitHub repo to a temporary directory.
 * @param {string} repoUrl - GitHub repo URL
 * @returns {string} path to cloned repo
 */
export function cloneRepo(repoUrl) {
    const tempDir = mkdtempSync(join(tmpdir(), 'diff-analyzer-'));
    console.log(`📥 Cloning ${repoUrl} ...`);
    execSync(`git clone --quiet "${repoUrl}" "${tempDir}"`, {
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`✅ Cloned to ${tempDir}`);
    return tempDir;
}

/**
 * Get recent commit list.
 * @param {string} repoDir
 * @param {number} count
 * @returns {{ sha: string, message: string }[]}
 */
export function getCommitList(repoDir, count = 10) {
    const raw = execSync(
        `git log --oneline -n ${count} --format="%H||%s"`,
        { cwd: repoDir, encoding: 'utf-8' }
    ).trim();

    if (!raw) return [];

    return raw.split('\n').map((line) => {
        const [sha, ...rest] = line.split('||');
        return { sha: sha.trim(), message: rest.join('||').trim() };
    });
}

/**
 * Get unified diff between two commits.
 * @param {string} repoDir
 * @param {string} sha1
 * @param {string} sha2
 * @returns {string} raw unified diff
 */
export function getDiff(repoDir, sha1, sha2) {
    return execSync(`git diff ${sha1}..${sha2}`, {
        cwd: repoDir,
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024, // 50MB
    });
}

/**
 * Get diff of the latest commit vs its parent.
 * @param {string} repoDir
 * @returns {string} raw unified diff
 */
export function getDiffLatest(repoDir) {
    return execSync('git diff HEAD~1..HEAD', {
        cwd: repoDir,
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
    });
}

/**
 * Cleanup cloned repo directory.
 * @param {string} repoDir
 */
export function cleanup(repoDir) {
    try {
        rmSync(repoDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up ${repoDir}`);
    } catch {
        console.warn(`⚠️ Failed to cleanup ${repoDir}`);
    }
}
