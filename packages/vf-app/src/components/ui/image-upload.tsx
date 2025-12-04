'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react';
import { LoadingDots } from './loading-dots';
import { uploadToIPFS, validateFile, fileToDataUrl, getIPFSUrl } from '@/services/ipfs-upload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  /** Current image URL (for preview) */
  currentImageUrl?: string;
  /** Current IPFS CID */
  currentIpfsCid?: string;
  /** Called when image is uploaded successfully */
  onUpload: (result: { cid: string; url: string; previewUrl: string }) => void;
  /** Called when image is cleared */
  onClear: () => void;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * ImageUpload - Drag & drop / click to upload image component
 * 
 * Uploads images to NEAR Social's IPFS gateway.
 */
export function ImageUpload({
  currentImageUrl,
  currentIpfsCid,
  onUpload,
  onClear,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine current display image
  const displayImage = preview || currentImageUrl || (currentIpfsCid ? getIPFSUrl(currentIpfsCid) : null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError.message);
      return;
    }

    try {
      // Show preview immediately
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);

      // Upload to IPFS
      setIsUploading(true);
      const result = await uploadToIPFS(file);
      
      console.log('IPFS upload result:', result);
      
      // Pass the data URL preview along with the IPFS result
      onUpload({ ...result, previewUrl: dataUrl });
      // Keep the preview for display until modal closes
    } catch (err) {
      console.error('IPFS upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  }, [disabled, isUploading, handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    onClear();
  }, [onClear]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-2xl transition-all cursor-pointer',
          'flex flex-col items-center justify-center',
          'min-h-[140px] p-4',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && !displayImage && 'border-border hover:border-muted-foreground/50 bg-muted/20',
          !isDragging && displayImage && 'border-border bg-muted/10',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive/50'
        )}
      >
        {/* Current/Preview Image */}
        {displayImage && !isUploading && (
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Clear button - styled like modal close buttons */}
            {!disabled && (
              <button
                onClick={handleClear}
                className="absolute -top-2 -right-2 w-6 h-6 bg-card border border-border text-muted-foreground hover:text-orange hover:border-orange rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        {/* Upload state */}
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingDots size="md" />
            <span className="text-sm text-muted-foreground">Uploading to IPFS...</span>
          </div>
        ) : !displayImage ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
              {isDragging ? (
                <Upload className="w-6 h-6 text-primary" />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? 'Drop image here' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, GIF, WebP, SVG (max 5MB)
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Click or drag to replace
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* IPFS CID display */}
      {currentIpfsCid && !error && (
        <p className="text-xs text-muted-foreground truncate">
          IPFS: {currentIpfsCid.slice(0, 20)}...
        </p>
      )}
    </div>
  );
}
