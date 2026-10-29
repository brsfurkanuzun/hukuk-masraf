# Hukuk Masraf

Hukuk ve icra dosyalarının masraflarını kaydetmek için iOS ve Android'de çalışan Expo uygulaması. Kayıt olma yoktur. Kullanıcılar Firebase Console'dan önceden açılır. Masraf kalemleri, tutarlar ve belge üstverisi Cloud Firestore'da durur. Fotoğraf ve PDF içerikleri Firestore'a yazılmaz.

Bu depoda çalışan bir Firebase veya Cloudinary projesi bağlı değildir. Aşağıdaki kurulum yapılmadan giriş, kayıt ve belge yükleme denendi sayılmamalıdır.

## Çalıştırma

```bash
npm install
cp .env.example .env
npm start
```

- iOS simülatörü: `npm run ios`
- Android emülatörü: `npm run android`
- Tip denetimi: `npm run typecheck`
- Birim testleri: `npm test`
- Cloud Functions imza testleri: `npm run test:functions`

Uygulama Expo SDK 58 kullanır. App Store ve Google Play'deki Expo Go sürümü bir süre SDK 57'de kalabilir. Mağaza istemcisi "Project is incompatible with this version of Expo Go" derse [expo.dev/go](https://expo.dev/go) üzerinden SDK 58 istemcisini kurun veya bir development build alın. iOS fiziksel cihazda mağaza sürümü yetmeyebilir; Expo'nun `eas go` akışı gerekir.

## Firebase

1. Firebase Console'da bir proje oluşturun. Authentication içinde yalnızca **Email/Password** sağlayıcısını açın. Kullanıcı kaydını uygulamadan kapatmak için istemcide kayıt ekranı yoktur; hesapları Console'dan siz oluşturun.
2. Web uygulaması ekleyip yapılandırma değerlerini `.env` dosyasına yazın. Bu değerler istemciye gömülür. Güvenlik, Security Rules ile sağlanır; API anahtarını gizlemek yetki kontrolü değildir.
3. Firestore veritabanını oluşturun.
4. Kuralları ve indeksleri dağıtın:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Spark planı Firestore okuma/yazma kotasıyla kullanılabilir. Cloud Functions Spark planında dağıtılamaz.

### Oturum

Giriş kullanıcı adı ve şifre ile yapılır. Uygulama `usernames/{kullaniciAdi}` belgesinden e-posta adresini okur, ardından Firebase e-posta oturumu açar. Kayıt ol bağlantısı yoktur. Oturum, native tarafta AsyncStorage üzerindeki Firebase Auth kalıcılığı ile uygulama yeniden açıldığında sürer. Kök yönlendirici, kullanıcı yokken masraf ekranlarını açmaz.

Kullanıcıyı Firebase Console → Authentication bölümünde e-posta ve şifre ile oluşturun. Aynı kişi için Firestore’a elle bir eşleme belgesi ekleyin. İstemci bu belgeyi yazamaz.

- Koleksiyon: `usernames`
- Belge kimliği: küçük harfle kullanıcı adı, örneğin `ayse.yilmaz`
- Alanlar: `email` (Authentication’daki adres), `username` (görünen ad)

Kurallar tek belge okumasına izin verir; listeleme kapalıdır. Her giriş 1 belge okur. Alan `@` içerirse değer doğrudan e-posta kabul edilir.

### Dosya ataması

Avukatlar serbest masraf açmaz. Önce kendilerine atanmış icra dosyası (`dosyalar`) seçilir; masraflar `dosyalar/{dosyaId}/expenses/{expenseId}` altında tutulur.

Dosya belgesi (Console veya yönetim aracı) örnek alanlar: `ownerId`, `assignedUserIds`, müvekkil / esas no / icra alanları (normalize edilmiş alanlar dahil), `createdAt`, `updatedAt` (24 karakter ISO).

Mobil uygulama yalnızca `assignedUserIds` içinde UID’si olan dosyaları listeler. Üst seviye `expenses` koleksiyonuna yeni kayıt yazılamaz.

Masraf türleri Yol, Gıda ve Konaklama’dır. Masraf kaydında isteğe bağlı `note` alanı vardır; boş bırakılabilir ve en fazla 500 karakterdir.

Çıkışta TanStack Query önbelleği temizlenir, oturum okuma sayacı sıfırlanır ve henüz bir masrafa bağlanmamış Cloudinary dosyaları silinmeye çalışılır.

Firestore kalıcı disk önbelleği açılmaz. `memoryLocalCache` ve `getDocsFromServer` kullanılır. Böylece hassas masraf kayıtları Firestore SDK tarafından diske yazılmaz ve eski disk önbelleği sunucu sonucuyla karışmaz. Oturum içindeki tekrar okumaları TanStack Query engeller. Süreç kapanınca bu bellek önbelleği de gider. Çevrimdışı masraf arşivi bu sürümde yoktur.

## Cloudinary ve Cloud Functions

Hukuki belgeler herkese açık URL olarak yüklenmez. İstemcide Cloudinary API Secret yoktur. Yükleme ancak `functions/` altındaki callable fonksiyonlar imza ürettikten sonra `type=authenticated` ile yapılır.

Fonksiyonlar:

- `createUploadSignature`
- `createDeliveryUrl` — yaklaşık 5 dakika geçerli imzalı bağlantı
- `deleteCloudinaryAsset` — yalnızca `users/{uid}/` altındaki dosyalar

Firestore'da saklanan referans `cloudinaryPublicId`, `resourceType` ve `accessMode: "authenticated"` alanlarıdır. Kalıcı `secureUrl` yazılmaz.

Bu akış Firebase Cloud Functions kullanır. Cloud Functions için **Blaze** planı gerekir ve çağrı başına ücret oluşabilir. Fonksiyonlar `europe-west1` bölgesindedir, bellek 256 MiB ve en fazla 10 eşzamanlı instance ile sınırlıdır. Fonksiyonlar dağıtılmadan belge ekleme bilinçli olarak başarısız olur. İstemci imzasız veya herkese açık yüklemeye düşmez.

Dağıtım:

```bash
cd functions
cp .env.example .env
# .env içine CLOUDINARY_CLOUD_NAME ve CLOUDINARY_API_KEY yazın
cd ..
npx firebase-tools functions:secrets:set CLOUDINARY_API_SECRET
npm --prefix functions install
npx firebase-tools deploy --only functions
```

Cloudinary hesabında authenticated delivery açık olmalıdır. İmzalı yüklemede kullanılan parametreler `overwrite`, `public_id`, `timestamp` ve `type` alanlarıdır. Secret yalnızca fonksiyon ortamındadır.

Callable fonksiyonlar Cloud Run üzerinde çalışır. Firebase, kimliği fonksiyon kodunda doğrular. İlk dağıtımdan sonra çağrı 401 verirse Firebase'in callable fonksiyonlar için önerdiği Cloud Run invoker ayarını uygulayın. Bu ayar dosyayı herkese açık yapmaz.

### Sahipsiz dosya temizliği

Yükleme başarılı olup Firestore yazması başarısız olursa dosya kimliği cihazda kuyruğa alınır. Kayıt başarılı olunca kuyruktan çıkarılır. Uygulama sonraki açılışta kuyruğu dener: masraf belgesi dosyayı hâlâ referans ediyorsa silmez, etmiyorsa Cloudinary'den siler. Bu kurtarma yolu, kuyruktaki her kimlik için bir `getDoc` okuması yapabilir. Normal ekran açılışında çalışmaz.

Form kaydedilmeden kapatılırsa, yalnızca bu oturumda yüklenmiş ve eski kayda ait olmayan dosyalar silinmeye çalışılır.

## Veri modeli

Masraf kalemleri ve belge üstverisi `expenses/{expenseId}` belgesinin içinde durur. Detay ekranı ek okuma yapmadan liste önbelleğindeki belgeyi kullanabilir.

Gömülü dizi, kalem başına ayrı okuma maliyetini kaldırır. Sınırlar: en fazla 20 kalem, kalem başına 8 belge, fotoğraf 10 MB, PDF 15 MB. Üstveri bu sınırlarda 1 MiB Firestore belgesinin çok altındadır. Dosya baytları yazılmaz.

Kalemlerin ayrı sorgulanması veya belgenin büyümesi gerekirse `expenses/{id}/items` alt koleksiyonu düşünülebilir. Bunun bedeli, detay ekranında ek sorgu ve her kalem belgesi için ayrı okuma ücretidir. İlk sürümde bu maliyet yoktur.

Arama için `clientNameNormalized` ve `fileCaseNumberNormalized` alanları tutulur. Firestore serbest metin araması yapmaz. En az 2 karakterde, 400 ms gecikmeyle önek sorgusu çalışır. İcra dairesi ve müvekkil önerileri `users/{uid}/meta/suggestions` belgesinden oturumda bir kez okunur; tuş vuruşu başına sorgu yoktur. Liste 200 adla sınırlıdır.

Tarih `YYYY-MM-DD` olarak cihazın yerel takvimiyle saklanır. `toISOString()` takvim günü için kullanılmaz. Saat dilimi kayması bu alan için oluşmaz. `createdAt` ve `updatedAt` UTC anıdır.

Tutarlar kuruş cinsinden tam sayıdır (`amountKurus`, `totalAmountKurus`). Toplam, formdaki kalemlerden hesaplanır. Listeyi güncellemek için bütün masraflar okunmaz.

## Okuma maliyeti

Gerçek zamanlı `onSnapshot` dinleyicisi yoktur. Liste `limit(20)` ve `startAfter` ile sayfalanır. Aynı imleç `getNextPageParam` boşaldığında tekrar istenmez. Sorgu anahtarı kullanıcı kimliği ve filtre planını içerir. `staleTime` 5 dakika, `gcTime` 30 dakikadır. Öneri sorgusunun `staleTime` değeri oturum boyunca tazedir.

| Eylem | Firestore |
| --- | --- |
| Hesabın cihazda ilk girişi | `users/{uid}` için 1 get |
| Formun oturumdaki ilk açılışı | öneri belgesi için 1 get |
| Masraf listesi | en fazla 20 belge |
| Sonraki sayfa | en fazla 20 belge |
| 5 dakika içinde listeye dönüş | 0 |
| Aşağı çekerek yenileme | yalnızca ilk sayfa |
| Listeden açılan detay | 0 |
| Önbellekte olmayan detay | 1 get |
| Belge önizleme | 0 Firestore; 1 fonksiyon çağrısı |
| Ekleme, düzenleme, silme | listeyi yeniden okumaz |

Profil ekranındaki sayaç, istemcinin saydığı belge adedidir. Boş sorgu veya konsolun sayımı farklı olabilir. Tasarruf oranı ölçülmedi. Ücret Firebase Console kullanım panelinden izlenir.

Sorgu şekilleri `firestore.indexes.json` içindedir. İndeks eksikse uygulama "indeks gerekli" der. Konsoldaki bağlantıdan indeks açmak yerine bu dosyayı dağıtın.

Emülatör:

```bash
npx firebase-tools emulators:start
```

`.env` içinde `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=1` yapın. Android emülatörü ana makineye `10.0.2.2` ile bağlanır. Fiziksel cihaz için `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` gerekir. Bu ortamda emülatör testi çalıştırılmadı. Java ve `firebase-tools` kurulu değilse emülatör açılmaz.

## Güvenlik kuralları

`firestore.rules` kimliği olmayan erişimi kapatır. Masraf okuma ve yazma `ownerId == request.auth.uid` şartına bağlıdır. Sorgu bu filtreyi taşımak zorundadır; istemci filtresi yetki sayılmaz. Güncellemede `ownerId` ve `createdAt` değiştirilemez. Belge alanları, tutar tipi, tarih biçimi ve `accessMode == "authenticated"` doğrulanır. Başka kullanıcının `users` belgesi okunamaz.

Kuralın toplam tutarı kalemlerle byte byte toplaması Firestore Rules dilinde genel döngü olmadığı için yapılmaz. Toplam istemcide hesaplanır ve detay ekranı kalemlerden yeniden toplanır. Kötü niyetli bir istemci yalnızca kendi belgesine tutarsız toplam yazabilir.

## Ekranlar

Giriş, masraf listesi, yeni masraf, detay, düzenleme, belge önizleme ve profil. Yeni masraf ana ekranın altındaki düğmeden açılır. Düzenleme aynı formu kullanır. PDF, indirildikten sonra işletim sisteminin görüntüleyicisinde açılır (`File.preview`). Fotoğraf uygulama içinde gösterilir. Paylaşım `expo-sharing` ile yapılır. İndirilen önizleme dosyası ekran kapanırken silinmeye çalışılır.

## Testler

`npm test` para çevrimi, tarih, form şeması, toplam tutar, sorgu planı, önbellek güncellemesi, dosya doğrulaması ve kural dosyasının herkese açık yazmayı içermediğini kontrol eder. `npm run test:functions` imza sıralamasını ve dosya sınıflandırmasını kontrol eder.

Çalıştırılmayanlar: gerçek Firebase projesi, Firestore emülatörü, Cloudinary yüklemesi, iOS ve Android arayüz turu. Bunlar kimlik bilgisi ve cihaz olmadan doğrulanmadı.
