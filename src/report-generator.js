import ExcelJS from 'exceljs';

/**
 * Generate and save an Excel report from analysis results.
 * @param {{ file: string, additions?: number, deletions?: number, summary: string, details: string, impact: string }[]} results
 * @param {string} outputPath
 */
export async function saveReport(results, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Diff 分析報告');

    // Define columns
    sheet.columns = [
        { header: '檔案名稱', key: 'file', width: 40 },
        { header: '新增行數', key: 'additions', width: 12 },
        { header: '刪除行數', key: 'deletions', width: 12 },
        { header: '變更前', key: 'before', width: 55 },
        { header: '變更後', key: 'after', width: 55 },
        { header: '異動摘要', key: 'summary', width: 50 },
        { header: '詳細說明', key: 'details', width: 70 },
        { header: '影響範圍', key: 'impact', width: 50 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add data rows
    for (const r of results) {
        const row = sheet.addRow({
            file: r.file,
            additions: r.additions ?? 0,
            deletions: r.deletions ?? 0,
            before: r.before ?? '',
            after: r.after ?? '',
            summary: r.summary,
            details: r.details,
            impact: r.impact,
        });

        row.alignment = { vertical: 'top', wrapText: true };
        row.height = 80;

        // Green for additions, red for deletions
        row.getCell('additions').font = { color: { argb: 'FF008000' } };
        row.getCell('deletions').font = { color: { argb: 'FFFF0000' } };

        // Monospace font for code columns
        row.getCell('before').font = { name: 'Consolas', size: 9, color: { argb: 'FFCC0000' } };
        row.getCell('after').font = { name: 'Consolas', size: 9, color: { argb: 'FF008800' } };
    }

    // Add alternating row colors
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && rowNumber % 2 === 0) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F7FB' },
            };
        }
    });

    // Auto-filter
    sheet.autoFilter = {
        from: 'A1',
        to: `H${results.length + 1}`,
    };

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    await workbook.xlsx.writeFile(outputPath);
    console.log(`📄 Report saved to: ${outputPath}`);
}
