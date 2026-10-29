import { forgetOrphanAssets, readOrphanAssets } from '@/services/cloudinary/orphanStore';

let flushedForUid: string | null = null;

export function resetOrphanFlushGuard(): void {
  flushedForUid = null;
}

export async function flushOrphanAssets(uid: string, options?: { force?: boolean }): Promise<void> {
  if (!options?.force && flushedForUid === uid) {
    return;
  }
  flushedForUid = uid;
  const queued = await readOrphanAssets(uid);
  if (queued.length > 0) {
    await forgetOrphanAssets(
      uid,
      queued.map((asset) => asset.publicId),
    );
  }
}

export async function deleteUnreferencedAsset(_input: {
  uid: string;
  expenseId: string;
  publicId: string;
  resourceType: 'image' | 'raw';
}): Promise<void> {
  // The API secret stays off the device, so the Cloudinary file is left in place.
}
