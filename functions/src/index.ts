import { initializeApp } from 'firebase-admin/app';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { v2 as cloudinary } from 'cloudinary';

import { classifyUpload, isSafeDocumentId, ownsPublicId, publicIdFor, signCloudinaryParams } from './sign';

initializeApp();

const cloudName = defineString('CLOUDINARY_CLOUD_NAME');
const apiKey = defineString('CLOUDINARY_API_KEY');
const apiSecret = defineSecret('CLOUDINARY_API_SECRET');

const callableOptions = {
  region: 'europe-west1' as const,
  secrets: [apiSecret],
  memory: '256MiB' as const,
  timeoutSeconds: 30,
  maxInstances: 10,
};

function requireUser(uid: string | undefined): string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Giriş gerekli.');
  }
  return uid;
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: cloudName.value(),
    api_key: apiKey.value(),
    api_secret: apiSecret.value(),
    secure: true,
  });
}

export const createUploadSignature = onCall(callableOptions, (request) => {
  const uid = requireUser(request.auth?.uid);
  const body = request.data as {
    expenseId?: unknown;
    itemId?: unknown;
    attachmentId?: unknown;
    mimeType?: unknown;
    fileSize?: unknown;
  };
  if (!isSafeDocumentId(body.expenseId) || !isSafeDocumentId(body.itemId) || !isSafeDocumentId(body.attachmentId)) {
    throw new HttpsError('invalid-argument', 'Belge kimliği geçersiz.');
  }
  const classified = classifyUpload(body.mimeType, body.fileSize);
  if (!classified) {
    throw new HttpsError('invalid-argument', 'Dosya türü veya boyutu kabul edilmedi.');
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = publicIdFor(uid, body.expenseId, body.itemId, body.attachmentId);
  const params = {
    overwrite: 'false',
    public_id: publicId,
    timestamp,
    type: 'authenticated',
  };
  return {
    cloudName: cloudName.value(),
    apiKey: apiKey.value(),
    timestamp,
    signature: signCloudinaryParams(params, apiSecret.value()),
    publicId,
    resourceType: classified.resourceType,
    type: 'authenticated' as const,
    overwrite: 'false' as const,
  };
});

export const createDeliveryUrl = onCall(callableOptions, (request) => {
  const uid = requireUser(request.auth?.uid);
  const body = request.data as { publicId?: unknown; resourceType?: unknown };
  if (typeof body.publicId !== 'string' || !ownsPublicId(uid, body.publicId)) {
    throw new HttpsError('permission-denied', 'Bu belgeye erişilemez.');
  }
  if (body.resourceType !== 'image' && body.resourceType !== 'raw') {
    throw new HttpsError('invalid-argument', 'Belge türü geçersiz.');
  }
  configureCloudinary();
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  const url = cloudinary.url(body.publicId, {
    resource_type: body.resourceType,
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
  return { url, expiresAt };
});

export const deleteCloudinaryAsset = onCall(callableOptions, async (request) => {
  const uid = requireUser(request.auth?.uid);
  const body = request.data as { publicId?: unknown; resourceType?: unknown };
  if (typeof body.publicId !== 'string' || !ownsPublicId(uid, body.publicId)) {
    throw new HttpsError('permission-denied', 'Bu belge silinemez.');
  }
  if (body.resourceType !== 'image' && body.resourceType !== 'raw') {
    throw new HttpsError('invalid-argument', 'Belge türü geçersiz.');
  }
  configureCloudinary();
  await cloudinary.uploader.destroy(body.publicId, {
    resource_type: body.resourceType,
    type: 'authenticated',
    invalidate: true,
  });
  return { ok: true };
});
