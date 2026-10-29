import { FieldGroup, Text } from '@expo/ui';

import { Button } from '@/components/common/Button';
import { ScreenHost } from '@/components/native/ScreenHost';
import { FIRESTORE_READ_PLAN } from '@/constants/query';
import { colors, type as typeScale } from '@/constants/theme';
import { useDocumentReadCount } from '@/hooks/useDocumentReadCount';
import { useAuth } from '@/providers/AuthProvider';
import { CLOUDINARY_NOT_CONFIGURED } from '@/utils/errors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const reads = useDocumentReadCount();

  return (
    <ScreenHost fill>
      <FieldGroup>
        <FieldGroup.Section title="Oturum">
          <Text textStyle={{ color: colors.ink, fontSize: typeScale.title, fontWeight: '700' }}>{user?.displayName || user?.email || 'Oturum'}</Text>
          {user?.displayName ? <Text textStyle={{ color: colors.muted, fontSize: typeScale.body }}>{user.email ?? ''}</Text> : null}
        </FieldGroup.Section>
        <FieldGroup.Section title="Bu oturum">
          <Text textStyle={{ color: colors.ink, fontSize: 34, fontWeight: '700' }}>{String(reads)}</Text>
          <FieldGroup.SectionFooter>
            <Text textStyle={{ color: colors.muted, fontSize: typeScale.label }}>Sayaç, uygulamanın döndürdüğü belge sayısını tutar. Faturalanan okuma Firebase Console üzerinden doğrulanır.</Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section title="Belge depolama">
          <Text textStyle={{ color: colors.muted, fontSize: typeScale.body }}>
            {process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
              ? 'Belgeler Cloudinary’ye yüklenir. Adres Firestore kaydına yazılır.'
              : CLOUDINARY_NOT_CONFIGURED}
          </Text>
        </FieldGroup.Section>
        <FieldGroup.Section title="Okuma planı">
          {Object.values(FIRESTORE_READ_PLAN).map((line) => (
            <Text key={line} textStyle={{ color: colors.muted, fontSize: typeScale.body }}>
              {line}
            </Text>
          ))}
        </FieldGroup.Section>
        <Button label="Çıkış yap" variant="danger" onPress={() => void signOut()} />
      </FieldGroup>
    </ScreenHost>
  );
}
