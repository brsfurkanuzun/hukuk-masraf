import { Picker, Text } from '@expo/ui/swift-ui';
import { frame, labelsHidden, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import type { SearchField } from '@/services/expenses/queryPlan';

export function SearchScope({ value, onChange }: { value: SearchField; onChange: (value: SearchField) => void }) {
  return (
    <Picker
      label="Arama"
      selection={value}
      modifiers={[pickerStyle('segmented'), labelsHidden(), frame({ maxWidth: Infinity })]}
      onSelectionChange={(next) => {
        if (next === 'client' || next === 'case') {
          onChange(next);
        }
      }}
    >
      <Text modifiers={[tag('client')]}>Müvekkil</Text>
      <Text modifiers={[tag('case')]}>Esas no</Text>
    </Picker>
  );
}
