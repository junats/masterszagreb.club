import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Receipt as ReceiptIcon, FileText, Images } from 'lucide-react';
import { analyzeReceiptImage } from '../services/geminiService';
import { Receipt, AnalysisResult } from '../types';

interface ReceiptScannerProps {
  onScanComplete: (receipts: Receipt[]) => void;
  onCancel: () => void;
  ageRestricted: boolean;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, onCancel, ageRestricted }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'receipt' | 'bill'>('receipt');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
              if (typeof reader.result === 'string') {
                  resolve(reader.result.split(',')[1]);
              } else {
                  reject(new Error('Failed to read file'));
              }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsAnalyzing(true);
    
    const fileList = Array.from(files);
    const totalFiles = fileList.length;
    setProgress({ current: 0, total: totalFiles });

    const newReceipts: Receipt[] = [];
    const errors: string[] = [];

    for (let i = 0; i < totalFiles; i++) {
        setProgress({ current: i + 1, total: totalFiles });
        const file = fileList[i];

        try {
            const base64String = await readFileAsBase64(file);
            
            // Pass the scanMode to the service to adjust the prompt
            const result: AnalysisResult = await analyzeReceiptImage(base64String, scanMode);
            
            newReceipts.push({
              id: crypto.randomUUID(),
              storeName: result.storeName,
              date: result.date,
              total: result.total,
              items: result.items,
              scannedAt: new Date().toISOString(),
              type: scanMode,
              referenceCode: result.referenceCode
            });

        } catch (err) {
            console.error(`Error processing file ${file.name}:`, err);
            errors.push(file.name);
        }
    }

    if (newReceipts.length > 0) {
        // If we had some errors but some successes, warn but proceed
        if (errors.length > 0) {
            console.warn("Some files failed to process:", errors);
        }
        onScanComplete(newReceipts);
    } else {
        // All failed
        setError("Failed to analyze images. Please ensure they are clear and well-lit.");
        setIsAnalyzing(false);
        setProgress(null);
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerUpload = () => {
    uploadInputRef.current?.click();
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center animate-in fade-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <h3 className="mt-8 text-xl font-bold text-white">
            {scanMode === 'bill' ? 'Processing Bill...' : 'Analyzing Receipt...'}
        </h3>
        <p className="mt-2 text-slate-400">
            {scanMode === 'bill' ? 'Extracting provider details and payment codes...' : 'Categorizing your items...'}
        </p>
        
        {progress && progress.total > 1 && (
            <p className="mt-4 text-emerald-400 font-medium">
                Processing image {progress.current} of {progress.total}
            </p>
        )}
        
        <div className="mt-8 w-full max-w-xs space-y-3">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden w-full">
                <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: progress ? `${(progress.current / progress.total) * 100}%` : '60%' }}
                ></div>
            </div>
            <p className="text-xs text-slate-500">Reading text data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-24 animate-in slide-in-from-bottom-5 duration-300">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">Scan Document</h2>
        <p className="text-slate-400 text-sm">Select document type to ensure accurate extraction.</p>
        {ageRestricted && scanMode === 'receipt' && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                <CheckCircle size={10} />
                <span>Parental Mode Active</span>
            </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={20} />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="bg-slate-800 p-1 rounded-xl flex mb-6 border border-slate-700">
          <button 
            onClick={() => setScanMode('receipt')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                scanMode === 'receipt' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
              <ReceiptIcon size={16} />
              Shopping Receipt
          </button>
          <button 
            onClick={() => setScanMode('bill')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                scanMode === 'bill' 
                ? 'bg-primary/20 text-primary border border-primary/20 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
              <FileText size={16} />
              Kindergarten Bill
          </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center gap-4">
        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <input
          type="file"
          accept="image/*"
          multiple
          ref={uploadInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Camera Button */}
        <button
          onClick={triggerCamera}
          className="group relative flex flex-col items-center justify-center w-56 h-56 rounded-full bg-surface border-2 border-dashed border-slate-600 hover:border-primary hover:bg-slate-800 transition-all duration-300 shadow-2xl shadow-black/50"
        >
            <div className="absolute inset-0 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
            <div className="p-6 bg-slate-900 rounded-full mb-4 shadow-inner ring-1 ring-white/10 group-hover:ring-primary/50 transition-all group-active:scale-95">
                <Camera className="w-10 h-10 text-primary" />
            </div>
          <span className="text-lg font-semibold text-slate-200">
             {scanMode === 'bill' ? 'Take Photo' : 'Take Photo'}
          </span>
          <span className="text-xs text-slate-500 mt-1">Camera Capture</span>
        </button>

        {/* Gallery/Multiple Upload Button */}
        <button
            onClick={triggerUpload}
            className="w-56 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
            <Images size={18} />
            Select from Gallery
        </button>

        <p className="text-xs text-slate-500 max-w-[250px] text-center mt-2">
            {scanMode === 'bill' 
                ? "Ensure the 'Reference Code' is clearly visible."
                : "You can select multiple receipt images at once."
            }
        </p>
      </div>

      <div className="mt-auto">
        <button onClick={onCancel} className="w-full py-3 rounded-xl text-slate-400 font-medium hover:bg-white/5 transition-colors">
            Cancel
        </button>
      </div>
    </div>
  );
};

export default ReceiptScanner;