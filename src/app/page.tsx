import Link from 'next/link';
import { db } from '@/lib/db';
import { reapExpiredTrials } from '@/lib/lifecycle';
import { CONTACT_PHONE_DISPLAY, PERSONAL_SITE, whatsappUrl } from '@/lib/platform';

export const dynamic = 'force-dynamic';

type Reference = {
  name: string;
  slug: string;
  coverUrl: string | null;
  description: string | null;
  _count: { categories: number; products: number };
};

async function references(): Promise<Reference[]> {
  try {
    await reapExpiredTrials();
    return await db.tenant.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { name: true, slug: true, coverUrl: true, description: true, _count: { select: { categories: true, products: true } } },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const brands = await references();
  const primaryReference = brands[0];
  const contact = whatsappUrl('Merhaba, QR Menülerim için fiyat ve kurulum bilgisi almak istiyorum.');

  return <main className="landing-page">
    <nav className="landing-nav">
      <Link className="landing-brand" href="/"><span>QM</span><div><strong>qrmenülerim</strong><small>DİJİTAL MENÜ STÜDYOSU</small></div></Link>
      <div className="landing-links"><a href="#platform">Platform</a><a href="#deneyim">Deneyim</a><a href="#referanslar">Referanslar</a><a href="#surec">Nasıl çalışır?</a></div>
      <div className="landing-nav-actions"><Link className="text-link" href="/login">Panele giriş</Link><a className="button button-light" href={contact} target="_blank" rel="noreferrer">Bize ulaş <span>↗</span></a></div>
    </nav>

    <section className="landing-hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-copy">
        <span className="hero-kicker"><i /> Türkiye’nin yeni nesil menü deneyimi</span>
        <h1>Menü değil,<br /><em>iştah açan bir marka</em><br />deneyimi.</h1>
        <p>QR Menülerim; restoranınızın ruhunu hızlı, zarif ve satışa odaklı bir dijital deneyime dönüştürür. Menü yönetiminden canlı yayına kadar her şey tek yerde.</p>
        <div className="hero-actions"><Link className="button button-accent" href="/deneme">24 saat ücretsiz dene <span>↗</span></Link><Link className="hero-demo-link" href={primaryReference ? `/${primaryReference.slug}` : '/mira'}>Canlı menüyü keşfet <i>▶</i></Link></div>
        <div className="hero-proof"><div className="proof-faces"><span>M</span><span>QR</span><span>✦</span></div><p><strong>Eksiksiz kurulum</strong><small>Kategori, ürün, tema, API ve mobil deneyim</small></p></div>
      </div>

      <div className="hero-product" aria-label="QR menü ürün önizlemesi">
        <div className="floating-note note-one"><span>YAYINDA</span><strong>Menü değişikliği anında canlı</strong></div>
        <div className="floating-note note-two"><span>4.9 ★</span><strong>Misafirin sevdiği akış</strong></div>
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="phone-cover" style={{ backgroundImage: `linear-gradient(180deg,rgba(11,12,10,.05),rgba(11,12,10,.8)),url(${primaryReference?.coverUrl || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=88'})` }}><header><span>QM</span><i>•••</i></header><div><small>MEZE · OCAKBAŞI · BAR</small><h2>Lezzeti<br />keşfet.</h2></div></div>
            <div className="phone-content"><label>⌕ <span>Menüde ara...</span></label><div className="phone-pills"><b>Tümü</b><span>Başlangıç</span><span>Ana yemek</span></div><article><div className="food-tile food-one" /><p><small>ŞEFİN SEÇİMİ</small><strong>Fıstıklı Humus</strong><span>Tahin, limon ve çıtır nohut</span></p><b>₺185</b></article><article><div className="food-tile food-two" /><p><small>ÇOK SEVİLEN</small><strong>İmza Tabağı</strong><span>Mevsim ürünleri ve şef sosu</span></p><b>₺395</b></article></div>
          </div>
        </div>
      </div>
    </section>

    <section className="signal-bar"><span>Mobil öncelikli</span><i /> <span>Anlık güncelleme</span><i /> <span>QR ile temassız erişim</span><i /> <span>API entegrasyonu</span><i /> <span>Karanlık tema</span></section>

    <section className="landing-section platform-section" id="platform">
      <header className="section-intro"><span className="eyebrow">BİR MENÜDEN DAHA FAZLASI</span><h2>İyi tasarım görünür.<br /><em>İyi deneyim hissedilir.</em></h2><p>Misafiriniz beklemez, aradığını kaybetmez. Siz de fiyatı, görseli ve ürünü saniyeler içinde güncellersiniz.</p></header>
      <div className="feature-bento" id="deneyim">
        <article className="feature-large"><div className="feature-index">01</div><span className="eyebrow">MİSAFİR DENEYİMİ</span><h3>Her ekranda hızlı.<br />Her dokunuşta zarif.</h3><p>Akıllı arama, filtreler, favoriler, ürün detayları, alerjen bilgileri ve tema seçimi tek akışta.</p><div className="search-demo"><span>⌕</span><p><strong>“glutensiz”</strong><small>3 uygun lezzet bulundu</small></p><i>→</i></div></article>
        <article className="feature-card dark-card"><div className="feature-index">02</div><span className="eyebrow">CANLI YÖNETİM</span><h3>Masadaki menü, paneldeki kadar güncel.</h3><div className="live-stack"><span><i /> Köz Patlıcan <b>Yayında</b></span><span><i /> İmza Tabağı <b>₺395</b></span><span><i /> Günün Menüsü <b>Güncellendi</b></span></div></article>
        <article className="feature-card accent-card"><div className="feature-index">03</div><span className="eyebrow">MARKANA ÖZEL</span><h3>Şablon gibi değil,<br />sizin gibi görünür.</h3><p>Kapak, dil, vurgu, duyuru ve içerik yapısı işletmenizin karakterine göre şekillenir.</p><div className="palette"><i /><i /><i /><i /></div></article>
        <article className="feature-wide"><div><div className="feature-index">04</div><span className="eyebrow">GÜVENLİ ALTYAPI</span><h3>Hızlı, ölçeklenebilir ve kontrol altında.</h3><p>Rol tabanlı paneller, güvenli şifreleme, durum denetimi ve dış kaynak erişim korumaları.</p></div><div className="tech-rings"><span>API</span><i>JSON</i><b>QR</b></div></article>
      </div>
    </section>

    <section className="references-section" id="referanslar">
      <header className="section-intro light"><span className="eyebrow">CANLI REFERANSLAR</span><h2>Biz anlatmayalım.<br /><em>Menüler konuşsun.</em></h2><p>Platformda yayında olan işletmeleri açın; deneyimi doğrudan misafirin gözünden inceleyin.</p></header>
      {brands.length ? <div className="reference-grid">{brands.map((brand, index) => <Link className={index === 0 ? 'reference-card featured' : 'reference-card'} href={`/${brand.slug}`} key={brand.slug}><div className="reference-image" style={{ backgroundImage: `linear-gradient(180deg,transparent 40%,rgba(10,11,9,.86)),url(${brand.coverUrl || 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=84'})` }}><span>{String(index + 1).padStart(2, '0')}</span><i>Canlı menü ↗</i><div><small>QR MENÜ REFERANSI</small><h3>{brand.name}</h3><p>{brand.description || 'Markaya özel hazırlanmış dijital menü deneyimi.'}</p></div></div><footer><span>{brand._count.categories} kategori</span><span>{brand._count.products} ürün</span><b>YAYINDA <i /></b></footer></Link>)}</div> : <div className="reference-empty"><span>✦</span><h3>İlk referans deneyimi hazırlanıyor.</h3><p>Canlı örnek menümüzü incelemek için aşağıdaki bağlantıyı kullanın.</p><Link className="button button-light" href="/mira">Örnek menüyü aç ↗</Link></div>}
    </section>

    <section className="landing-section process-section" id="surec">
      <header className="section-intro"><span className="eyebrow">SIFIRDAN YAYINA</span><h2>Bir gün değil,<br /><em>birkaç iyi adım.</em></h2></header>
      <div className="process-grid"><article><span>01</span><h3>Profilini oluştur</h3><p>İşletme ve giriş bilgilerinle 24 saatlik tam yetkili hesabını aç.</p></article><article><span>02</span><h3>Markanı yansıt</h3><p>Kapak, açıklama, saatler, kategori ve ürünlerini panelden düzenle.</p></article><article><span>03</span><h3>QR’ını paylaş</h3><p>Menü bağlantın anında hazır; masada, sosyal medyada ve Google profilinde kullan.</p></article></div>
    </section>

    <section className="landing-cta"><div><span className="eyebrow">İLK 24 SAAT BİZDEN</span><h2>Menünüzü bugün<br /><em>başka bir seviyeye taşıyın.</em></h2><p>Kredi kartı gerekmez. Tüm özellikler açık. Kurulum birkaç dakika.</p></div><div><Link className="button button-accent" href="/deneme">Ücretsiz denemeyi başlat <span>↗</span></Link><a href={contact} target="_blank" rel="noreferrer">WhatsApp · {CONTACT_PHONE_DISPLAY}</a></div></section>

    <footer className="landing-footer"><div className="landing-brand"><span>QM</span><div><strong>qrmenülerim</strong><small>DİJİTAL MENÜ STÜDYOSU</small></div></div><p>Her masada iyi görünen,<br />her işletmede kolay yönetilen menüler.</p><div><Link href="/login">Panel</Link><Link href="/deneme">Ücretsiz deneme</Link><a href={contact} target="_blank" rel="noreferrer">İletişim</a></div><small>© {new Date().getFullYear()} QR Menülerim · Tasarım ve geliştirme <a href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümit Can Çınar ↗</a></small></footer>
  </main>;
}
