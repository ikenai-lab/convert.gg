import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const FORMATS = [
    { id: 'zip', label: 'ZIP' },
    { id: 'tar', label: 'TAR' },
    { id: 'tar.gz', label: 'TAR.GZ' },
    { id: '7z', label: '7-Zip' },
];

export default function ConvertArchive() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState<string>('zip');
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
    });

    const handleConvert = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            setStatus('Choosing save location...');

            // Construct default filename
            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const defaultName = `${originalName}.${format}`;

            const filterMap: any = {
                'zip': { name: 'ZIP Archive', extensions: ['zip'] },
                'tar': { name: 'TAR Archive', extensions: ['tar'] },
                'tar.gz': { name: 'GZIP Archive', extensions: ['tar.gz', 'gz', 'tgz'] }, // Added variants
                '7z': { name: '7-Zip Archive', extensions: ['7z'] }
            };

            // 1. Ask user for save location
            const savePath = await window.electronAPI.saveFile(defaultName, [filterMap[format]]);

            if (!savePath) {
                setStatus('Conversion cancelled');
                setIsProcessing(false);
                return;
            }

            setStatus(`Converting...`);

            // 2. Call backend 'convert'
            // @ts-ignore
            await window.electronAPI.convertArchive(file.path, savePath);

            setStatus('Success! Archive converted.');
        } catch (error) {
            console.error(error);
            setStatus('Error: Failed to convert.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
            <button onClick={() => navigate('/')} className="mb-8 flex items-center text-gray-500 hover:text-[var(--text-primary)]">
                <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
            </button>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-semibold mb-2">Convert Archive</h1>
                <p className="text-gray-500 mb-8">Change format between Zip, Tar, 7z, etc.</p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors mb-8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}
                >
                    <input {...getInputProps()} />
                    <ArrowPathIcon className="h-12 w-12 text-gray-400 mb-4" />
                    {file ? (
                        <p className="text-lg font-medium">{file.name}</p>
                    ) : (
                        <p className="text-gray-500">Drag & drop archive here</p>
                    )}
                </div>

                {/* Format Selection */}
                {file && (
                    <div className="mb-8">
                        <p className="font-medium mb-3">Select Output Format:</p>
                        <div className="flex gap-3">
                            {FORMATS.map(fmt => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setFormat(fmt.id)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                                ${format === fmt.id
                                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                                            : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                                        }`}
                                >
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleConvert}
                        disabled={!file || isProcessing}
                        className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isProcessing ? 'Converting...' : 'Convert Archive'}
                    </button>

                    {status && <p className="text-sm font-medium animate-pulse">{status}</p>}
                </div>
            </div>
        </div>
    );
}
