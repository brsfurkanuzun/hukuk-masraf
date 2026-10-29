import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { MAX_ATTACHMENTS_PER_ITEM, PDF_MIME_TYPE } from '@/constants/limits';
import type { LocalAttachment } from '@/models/expense';
import { inferMimeType, validateAttachmentFile } from '@/utils/files';
import { createId } from '@/utils/id';
import { AppError } from '@/utils/errors';

async function sizeOf(uri: string, reported?: number | null): Promise<number> {
  if (reported && reported > 0) {
    return reported;
  }
  try {
    const file = new File(uri);
    return file.size ?? 0;
  } catch {
    return 0;
  }
}

function toLocalAttachment(input: {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}): LocalAttachment {
  const problem = validateAttachmentFile(input.mimeType, input.fileSize);
  if (problem) {
    throw new AppError(problem, 'app/invalid-file');
  }
  return {
    id: createId(),
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    localUri: input.uri,
    status: 'pending',
    progress: 0,
  };
}

async function fromImageAsset(asset: ImagePicker.ImagePickerAsset): Promise<LocalAttachment> {
  const fileName = asset.fileName ?? `fotograf-${createId().slice(0, 8)}.jpg`;
  const mimeType = inferMimeType(fileName, asset.mimeType);
  if (!mimeType) {
    throw new AppError('Fotoğraf türü okunamadı.', 'app/invalid-file');
  }
  return toLocalAttachment({
    uri: asset.uri,
    fileName,
    mimeType,
    fileSize: await sizeOf(asset.uri, asset.fileSize),
  });
}

export async function pickImages(source: 'library' | 'camera'): Promise<LocalAttachment[]> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new AppError('Kamera izni verilmedi.', 'app/permission');
    }
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new AppError('Galeri izni verilmedi.', 'app/permission');
    }
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsMultipleSelection: true,
        });
  if (result.canceled) {
    return [];
  }
  return Promise.all(result.assets.map((asset) => fromImageAsset(asset)));
}

export async function pickPdf(): Promise<LocalAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: PDF_MIME_TYPE,
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) {
    return [];
  }
  const attachments: LocalAttachment[] = [];
  for (const asset of result.assets) {
    const mimeType = inferMimeType(asset.name, asset.mimeType);
    if (!mimeType) {
      throw new AppError('PDF türü okunamadı.', 'app/invalid-file');
    }
    attachments.push(
      toLocalAttachment({
        uri: asset.uri,
        fileName: asset.name,
        mimeType,
        fileSize: await sizeOf(asset.uri, asset.size),
      }),
    );
  }
  return attachments;
}

export function assertAttachmentCapacity(currentCount: number, incomingCount: number): void {
  if (currentCount + incomingCount > MAX_ATTACHMENTS_PER_ITEM) {
    throw new AppError('Bir masraf kalemine en fazla 8 belge eklenebilir.', 'app/limit');
  }
}
