'use client';

import React, { useEffect, useMemo } from 'react';
import { AlertCircle, Check, ExternalLink, Github, Globe, Hash, ImageIcon, LinkIcon, MapPin, Send, User, X } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { Button, LoadingButton } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { cidFromMediaRef, toIpfsUri } from '@/features/onsocial/media';
import {
  PROFILE_ABOUT_MAX,
  PROFILE_ABOUT_PHOTOS_MAX,
  PROFILE_BIO_MAX,
  PROFILE_INDUSTRY_OPTIONS,
  PROFILE_LEAD_MAX,
} from '@/features/onsocial/profile';
import { useAppDrawer } from '@/features/shell/drawer-context';
import { useProfileEditor } from '@/hooks/use-profile-editor';
import { getIPFSUrl } from '@/services/ipfs-upload';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

function firstNonEmpty(...values: (string | null | undefined)[]): string {
  return values.find((value) => Boolean(value)) ?? '';
}

export function ProfileEditorDrawerContent() {
  const { action, closeDrawer, setLocked } = useAppDrawer();
  const onSuccess = action?.id === 'edit-profile' ? action.onSuccess : undefined;

  const {
    formState,
    updateField,
    updateLink,
    daoLocked,
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
      setTimeout(() => {
        closeDrawer();
      }, 2000);
    },
  });

  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [bgImagePreviewUrl, setBgImagePreviewUrl] = React.useState<string | null>(null);
  const [tagInput, setTagInput] = React.useState('');

  useEffect(() => {
    resetForm();
    setImagePreviewUrl(null);
    setBgImagePreviewUrl(null);
    setTagInput('');
  }, [resetForm]);

  useEffect(() => {
    setLocked(isSubmitting);
    return () => setLocked(false);
  }, [isSubmitting, setLocked]);

  const websiteValidation = useMemo(() => {
    const value = formState.website.trim();
    if (!value) return { isValid: true, error: null, hint: null };
    if (value.includes(' ')) {
      return { isValid: false, error: 'URLs cannot contain spaces', hint: null };
    }
    if (!value.includes('.')) {
      return { isValid: false, error: 'Enter a valid domain (e.g., example.com)', hint: null };
    }
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return { isValid: true, error: null, hint: `Will be saved as: https://${value}` };
    }
    return { isValid: true, error: null, hint: null };
  }, [formState.website]);

  const handleWebsiteBlur = () => {
    const value = formState.website.trim();
    if (value && !value.includes(' ') && value.includes('.')) {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        updateField('website', `https://${value}`);
      }
    }
  };

  const existingTags = useMemo(() => {
    if (!formState.tags.trim()) return [];
    return formState.tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag && /^[a-z0-9_-]+$/.test(tag) && tag.length <= MAX_TAG_LENGTH)
      .filter((tag, index, list) => list.indexOf(tag) === index)
      .slice(0, MAX_TAGS);
  }, [formState.tags]);

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
  }, [existingTags, tagInput]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || !inputValidation.isValid) return;
    if (existingTags.includes(trimmed) || existingTags.length >= MAX_TAGS) return;
    updateField('tags', [...existingTags, trimmed].join(', '));
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    updateField('tags', existingTags.filter((tag) => tag !== tagToRemove).join(', '));
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      addTag(tagInput);
    } else if (event.key === 'Backspace' && !tagInput && existingTags.length > 0) {
      removeTag(existingTags[existingTags.length - 1]);
    }
  };

  const handleTagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.includes(',')) {
      const parts = value.split(',');
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          const trimmed = part.trim().toLowerCase();
          if (
            trimmed &&
            /^[a-z0-9_-]+$/.test(trimmed) &&
            trimmed.length <= MAX_TAG_LENGTH &&
            !existingTags.includes(trimmed) &&
            existingTags.length < MAX_TAGS
          ) {
            updateField('tags', [...existingTags, trimmed].join(', '));
          }
        }
      });
      setTagInput(parts[parts.length - 1]);
    } else {
      setTagInput(value);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (tagInput.trim()) {
      addTag(tagInput);
    }
    void submitProfile();
  };

  const bannerSrc = firstNonEmpty(
    bgImagePreviewUrl,
    formState.backgroundImageUrl,
    formState.backgroundImageIpfsCid ? getIPFSUrl(formState.backgroundImageIpfsCid) : ''
  );
  const avatarSrc = firstNonEmpty(
    imagePreviewUrl,
    formState.imageUrl,
    formState.imageIpfsCid ? getIPFSUrl(formState.imageIpfsCid) : ''
  );

  const headerAvatar = avatarSrc ? (
      <div className="h-10 w-10 overflow-hidden rounded-full bg-muted/50 sm:h-12 sm:w-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={avatarSrc}
          src={avatarSrc}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    ) : accountId ? (
      <ProfileAvatar accountId={accountId} size="lg" className="h-10 w-10 sm:h-12 sm:w-12" />
    ) : (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 sm:h-12 sm:w-12">
        <User className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
      </div>
    );

  if (transactionHash) {
    return (
      <>
        <Drawer.Header title="Profile Updated!" onClose={closeDrawer} />
        <Drawer.Content className="text-center">
          <div className="space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verified/10">
              <Check className="h-10 w-10 text-verified" />
            </div>
            <p className="text-sm text-muted-foreground">Your profile has been saved on OnSocial.</p>
            <a
              href={`https://nearblocks.io/txns/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View Transaction <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Drawer.Content>
        <Drawer.Footer>
          <Button onClick={closeDrawer} variant="verified" className="w-full py-3 font-bold">
            Close
          </Button>
        </Drawer.Footer>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 px-5 pb-4 pt-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex-shrink-0">{headerAvatar}</div>
            <div className="min-w-0 flex-1 space-y-0.5 text-left">
              <h2 id="app-drawer-title" className="truncate text-lg font-bold text-foreground">
                {formState.name || 'Your Name'}
              </h2>
              {accountId && <p className="truncate text-sm text-muted-foreground">@{accountId}</p>}
              {formState.kind === 'org' ? (
                <p className="truncate pt-0.5 text-sm text-muted-foreground">
                  {formState.industry.trim() || 'Organization'}
                </p>
              ) : daoLocked ? (
                <p className="truncate pt-0.5 text-sm text-muted-foreground">DAO</p>
              ) : (
                <p className="truncate pt-0.5 text-sm italic text-muted-foreground/50">Person</p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {formState.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="max-w-[100px] truncate">{formState.location}</span>
                  </span>
                )}
                {existingTags.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    {tag}
                  </span>
                ))}
                {existingTags.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{existingTags.length - 2}</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            disabled={isSubmitting}
            className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <Drawer.Content className="space-y-4">
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
              onChange={(event) => {
                if (event.target.value.length <= 32) {
                  updateField('name', event.target.value);
                }
              }}
              placeholder="Your name or nickname"
              maxLength={32}
              disabled={isSubmitting}
            />
          </div>

          {!daoLocked && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Face</Label>
              <div className="flex gap-2">
                {(
                  [
                    ['person', 'Person'],
                    ['org', 'Organization'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField('kind', value)}
                    disabled={isSubmitting}
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                      formState.kind === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formState.kind === 'org' && !daoLocked && (
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium">
                Industry
              </Label>
              <select
                id="industry"
                value={formState.industry}
                onChange={(event) => updateField('industry', event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm"
              >
                <option value="">Organization</option>
                {PROFILE_INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
              Bio
              {formState.bio && (
                <span
                  className={`text-xs ${formState.bio.length > PROFILE_BIO_MAX ? 'text-orange' : formState.bio.length > PROFILE_BIO_MAX - 40 ? 'text-orange/70' : 'text-muted-foreground'}`}
                >
                  ({formState.bio.length}/{PROFILE_BIO_MAX})
                </span>
              )}
            </Label>
            <textarea
              id="description"
              value={formState.bio}
              onChange={(event) => {
                if (event.target.value.length <= PROFILE_BIO_MAX) {
                  updateField('bio', event.target.value);
                }
              }}
              rows={3}
              maxLength={PROFILE_BIO_MAX}
              className="w-full resize-none rounded-2xl border border-border bg-transparent px-4 py-3 text-sm leading-relaxed placeholder:font-medium placeholder:text-primary placeholder:opacity-60 hover:border-muted-foreground/50 focus:border-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Short line on your face"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">The face line. The business story is About, below.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">About</p>
              <p className="text-xs text-muted-foreground">
                Same OnSocial About page. Farms, mills, and people write it once — VF reads it here.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-lead" className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                Lead
                {formState.lead && (
                  <span className="text-xs text-muted-foreground">
                    ({formState.lead.length}/{PROFILE_LEAD_MAX})
                  </span>
                )}
              </Label>
              <Input
                id="about-lead"
                value={formState.lead}
                onChange={(event) => {
                  if (event.target.value.length <= PROFILE_LEAD_MAX) {
                    updateField('lead', event.target.value);
                  }
                }}
                placeholder="Oats from Kalmar. Logged, not claimed."
                disabled={isSubmitting}
                maxLength={PROFILE_LEAD_MAX}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about" className="flex items-center gap-2 text-sm font-medium">
                The story
                {formState.about && (
                  <span
                    className={`text-xs ${formState.about.length > PROFILE_ABOUT_MAX - 100 ? 'text-orange' : 'text-muted-foreground'}`}
                  >
                    ({formState.about.length}/{PROFILE_ABOUT_MAX})
                  </span>
                )}
              </Label>
              <textarea
                id="about"
                value={formState.about}
                onChange={(event) => {
                  if (event.target.value.length <= PROFILE_ABOUT_MAX) {
                    updateField('about', event.target.value);
                  }
                }}
                rows={6}
                maxLength={PROFILE_ABOUT_MAX}
                className="w-full resize-y rounded-2xl border border-border bg-transparent px-4 py-3 text-sm leading-relaxed placeholder:font-medium placeholder:text-primary placeholder:opacity-60 hover:border-muted-foreground/50 focus:border-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Who you are, what you grow or stamp, and how to read the business."
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                About photos ({formState.photos.length}/{PROFILE_ABOUT_PHOTOS_MAX})
              </p>
              {formState.photos.map((ref, index) => (
                <ImageUpload
                  key={`${ref}-${index}`}
                  currentIpfsCid={cidFromMediaRef(ref) ?? undefined}
                  onUpload={(result) => {
                    const next = [...formState.photos];
                    next[index] = toIpfsUri(result.cid);
                    updateField('photos', next);
                  }}
                  onClear={() => {
                    updateField(
                      'photos',
                      formState.photos.filter((_, itemIndex) => itemIndex !== index)
                    );
                  }}
                  disabled={isSubmitting}
                />
              ))}
              {formState.photos.length < PROFILE_ABOUT_PHOTOS_MAX && (
                <ImageUpload
                  onUpload={(result) => {
                    updateField('photos', [...formState.photos, toIpfsUri(result.cid)]);
                  }}
                  onClear={() => undefined}
                  disabled={isSubmitting}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
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
              onChange={(event) => {
                if (event.target.value.length <= 50) {
                  updateField('location', event.target.value);
                }
              }}
              placeholder="City, Country or Remote"
              disabled={isSubmitting}
              maxLength={50}
            />
            <div className="flex flex-wrap gap-1.5">
              {['Remote 🌍', 'Worldwide', 'Nomad'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => updateField('location', suggestion)}
                  disabled={isSubmitting}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2 text-sm font-medium">
              <Hash className="h-4 w-4" />
              Tags / Interests
              <span className="text-xs text-muted-foreground">
                ({existingTags.length}/{MAX_TAGS})
              </span>
            </Label>
            <div
              className={`flex min-h-12 cursor-text flex-wrap items-center gap-1.5 rounded-2xl border bg-transparent px-4 py-3 transition-colors ${
                inputValidation.error
                  ? 'border-orange focus-within:border-orange'
                  : 'border-border hover:border-muted-foreground/50 focus-within:border-muted-foreground/50'
              }`}
              onClick={() => document.getElementById('tags')?.focus()}
            >
              {existingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeTag(tag);
                  }}
                  disabled={isSubmitting}
                  className="group flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary transition-colors hover:bg-primary/20"
                >
                  {tag}
                  <span className="text-primary/50 group-hover:text-primary">×</span>
                </button>
              ))}
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
                  placeholder={existingTags.length === 0 ? 'Type and press comma or enter...' : ''}
                  disabled={isSubmitting}
                  className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:font-medium placeholder:text-primary placeholder:opacity-60 disabled:cursor-not-allowed"
                />
              )}
            </div>
            {inputValidation.error && (
              <div className="flex items-start gap-2 text-xs text-orange">
                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>{inputValidation.error}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Press comma or enter to add. Click tag to remove.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Profile Image</h4>
          <ImageUpload
            currentImageUrl={formState.imageUrl}
            currentIpfsCid={formState.imageIpfsCid}
            onUpload={(result) => {
              setImagePreviewUrl(result.previewUrl);
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
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
              Or enter URL manually
            </summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-sm font-medium">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  value={formState.imageUrl}
                  onChange={(event) => {
                    updateField('imageUrl', event.target.value);
                    if (event.target.value) updateField('imageIpfsCid', '');
                  }}
                  placeholder="https://example.com/image.jpg"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </details>
        </div>

        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-medium text-foreground">
            <ImageIcon className="h-4 w-4" />
            Banner Image
          </h4>
          <p className="-mt-2 text-xs text-muted-foreground">A cover/banner image shown on your profile page</p>
          {bannerSrc ? (
            <div className="relative h-24 w-full overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerSrc}
                alt="Banner preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
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
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
              Or enter URL manually
            </summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="bgImageUrl" className="text-sm font-medium">
                  Banner URL
                </Label>
                <Input
                  id="bgImageUrl"
                  value={formState.backgroundImageUrl}
                  onChange={(event) => {
                    updateField('backgroundImageUrl', event.target.value);
                    if (event.target.value) updateField('backgroundImageIpfsCid', '');
                  }}
                  placeholder="https://example.com/banner.jpg"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </details>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Social Links</h4>
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              value={formState.website}
              onChange={(event) => updateField('website', event.target.value)}
              onBlur={handleWebsiteBlur}
              placeholder="e.g. yourwebsite.com"
              disabled={isSubmitting}
              className={websiteValidation.error ? 'border-orange focus:border-orange' : ''}
            />
            {websiteValidation.error && (
              <div className="flex items-start gap-2 text-xs text-orange">
                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>{websiteValidation.error}</span>
              </div>
            )}
            {websiteValidation.hint && <p className="text-xs text-muted-foreground">{websiteValidation.hint}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2 text-sm font-medium">
              <FaXTwitter className="h-4 w-4" />
              X
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <Input
                id="twitter"
                value={formState.links.twitter ?? ''}
                onChange={(event) => updateLink('twitter', event.target.value.replace(/^@/, ''))}
                placeholder="username"
                disabled={isSubmitting}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github" className="flex items-center gap-2 text-sm font-medium">
              <Github className="h-4 w-4" />
              GitHub
            </Label>
            <Input
              id="github"
              value={formState.links.github ?? ''}
              onChange={(event) => updateLink('github', event.target.value)}
              placeholder="username"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram" className="flex items-center gap-2 text-sm font-medium">
              <Send className="h-4 w-4" />
              Telegram
            </Label>
            <Input
              id="telegram"
              value={formState.links.telegram ?? ''}
              onChange={(event) => updateLink('telegram', event.target.value)}
              placeholder="username"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="rounded-lg bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <LinkIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Your profile lives on OnSocial core at <span className="font-mono text-xs">profile/</span>
              . Organization is a face on the same account — not a group and not a VF tracker role.
            </div>
          </div>
        </div>
      </Drawer.Content>

      <Drawer.Footer>
        <div className="flex gap-3">
          <Button type="button" variant="muted" onClick={closeDrawer} className="h-12 flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="verified"
            className="h-12 flex-1 font-bold"
            disabled={!hasChanges || !isConnected}
            isLoading={isSubmitting}
          >
            Save Profile
          </LoadingButton>
        </div>
      </Drawer.Footer>
    </form>
  );
}
