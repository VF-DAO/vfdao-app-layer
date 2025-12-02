// src/types/profile.ts
export interface NearSocialProfile {
  name?: string;
  description?: string;
  image?: {
    url?: string;
    ipfs_cid?: string;
    nft?: {
      contractId: string;
      tokenId: string;
    };
  };
  backgroundImage?: {
    url?: string;
    ipfs_cid?: string;
  };
  linktree?: Record<string, string>;
  website?: string;
  tagline?: string;
  location?: string;
  plurals?: number; // For plural pronouns
  horizontalBanner?: {
    url?: string;
    ipfs_cid?: string;
  };
}

export interface NearSocialProfileData {
  profile?: NearSocialProfile;
  [key: string]: any; // Allow for other social data
}