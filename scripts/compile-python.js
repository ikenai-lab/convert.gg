
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SIDE_CARS_DIR = path.join(__dirname, '../py-sidecars');
const DIST_DIR = path.join(__dirname, '../dist-python');

const SCRIPTS = [
    'archive_tools.py',
    'doc_tools.py',
    'media_tools.py',
    'ocr_engine.py',
    'pdf_tools.py'
];

if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// Ensure PyInstaller is installed (user should run pip install -r requirements.txt)
// We assume it's in the venv
const VENV_PYTHON = path.join(SIDE_CARS_DIR, 'venv/bin/python');
// On Windows it might be Scripts/python.exe. Ideally we use the active environment.
// For now, let's assume 'pyinstaller' is in the PATH or we use the venv module.
const PYINSTALLER_CMD = 'pyinstaller';

console.log('Compiling Python sidecars...');

SCRIPTS.forEach(script => {
    const scriptPath = path.join(SIDE_CARS_DIR, script);
    console.log(`Building ${script}...`);

    try {
        // --onefile: Create a single executable
        // --distpath: Output directory
        // --workpath: Temp directory (ignored/deleted usually)
        // --specpath: Spec file directory (keep out of root)
        // --clean: Clean cache
        // --name: Output name (strip .py)
        const name = path.basename(script, '.py');

        execSync(`${PYINSTALLER_CMD} --onefile --clean --distpath "${DIST_DIR}" --workpath "${path.join(__dirname, '../build-py')}" --specpath "${path.join(__dirname, '../build-py')}" --name "${name}" "${scriptPath}"`, {
            stdio: 'inherit',
            cwd: SIDE_CARS_DIR // Run in sidecars dir so imports work
        });
    } catch (e) {
        console.error(`Failed to compile ${script}:`, e);
        process.exit(1);
    }
});

console.log('Python compilation complete.');
