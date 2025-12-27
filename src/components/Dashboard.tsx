
import { useNavigate } from 'react-router-dom';
import {
    DocumentDuplicateIcon,
    ScissorsIcon,
    DocumentTextIcon,
    ArrowsPointingInIcon,
    FolderOpenIcon,
    FolderPlusIcon,
    ArrowPathIcon,
    MoonIcon,
    SunIcon,
    PhotoIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Dashboard() {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleTheme = () => setDarkMode(!darkMode);

    const ToolCard = ({ title, icon: Icon, onClick }: { title: string, icon: any, onClick: () => void }) => (
        <div
            onClick={onClick}
            className="group flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-all duration-200
                 bg-[var(--card-bg)] border-[var(--card-border)] hover:scale-105 shadow-sm hover:shadow-md"
        >
            <Icon className="h-8 w-8 mb-3 text-[var(--icon-color)] transition-transform" />
            <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        </div>
    );

    return (
        <div className="min-h-screen p-8 transition-colors duration-200 bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Toggle Dark Mode"
                    >
                        {darkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-600" />}
                    </button>
                    <h1 className="text-2xl font-semibold tracking-tight">convert.gg</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
                {/* PDF Tools Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">PDF Tools</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ToolCard title="Merge PDF" icon={DocumentDuplicateIcon} onClick={() => navigate('/merge')} />
                        <ToolCard title="Split PDF" icon={ScissorsIcon} onClick={() => navigate('/split')} />
                        <ToolCard title="PDF to Word" icon={DocumentTextIcon} onClick={() => navigate('/ocr')} />
                        <ToolCard title="Doc to PDF" icon={DocumentTextIcon} onClick={() => navigate('/doc/convert')} />
                        <ToolCard title="Compress PDF" icon={ArrowsPointingInIcon} onClick={() => navigate('/compress')} />
                    </div>
                </section>

                {/* Archive Tools Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
                        <FolderOpenIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Archive Tools</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ToolCard title="Extract Archive" icon={FolderOpenIcon} onClick={() => navigate('/archive/extract')} />
                        <ToolCard title="Create Archive" icon={FolderPlusIcon} onClick={() => navigate('/archive/create')} />
                        <ToolCard title="Convert Format" icon={ArrowPathIcon} onClick={() => navigate('/archive/convert')} />
                    </div>
                </section>

                {/* Media Tools Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
                        <PhotoIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Media Tools</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ToolCard title="Convert Image" icon={PhotoIcon} onClick={() => navigate('/media/image')} />
                        <ToolCard title="Compress Image" icon={ArrowsPointingInIcon} onClick={() => navigate('/media/compress')} />
                        <ToolCard title="Images to PDF" icon={DocumentTextIcon} onClick={() => navigate('/media/pdf')} />
                    </div>
                </section>
            </div>
        </div>
    );
}
