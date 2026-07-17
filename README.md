# qrmenulerim

Premium, çok müşterili QR menü platformu. İlk aşamada MİRA için hazırlanmış çalışan QR menü deneyimi bulunur.

## Yerel çalıştırma

```bash
npm install
npm run dev
```

Menü: `http://localhost:3000/mira`

## Üretim

```bash
npm ci
npm run build
npm start
```

Node.js 20 veya daha yeni bir sürüm önerilir. Üretimde `.env.example` temel alınarak gerçek ortam değişkenleri tanımlanmalıdır; `.env` dosyaları repoya eklenmez.

### cPanel Node.js App

Uygulama kökünde `npm ci` ve `npm run build` çalıştırın. cPanel Application Manager için başlangıç dosyası `app.js` seçilmelidir.

## Kontroller

```bash
npm run typecheck
npm run build
```
