import { cidFromMediaRef, resolveOnSocialMediaUrl, toIpfsUri } from '@/features/onsocial/media';

export interface IPFSUploadResult {
  cid: string;
  url: string;
  uri: string;
}

export interface IPFSUploadError {
  message: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'NETWORK_ERROR';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export function validateFile(file: File): IPFSUploadError | null {
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      code: 'FILE_TOO_LARGE',
    };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      message: `Invalid file type. Allowed: ${ALLOWED_TYPES.map((type) => type.split('/')[1]).join(', ')}`,
      code: 'INVALID_TYPE',
    };
  }
  return null;
}

export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const body = new FormData();
  body.append('file', file, file.name);

  try {
    const response = await fetch('/api/onsocial/media', {
      method: 'POST',
      body,
    });
    if (response.ok) {
      const payload = (await response.json()) as { cid?: string; url?: string; uri?: string };
      if (payload.cid && payload.url) {
        return {
          cid: payload.cid,
          url: payload.url,
          uri: payload.uri ?? toIpfsUri(payload.cid),
        };
      }
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
  }

  const preview = await fileToDataUrl(file);
  return {
    cid: '',
    url: preview,
    uri: preview,
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function getIPFSUrl(cid: string): string {
  return resolveOnSocialMediaUrl(cid) ?? cid;
}

export function storedMediaValue(result: IPFSUploadResult): string {
  if (result.cid) return toIpfsUri(result.cid);
  return result.url;
}

export { cidFromMediaRef, resolveOnSocialMediaUrl };
