#!/usr/bin/env node

import { Command } from 'commander';
import { cloneRepo, getCommitList, getDiff, getDiffLatest, cleanup } from './git-fetcher.js';
import { parseDiffText, formatForAI, extractBeforeAfter } from './diff-parser.js';
import { analyzeAllFiles } from './ai-analyzer.js';
import { saveReport } from './report-generator.js';
import { resolve } from 'path';

const program = new Command();

program
    .name('diff-analyzer')
    .description('分析 GitHub 專案的 diff，透過 Gemini AI 產生人話版異動說明')
    .version('1.0.0')
    .requiredOption('--repo <url>', 'GitHub repo URL')
    .option('--commit <sha>', '指定 commit SHA（比對該 commit 與前一個 commit）')
    .option('--compare <range>', '比對兩個 commit，格式: sha1..sha2')
    .option('--output <path>', 'Excel 輸出路徑', './diff-report.xlsx')
    .option('--list <count>', '列出最近 N 筆 commit', parseInt)
    .parse(process.argv);

const opts = program.opts();

async function main() {
    let repoDir = null;

    try {
        // 1. Clone repo
        repoDir = cloneRepo(opts.repo);

        // 2. If --list, show commits and exit
        if (opts.list) {
            const commits = getCommitList(repoDir, opts.list);
            console.log('\n📋 Recent commits:\n');
            commits.forEach((c, i) => {
                console.log(`  ${i + 1}. ${c.sha.substring(0, 8)} — ${c.message}`);
            });
            console.log('\n💡 Use --compare <sha1>..<sha2> or --commit <sha> to analyze.');
            return;
        }

        // 3. Get diff
        let rawDiff;
        if (opts.compare) {
            const [sha1, sha2] = opts.compare.split('..');
            if (!sha1 || !sha2) {
                console.error('❌ --compare format should be: sha1..sha2');
                process.exit(1);
            }
            console.log(`📊 Comparing ${sha1.substring(0, 8)}..${sha2.substring(0, 8)}`);
            rawDiff = getDiff(repoDir, sha1, sha2);
        } else if (opts.commit) {
            console.log(`📊 Analyzing commit ${opts.commit.substring(0, 8)}`);
            rawDiff = getDiff(repoDir, `${opts.commit}~1`, opts.commit);
        } else {
            console.log('📊 Analyzing latest commit...');
            rawDiff = getDiffLatest(repoDir);
        }

        if (!rawDiff || !rawDiff.trim()) {
            console.log('ℹ️ No changes found in the specified range.');
            return;
        }

        // 4. Parse diff
        const parsedFiles = parseDiffText(rawDiff);
        const nonBinaryFiles = parsedFiles.filter((f) => !f.isBinary);

        console.log(`\n📁 Found ${parsedFiles.length} changed files (${nonBinaryFiles.length} analyzable)\n`);

        if (nonBinaryFiles.length === 0) {
            console.log('ℹ️ All changes are binary files, nothing to analyze.');
            return;
        }

        // 5. Prepare diffs for AI
        const fileDiffs = nonBinaryFiles.map((f) => {
            const { before, after } = extractBeforeAfter(f);
            return {
                file: f.file,
                additions: f.additions,
                deletions: f.deletions,
                before,
                after,
                diffText: formatForAI(f),
            };
        });

        // 6. AI analysis
        console.log('🧠 Starting AI analysis...\n');
        const analysisResults = await analyzeAllFiles(fileDiffs);

        // Merge additions/deletions into results
        const mergedResults = analysisResults.map((r) => {
            const original = fileDiffs.find((f) => f.file === r.file);
            return {
                ...r,
                additions: original?.additions ?? 0,
                deletions: original?.deletions ?? 0,
                before: original?.before ?? '',
                after: original?.after ?? '',
            };
        });

        // 7. Generate Excel
        const outputPath = resolve(opts.output);
        await saveReport(mergedResults, outputPath);

        console.log(`\n✅ Done! Analyzed ${mergedResults.length} files.`);
        console.log(`📄 Report: ${outputPath}`);
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        process.exit(1);
    } finally {
        if (repoDir) cleanup(repoDir);
    }
}

main();
