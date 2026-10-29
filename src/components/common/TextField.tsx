import { Column, Text, TextInput, useNativeState, type TextInputProps, type TextInputRef } from '@expo/ui';
import { useEffect, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, Text as RnText, TextInput as RnTextInput, View, type TextInputProps as RnTextInputProps } from 'react-native';

import { KeyboardDone } from '@/components/forms/KeyboardDone';
import { colors, radius, type as typeScale } from '@/constants/theme';

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  inputMode?: TextInputProps['inputMode'];
  enterKeyHint?: TextInputProps['enterKeyHint'];
  multiline?: boolean;
  autoFocus?: boolean;
  variant?: 'row' | 'search';
  divider?: boolean;
  trailing?: ReactNode;
  inputHeight?: number;
}

export function TextField(props: TextFieldProps) {
  if (Platform.OS === 'web') {
    return <WebTextField {...props} />;
  }
  return <NativeTextField {...props} />;
}

function NativeTextField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  hint,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  inputMode,
  enterKeyHint,
  multiline,
  autoFocus,
  variant = 'row',
  inputHeight,
}: TextFieldProps) {
  const state = useNativeState(value);
  const latest = useRef(value);
  const inputRef = useRef<TextInputRef>(null);
  const numeric = keyboardType === 'decimal-pad' || keyboardType === 'number-pad' || keyboardType === 'numeric';
  useEffect(() => {
    if (value !== latest.current) {
      latest.current = value;
      state.set(value);
    }
  }, [state, value]);

  function finish() {
    onBlur?.();
    inputRef.current?.blur();
  }

  const field = (
    <Column spacing={4}>
      {label && variant !== 'search' ? <Text textStyle={{ color: colors.muted, fontSize: typeScale.label }}>{label}</Text> : null}
      <TextInput
        ref={inputRef}
        value={state}
        onChangeText={(text) => {
          latest.current = text;
          onChangeText(text);
        }}
        onBlur={onBlur}
        onSubmitEditing={numeric ? finish : undefined}
        placeholder={placeholder ?? label}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        returnKeyType={numeric ? 'done' : undefined}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        multiline={multiline}
        autoFocus={autoFocus}
        style={inputHeight ? { height: inputHeight } : undefined}
      />
      {error ? <Text textStyle={{ color: colors.danger, fontSize: typeScale.small }}>{error}</Text> : null}
      {!error && hint ? <Text textStyle={{ color: colors.faint, fontSize: typeScale.small }}>{hint}</Text> : null}
    </Column>
  );

  if (!numeric) {
    return field;
  }
  return <KeyboardDone onDone={finish}>{field}</KeyboardDone>;
}

function WebTextField({ label, error, hint, divider = false, variant = 'row', trailing, ...inputProps }: TextFieldProps) {
  const search = variant === 'search';
  const rnProps: RnTextInputProps = {
    value: inputProps.value,
    onChangeText: inputProps.onChangeText,
    onBlur: inputProps.onBlur,
    placeholder: inputProps.placeholder,
    secureTextEntry: inputProps.secureTextEntry,
    keyboardType: inputProps.keyboardType,
    autoCapitalize: inputProps.autoCapitalize,
    autoCorrect: inputProps.autoCorrect,
    inputMode: inputProps.inputMode,
    enterKeyHint: inputProps.enterKeyHint,
    multiline: inputProps.multiline,
  };
  return (
    <View style={[web.wrap, search && web.searchWrap, divider && web.divider, error ? web.wrapError : null]}>
      {label && !search ? <RnText style={web.label}>{label}</RnText> : null}
      <View style={trailing ? web.inputRow : undefined}>
        <RnTextInput placeholderTextColor={colors.faint} accessibilityLabel={label ?? inputProps.placeholder} style={[web.input, trailing ? web.inputGrow : null, inputProps.multiline ? web.multiline : null]} {...rnProps} />
        {trailing}
      </View>
      {error ? <RnText style={web.error}>{error}</RnText> : hint ? <RnText style={web.hint}>{hint}</RnText> : null}
    </View>
  );
}

const web = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 8, gap: 2 },
  searchWrap: { marginHorizontal: 16, backgroundColor: colors.search, borderRadius: radius.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  wrapError: { backgroundColor: colors.dangerSoft },
  label: { color: colors.muted, fontSize: typeScale.label },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { minHeight: 26, padding: 0, color: colors.ink, fontSize: typeScale.body },
  inputGrow: { flex: 1 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: typeScale.small },
  hint: { color: colors.faint, fontSize: typeScale.small },
});
