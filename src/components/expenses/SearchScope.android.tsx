import { Text } from '@expo/ui';
import { SegmentedButton, SingleChoiceSegmentedButtonRow } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import type { SearchField } from '@/services/expenses/queryPlan';

export function SearchScope({ value, onChange }: { value: SearchField; onChange: (value: SearchField) => void }) {
  return (
    <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
      <SegmentedButton selected={value === 'client'} onClick={() => onChange('client')}>
        <SegmentedButton.Label>
          <Text>Müvekkil</Text>
        </SegmentedButton.Label>
      </SegmentedButton>
      <SegmentedButton selected={value === 'case'} onClick={() => onChange('case')}>
        <SegmentedButton.Label>
          <Text>Esas no</Text>
        </SegmentedButton.Label>
      </SegmentedButton>
    </SingleChoiceSegmentedButtonRow>
  );
}
