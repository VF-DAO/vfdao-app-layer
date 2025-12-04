// src/services/social-db.ts
import { connect, Contract, keyStores } from 'near-api-js';
import { getPrioritizedEndpoints } from '../lib/rpc-config';
import type { NearSocialProfile, NearSocialProfileData } from '../types/profile';

const SOCIAL_DB_CONTRACT_ID = 'social.near';

// Social DB uses null to delete fields
// String values are added/updated, null values are deleted
export interface ProfileUpdateData {
  name?: string | null;
  description?: string | null;
  image?: {
    url?: string;
    ipfs_cid?: string;
  } | null;
  backgroundImage?: {
    url?: string;
    ipfs_cid?: string;
  } | null;
  linktree?: Record<string, string | null>;
  tags?: Record<string, string> | null;
  website?: string | null;
  tagline?: string | null;
  location?: string | null;
}

export interface SetProfileTransactionParams {
  receiverId: string;
  actions: {
    type: 'FunctionCall';
    params: {
      methodName: string;
      args: Record<string, unknown>;
      gas: string;
      deposit: string;
    };
  }[];
}

class SocialDBService {
  private contract: Contract | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Use the first available RPC endpoint
      const rpcUrl = getPrioritizedEndpoints('mainnet')[0];

      const connectionConfig = {
        networkId: 'mainnet',
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: rpcUrl,
        walletUrl: 'https://app.mynearwallet.com/',
        helperUrl: 'https://helper.mainnet.near.org',
        explorerUrl: 'https://nearblocks.io',
      };

      const near = await connect(connectionConfig);

