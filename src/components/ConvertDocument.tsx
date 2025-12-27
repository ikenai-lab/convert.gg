
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, DocumentTextIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function ConvertDocument() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
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
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.oasis.opendocument.text': ['.odt'],
            'application/rtf': ['.rtf'],
            'text/rtf': ['.rtf']
        }
    });

    const handleConvert = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            setStatus('Choosing destination...');

            const defaultName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
            const filterObj = { name: 'PDF Document', extensions: ['pdf'] };

            // 1. Ask user for save location
            const savePath = await window.electronAPI.saveFile(defaultName, [filterObj]);

            if (!savePath) {
                setStatus('Conversion cancelled');
                setIsProcessing(false);
                return;
            }

            setStatus(`Converting ${file.name} to PDF...`);

            // 2. Call backend
            // @ts-ignore
            await window.electronAPI.convertToPdf(file.path, savePath);

            setStatus('Success! Document converted.');
        } catch (error) {
            console.error(error);
            setStatus('Error: Helper failed. Install MS Word or LibreOffice.');
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
                <h1 className="text-3xl font-semibold mb-2">Convert to PDF</h1>
                <p className="text-gray-500 mb-8">Convert DOC, DOCX, ODT, or RTF into a PDF.</p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors mb-8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--card-border)] hover:scale-105 active:scale-95'}`}
                >
                    <input {...getInputProps()} />
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-4" />
                    {file ? (
                        <div className="flex items-center gap-2">
                            <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                            <p className="text-lg font-medium">{file.name}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500">Drag & drop document here</p>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleConvert}
                        disabled={!file || isProcessing}
                        className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isProcessing ? 'Converting...' : 'Convert to PDF'}
                    </button>

                    {status && <p className={`text-sm font-medium animate-pulse ${status.includes('Error') ? 'text-red-500' : ''}`}>{status}</p>}
                </div>
            </div>
        </div>
    );
}
