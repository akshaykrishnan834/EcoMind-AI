import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X, AlertCircle, FileText } from 'lucide-react';

const WasteImageUpload = ({
  onImageSelected,
  onAnalyze,
  onSwitchToManual,
  isAnalyzing,
  error
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 10;

  const handleFile = (file) => {
    setValidationError('');
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError('Invalid file format. Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationError(`File size exceeds ${MAX_SIZE_MB}MB limit. Please choose a smaller image.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (onImageSelected) {
      onImageSelected(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageSelected) {
      onImageSelected(null);
    }
  };

  const handleAnalyzeClick = () => {
    if (!selectedFile) {
      setValidationError('Please select or upload an image first.');
      return;
    }
    if (onAnalyze) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#0a4d2c]" />
            Upload Waste Photo
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Upload a clear photo of your waste items for instant AI classification, or enter items manually.
          </p>
        </div>

        <button
          type="button"
          onClick={onSwitchToManual}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer shrink-0"
        >
          <FileText className="w-4 h-4 text-emerald-700" />
          <span>Skip to Manual Entry</span>
        </button>
      </div>

      {/* Validation or API Error Banner */}
      {(validationError || error) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice: </span>
            {validationError || error}
          </div>
        </div>
      )}

      {/* Image Preview or Dropzone */}
      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-gray-900/5 max-h-[360px] flex items-center justify-center group">
            <img
              src={previewUrl}
              alt="Uploaded Waste Preview"
              className="max-h-[340px] w-auto object-contain rounded-xl shadow-xs"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-3 right-3 p-2 bg-gray-900/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-gray-900/80 text-white text-xs rounded-lg backdrop-blur-xs font-medium">
              {selectedFile?.name} ({(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB)
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearImage}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              disabled={isAnalyzing}
            >
              Choose Different Photo
            </button>

            <button
              type="button"
              onClick={handleAnalyzeClick}
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-6 py-3 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Waste with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                  <span>Analyze with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#0a4d2c] bg-emerald-50/80 scale-[0.99]'
              : 'border-emerald-200/80 bg-emerald-50/30 hover:bg-emerald-50/60 hover:border-emerald-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center mx-auto shadow-xs">
              <Upload className="w-8 h-8 text-[#0a4d2c]" />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-800">
                Click to upload <span className="font-normal text-gray-500">or drag and drop</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports JPEG, JPG, PNG, WEBP (Max {MAX_SIZE_MB}MB)
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-emerald-200 shadow-2xs text-xs font-semibold text-[#0a4d2c]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant AI Waste Recognition</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteImageUpload;
