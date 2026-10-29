/**
 * Expected Firestore document reads by user action.
 * These are design counts for documents returned or requested with getDoc.
 * They are not measured billing savings. Confirm charges in Firebase Console.
 */
export const FIRESTORE_READ_PLAN = {
  usernameLookup: 'Her girişte kullanıcı adı belgesi 1 kez okunur. Eşleşen e-posta ile oturum açılır.',
  sessionProfile: 'Bir hesap bu cihazda ilk kez giriş yaptığında users belgesi 1 kez okunur. Sonraki açılışlarda bu okuma atlanır.',
  suggestions: 'Masraf formu oturumda ilk açıldığında öneri belgesi 1 kez okunur. Sonraki açılışlar bellek önbelleğini kullanır.',
  expenseTypes: 'Masraf türü listesi oturumda 1 kez okunur. Belge yoksa yerleşik Yol, Gıda ve Konaklama seçenekleri kullanılır.',
  expenseList: 'Liste sorgusu en fazla 20 masraf belgesi döndürür.',
  nextPage: 'Sonraki sayfa en fazla 20 belge daha okur. Aynı imleç tekrar istenmez.',
  listRevisit: 'TanStack Query kaydı 5 dakikadan taze ise liste yeniden okunmaz.',
  pullToRefresh: 'Yenileme yalnızca ilk sayfayı okur. Daha önce yüklenen sonraki sayfalar tekrar okunmaz.',
  detailFromListCache: 'Kayıt liste önbelleğindeyse detay için Firestore okuması yapılmaz.',
  detailCacheMiss: 'Önbellekte yoksa 1 getDoc yapılır.',
  preview: 'Önizleme Firestore okumaz. Kısa ömürlü bağlantı Cloud Function ile üretilir.',
  createUpdateDelete: 'Yazma işlemleri listeyi baştan okumaz; bellek önbelleği güncellenir.',
  orphanRecovery: 'Yalnızca çökme sonrası sahipsiz kalan her Cloudinary kimliği için 1 getDoc yapılır.',
} as const;
