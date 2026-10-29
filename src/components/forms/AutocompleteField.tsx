import { Column } from '@expo/ui';

import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { filterSuggestions } from '@/utils/text';

interface AutocompleteFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suggestions: string[];
  error?: string;
  placeholder?: string;
  required?: boolean;
  divider?: boolean;
}

export function AutocompleteField({ label, value, onChangeText, suggestions, error, placeholder }: AutocompleteFieldProps) {
  const matches = filterSuggestions(suggestions, value);
  return (
    <Column spacing={4}>
      <TextField label={label} value={value} onChangeText={onChangeText} error={error} placeholder={placeholder} autoCorrect={false} autoCapitalize="words" />
      {matches.map((match) => (
        <Button key={match} variant="ghost" label={match} onPress={() => onChangeText(match)} />
      ))}
    </Column>
  );
}
