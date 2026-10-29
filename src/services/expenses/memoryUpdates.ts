import { SUGGESTION_LIMIT } from '@/constants/limits';
import type { OrphanAsset, SuggestionLists } from '@/models/expense';

export function addOrphanAssets(current: OrphanAsset[], incoming: OrphanAsset[]): OrphanAsset[] {
  const byId = new Map(current.map((asset) => [asset.publicId, asset]));
  for (const asset of incoming) {
    byId.set(asset.publicId, asset);
  }
  return [...byId.values()];
}

export function removeOrphanAssets(current: OrphanAsset[], publicIds: string[]): OrphanAsset[] {
  const remove = new Set(publicIds);
  return current.filter((asset) => !remove.has(asset.publicId));
}

export function mergeSuggestionLists(current: SuggestionLists, additions: SuggestionLists): SuggestionLists {
  return {
    enforcementOffices: uniqueKeepOrder([...current.enforcementOffices, ...additions.enforcementOffices]),
    clientNames: uniqueKeepOrder([...current.clientNames, ...additions.clientNames]),
  };
}

function uniqueKeepOrder(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const key = name.trim().toLocaleLowerCase('tr-TR');
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(name.trim());
    if (result.length >= SUGGESTION_LIMIT) {
      break;
    }
  }
  return result;
}
