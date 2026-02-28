import parseDiff from 'parse-diff';

/**
 * Parse raw unified diff string into structured per-file objects.
 * @param {string} rawDiff
 * @returns {import('./types').ParsedFile[]}
 */
export function parseDiffText(rawDiff) {
    if (!rawDiff || !rawDiff.trim()) return [];

    const files = parseDiff(rawDiff);

    return files.map((file) => ({
        file: file.to === '/dev/null' ? file.from : file.to,
        from: file.from,
        to: file.to,
        additions: file.additions,
        deletions: file.deletions,
        isBinary: file.binary || false,
        isDeleted: file.to === '/dev/null',
        isNew: file.from === '/dev/null',
        chunks: file.chunks.map((chunk) => ({
            oldStart: chunk.oldStart,
            oldLines: chunk.oldLines,
            newStart: chunk.newStart,
            newLines: chunk.newLines,
            changes: chunk.changes.map((change) => ({
                type: change.type,
                ln: change.type === 'add' ? change.ln : change.type === 'del' ? change.ln : change.ln1,
                content: change.content,
            })),
        })),
    }));
}

/**
 * Format a single parsed file's diff into readable text for AI analysis.
 * @param {import('./types').ParsedFile} parsedFile
 * @returns {string}
 */
export function formatForAI(parsedFile) {
    if (parsedFile.isBinary) {
        return `[Binary file: ${parsedFile.file}]`;
    }

    const lines = [];
    lines.push(`File: ${parsedFile.file}`);

    if (parsedFile.isNew) lines.push('(New file)');
    if (parsedFile.isDeleted) lines.push('(Deleted file)');

    lines.push(`Additions: +${parsedFile.additions}, Deletions: -${parsedFile.deletions}`);
    lines.push('');

    for (const chunk of parsedFile.chunks) {
        lines.push(`@@ -${chunk.oldStart},${chunk.oldLines} +${chunk.newStart},${chunk.newLines} @@`);
        for (const change of chunk.changes) {
            lines.push(change.content);
        }
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Extract before/after code text from a parsed file's diff.
 * @param {import('./types').ParsedFile} parsedFile
 * @returns {{ before: string, after: string }}
 */
export function extractBeforeAfter(parsedFile) {
    if (parsedFile.isBinary) {
        return { before: '[Binary]', after: '[Binary]' };
    }

    const beforeLines = [];
    const afterLines = [];

    for (const chunk of parsedFile.chunks) {
        for (const change of chunk.changes) {
            const code = change.content.substring(1); // strip +/- prefix
            if (change.type === 'del') {
                beforeLines.push(`L${change.ln}: ${code}`);
            } else if (change.type === 'add') {
                afterLines.push(`L${change.ln}: ${code}`);
            }
        }
    }

    return {
        before: beforeLines.length > 0 ? beforeLines.join('\n') : '(無刪除)',
        after: afterLines.length > 0 ? afterLines.join('\n') : '(無新增)',
    };
}
