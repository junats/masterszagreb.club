
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Images, ScanLine } from 'lucide-react';
import { analyzeReceiptImage } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Receipt, AnalysisResult } from '../types';

interface ReceiptScannerProps {
  onScanComplete: (receipts: Receipt[]) => void;
  onCancel: () => void;
  ageRestricted: boolean;
  userId: string;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, onCancel, ageRestricted, userId }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Helper to compress image before sending/storing
  const optimizeImage = async (file: File): Promise<Blob> => {
    // Check for HEIC/HEIF format (common on iOS) and convert to JPEG
    if (file.type === 'image/heic' || file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        try {
            console.log(`Detected HEIC/HEIF image (${file.name}), converting to JPEG...`);
            // Dynamically import heic2any to avoid loading it when not needed
            // @ts-ignore
            const heic2anyModule = await import('heic2any');
            const heic2any = heic2anyModule.default || heic2anyModule;
            
            const result = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });
            
            const blob = Array.isArray(result) ? result[0] : result;
            // Replace the original file with the converted JPEG
            const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
            file = new File([blob], newName, { type: "image/jpeg" });
            console.log(`Conversion successful: ${file.name}`);
        } catch (e) {
            console.error("HEIC conversion failed, attempting to read as is:", e);
        }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas to Blob failed"));
            }, 'image/jpeg', 0.7);
          } else {
            reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(new Error("Failed to load image: " + err));
      };
      reader.onerror = (err) => reject(new Error("Failed to read file: " + err));
      reader.readAsDataURL(file);
    });
  };

  // Helper to convert Blob to Base64 for Gemini Analysis
  const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = (reader.result as string).split(',')[1];
              resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  };

  const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsAnalyzing(true);
    
    const fileList: File[] = Array.from(files);
    const totalFiles = fileList.length;
    setProgress({ current: 0, total: totalFiles });

    const newReceipts: Receipt[] = [];
    const errors: string[] = [];

    for (let i = 0; i < totalFiles; i++) {
        setProgress({ current: i + 1, total: totalFiles });
        const file = fileList[i];

        try {
            // 1. Optimize Image (Resize & Compress) -> Blob
            const processedBlob = await optimizeImage(file);
            
            // 2. Convert to Base64 for Gemini Analysis
            const base64ForAI = await blobToBase64(processedBlob);
            
            // 3. Analyze with Unified Smart Service
            const result: AnalysisResult = await analyzeReceiptImage(base64ForAI);

            // 4. Upload Image via Storage Service (Cloud or Mock)
            const storagePath = await storageService.uploadReceiptImage(processedBlob, userId);
            
            newReceipts.push({
              id: generateId(),
              storeName: result.storeName,
              date: result.date,
              total: result.total,
              items: result.items,
              scannedAt: new Date().toISOString(),
              type: result.type || 'receipt',
              referenceCode: result.referenceCode,
              storagePath: storagePath // Save the path/reference, not just base64
            });

        } catch (err) {
            console.error(`Error processing file ${file.name}:`, err);
            errors.push(file.name);
        }
    }

    if (newReceipts.length > 0) {
        if (errors.length > 0) {
            console.warn("Some files failed to process:", errors);
        }
        onScanComplete(newReceipts);
    } else {
        setError("Failed to analyze images. " + (errors.length > 0 ? `Error with: ${errors[0]}` : "Please try again."));
        setIsAnalyzing(false);
        setProgress(null);
    }
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
        cameraInputRef.current.value = ''; 
        cameraInputRef.current.click();
    }
  };

  const triggerUpload = () => {
    if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
        uploadInputRef.current.click();
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-6 text-center animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
          <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
        </div>
        <h3 className="mt-8 text-xl font-heading font-bold text-white tracking-tight">
            Analyzing Document...
        </h3>
        <p className="mt-2 text-slate-400 font-medium">
            Extracting details, identifying bills, and categorizing items...
        </p>
        
        {progress && progress.total > 1 && (
            <p className="mt-4 text-emerald-400 font-bold tabular-nums">
                Processing image {progress.current} of {progress.total}
            </p>
        )}
        
        <div className="mt-8 w-full max-w-xs space-y-3">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-full ring-1 ring-white/10">
                <div 
                    className="h-full bg-primary transition-all duration-700 ease-out" 
                    style={{ width: progress ? `${(progress.current / progress.total) * 100}%` : '60%' }}
                ></div>
            </div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Optimizing & Reading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-24 animate-in slide-in-from-bottom-5 duration-500 ease-out bg-background">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-surfaceHighlight rounded-2xl mx-auto flex items-center justify-center mb-4 ring-1 ring-white/10 shadow-lg shadow-black/50">
             <ScanLine size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-white tracking-tight">Scan Document</h2>
        <p className="text-slate-400 text-sm font-medium mt-1">Upload a Receipt or Bill.</p>
        <p className="text-slate-500 text-xs mt-1">AI will automatically classify it for you.</p>

        {ageRestricted && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <CheckCircle size={12} />
                <span>Parental Mode Active</span>
            </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <p className="text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <input
          type="file"
          accept="image/*,.heic,.heif"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <input
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          ref={uploadInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={triggerCamera}
          className="group relative flex flex-col items-center justify-center w-60 h-60 rounded-full bg-surface border-2 border-dashed border-slate-700 hover:border-primary hover:bg-surfaceHighlight transition-all duration-500 shadow-2xl shadow-black/50 hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]"
        >
            <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 pointer-events-none"></div>
            <div className="p-7 bg-slate-900 rounded-full mb-4 shadow-inner ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-500">
                <Camera className="w-12 h-12 text-primary group-hover:text-sky-300 transition-colors duration-300" />
            </div>
          <span className="text-xl font-heading font-bold text-slate-200 tracking-tight group-hover:text-white transition-colors duration-300">
             Take Photo
          </span>
          <span className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide group-hover:text-primary/70 transition-colors duration-300">Camera Capture</span>
        </button>

        <button
            onClick={triggerUpload}
            className="w-60 py-4 rounded-2xl bg-surface border border-white/5 text-slate-300 font-bold hover:bg-surfaceHighlight hover:border-white/20 hover:text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
            <Images size={18} />
            Select from Gallery
        </button>

        <p className="text-xs text-slate-500 max-w-[260px] text-center mt-2 font-medium">
             Supports Receipts, Invoices, and Kindergarten Bills.<br/>
             Ensure text is clear and well-lit.
        </p>
      </div>

      <div className="mt-auto">
        <button onClick={onCancel} className="w-full py-4 rounded-2xl text-slate-500 font-bold hover:bg-white/5 hover:text-slate-300 transition-all duration-300">
            Cancel
        </button>
      </div>
    </div>
  );
};

export default ReceiptScanner;
