import type { AttachmentMeta, AttachmentResourceType, LocalAttachment } from '@/models/expense';
import { attachmentFromUpload } from '@/services/cloudinary/cloudinaryClient';
import { nowIso } from '@/utils/date';
import { AppError, CLOUDINARY_NOT_CONFIGURED } from '@/utils/errors';
import { resourceTypeForMime } from '@/utils/files';

type ReactNativeFile = { uri: string; name: string; type: string };

interface CloudinaryUploadResult {
  publicId: string;
  resourceType: AttachmentResourceType;
  url: string;
}

export function cloudinaryUploadConfig(): { cloudName: string; uploadPreset: string } {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? '';
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() ?? '';
  if (!cloudName || !uploadPreset) {
    throw new AppError(CLOUDINARY_NOT_CONFIGURED, 'app/cloudinary-config');
  }
  return { cloudName, uploadPreset };
}

export async function uploadLocalAttachment(input: {
  uid: string;
  expenseId: string;
  itemId: string;
  attachment: LocalAttachment;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<AttachmentMeta> {
  const resourceType = resourceTypeForMime(input.attachment.mimeType);
  const uploaded = await postFile(input.attachment, resourceType, input.signal, input.onProgress);
  const meta = attachmentFromUpload({
    id: input.attachment.id,
    fileName: input.attachment.fileName,
    mimeType: input.attachment.mimeType,
    fileSize: Math.round(input.attachment.fileSize),
    publicId: uploaded.publicId,
    resourceType: uploaded.resourceType,
    url: uploaded.url,
    uploadedAt: nowIso(),
  });
  return meta;
}

async function postFile(
  attachment: LocalAttachment,
  resourceType: AttachmentResourceType,
  signal: AbortSignal | undefined,
  onProgress: ((progress: number) => void) | undefined,
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = cloudinaryUploadConfig();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };
    xhr.onerror = () => reject(new AppError('Belge yüklenemedi. Tekrar deneyin.', 'app/upload-failed'));
    xhr.onabort = () => reject(new AppError('Belge yüklemesi iptal edildi.', 'app/upload-aborted'));
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new AppError('Belge yüklenemedi. Tekrar deneyin.', 'app/upload-failed'));
        return;
      }
      resolve(readUploadResult(xhr.responseText, cloudName, resourceType));
    };
    const body = new FormData();
    const file: ReactNativeFile = {
      uri: attachment.localUri,
      name: attachment.fileName,
      type: attachment.mimeType,
    };
    body.append('file', file as unknown as Blob);
    body.append('upload_preset', uploadPreset);
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(body);
  });
}

function readUploadResult(responseText: string, cloudName: string, fallbackType: AttachmentResourceType): CloudinaryUploadResult {
  let parsed: { secure_url?: unknown; public_id?: unknown; resource_type?: unknown };
  try {
    parsed = JSON.parse(responseText) as { secure_url?: unknown; public_id?: unknown; resource_type?: unknown };
  } catch {
    throw new AppError('Belge yüklenemedi. Tekrar deneyin.', 'app/upload-failed');
  }
  const url = typeof parsed.secure_url === 'string' ? parsed.secure_url : '';
  const publicId = typeof parsed.public_id === 'string' ? parsed.public_id : '';
  const resourceType = parsed.resource_type === 'image' || parsed.resource_type === 'raw' ? parsed.resource_type : fallbackType;
  const prefix = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/`;
  if (!publicId || !url.startsWith(prefix)) {
    throw new AppError('Cloudinary adresi doğrulanamadı.', 'app/upload-failed');
  }
  return { publicId, resourceType, url };
}
