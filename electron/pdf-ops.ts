const { runPythonScript } = require('./python-runner');

export async function mergePdfs(filePaths: string[], outputPath: string): Promise<void> {
    await runPythonScript('pdf_tools.py', ['merge', '--inputs', ...filePaths, '--output_path', outputPath]);
}

export async function rotatePdf(filePath: string, degreesToRotate: number): Promise<void> {
    await runPythonScript('pdf_tools.py', ['rotate', '--input_path', filePath, '--degrees', degreesToRotate.toString()]);
}

export async function splitPdf(filePath: string, outputDir: string): Promise<string[]> {
    const output = await runPythonScript('pdf_tools.py', ['split', '--input_path', filePath, '--output_dir', outputDir]);
    // The python script prints a JSON list of created files
    try {
        const lines = output.trim().split('\n');
        // The last line should be the JSON
        const jsonLine = lines[lines.length - 1];
        return JSON.parse(jsonLine);
    } catch (e) {
        console.error("Failed to parse split output", output);
        return [];
    }
}

export async function compressPdf(filePath: string, outputPath: string): Promise<void> {
    await runPythonScript('pdf_tools.py', ['compress', '--input_path', filePath, '--output_path', outputPath]);
}

export async function getPdfPageCount(filePath: string): Promise<number> {
    const output = await runPythonScript('pdf_tools.py', ['count', '--input_path', filePath]);
    try {
        const lines = output.trim().split('\n');
        const countLine = lines[lines.length - 1];
        return parseInt(countLine, 10);
    } catch (e) {
        console.error("Failed to parse page count output", output);
        return 0;
    }
}

export async function extractPages(filePath: string, pageIndices: number[], outputPath: string): Promise<void> {
    // Python expects comma separated string of indices
    const indicesStr = pageIndices.join(',');
    await runPythonScript('pdf_tools.py', ['extract', '--input_path', filePath, '--pages', indicesStr, '--output_path', outputPath]);
}
