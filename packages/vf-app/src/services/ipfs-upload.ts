// src/services/ipfs-upload.ts

/**
 * IPFS Upload Service for NEAR Social
 * 
 * Uploads images to NEAR Social's IPFS gateway and returns the CID.
 * Images can then be accessed via: https://ipfs.near.social/ipfs/{CID}
 */

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

export interface IPFSUploadError {
  message: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'NETWORK_ERROR';
}

// Configuration
const IPFS_UPLOAD_GATEWAY = 'https://ipfs.near.social';
const IPFS_DISPLAY_GATEWAY = 'https://ipfs.near.social/ipfs';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * Validate file before upload
 */
export function validateFile(file: File): IPFSUploadError | null {
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      code: 'FILE_TOO_LARGE',
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      message: `Invalid file type. Allowed: ${ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`,
      code: 'INVALID_TYPE',
    };
  }

  return null;
}

/**
 * Upload a file to NEAR Social's IPFS gateway
 */
export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  // Validate file
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  try {
    // Read file as ArrayBuffer and send as raw binary
    const arrayBuffer = await file.arrayBuffer();
    
    const response = await fetch(`${IPFS_UPLOAD_GATEWAY}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log('IPFS response:', data);
    
    // The response contains the CID - try different possible field names
    const cid = data.cid || data.Hash || data.hash || data.IpfsHash;
    
    if (!cid) {
      console.error('No CID in response:', data);
      throw new Error('No CID returned from IPFS upload');
    }

    return {
      cid,
      url: `${IPFS_DISPLAY_GATEWAY}/${cid}`,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Convert a File to a data URL for preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get the full IPFS URL from a CID
 */
export function getIPFSUrl(cid: string): string {
  return `${IPFS_DISPLAY_GATEWAY}/${cid}`;
}
