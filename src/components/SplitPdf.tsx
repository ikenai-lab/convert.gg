import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    ArrowLeftIcon,
    DocumentIcon,
    XMarkIcon,
    ScissorsIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function SplitPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [range, setRange] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('idle');
            setRange('');
            setPageCount(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        disabled: isProcessing
    });

    // Fetch page count when file is loaded
    useEffect(() => {
        if (file) {
            (async () => {
                try {
                    const count = await window.electronAPI.getPageCount((file as any).path);
                    setPageCount(count);
                    setRange(`1-${count}`); // Default to all pages
                } catch (error) {
                    console.error("Failed to get page count", error);
                }
            })();
        }
    }, [file]);

    const removeFile = () => {
        setFile(null);
        setPageCount(null);
        setRange('');
        setStatus('idle');
    };

    const parseRange = (rangeStr: string, max: number): number[] => {
        const pages = new Set<number>();
        const parts = rangeStr.split(',');

        parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    // Determine min and max to handle cases like "5-1" correctly if desired, 
                    // or strictly "start to end". Let's do min to max.
                    const s = Math.min(start, end);
                    const e = Math.max(start, end);
                    for (let i = s; i <= e; i++) {
                        if (i >= 1 && i <= max) pages.add(i - 1); // 0-indexed for pdf-lib
                    }
                }
            } else {
                const num = Number(trimmed);
                if (!isNaN(num) && num >= 1 && num <= max) {
                    pages.add(num - 1);
                }
            }
        });

        return Array.from(pages).sort((a, b) => a - b);
    };

    const handleExtract = async () => {
        if (!file || !pageCount) return;
        setIsProcessing(true);
        try {
            const pageIndices = parseRange(range, pageCount);
            if (pageIndices.length === 0) {
                alert("Invalid page range selected.");
                setIsProcessing(false);
                return;
            }

            const defaultName = file.name.replace('.pdf', '_extracted.pdf');
            const outputPath = await window.electronAPI.saveFile(defaultName, [{ name: 'PDF Document', extensions: ['pdf'] }]);

            if (!outputPath) {
                setIsProcessing(false);
                return;
            }

            const filePath = (file as any).path;
            await window.electronAPI.extractPages(filePath, pageIndices, outputPath);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-12">
            <div className="max-w-4xl mx-auto">

                <div className="mb-10">
                    <Link to="/" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors text-sm mb-6">
                        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                        Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Extract Pages</h1>
                    <p className="text-gray-500">Extract specific pages from your PDF document.</p>
                </div>

                <div className="space-y-6">

                    {/* Dropzone */}
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`
                group border border-dashed rounded-lg p-16 transition-all duration-200 cursor-pointer text-center
                ${isDragActive ? 'bg-blue-50 border-blue-400' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
              `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center space-y-3 text-gray-500 group-hover:text-gray-800">
                                <ScissorsIcon className="w-8 h-8 stroke-1" />
                                <span className="text-sm font-medium">Click to select a PDF or drag and drop</span>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                                        <DocumentIcon className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                                        <p className="text-xs text-gray-500">{pageCount ? `${pageCount} Pages` : 'Loading pages...'}</p>
                                    </div>
                                </div>
                                <button onClick={removeFile} className="text-gray-400 hover:text-red-500">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Controls */}
                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                    Select Pages (e.g. 1-3, 5)
                                </label>
                                <input
                                    type="text"
                                    value={range}
                                    onChange={(e) => setRange(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                                    placeholder="e.g. 1-5, 8, 11-13"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Enter page numbers or ranges separated by commas.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-between">
                        <div className="text-sm min-h-[20px]">
                            {status === 'success' && <span className="text-green-600 font-medium">✨ Pages extracted successfully!</span>}
                            {status === 'error' && <span className="text-red-600 font-medium">❌ Error extracting pages.</span>}
                        </div>

                        <button
                            onClick={handleExtract}
                            disabled={!file || isProcessing}
                            className={`
                px-6 py-2 rounded-lg text-sm font-medium text-white transition-all
                ${!file || isProcessing ? 'bg-gray-200 text-gray-400' : 'bg-black hover:bg-gray-800 shadow-sm'}
              `}
                        >
                            {isProcessing ? 'Processing' : 'Extract Pages'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
