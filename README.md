# QR Menülerim

Premium, çok müşterili QR menü platformu. Ana tanıtım sitesi, müşteri ve superadmin panelleri, canlı QR menüler, 24 saatlik tam özellikli deneme hesapları, askıya alma ve otomatik deneme temizliği tek uygulamada çalışır.

## Yerel çalıştırma

```bash
npm install
npm run dev
```

Ana site: `http://localhost:3000`

Menü: `http://localhost:3000/mira`

Deneme kaydı: `http://localhost:3000/deneme`

## Üretim

```bash
npm ci
npm run build
npm start
```

Node.js 20 veya daha yeni bir sürüm önerilir. Üretimde `.env.example` temel alınarak gerçek ortam değişkenleri tanımlanmalıdır; `.env` dosyaları repoya eklenmez.

### cPanel Node.js App

Uygulama kökünde `npm ci` ve `npm run build` çalıştırın. cPanel Application Manager için başlangıç dosyası `app.js` seçilmelidir.

### Deneme hesabı yaşam döngüsü

- Deneme kaydı anında 24 saatlik tam erişim açar.
- Süre dolunca profil ve menü kilitlenir; içerikler yedi gün korunur.
- Platform ziyaretleri süresi dolmuş profilleri kendiliğinden temizler.
- Trafikten bağımsız kesin temizlik için cPanel Cron Jobs üzerinden günde bir kez `POST /api/cron/trials` çağrısı yapılmalıdır. İstek `Authorization: Bearer <CRON_SECRET>` başlığını taşımalıdır.
- `CRON_SECRET` ve `AUTH_SECRET` üretimde uzun, birbirinden farklı değerler olmalıdır.

Veri modelindeki yeni alanları mevcut veritabanına eklemek için dağıtım sırasında bir kez:

```bash
npx prisma db push
```

## Kontroller

```bash
npm run typecheck
npm run build
```
