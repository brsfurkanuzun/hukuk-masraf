import { Row } from '@expo/ui';

import { Button } from '@/components/common/Button';
import type { SearchField } from '@/services/expenses/queryPlan';

export function SearchScope({ value, onChange }: { value: SearchField; onChange: (value: SearchField) => void }) {
  return (
    <Row spacing={8}>
      <Button label="Müvekkil" variant={value === 'client' ? 'primary' : 'secondary'} onPress={() => onChange('client')} />
      <Button label="Esas no" variant={value === 'case' ? 'primary' : 'secondary'} onPress={() => onChange('case')} />
    </Row>
  );
}
