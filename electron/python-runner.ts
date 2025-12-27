import { spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';

const isDev = !app.isPackaged;

// Generic runner for any python script in py-sidecars
// Returns the stdout output as a string
export function runPythonScript(scriptName: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        let command: string;
        let pArgs: string[];

        if (isDev) {
            // Development: Use Venv Python + .py Script
            command = path.join(__dirname, '../py-sidecars/venv/bin/python'); // Or 'python' if relying on PATH
            const scriptPath = path.join(__dirname, `../py-sidecars/${scriptName}`);
            pArgs = [scriptPath, ...args];
        } else {
            // Production: Use Compiled Binary
            // Name: scriptName without .py
            const name = scriptName.replace('.py', '');
            // Extension: '' on Linux/Mac, '.exe' on Windows
            const ext = process.platform === 'win32' ? '.exe' : '';

            command = path.join(process.resourcesPath, 'bin', name + ext);
            pArgs = args;
        }

        const pythonProcess = spawn(command, pArgs);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            const str = data.toString();
            outputData += str;
            console.log(`[${scriptName} stdout]: ${str}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            const str = data.toString();
            errorData += str;
            console.error(`[${scriptName} stderr]: ${str}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(outputData.trim());
            } else {
                reject(new Error(`Script ${scriptName} failed with code ${code}. Error: ${errorData || outputData}`));
            }
        });

        pythonProcess.on('error', (err) => {
            reject(err);
        });
    });
}

export function runOcrScript(inputPath: string, outputPath: string): Promise<void> {
    return runPythonScript('ocr_engine.py', [
        '--input_pdf_path', inputPath,
        '--output_docx_path', outputPath
    ]).then(() => { });
}