      this.contract = new Contract(
        await near.account(''),
        SOCIAL_DB_CONTRACT_ID,
        {
          viewMethods: ['get', 'keys'],
          changeMethods: [],
          useLocalViewExecution: false,
        }
      );

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SocialDB service:', error);
      throw error;
    }
  }

  /**
   * Get profile data for a single account
   */
  async getProfile(accountId: string): Promise<NearSocialProfileData | null> {
    await this.initialize();

    if (!this.contract) {
      throw new Error('SocialDB service not initialized');
    }

    try {
      const keys = [`${accountId}/profile/**`];
      const result = await (this.contract as any).get({ keys });

      if (!result?.[accountId]) {
        return null;
      }

      return result[accountId] as NearSocialProfileData;
    } catch (error) {
      console.error(`Failed to fetch profile for ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Get profile data for multiple accounts in batch
   */
  async getMultipleProfiles(accountIds: string[]): Promise<Record<string, NearSocialProfileData | null>> {
    await this.initialize();

    if (!this.contract) {
      throw new Error('SocialDB service not initialized');
    }

    try {
      const keys = accountIds.map(accountId => `${accountId}/profile/**`);
      const result = await (this.contract as any).get({ keys });

      const profiles: Record<string, NearSocialProfileData | null> = {};
      accountIds.forEach(accountId => {
        profiles[accountId] = result[accountId] ?? null;
      });

      return profiles;
    } catch (error) {
      console.error('Failed to fetch multiple profiles:', error);
      // Return null for all accounts on error
      return accountIds.reduce((acc, accountId) => {
        acc[accountId] = null;
        return acc;
      }, {} as Record<string, NearSocialProfileData | null>);
    }
  }

  /**
   * Get just the profile name for an account (lighter query)
   */
  async getProfileName(accountId: string): Promise<string | null> {
    await this.initialize();

    if (!this.contract) {
      throw new Error('SocialDB service not initialized');
    }

    try {
      const keys = [`${accountId}/profile/name`];
      const result = await (this.contract as any).get({ keys });

      if (!result?.[accountId]?.profile) {
        return null;
      }

      return result[accountId].profile.name ?? null;
    } catch (error) {
      console.error(`Failed to fetch profile name for ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Get profile image URL for an account
   */
  async getProfileImage(accountId: string): Promise<string | null> {
    await this.initialize();

    if (!this.contract) {
      throw new Error('SocialDB service not initialized');
    }

    try {
      const keys = [`${accountId}/profile/image`];
      const result = await (this.contract as any).get({ keys });

      if (!result?.[accountId]?.profile) {
        return null;
      }

      const image = result[accountId].profile.image;
      if (!image) return null;

      // Handle different image formats
      if (image.url) return image.url;
      if (image.ipfs_cid) return `https://ipfs.near.social/ipfs/${image.ipfs_cid}`;
      if (image.nft) {
        // For NFT images, we'd need additional logic to fetch from the NFT contract
        // For now, return null
        return null;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch profile image for ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Utility method to extract display name from profile data
   */
  getDisplayName(accountId: string, profileData: NearSocialProfileData | null): string {
    if (profileData?.profile?.name) {
      return profileData.profile.name;
    }
    // Fallback to full account ID when no profile name exists
    return accountId;
  }

  /**
   * Utility method to strip emojis from a string
   */
  private stripEmojis(str: string): string {
    // Comprehensive emoji regex that covers most Unicode emoji ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1f926}-\u{1f937}]|[\u{10000}-\u{10FFFF}]|[\u{1f1f2}-\u{1f1f4}]|[\u{1f1e6}-\u{1f1ff}]|[\u{1f600}-\u{1f64f}]|[\u{1f680}-\u{1f6ff}]|[\u{2600}-\u{26ff}]|[\u{2700}-\u{27bf}]|[\u{1f1f2}-\u{1f1f4}]|[\u{1f1e6}-\u{1f1ff}]|[\u{1f191}-\u{1f251}]|[\u{1f004}]|[\u{1f0cf}]|[\u{1f170}-\u{1f171}]|[\u{1f17e}-\u{1f17f}]|[\u{1f18e}]|[\u{3030}]|[\u{2b50}]|[\u{2b55}]|[\u{2934}-\u{2935}]|[\u{2b05}-\u{2b07}]|[\u{2b1b}-\u{2b1c}]|[\u{3297}]|[\u{3299}]|[\u{303d}]|[\u{00a9}]|[\u{00ae}]|[\u{2122}]|[\u{23f3}]|[\u{24c2}]|[\u{23e9}-\u{23ef}]|[\u{25b6}]|[\u{23f8}-\u{23fa}]/gu;
    return str.replace(emojiRegex, '').trim();
  }

  /**
   * Utility method to extract profile image URL from profile data
   */
  getProfileImageUrl(profileData: NearSocialProfileData | null): string | null {
    if (!profileData?.profile?.image) {
      return null;
    }

    const image = profileData.profile.image;

    if (image.url) {
      return image.url;
    }
    if (image.ipfs_cid) {
      const url = `https://ipfs.near.social/ipfs/${image.ipfs_cid}`;
      return url;
    }

    return null;
  }

  /**
   * Utility method to extract profile description from profile data
   */
  getProfileDescription(profileData: NearSocialProfileData | null): string | null {
    if (!profileData?.profile?.description) {
      return null;
    }

    // Strip emojis from the description
    return this.stripEmojis(profileData.profile.description);
  }

  /**
   * Build a transaction to update profile data on Social DB
   * This returns the transaction params that can be signed by the wallet
   */
  buildSetProfileTransaction(
    accountId: string,
    profileData: ProfileUpdateData
  ): SetProfileTransactionParams {
    // Build the profile object, only including non-undefined values
    const profile: Record<string, unknown> = {};
    
    if (profileData.name !== undefined) {
      profile.name = profileData.name;
    }
    if (profileData.description !== undefined) {
      profile.description = profileData.description;
    }
    if (profileData.image !== undefined) {
      profile.image = profileData.image;
    }
    if (profileData.backgroundImage !== undefined) {
      profile.backgroundImage = profileData.backgroundImage;
    }
    if (profileData.linktree !== undefined) {
      profile.linktree = profileData.linktree;
    }
    if (profileData.tags !== undefined) {
      profile.tags = profileData.tags;
    }
    if (profileData.website !== undefined) {
      profile.website = profileData.website;
    }
    if (profileData.tagline !== undefined) {
      profile.tagline = profileData.tagline;
    }
    if (profileData.location !== undefined) {
      profile.location = profileData.location;
    }

    // Build the data structure for Social DB
    const data = {
      [accountId]: {
        profile,
      },
    };

    // Calculate approximate storage needed
    // We add extra deposit to be safe (0.05 NEAR is typically enough for profile updates)
    const deposit = '50000000000000000000000'; // 0.05 NEAR

    return {
      receiverId: SOCIAL_DB_CONTRACT_ID,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'set',
            args: { data },
            gas: '100000000000000', // 100 TGas
            deposit,
          },
        },
      ],
    };
  }

  /**
   * Build a transaction to delete specific profile fields
   * Pass null as the value to delete a field
   */
  buildDeleteProfileFieldsTransaction(
    accountId: string,
    fieldsToDelete: (keyof NearSocialProfile)[]
  ): SetProfileTransactionParams {
    const profile: Record<string, null> = {};
    
    for (const field of fieldsToDelete) {
      profile[field] = null;
    }

    const data = {
      [accountId]: {
        profile,
      },
    };

    return {
      receiverId: SOCIAL_DB_CONTRACT_ID,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'set',
            args: { data },
            gas: '100000000000000', // 100 TGas
            deposit: '1', // Minimal deposit for deletion
          },
        },
      ],
    };
  }
}

// Export singleton instance
export const socialDBService = new SocialDBService();
export default socialDBService;