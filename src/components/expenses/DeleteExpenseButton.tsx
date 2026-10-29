import { Button } from '@/components/common/Button';

export function DeleteExpenseButton({ onPress }: { onPress: () => void }) {
  return <Button label="Sil" variant="danger" onPress={onPress} style={{ width: '100%', backgroundColor: 'transparent' }} />;
}
