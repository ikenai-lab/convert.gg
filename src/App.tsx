import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import MergePdf from './components/MergePdf';
import SplitPdf from './components/SplitPdf';
import OcrPdf from './components/OcrPdf';
import CompressPdf from './components/CompressPdf';
import ExtractArchive from './components/ExtractArchive';
import CreateArchive from './components/CreateArchive';
import ConvertArchive from './components/ConvertArchive';
import ConvertImage from './components/ConvertImage';
import CompressImage from './components/CompressImage';
import ImagesToPdf from './components/ImagesToPdf';
import ConvertDocument from './components/ConvertDocument';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-200">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/merge" element={<MergePdf />} />
                    <Route path="/split" element={<SplitPdf />} />
                    <Route path="/ocr" element={<OcrPdf />} />
                    <Route path="/doc/convert" element={<ConvertDocument />} />
                    <Route path="/compress" element={<CompressPdf />} />

                    <Route path="/archive/extract" element={<ExtractArchive />} />
                    <Route path="/archive/create" element={<CreateArchive />} />
                    <Route path="/archive/convert" element={<ConvertArchive />} />
                    <Route path="/media/image" element={<ConvertImage />} />
                    <Route path="/media/compress" element={<CompressImage />} />
                    <Route path="/media/pdf" element={<ImagesToPdf />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;;
