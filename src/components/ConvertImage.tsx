

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const FORMATS = [
    { id: 'png', label: 'PNG' },
    { id: 'jpg', label: 'JPG' },
    { id: 'jpeg', label: 'JPEG' },
    { id: 'webp', label: 'WebP' },
    { id: 'bmp', label: 'BMP' },
    { id: 'tiff', label: 'TIFF' },
];

export default function ConvertImage() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState('png');
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
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff']
        }
    });

    const handleConvert = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            setStatus('Choosing destination...');

            // Determine default name and filters based on selection
            const nameParts = file.name.split('.');
            const baseName = nameParts.slice(0, -1).join('.') || 'image';
            const defaultName = `${baseName}.${outputFormat} `;

            const filterObj = {
                name: `${outputFormat.toUpperCase()} Image`,
                extensions: [outputFormat]
            };

            // 1. Ask user for save location with PRE-SELECTED format
            const savePath = await window.electronAPI.saveFile(defaultName, [filterObj]);

            if (!savePath) {
                setStatus('Conversion cancelled');
                setIsProcessing(false);
                return;
            }

            setStatus(`Converting to ${outputFormat.toUpperCase()}...`);

            // 2. Call backend
            // @ts-ignore
            await window.electronAPI.convertImage(file.path, savePath);

            setStatus('Success! Image converted.');
        } catch (error) {
            console.error(error);
            setStatus('Error: Failed to convert image.');
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
                <h1 className="text-3xl font-semibold mb-2">Convert Image</h1>
                <p className="text-gray-500 mb-8">Convert between PNG, JPG, WebP and more.</p>

                <div
                    {...getRootProps()}
                    className={`border - 2 border - dashed rounded - xl p - 12 flex flex - col items - center justify - center cursor - pointer transition - colors mb - 8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--card-border)] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'} `}
                >
                    <input {...getInputProps()} />
                    <PhotoIcon className="h-12 w-12 text-gray-400 mb-4" />
                    {file ? (
                        <p className="text-lg font-medium">{file.name}</p>
                    ) : (
                        <p className="text-gray-500">Drag & drop image, or click to select</p>
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
                                    onClick={() => setOutputFormat(fmt.id)}
                                    className={`px - 4 py - 2 rounded - lg border text - sm font - medium transition - colors
                                        ${outputFormat === fmt.id
                                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                                            : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                                        } `}
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
                        {isProcessing ? 'Converting...' : 'Convert Image'}
                    </button>

                    {status && <p className="text-sm font-medium animate-pulse">{status}</p>}
                </div>
            </div>
        </div>
    );
}
