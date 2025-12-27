
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const FORMATS = [
    { id: 'jpg', label: 'JPG' },
    { id: 'jpeg', label: 'JPEG' },
    { id: 'webp', label: 'WebP' },
    { id: 'png', label: 'PNG (Optimize)' }, // PNG isn't good for target size but we can optimize
];

export default function CompressImage() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState('jpg');
    const [targetSizeKB, setTargetSizeKB] = useState<number>(500);
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

    const handleCompress = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            setStatus('Choosing destination...');

            const defaultName = `compressed.${outputFormat}`;
            const filterObj = {
                name: `${outputFormat.toUpperCase()} Image`,
                extensions: [outputFormat]
            };

            // 1. Ask user for save location
            const savePath = await window.electronAPI.saveFile(defaultName, [filterObj]);

            if (!savePath) {
                setStatus('Calculated cancelled');
                setIsProcessing(false);
                return;
            }

            setStatus(`Compressing to < ${targetSizeKB}KB...`);

            const targetSizeBytes = targetSizeKB * 1024;

            // 2. Call backend
            // @ts-ignore
            await window.electronAPI.compressImage(file.path, savePath, targetSizeBytes);

            setStatus('Success! Image compressed.');
        } catch (error) {
            console.error(error);
            setStatus('Error: Failed to compress image.');
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
                <h1 className="text-3xl font-semibold mb-2">Compress Image</h1>
                <p className="text-gray-500 mb-8">Reduce image size to a specific target.</p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors mb-8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--card-border)] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
                >
                    <input {...getInputProps()} />
                    <ArrowsPointingInIcon className="h-12 w-12 text-gray-400 mb-4" />
                    {file ? (
                        <p className="text-lg font-medium">{file.name}</p>
                    ) : (
                        <p className="text-gray-500">Drag & drop image here</p>
                    )}
                </div>

                {file && (
                    <div className="space-y-6 mb-8">
                        {/* Target Size Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Target Size (KB)</label>
                            <input
                                type="number"
                                value={targetSizeKB}
                                onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 0)}
                                className="w-full p-2 rounded-lg border bg-[var(--card-bg)] border-[var(--card-border)] focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">We'll adjust quality to try fit this size.</p>
                        </div>

                        {/* Output Format */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Output Format</label>
                            <div className="flex gap-3 flex-wrap">
                                {FORMATS.map(fmt => (
                                    <button
                                        key={fmt.id}
                                        onClick={() => setOutputFormat(fmt.id)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                                    ${outputFormat === fmt.id
                                                ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                                                : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                                            }`}
                                    >
                                        {fmt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleCompress}
                        disabled={!file || isProcessing || targetSizeKB <= 0}
                        className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isProcessing ? 'Compressing...' : 'Compress Image'}
                    </button>

                    {status && <p className="text-sm font-medium animate-pulse">{status}</p>}
                </div>
            </div>
        </div>
    );
}
