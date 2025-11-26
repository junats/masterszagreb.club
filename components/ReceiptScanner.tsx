import React, { useState, useRef } from 'react';
import { Camera as CameraIcon, Upload, Loader2, CheckCircle, AlertCircle, Images, ScanLine } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { analyzeReceiptImage } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Receipt, AnalysisResult } from '../types';

const computeHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

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

  // Helper to compress image before sending/storing
  const optimizeImage = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Max dimensions - reduced to avoid memory issues
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
            }, 'image/jpeg', 0.7); // Compress to 70% quality
          } else {
            reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(new Error("Failed to load image: " + err));
      };
      reader.onerror = (err) => reject(new Error("Failed to read file: " + err));
      reader.readAsDataURL(blob);
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

  const processImage = async (blob: Blob, fileName: string = 'camera_capture.jpg') => {
    try {
      console.log(`📸 Processing image, size: ${blob.size} bytes`);

      // 1. Optimize Image (Resize & Compress) -> Blob
      console.log('🔄 Step 1: Optimizing image...');
      const processedBlob = await optimizeImage(blob);
      console.log('✅ Step 1 complete, blob size:', processedBlob.size);

      // 2. Convert to Base64 for Gemini Analysis
      console.log('🔄 Step 2: Converting to base64...');
      const base64ForAI = await blobToBase64(processedBlob);
      console.log('✅ Step 2 complete, base64 length:', base64ForAI.length);

      // 3. Analyze with Unified Smart Service
      console.log('🔄 Step 3: Calling analyzeReceiptImage...');
      const result: AnalysisResult = await analyzeReceiptImage(base64ForAI);
      console.log('✅ Step 3 complete, result:', result);

      // 4. Upload Image via Storage Service (Cloud or Mock)
      console.log('🔄 Step 4: Uploading to storage...');
      let storagePath = '';
      let imageUrl = '';
      try {
        storagePath = await storageService.uploadReceiptImage(processedBlob, userId);
        console.log('✅ Step 4 complete, path:', storagePath);
        // Store base64 representation as fallback and for duplicate detection
        imageUrl = `data:image/jpeg;base64,${base64ForAI}`;
      } catch (uploadError) {
        console.warn('⚠️ Storage upload failed (continuing anyway):', uploadError);
        // Fallback: store base64 data URL for display in history
        imageUrl = `data:image/jpeg;base64,${base64ForAI}`;
      }

      const imageHash = computeHash(base64ForAI);
      // Simple hash for original file to detect exact re-uploads
      const fileHash = `${fileName}|${blob.size}`;

      return {
        id: generateId(),
        storeName: result.storeName,
        date: result.date,
        total: result.total,
        items: result.items,
        scannedAt: new Date().toISOString(),
        type: result.type || 'receipt',
        referenceCode: result.referenceCode,
        storagePath: storagePath, // May be empty if upload failed
        imageUrl: imageUrl, // Base64 fallback for history view
        imageHash: imageHash,
        fileHash: fileHash,
      } as Receipt;

    } catch (err) {
      console.error(`Error processing image:`, err);
      throw err;
    }
  };

  const handleCameraCapture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        setIsAnalyzing(true);
        setProgress({ current: 1, total: 1 });

        const response = await fetch(image.webPath);
        const blob = await response.blob();

        try {
          const receipt = await processImage(blob, 'camera_capture.jpg');
          finishProcessing([receipt], []);
        } catch (e) {
          finishProcessing([], ['Camera Capture']);
        }
      }
    } catch (e) {
      console.log('Camera cancelled or failed', e);
      // Don't show error if user just cancelled
      if (String(e).includes('cancelled')) return;
      setError('Failed to launch camera. Please try again or use the gallery.');
    }
  };

  const handleGallerySelect = async () => {
    try {
      const result = await Camera.pickImages({
        quality: 90,
        limit: 10 // Limit to 10 images to prevent OOM
      });

      if (result.photos && result.photos.length > 0) {
        setIsAnalyzing(true);
        const totalFiles = result.photos.length;
        setProgress({ current: 0, total: totalFiles });

        const newReceipts: Receipt[] = [];
        const errors: string[] = [];

        for (let i = 0; i < totalFiles; i++) {
          setProgress({ current: i + 1, total: totalFiles });
          const photo = result.photos[i];

          if (photo.webPath) {
            try {
              const response = await fetch(photo.webPath);
              const blob = await response.blob();
              const receipt = await processImage(blob, `gallery_image_${i}.jpg`);
              newReceipts.push(receipt);
            } catch (e) {
              console.error(`Failed to process gallery image ${i}`, e);
              errors.push(`Image ${i + 1}`);
            }
          }
        }

        finishProcessing(newReceipts, errors);
      }
    } catch (e) {
      console.log('Gallery cancelled or failed', e);
      if (String(e).includes('cancelled')) return;
      setError('Failed to pick images. Please try again.');
    }
  };

  const finishProcessing = (newReceipts: Receipt[], errors: string[]) => {
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

        <button
          onClick={handleCameraCapture}
          className="group relative flex flex-col items-center justify-center w-60 h-60 rounded-full bg-surface border-2 border-dashed border-slate-700 hover:border-primary hover:bg-surfaceHighlight transition-all duration-500 shadow-2xl shadow-black/50 hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]"
        >
          <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 pointer-events-none"></div>
          <div className="p-7 bg-slate-900 rounded-full mb-4 shadow-inner ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-500">
            <CameraIcon className="w-12 h-12 text-primary group-hover:text-sky-300 transition-colors duration-300" />
          </div>
          <span className="text-xl font-heading font-bold text-slate-200 tracking-tight group-hover:text-white transition-colors duration-300">
            Take Photo
          </span>
          <span className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide group-hover:text-primary/70 transition-colors duration-300">Camera Capture</span>
        </button>

        <button
          onClick={handleGallerySelect}
          className="w-60 py-4 rounded-2xl bg-surface border border-white/5 text-slate-300 font-bold hover:bg-surfaceHighlight hover:border-white/20 hover:text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <Images size={18} />
          Select from Gallery
        </button>

        <p className="text-xs text-slate-500 max-w-[260px] text-center mt-2 font-medium">
          Supports Receipts, Invoices, and Kindergarten Bills.<br />
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
