import Link from 'next/link';
import { db } from '@/lib/db';
import { reapExpiredTrials } from '@/lib/lifecycle';
import { CONTACT_PHONE_DISPLAY, PERSONAL_SITE, whatsappUrl } from '@/lib/platform';
import { activeStandProducts } from '@/lib/stand-products';
import StandVisual from '@/components/stands/StandVisual';
import styles from './Landing.module.css';

export const dynamic = 'force-dynamic';

type Reference = {
  name: string;
  slug: string;
  coverUrl: string | null;
  description: string | null;
  _count: { categories: number; products: number };
};

const fallbackCover = 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1800&q=88';
const foodOne = 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=700&q=86';
const foodTwo = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=86';

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

function Brand() {
  return <span className={styles.brand}>
    <span className={styles.brandMark}>QM</span>
    <span className={styles.brandCopy}><strong>qrmenülerim</strong><small>DİJİTAL MENÜ SİSTEMİ</small></span>
  </span>;
}

export default async function HomePage() {
  const [brands, stands] = await Promise.all([references(), activeStandProducts()]);
  const primaryReference = brands[0];
  const exampleUrl = primaryReference ? `/${primaryReference.slug}` : '/mira';
  const cover = primaryReference?.coverUrl || fallbackCover;
  const contact = whatsappUrl('Merhaba, QR Menülerim hakkında fiyat ve kurulum bilgisi almak istiyorum.');

  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Ana menü">
      <Link className={styles.brandLink} href="/" aria-label="QR Menülerim ana sayfa"><Brand /></Link>
      <div className={styles.navLinks}>
        <a href="#ozellikler">Neler sunuyor?</a>
        <a href="#nasil-calisir">Nasıl çalışır?</a>
        <a href="#standlar">Stand ürünleri</a>
        <a href="#referanslar">Referanslar</a>
        <a href="#sorular">Sık sorulanlar</a>
      </div>
      <div className={styles.navActions}>
        <Link className={styles.loginLink} href="/login">Panele giriş</Link>
        <Link className={styles.navCta} href="/deneme">Ücretsiz deneyin <span>↗</span></Link>
      </div>
      <details className={styles.mobileMenu}>
        <summary aria-label="Gezinme menüsünü aç"><span /><span /></summary>
        <div>
          <a href="#ozellikler">Neler sunuyor?</a>
          <a href="#nasil-calisir">Nasıl çalışır?</a>
          <a href="#standlar">Stand ürünleri</a>
          <a href="#referanslar">Referanslar</a>
          <a href="#sorular">Sık sorulanlar</a>
          <Link href="/login">Panele giriş</Link>
          <Link className={styles.mobileMenuCta} href="/deneme">24 saat ücretsiz deneyin</Link>
        </div>
      </details>
    </nav>

    <section className={styles.hero}>
      <div className={styles.heroGrid} />
      <div className={styles.heroCopy}>
        <span className={styles.kicker}><i /> Restoranlar için yeni nesil dijital menü</span>
        <h1>Menünüz,<br /><em>markanız kadar iyi</em><br />görünsün.</h1>
        <p>Ürünlerinizi, fiyatlarınızı ve görsellerinizi tek panelden yönetin. Misafirleriniz hızlı, anlaşılır ve her ekranda kusursuz çalışan bir menüyle buluşsun.</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href="/deneme">24 saat ücretsiz deneyin <span>↗</span></Link>
          <Link className={styles.secondaryButton} href={exampleUrl}><span className={styles.play}>▶</span> Örnek menüyü inceleyin</Link>
        </div>
        <ul className={styles.heroTrust} aria-label="Deneme avantajları">
          <li><span>✓</span>Kredi kartı gerekmez</li>
          <li><span>✓</span>Tüm özellikler açık</li>
          <li><span>✓</span>Dakikalar içinde hazır</li>
        </ul>
      </div>

      <div className={styles.heroVisual} aria-label="Canlı QR menü önizlemesi">
        <div className={styles.visualHalo} />
        <div className={styles.syncNote}><span>● CANLI</span><strong>Panelde değiştirin</strong><small>Menüde anında yayınlansın</small></div>
        <div className={styles.deviceNote}><strong>Her ekrana hazır</strong><small>Telefon · Tablet · Masaüstü</small></div>
        <Link className={styles.menuMockup} href={exampleUrl} aria-label="Örnek menüyü aç">
          <div className={styles.mockupTop}><span className={styles.mockupLogo}>M</span><span className={styles.mockupDots}>•••</span></div>
          <div className={styles.mockupCover} style={{ backgroundImage: `linear-gradient(180deg,rgba(8,10,8,.08),rgba(8,10,8,.86)),url(${cover})` }}>
            <span>MEZE · OCAKBAŞI · BAR</span>
            <h2>Lezzeti<br />keşfedin.</h2>
          </div>
          <div className={styles.mockupBody}>
            <div className={styles.mockSearch}><span>⌕</span> Menüde ara…</div>
            <div className={styles.mockPills}><strong>Öne çıkanlar</strong><span>Başlangıçlar</span><span>Ana yemekler</span></div>
            <article><span className={styles.mockFood} style={{ backgroundImage: `url(${foodOne})` }} /><p><small>ŞEFİN ÖNERİSİ</small><strong>Fıstıklı humus</strong><span>Tahin, limon ve çıtır nohut</span></p><b>₺185</b></article>
            <article><span className={styles.mockFood} style={{ backgroundImage: `url(${foodTwo})` }} /><p><small>ÇOK SEVİLEN</small><strong>İmza tabağı</strong><span>Mevsim ürünleri ve şef sosu</span></p><b>₺395</b></article>
          </div>
        </Link>
      </div>
    </section>

    <section className={styles.promiseBar} aria-label="Platform özellikleri">
      <span><i>01</i> Mobil öncelikli tasarım</span>
      <span><i>02</i> Anlık içerik güncelleme</span>
      <span><i>03</i> Markaya özel görünüm</span>
      <span><i>04</i> Güvenli yönetim paneli</span>
    </section>

    <section className={styles.features} id="ozellikler">
      <header className={styles.sectionHeading}>
        <div><span className={styles.sectionKicker}>MENÜNÜZÜN YENİ STANDARDI</span><h2>Misafir için zahmetsiz.<br /><em>İşletmeniz için güçlü.</em></h2></div>
        <p>Güzel görünen bir menü yetmez. Aranan ürün kolay bulunmalı, fiyatlar güncel kalmalı ve her işlem işletme için anlaşılır olmalı.</p>
      </header>

      <div className={styles.featureGrid}>
        <article className={styles.featureLead}>
          <span className={styles.cardNumber}>01</span>
          <div><span className={styles.sectionKicker}>MİSAFİR DENEYİMİ</span><h3>Aradığını saniyeler içinde bulan misafirler.</h3><p>Akıllı arama, kategori geçişleri, beslenme tercihleri, alerjen bilgileri ve favoriler; tek, anlaşılır bir akışta.</p></div>
          <div className={styles.searchCard}><span>⌕</span><p><small>MENÜDE ARAMA</small><strong>“glutensiz”</strong><em>3 uygun ürün bulundu</em></p><b>→</b></div>
        </article>

        <article className={styles.featureManage}>
          <span className={styles.cardNumber}>02</span>
          <span className={styles.sectionKicker}>KOLAY YÖNETİM</span>
          <h3>Fiyatı değiştirin.<br />Menü anında güncellensin.</h3>
          <div className={styles.editRows}>
            <span><i className={styles.liveDot} /><p><strong>Köz patlıcan</strong><small>Yayında</small></p><b>₺245</b></span>
            <span><i className={styles.liveDot} /><p><strong>İmza tabağı</strong><small>Az önce güncellendi</small></p><b>₺395</b></span>
            <span><i /><p><strong>Günün tatlısı</strong><small>Taslak</small></p><b>＋</b></span>
          </div>
        </article>

        <article className={styles.featureBrand}>
          <span className={styles.cardNumber}>03</span>
          <span className={styles.sectionKicker}>MARKANIZA ÖZEL</span>
          <h3>Hazır şablon gibi değil, işletmeniz gibi görünür.</h3>
          <p>Kapak görseli, renkler, metinler, duyurular ve menü düzeni markanızın karakteriyle uyumlu çalışır.</p>
          <div className={styles.palette}><span /><span /><span /><span /><b>Aa</b></div>
        </article>

        <article className={styles.featureSecure}>
          <div><span className={styles.sectionKicker}>GÜVENLİ VE ESNEK ALTYAPI</span><h3>Bugün için hızlı.<br />Yarın için hazır.</h3><p>Güvenli hesaplar, yayın durumu yönetimi, otomatik deneme takibi ve isterseniz mevcut sisteminizle API bağlantısı.</p></div>
          <ul><li><span>✓</span>Rol tabanlı güvenli erişim</li><li><span>✓</span>Askıya alma ve deneme yönetimi</li><li><span>✓</span>API ile canlı veri desteği</li><li><span>✓</span>Arıza durumunda kayıtlı menüye dönüş</li></ul>
        </article>
      </div>
    </section>

    <section className={styles.process} id="nasil-calisir">
      <div className={styles.processIntro}><span className={styles.sectionKicker}>ÜÇ ADIMDA YAYINDA</span><h2>Menünüzü hazırlamak<br /><em>sandığınızdan kolay.</em></h2><p>Teknik bilgiye ihtiyacınız yok. İşletme profilinizi oluşturun, içeriklerinizi düzenleyin ve size özel bağlantıyı paylaşın.</p><Link className={styles.darkButton} href="/deneme">Ücretsiz başlayın <span>↗</span></Link></div>
      <div className={styles.steps}>
        <article><span>01</span><div><h3>İşletmenizi oluşturun</h3><p>Temel bilgilerinizi girin. Örnek kategoriler ve ürünlerle kullanıma hazır bir panel açılsın.</p></div></article>
        <article><span>02</span><div><h3>Menünüzü düzenleyin</h3><p>Ürünleri, fiyatları, görselleri ve işletme bilgilerini kolayca kendinize göre güncelleyin.</p></div></article>
        <article><span>03</span><div><h3>QR kodunuzu paylaşın</h3><p>Menü bağlantınızı masalarda, sosyal medyada ve Google işletme profilinizde kullanın.</p></div></article>
      </div>
    </section>

    <section className={styles.stands} id="standlar">
      <header className={styles.standsHeading}>
        <div><span className={styles.sectionKicker}>MASAYA DOKUNAN TASARIM</span><h2>Stand ürünlerimiz</h2><p>QR menünüzü masanın doğal bir parçasına dönüştüren, reklamcıda üretime uygun ölçü ve malzemelerle tasarlanmış özel modeller.</p></div>
        <div className={styles.productionNote}><span>ÜRETİME HAZIR</span><strong>Her stand işletmenizin QR kodu ve marka bilgileriyle kişiselleştirilebilir.</strong><small>Önizlemelerdeki QR kodlar yalnızca tasarım örneğidir.</small></div>
      </header>
      <div className={styles.standGrid}>
        {stands.map((stand, index) => {
          const productContact = whatsappUrl(`Merhaba, ${stand.name} QR menü standı hakkında fiyat ve üretim bilgisi almak istiyorum.`);
          const hasPrice = stand.price !== null;
          return <article className={styles.standCard} key={stand.id}>
            <div className={styles.standVisualWrap}><StandVisual name={stand.name} visualStyle={stand.visualStyle} imageUrl={stand.imageUrl} /><span>{String(index + 1).padStart(2, '0')}</span></div>
            <div className={styles.standCardBody}>
              <span className={styles.sectionKicker}>QR MENÜ STANDI</span>
              <h3>{stand.name}</h3>
              <p>{stand.description}</p>
              <dl><div><dt>Ölçü</dt><dd>{stand.dimensions}</dd></div><div><dt>Üretim</dt><dd>{stand.material}</dd></div></dl>
              <div className={styles.standCardFooter}>
                {hasPrice ? <strong>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(stand.price))}</strong> : <a className={styles.priceContact} href={productContact} target="_blank" rel="noreferrer">Fiyat için iletişime geçin</a>}
                <a className={styles.standInfoButton} href={productContact} target="_blank" rel="noreferrer">{hasPrice ? 'Bilgi alın' : 'Bilgi edinin'} <span>↗</span></a>
              </div>
            </div>
          </article>;
        })}
      </div>
    </section>

    <section className={styles.references} id="referanslar">
      <header className={styles.referenceHeading}><div><span className={styles.sectionKicker}>CANLI REFERANSLAR</span><h2>Gerçek menüler.<br /><em>Gerçek deneyimler.</em></h2></div><p>Yayındaki işletmelerimizin menülerini açın; hızı, görünümü ve kullanım kolaylığını doğrudan deneyimleyin.</p></header>
      {brands.length ? <div className={styles.referenceGrid}>{brands.map((brand, index) => <Link className={styles.referenceCard} href={`/${brand.slug}`} key={brand.slug}>
        <div className={styles.referenceImage} style={{ backgroundImage: `linear-gradient(180deg,rgba(10,11,9,.03),rgba(10,11,9,.87)),url(${brand.coverUrl || fallbackCover})` }}><span>{String(index + 1).padStart(2, '0')}</span><b>Menüyü aç ↗</b><div><small>CANLI QR MENÜ</small><h3>{brand.name}</h3><p>{brand.description || 'İşletmeye özel hazırlanmış dijital menü deneyimi.'}</p></div></div>
        <footer><span>{brand._count.categories} kategori</span><span>{brand._count.products} ürün</span><strong><i /> Yayında</strong></footer>
      </Link>)}</div> : <div className={styles.referenceEmpty}><span>✦</span><h3>Örnek menümüzü inceleyin.</h3><p>Misafir deneyimini doğrudan görmek için canlı örnek menüyü açın.</p><Link className={styles.lightButton} href="/mira">Örnek menüyü açın ↗</Link></div>}
    </section>

    <section className={styles.faq} id="sorular">
      <header><span className={styles.sectionKicker}>MERAK EDİLENLER</span><h2>Sık sorulan sorular</h2><p>Başlamadan önce bilmeniz gerekenleri kısa ve açık biçimde yanıtladık.</p></header>
      <div className={styles.faqList}>
        <details><summary>QR menü nasıl çalışır?<span>＋</span></summary><p>Size özel menü bağlantısını QR koda dönüştürüp masalarınızda kullanırsınız. Misafirleriniz telefonlarının kamerasıyla kodu okutur ve herhangi bir uygulama indirmeden menünüze ulaşır.</p></details>
        <details><summary>24 saatlik denemede hangi özellikler açık?<span>＋</span></summary><p>Kategori ve ürün yönetimi, görsel ve fiyat düzenleme, tema seçenekleri, canlı menü, favoriler ve API bağlantısı dahil tüm özellikleri kullanabilirsiniz. Kredi kartı gerekmez.</p></details>
        <details><summary>Yaptığım değişiklikler ne zaman yayınlanır?<span>＋</span></summary><p>Panelde kaydettiğiniz değişiklikler anında canlı menünüze yansır. QR kodunu yeniden oluşturmanız veya basılı materyalleri değiştirmeniz gerekmez.</p></details>
        <details><summary>Deneme süresi bittiğinde içeriklerim silinir mi?<span>＋</span></summary><p>Deneme bitince menünüz geçici olarak kapanır. İçerikleriniz yedi gün boyunca saklanır; bu süre içinde bizimle iletişime geçerek hesabınızı kaldığınız yerden etkinleştirebilirsiniz.</p></details>
        <details><summary>Mevcut menü sistemimle bağlantı kurulabilir mi?<span>＋</span></summary><p>Evet. Uyumlu bir JSON API&apos;niz varsa kategori, ürün, fiyat ve görsellerinizi canlı olarak aktarabiliriz. Bağlantıda sorun olursa sistem kayıtlı menüyü göstermeye devam eder.</p></details>
      </div>
    </section>

    <section className={styles.finalCta}>
      <div><span className={styles.sectionKicker}>İLK 24 SAAT ÜCRETSİZ</span><h2>Masanıza yakışan menüyle<br /><em>bugün tanışın.</em></h2><p>Kredi kartı gerekmez. Kurulum birkaç dakika sürer ve tüm özellikler ilk andan itibaren kullanıma açıktır.</p></div>
      <div><Link className={styles.primaryButton} href="/deneme">Ücretsiz denemeyi başlatın <span>↗</span></Link><a href={contact} target="_blank" rel="noreferrer">WhatsApp’tan bilgi alın · {CONTACT_PHONE_DISPLAY}</a></div>
    </section>

    <footer className={styles.footer}>
      <div><Brand /><p>Restoranların kolay yönettiği,<br />misafirlerin keyifle kullandığı menüler.</p></div>
      <div className={styles.footerLinks}><strong>Ürün</strong><a href="#ozellikler">Özellikler</a><a href="#nasil-calisir">Nasıl çalışır?</a><a href="#standlar">Stand ürünleri</a><a href="#referanslar">Referanslar</a></div>
      <div className={styles.footerLinks}><strong>Hızlı bağlantılar</strong><Link href="/deneme">Ücretsiz deneme</Link><Link href="/login">Panele giriş</Link><a href={contact} target="_blank" rel="noreferrer">WhatsApp</a></div>
      <small>© {new Date().getFullYear()} QR Menülerim. Tüm hakları saklıdır. <span>Tasarım ve geliştirme</span> <a href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümit Can Çınar ↗</a></small>
    </footer>

    <div className={styles.mobileCtaBar}><Link href="/deneme">24 saat ücretsiz deneyin</Link><a href={contact} target="_blank" rel="noreferrer" aria-label="WhatsApp’tan iletişime geçin">WhatsApp</a></div>
  </main>;
}
