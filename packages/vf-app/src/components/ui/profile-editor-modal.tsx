'use client';

import React, { useEffect, useMemo } from 'react';
import { AlertCircle, Check, ExternalLink, Github, Globe, Hash, ImageIcon, LinkIcon, MapPin, Send, User, X } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { Button, LoadingButton } from './button';
import { Input } from './input';
import { Label } from './label';
import { Modal } from './modal';
import { ProfileAvatar } from './profile-avatar';
import { ImageUpload } from './image-upload';
import { getIPFSUrl } from '@/services/ipfs-upload';
import { useProfileEditor } from '@/hooks/use-profile-editor';

interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal for editing user's NEAR Social DB profile
 * Uses centralized Modal component with gradient header styling
 */
export function ProfileEditorModal({ isOpen, onClose, onSuccess }: ProfileEditorModalProps) {
  const {
    formState,
    updateField,
    updateLinktree,
    resetForm,
    submitProfile,
    isSubmitting,
    error,
    transactionHash,
    hasChanges,
    accountId,
    isConnected,
  } = useProfileEditor({
    onSuccess: () => {
      onSuccess?.();
      // Keep modal open briefly to show success
      setTimeout(() => {
        onClose();
      }, 2000);
    },
  });

  // Local preview URL for immediate display (data URL from file)
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [bgImagePreviewUrl, setBgImagePreviewUrl] = React.useState<string | null>(null);

  // Reset form when modal opens (track previous open state)
  const wasOpenRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      resetForm();
      setImagePreviewUrl(null); // Clear preview when modal opens
      setBgImagePreviewUrl(null);
      setTagInput(''); // Clear tag input
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, resetForm]);

  // Tag input state (for the text being typed)
  const [tagInput, setTagInput] = React.useState('');
  
  // Tag validation
  const MAX_TAGS = 10;
  const MAX_TAG_LENGTH = 20;
  
  // Website validation helper
  const websiteValidation = useMemo(() => {
    const value = formState.website.trim();
    if (!value) return { isValid: true, error: null, hint: null };
    
    // Check for spaces (invalid in URLs)
    if (value.includes(' ')) {
      return { isValid: false, error: 'URLs cannot contain spaces', hint: null };
    }
    
    // Check for at least one dot (basic domain check)
    if (!value.includes('.')) {
      return { isValid: false, error: 'Enter a valid domain (e.g., example.com)', hint: null };
    }
    
    // If no protocol, suggest adding https://
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return { 
        isValid: true, 
        error: null, 
        hint: `Will be saved as: https://${value}` 
      };
    }
    
    return { isValid: true, error: null, hint: null };
  }, [formState.website]);
  
  // Auto-fix website URL on blur
  const handleWebsiteBlur = () => {
    const value = formState.website.trim();
    if (value && !value.includes(' ') && value.includes('.')) {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        updateField('website', `https://${value}`);
      }
    }
  };
  
  // Parse existing tags from formState
  const existingTags = useMemo(() => {
    if (!formState.tags.trim()) return [];
    return formState.tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t && /^[a-z0-9_-]+$/.test(t) && t.length <= MAX_TAG_LENGTH)
      .filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
      .slice(0, MAX_TAGS);
  }, [formState.tags]);
  
  // Validate current input being typed
  const inputValidation = useMemo(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return { isValid: true, error: null };
    
    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      return { isValid: false, error: 'Only letters, numbers, hyphens allowed' };
    }
    if (trimmed.length > MAX_TAG_LENGTH) {
      return { isValid: false, error: `Max ${MAX_TAG_LENGTH} characters` };
    }
    if (existingTags.includes(trimmed)) {
      return { isValid: false, error: 'Tag already added' };
    }
    if (existingTags.length >= MAX_TAGS) {
      return { isValid: false, error: `Max ${MAX_TAGS} tags` };
    }
    return { isValid: true, error: null };
  }, [tagInput, existingTags]);
  
  // Add a tag
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || !inputValidation.isValid) return;
    if (existingTags.includes(trimmed)) return;
    if (existingTags.length >= MAX_TAGS) return;
    
    const newTags = [...existingTags, trimmed];
    updateField('tags', newTags.join(', '));
    setTagInput('');
  };
  
  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    const newTags = existingTags.filter(t => t !== tagToRemove);
    updateField('tags', newTags.join(', '));
  };
  
  // Handle key press in tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && existingTags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(existingTags[existingTags.length - 1]);
    }
  };
  
  // Handle input change - also check for comma
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      // Split by comma and add each tag
      const parts = value.split(',');
      parts.forEach((part, i) => {
        if (i < parts.length - 1) {
          // Add completed tags (before the last comma)
          const trimmed = part.trim().toLowerCase();
          if (trimmed && /^[a-z0-9_-]+$/.test(trimmed) && trimmed.length <= MAX_TAG_LENGTH) {
            if (!existingTags.includes(trimmed) && existingTags.length < MAX_TAGS) {
              const newTags = [...existingTags, trimmed];
              updateField('tags', newTags.join(', '));
            }
          }
        }
      });
      // Keep the part after the last comma as current input
      setTagInput(parts[parts.length - 1]);
    } else {
      setTagInput(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add any pending tag input before submitting
    if (tagInput.trim()) {
      addTag(tagInput);
    }
    void submitProfile();
  };

  // Get header avatar element
  const headerAvatar = (imagePreviewUrl || formState.imageUrl || formState.imageIpfsCid) ? (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-muted/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imagePreviewUrl || formState.imageUrl || formState.imageIpfsCid}
        src={imagePreviewUrl || formState.imageUrl || getIPFSUrl(formState.imageIpfsCid)}
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  ) : accountId ? (
    <ProfileAvatar accountId={accountId} size="lg" className="w-10 h-10 sm:w-12 sm:h-12" />
  ) : (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/50 flex items-center justify-center">
      <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
    </div>
  );

  // Success state
  if (transactionHash) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
        <Modal.Content className="text-center">
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-verified/10 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-verified" />
            </div>
            <h3 className="text-lg font-bold">Profile Updated!</h3>
            <p className="text-sm text-muted-foreground">
              Your profile has been successfully updated on NEAR Social.
            </p>
            <a
              href={`https://nearblocks.io/txns/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
            >
              View Transaction <ExternalLink className="w-4 h-4" />
            </a>
            <Button onClick={onClose} variant="verified" className="w-full py-3 font-bold">
              Close
            </Button>
          </div>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      disableClose={isSubmitting}
      closeOnBackdrop={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
        {/* Custom Header with Live Preview */}
        <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 p-4 sm:p-6 flex-shrink-0 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            {/* Profile Preview Card */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {headerAvatar}
              </div>
              
              {/* Info */}
              <div className="min-w-0 flex-1 space-y-0.5 text-left">
                {/* Name */}
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {formState.name || 'Your Name'}
                </h2>
                
                {/* Username @account.near */}
                {accountId && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{accountId}
                  </p>
                )}
                
                {/* Tagline Preview */}
                {formState.tagline ? (
                  <p className="text-sm text-muted-foreground truncate pt-0.5">
                    {formState.tagline}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic truncate pt-0.5">
                    Add a tagline...
                  </p>
                )}
                
                {/* Location + Tags row */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {formState.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{formState.location}</span>
                    </span>
                  )}
                  
                  {/* Show first 2 tags as preview */}
                  {existingTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {existingTags.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{existingTags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <Modal.Content className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Basic Info</h4>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                Display Name
                {formState.name && (
                  <span className={`text-xs ${formState.name.length > 32 ? 'text-orange' : 'text-muted-foreground'}`}>
                    ({formState.name.length}/32)
                  </span>
                )}
              </Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => {
                  if (e.target.value.length <= 32) {
                    updateField('name', e.target.value);
                  }
                }}
                placeholder="Your name or nickname"
                maxLength={32}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline" className="flex items-center gap-2 text-sm font-medium">
                Tagline
                {formState.tagline && (
                  <span className={`text-xs ${formState.tagline.length > 100 ? 'text-orange' : 'text-muted-foreground'}`}>
                    ({formState.tagline.length}/100)
                  </span>
                )}
              </Label>
              <Input
                id="tagline"
                value={formState.tagline}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    updateField('tagline', e.target.value);
                  }
                }}
                placeholder="A short tagline about you"
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                Bio / Description
                {formState.description && (
                  <span className={`text-xs ${formState.description.length > 280 ? 'text-orange' : formState.description.length > 240 ? 'text-orange/70' : 'text-muted-foreground'}`}>
                    ({formState.description.length}/280)
                  </span>
                )}
              </Label>
              <textarea
                id="description"
                value={formState.description}
                onChange={(e) => {
                  if (e.target.value.length <= 280) {
                    updateField('description', e.target.value);
                  }
                }}
                rows={3}
                maxLength={280}
                className="w-full px-4 py-3 bg-transparent border border-border rounded-2xl text-sm leading-relaxed focus:outline-none focus:border-muted-foreground/50 resize-none placeholder:text-primary placeholder:font-medium placeholder:opacity-60 hover:border-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Share a bit about yourself"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                Location
                {formState.location && (
                  <span className={`text-xs ${formState.location.length > 50 ? 'text-orange' : 'text-muted-foreground'}`}>
                    ({formState.location.length}/50)
                  </span>
                )}
              </Label>
              <Input
                id="location"
                value={formState.location}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    updateField('location', e.target.value);
                  }
                }}
                placeholder="City, Country or Remote"
                disabled={isSubmitting}
                maxLength={50}
              />
              
              {/* Quick location suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {['Remote 🌍', 'Worldwide', 'Nomad'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => updateField('location', suggestion)}
                    disabled={isSubmitting}
                    className="px-2 py-0.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2 text-sm font-medium">
                <Hash className="w-4 h-4" />
                Tags / Interests
                <span className="text-xs text-muted-foreground">
                  ({existingTags.length}/{MAX_TAGS})
                </span>
              </Label>
              
              {/* Tag pills container with input */}
              <div 
                className={`min-h-12 px-4 py-3 bg-transparent border rounded-2xl flex flex-wrap gap-1.5 items-center cursor-text transition-colors ${
                  inputValidation.error 
                    ? 'border-orange focus-within:border-orange' 
                    : 'border-border focus-within:border-muted-foreground/50 hover:border-muted-foreground/50'
                }`}
                onClick={() => document.getElementById('tags')?.focus()}
              >
                {/* Existing tags as removable pills */}
                {existingTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    disabled={isSubmitting}
                    className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1 group"
                  >
                    {tag}
                    <span className="text-primary/50 group-hover:text-primary">×</span>
                  </button>
                ))}
                
                {/* Input for new tags */}
                {existingTags.length < MAX_TAGS && (
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      if (tagInput.trim() && inputValidation.isValid) {
                        addTag(tagInput);
                      }
                    }}
                    placeholder={existingTags.length === 0 ? "Type and press comma or enter..." : ""}
                    disabled={isSubmitting}
                    className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-primary placeholder:font-medium placeholder:opacity-60 disabled:cursor-not-allowed"
                  />
                )}
              </div>
              
              {/* Input validation error */}
              {inputValidation.error && (
                <div className="flex items-start gap-2 text-xs text-orange">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{inputValidation.error}</span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Press comma or enter to add. Click tag to remove.
              </p>
            </div>
          </div>

          {/* Profile Image */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Profile Image</h4>
            
            <ImageUpload
              currentImageUrl={formState.imageUrl}
              currentIpfsCid={formState.imageIpfsCid}
              onUpload={(result) => {
                // Save preview URL for immediate display
                setImagePreviewUrl(result.previewUrl);
                // Clear URL and set IPFS CID for saving
                updateField('imageUrl', '');
                updateField('imageIpfsCid', result.cid);
              }}
              onClear={() => {
                setImagePreviewUrl(null);
                updateField('imageUrl', '');
                updateField('imageIpfsCid', '');
              }}
              disabled={isSubmitting}
            />

            {/* Manual URL input (collapsed/advanced) */}
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Or enter URL manually
              </summary>
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-sm font-medium">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formState.imageUrl}
                    onChange={(e) => {
                      updateField('imageUrl', e.target.value);
                      if (e.target.value) updateField('imageIpfsCid', '');
                    }}
                    placeholder="https://example.com/image.jpg"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Background Image */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Banner Image
            </h4>
            <p className="text-xs text-muted-foreground -mt-2">
              A cover/banner image shown on your profile page
            </p>
            
            {/* Background image preview */}
            {(bgImagePreviewUrl || formState.backgroundImageUrl || formState.backgroundImageIpfsCid) && (
              <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bgImagePreviewUrl || formState.backgroundImageUrl || getIPFSUrl(formState.backgroundImageIpfsCid)}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <ImageUpload
              currentImageUrl={formState.backgroundImageUrl}
              currentIpfsCid={formState.backgroundImageIpfsCid}
              onUpload={(result) => {
                setBgImagePreviewUrl(result.previewUrl);
                updateField('backgroundImageUrl', '');
                updateField('backgroundImageIpfsCid', result.cid);
              }}
              onClear={() => {
                setBgImagePreviewUrl(null);
                updateField('backgroundImageUrl', '');
                updateField('backgroundImageIpfsCid', '');
              }}
              disabled={isSubmitting}
            />

            {/* Manual URL input (collapsed/advanced) */}
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Or enter URL manually
              </summary>
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="bgImageUrl" className="text-sm font-medium">Banner URL</Label>
                  <Input
                    id="bgImageUrl"
                    value={formState.backgroundImageUrl}
                    onChange={(e) => {
                      updateField('backgroundImageUrl', e.target.value);
                      if (e.target.value) updateField('backgroundImageIpfsCid', '');
                    }}
                    placeholder="https://example.com/banner.jpg"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Social Links</h4>
            
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              <Input
                id="website"
                value={formState.website}
                onChange={(e) => updateField('website', e.target.value)}
                onBlur={handleWebsiteBlur}
                placeholder="e.g. yourwebsite.com"
                disabled={isSubmitting}
                className={websiteValidation.error ? 'border-orange focus:border-orange' : ''}
              />
              {/* Validation feedback */}
              {websiteValidation.error && (
                <div className="flex items-start gap-2 text-xs text-orange">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{websiteValidation.error}</span>
                </div>
              )}
              {websiteValidation.hint && (
                <p className="text-xs text-muted-foreground">
                  {websiteValidation.hint}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2 text-sm font-medium">
                <FaXTwitter className="w-4 h-4" />
                X
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="twitter"
                  value={formState.linktree.twitter ?? ''}
                  onChange={(e) => {
                    // Strip @ if user types it
                    const value = e.target.value.replace(/^@/, '');
                    updateLinktree('twitter', value);
                  }}
                  placeholder="username"
                  disabled={isSubmitting}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2 text-sm font-medium">
                <Github className="w-4 h-4" />
                GitHub
              </Label>
              <Input
                id="github"
                value={formState.linktree.github ?? ''}
                onChange={(e) => updateLinktree('github', e.target.value)}
                placeholder="username"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram" className="flex items-center gap-2 text-sm font-medium">
                <Send className="w-4 h-4" />
                Telegram
              </Label>
              <Input
                id="telegram"
                value={formState.linktree.telegram ?? ''}
                onChange={(e) => updateLinktree('telegram', e.target.value)}
                placeholder="username"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Info about Social DB */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                Your profile is stored on{' '}
                <a
                  href="https://github.com/NearSocial/social-db"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  NEAR Social DB
                </a>
                . A small storage deposit (~0.05 NEAR) is required for new data.
              </div>
            </div>
          </div>
        </Modal.Content>

        {/* Fixed Footer with Actions */}
        <Modal.Footer className="border-t border-border">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="muted"
              onClick={onClose}
              className="flex-1 h-12"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="verified"
              className="flex-1 font-bold h-12"
              disabled={!hasChanges || !isConnected}
              isLoading={isSubmitting}
            >
              Save Profile
            </LoadingButton>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
