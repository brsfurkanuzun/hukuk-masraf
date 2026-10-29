import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OrphanAsset } from '@/models/expense';
import { addOrphanAssets, removeOrphanAssets } from '@/services/expenses/memoryUpdates';

function storageKey(uid: string): string {
  return `@hukuk-masraf/orphan-assets:${uid}`;
}

export async function readOrphanAssets(uid: string): Promise<OrphanAsset[]> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as OrphanAsset[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (asset) =>
        typeof asset.publicId === 'string' &&
        (asset.resourceType === 'image' || asset.resourceType === 'raw') &&
        typeof asset.expenseId === 'string',
    );
  } catch {
    return [];
  }
}

async function writeOrphanAssets(uid: string, assets: OrphanAsset[]): Promise<void> {
  if (assets.length === 0) {
    await AsyncStorage.removeItem(storageKey(uid));
    return;
  }
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(assets));
}

export async function rememberOrphanAssets(uid: string, assets: OrphanAsset[]): Promise<void> {
  if (assets.length === 0) {
    return;
  }
  const current = await readOrphanAssets(uid);
  await writeOrphanAssets(uid, addOrphanAssets(current, assets));
}

export async function forgetOrphanAssets(uid: string, publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) {
    return;
  }
  const current = await readOrphanAssets(uid);
  await writeOrphanAssets(uid, removeOrphanAssets(current, publicIds));
}
