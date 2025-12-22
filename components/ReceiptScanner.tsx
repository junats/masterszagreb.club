import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera as CameraIcon, Upload, Loader2, CheckCircle, AlertCircle, Images, ScanLine, Edit2, Save, X } from 'lucide-react';
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

import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';

interface ReceiptScannerProps {
  onScanComplete: (receipts: Receipt[]) => void;
  onCancel: () => void;
  // Removed: ageRestricted, userId, categories
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, onCancel }) => {
  const {
    ageRestricted,
    categories,
    isProMode
  } = useData();
  const { user } = useUser();

  // Fallback if user is null (should normally be handled by auth guard)
  const userId = user?.id || 'user-1';

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [scannedReceipts, setScannedReceipts] = useState<Receipt[]>([]);
  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0);

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

          // Max dimensions - increased to support long receipts without crushing text
          const MAX_WIDTH = 1500;
          const MAX_HEIGHT = 2500;
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
      // Safety Timeout Promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Analysis timed out. Please try again.")), 120000)
      );

      // The actual processing logic wrapped in a promise we can race against
      const processingTask = async () => {
        // 1. Optimize Image (Resize & Compress) -> Blob
        const processedBlob = await optimizeImage(blob);

        // 2. Convert to Base64 for Gemini Analysis
        const base64ForAI = await blobToBase64(processedBlob);

        // 3. Analyze with Unified Smart Service
        const result: AnalysisResult = await analyzeReceiptImage(base64ForAI, categories);

        // 4. Upload Image via Storage Service (Cloud or Mock)
        let storagePath = '';
        let imageUrl = '';
        try {
          storagePath = await storageService.uploadReceiptImage(processedBlob, userId);
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
          storeName: result.storeName || 'Unknown Store',
          date: result.date || new Date().toISOString().split('T')[0],
          total: result.total || (result.items || []).reduce((sum, item) => sum + item.price, 0) || 0,
          items: result.items || [],
          scannedAt: new Date().toISOString(),
          type: result.type || 'receipt',
          referenceCode: result.referenceCode,
          storagePath: storagePath,
          imageUrl: imageUrl,
          imageHash: imageHash,
          fileHash: fileHash,
        } as Receipt;
      };

      // Race the processing against the timeout
      return await Promise.race([processingTask(), timeoutPromise]) as Receipt;

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
        source: CameraSource.Camera,
        saveToGallery: false
      });

      if (image.webPath) {
        setIsAnalyzing(true);
        // Reset state
        setError(null);
        setProgress({ current: 1, total: 1 });

        const response = await fetch(image.webPath);
        const blob = await response.blob();

        try {
          const receipt = await processImage(blob, 'camera_capture.jpg');
          finishProcessing([receipt], []);
        } catch (e: any) {
          console.error("Single camera processing failed:", e);
          finishProcessing([], [e instanceof Error ? e.message : String(e)]);
        }
      }
    } catch (e) {
      console.log('Camera cancelled or failed', e);
      // Don't show error if user just cancelled
      if (String(e).includes('cancelled') || String(e).includes('User cancelled')) return;
      setError('Failed to launch camera: ' + (e instanceof Error ? e.message : String(e)));
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
      // Save ALL receipts for review
      setScannedReceipts(newReceipts);
      setCurrentReceiptIndex(0); // Reset to first receipt
      setShowReviewModal(true);
      setIsAnalyzing(false);
      setProgress(null);
    } else {
      setError("Failed to analyze images. " + (errors.length > 0 ? `Error with: ${errors[0]}` : "Please try again."));
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  const handleSave = () => {
    if (scannedReceipts.length > 0) {
      // Ensure all receipts have valid dates
      const finalReceipts = scannedReceipts.map(receipt => ({
        ...receipt,
        date: receipt.date || new Date().toISOString().split('T')[0]
      }));
      onScanComplete(finalReceipts);
      setShowReviewModal(false);
      setScannedReceipts([]);
    }
  };

  // Helper to update the first receipt in the array
  const updateFirstReceipt = (updates: Partial<Receipt>) => {
    if (scannedReceipts.length > 0) {
      const updated = [...scannedReceipts];
      updated[0] = { ...updated[0], ...updates };
      setScannedReceipts(updated);
    }
  };

  // Process Files (Images or Docs)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsAnalyzing(true);
      setProgress({ current: 0, total: files.length });

      const newReceipts: Receipt[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        setProgress({ current: i + 1, total: files.length });
        const file = files[i];

        try {
          // Check if image
          if (file.type.startsWith('image/')) {
            const receipt = await processImage(file, file.name);
            newReceipts.push(receipt);
          } else {
            // Document (PDF, etc.) - Skip Analysis, Direct Upload Logic
            // We create a "Manual" receipt but with the file attached
            const storagePath = await storageService.uploadReceipt(file, userId);

            newReceipts.push({
              id: crypto.randomUUID(),
              storeName: "Unknown Store",
              date: new Date().toISOString().split('T')[0],
              total: 0,
              items: [{ name: "Document Upload", price: 0, category: "Other", quantity: 1 }],
              storagePath: storagePath,
              imageUrl: '', // No preview for docs
              scannedAt: new Date().toISOString(),
              type: 'receipt'
            });
          }
        } catch (e: any) {
          console.error(`Failed to process file ${file.name}`, e);
          // Include actual error message for debugging
          errors.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      finishProcessing(newReceipts, errors);
    }
  };

  // Manual Entry Logic
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({ store: '', total: '', date: new Date().toISOString().split('T')[0], category: 'Other' });

  const handleManualSubmit = () => {
    if (!manualData.store || !manualData.total) return;

    const parsedTotal = parseFloat(manualData.total);
    if (isNaN(parsedTotal)) {
      alert("Please enter a valid amount.");
      return;
    }

    const simpleId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const newReceipt: Receipt = {
      id: simpleId,
      storeName: manualData.store,
      date: manualData.date,
      total: parsedTotal,
      items: [{ name: "Manual Entry", price: parsedTotal, category: manualData.category, quantity: 1 }],
      scannedAt: new Date().toISOString(),
      imageUrl: '',
      storagePath: '',
      type: 'receipt'
    };

    console.log("Saving manual receipt:", newReceipt);
    onScanComplete([newReceipt]);

    // cleanup
    setShowManualModal(false);
    setManualData({ store: '', total: '', date: new Date().toISOString().split('T')[0], category: 'Other' });
  };

  return (
    <div className="flex flex-col h-full px-4 pt-0 pb-8 overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col h-full"
      >
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-surfaceHighlight rounded-2xl mx-auto flex items-center justify-center mb-4 ring-1 ring-white/10 shadow-lg shadow-black/50">
            <ScanLine size={32} className="text-primary" />
          </div>
          <p className="text-slate-400 text-sm font-medium mt-1">Upload a Receipt or Bill.</p>

          {ageRestricted && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <CheckCircle size={12} />
              <span>Parental Mode Active</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => { setError(null); handleCameraCapture(); }}
              className="self-end px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold rounded-lg transition-colors border border-red-500/30"
            >
              Retry Scan
            </button>
          </div>
        )}

        {/* Analyzing Overlay (Modal) */}
        {isAnalyzing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface w-full max-w-sm p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 size={48} className="text-primary animate-spin relative z-10" />
              </div>

              <h3 className="text-xl font-heading font-bold text-white mb-2">Analyzing Receipt...</h3>
              <p className="text-slate-400 text-sm mb-6">Extracting merchant, date, and totals.</p>

              {progress && (
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
              {progress && progress.total > 1 && (
                <p className="text-xs text-slate-500 font-mono">Processing {progress.current} of {progress.total}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {/* Camera */}
          <button
            onClick={handleCameraCapture}
            className="aspect-square bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-4 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/50"
          >
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
              <CameraIcon size={32} className="text-blue-400" />
            </div>
            <span className="text-slate-300 font-medium">Camera</span>
          </button>

          {/* Gallery / File */}
          <button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="aspect-square bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-4 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/50"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20">
              <Images size={32} className="text-purple-400" />
            </div>
            <span className="text-slate-300 font-medium">Upload File</span>
          </button>

          {/* Manual Entry */}
          <button
            onClick={() => setShowManualModal(true)}
            className="col-span-2 h-20 bg-slate-900 rounded-3xl border border-slate-800 flex flex-row items-center justify-center gap-4 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/50"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
              <Edit2 size={20} className="text-emerald-400" />
            </div>
            <span className="text-slate-300 font-medium">Enter Manually</span>
          </button>
        </div>


        <p className="text-xs text-slate-500 max-w-[260px] mx-auto text-center mt-2 font-medium">
          Supports Receipts, Invoices, and Kindergarten Bills.<br />
          Ensure text is clear and well-lit.
        </p>


        <div className="mt-auto">
          <button onClick={onCancel} className="w-full py-4 rounded-2xl text-slate-500 font-bold hover:bg-white/5 hover:text-slate-300 transition-all duration-300">
            Cancel
          </button>
        </div>

        {/* Review Modal */}
        {
          showReviewModal && scannedReceipts.length > 0 && (
            <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
              {/* Position modal below header instead of centering */}
              <div className="w-full h-full flex justify-center pt-[calc(var(--header-height)+var(--safe-area-top)+1rem)] pb-24 px-4">
                <div className="bg-surface w-full max-w-lg h-fit max-h-[calc(100vh-var(--header-height)-var(--safe-area-top)-7rem)] rounded-3xl border border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

                  {/* Header - Fixed */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                      <h2 className="text-xl font-heading font-bold text-white">Review Scan</h2>
                      {scannedReceipts.length > 1 && (
                        <p className="text-xs text-slate-400 mt-1">
                          Receipt {currentReceiptIndex + 1} of {scannedReceipts.length}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain">
                    {/* Store & Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Store</label>
                        <input
                          type="text"
                          value={scannedReceipts[0]?.storeName || ''}
                          onChange={(e) => updateFirstReceipt({ storeName: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date</label>
                        <input
                          type="date"
                          value={scannedReceipts[0]?.date || ''}
                          onChange={(e) => updateFirstReceipt({ date: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Total Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                        <input
                          type="number"
                          value={scannedReceipts[0]?.total || 0}
                          onChange={(e) => updateFirstReceipt({ total: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white font-mono focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex justify-between">
                        <span>Items ({scannedReceipts[0]?.items.length || 0})</span>
                        <span className="text-primary text-[10px]">Tap to edit details</span>
                      </label>
                      <div className="space-y-2">
                        {(scannedReceipts[0]?.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="text-sm text-white font-medium truncate">{item.name}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300">{item.category}</span>
                                {item.isChildRelated && (
                                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle size={8} /> Child
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-mono text-slate-300">€{item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Extra spacing at bottom to ensure last fields are accessible */}
                    <div className="h-4"></div>
                  </div>

                  {/* Multi-Receipt Navigation - Only show if multiple receipts */}
                  {scannedReceipts.length > 1 && (
                    <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between shrink-0">
                      <button
                        onClick={() => {
                          // Go to previous receipt
                          const newIndex = (currentReceiptIndex - 1 + scannedReceipts.length) % scannedReceipts.length;
                          setCurrentReceiptIndex(newIndex);
                          const reordered = [...scannedReceipts.slice(newIndex), ...scannedReceipts.slice(0, newIndex)];
                          setScannedReceipts(reordered);
                        }}
                        disabled={scannedReceipts.length <= 1}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        ← Previous
                      </button>

                      {/* Pagination Dots - Now properly tracking current index */}
                      <div className="flex gap-2">
                        {Array.from({ length: scannedReceipts.length }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentReceiptIndex(idx);
                              const reordered = [...scannedReceipts.slice(idx), ...scannedReceipts.slice(0, idx)];
                              setScannedReceipts(reordered);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentReceiptIndex ? 'bg-primary w-6' : 'bg-slate-600 hover:bg-slate-500'
                              }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          // Go to next receipt
                          const newIndex = (currentReceiptIndex + 1) % scannedReceipts.length;
                          setCurrentReceiptIndex(newIndex);
                          const reordered = [...scannedReceipts.slice(1), scannedReceipts[0]];
                          setScannedReceipts(reordered);
                        }}
                        disabled={scannedReceipts.length <= 1}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  {/* Footer - Fixed at bottom with extra padding */}
                  <div className="p-6 pb-8 border-t border-white/10 bg-surfaceHighlight/50 rounded-b-3xl shrink-0">
                    <button
                      onClick={handleSave}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      Save {scannedReceipts.length > 1 ? `${scannedReceipts.length} Receipts` : 'Receipt'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </motion.div >

      {/* Hidden File Input */}
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*,.pdf"
        multiple
        onChange={handleFileUpload}
      />

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-heading font-bold text-white">Manual Entry</h2>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Store & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Store</label>
                  <input
                    type="text"
                    value={manualData.store}
                    onChange={(e) => setManualData({ ...manualData, store: e.target.value })}
                    placeholder="e.g. Wal-Mart"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date</label>
                  <input
                    type="date"
                    value={manualData.date}
                    onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Total & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Total Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <input
                      type="number"
                      value={manualData.total}
                      onChange={(e) => setManualData({ ...manualData, total: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white font-mono focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                  <select
                    value={manualData.category}
                    onChange={(e) => setManualData({ ...manualData, category: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-primary focus:outline-none appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-white/10 bg-surfaceHighlight/50 rounded-b-3xl">
              <button
                onClick={handleManualSubmit}
                disabled={!manualData.store || !manualData.total}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Add Receipt
              </button>
            </div>

          </div>
        </div>
      )}
    </div >
  );
};

export default ReceiptScanner;
