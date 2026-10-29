import { Column, FieldGroup, Row, Spacer, Text } from '@expo/ui';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { loginFormModifiers } from '@/components/forms/loginFormModifiers';
import { PasswordField } from '@/components/forms/PasswordField';
import { ScreenHost } from '@/components/native/ScreenHost';
import { colors, type as typeScale } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const { configured, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    const address = email.trim();
    if (!address || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    if (!address.includes('@')) {
      setError('Geçerli bir e-posta girin.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(address, password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Giriş yapılamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenHost fill>
      <Column style={{ width: '100%', height: '100%' }}>
        <Spacer flexible />
        <FieldGroup modifiers={loginFormModifiers}>
          <FieldGroup.Section>
            <FieldGroup.SectionHeader>
              <Text textStyle={{ color: colors.ink, fontSize: typeScale.label, fontWeight: '700' }}>Masraf Defteri</Text>
            </FieldGroup.SectionHeader>
            <TextField
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              placeholder="ornek@eposta.com"
            />
            <PasswordField value={password} onChangeText={setPassword} visible={visible} onToggle={() => setVisible((current) => !current)} />
            {error ? <Text textStyle={{ color: colors.danger, fontSize: typeScale.body }}>{error}</Text> : null}
            <Row alignment="center" style={{ width: '100%' }}>
              <Spacer flexible />
              <Button label="Giriş yap" onPress={() => void onSubmit()} loading={submitting} disabled={submitting} />
              <Spacer flexible />
            </Row>
          </FieldGroup.Section>
        </FieldGroup>
        <Spacer flexible />
      </Column>
    </ScreenHost>
  );
}
