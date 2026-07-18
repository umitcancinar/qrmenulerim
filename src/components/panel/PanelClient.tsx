'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { PERSONAL_SITE } from '@/lib/platform';
import { Icon, type IconName } from '@/components/menu/Icons';

type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  kicker?: string | null;
  price: string | number;
  isAvailable: boolean;
  isFeatured?: boolean;
  preparationMin: number | null;
  calories?: number | null;
  badges?: string[];
  allergens?: string[];
  ingredients?: string[];
};
type Category = { id: string; name: string; description: string | null; imageUrl?: string | null; products: Product[] };
type Tenant = {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'TRIAL';
  trialEndsAt: string | null;
  logoUrl: string | null;
  description: string | null;
  coverUrl: string | null;
  phone: string | null;
  address: string | null;
  settings: Record<string, unknown>;
};
type Modal = { type: 'category' | 'product'; entity?: Category | Product } | null;
type Tab = 'menu' | 'appearance' | 'integration' | 'analytics' | 'account';

const list = (value: FormDataEntryValue | undefined) =>
  typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

const headers: Record<Tab, { eyebrow: string; title: string; copy: string }> = {
  menu: { eyebrow: 'MENÜ YÖNETİMİ', title: '', copy: 'Değişiklikler kaydedildiğinde QR menünüzde anında görünür.' },
  appearance: { eyebrow: 'MARKA GÖRÜNÜMÜ', title: 'Menünüzü markanıza göre düzenleyin.', copy: 'Burada kaydettiğiniz işletme bilgileri canlı menünüze doğrudan uygulanır.' },
  integration: { eyebrow: 'API BAĞLANTISI', title: 'Menü verinizi dış kaynaktan alın.', copy: 'Mevcut menü API adresinizi ekleyerek kategori ve ürünlerinizi canlı kaynaktan kullanın.' },
  analytics: { eyebrow: 'İÇERİK ÖZETİ', title: 'Menünüzün güncel özeti', copy: 'Kategori, ürün ve yayın hazırlığı bilgilerini tek bakışta inceleyin.' },
  account: { eyebrow: 'HESAP AYARLARI', title: 'Hesabınızı yönetin.', copy: 'Kullanıcı adınızı, görünen adınızı ve şifrenizi güvenle güncelleyin.' },
};

export default function PanelClient({
  tenant: initialTenant,
  initialCategories,
  user: initialUser,
}: {
  tenant: Tenant;
  initialCategories: Category[];
  user: { username: string; displayName: string };
}) {
  const [tenant, setTenant] = useState(initialTenant);
  const [user, setUser] = useState(initialUser);
  const [categories, setCategories] = useState(initialCategories);
  const [active, setActive] = useState(initialCategories[0]?.id || '');
  const [modal, setModal] = useState<Modal>(null);
  const [tab, setTab] = useState<Tab>('menu');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState(false);
  const [integrationResult, setIntegrationResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [notice, setNotice] = useState('');
  const integrationForm = useRef<HTMLFormElement>(null);
  const category = categories.find((item) => item.id === active);
  const productTotal = useMemo(() => categories.reduce((sum, item) => sum + item.products.length, 0), [categories]);
  const availableProductTotal = useMemo(() => categories.reduce((sum, item) => sum + item.products.filter((product) => product.isAvailable).length, 0), [categories]);
  const settings = tenant.settings || {};
  const header = headers[tab];
  const allProducts = categories.flatMap((item) => item.products);
  const healthChecks = [Boolean(tenant.coverUrl), Boolean(tenant.description), Boolean(tenant.phone), Boolean(tenant.address), categories.length > 0, productTotal >= 3];
  const healthScore = Math.round(healthChecks.filter(Boolean).length / healthChecks.length * 100);
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2400); };

  useEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [modal]);

  async function saveMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    setSaving(true);
    setError('');
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const isProduct = modal.type === 'product';
    const data = {
      ...raw,
      categoryId: isProduct ? active : undefined,
      price: raw.price ? Number(raw.price) : undefined,
      preparationMin: raw.preparationMin ? Number(raw.preparationMin) : undefined,
      calories: raw.calories ? Number(raw.calories) : undefined,
      badges: list(raw.badges),
      allergens: list(raw.allergens),
      ingredients: list(raw.ingredients),
      isFeatured: raw.isFeatured === 'on',
      isAvailable: isProduct ? raw.isAvailable === 'on' : undefined,
    };
    const resource = modal.type === 'category' ? 'categories' : 'products';
    const response = await fetch(modal.entity ? `/api/panel/menu/${resource}/${modal.entity.id}` : '/api/panel/menu', {
      method: modal.entity ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modal.entity ? data : { ...data, type: modal.type }),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) return setError('Kayıt yapılamadı, bilgileri kontrol edin.');
    if (modal.type === 'category') {
      if (modal.entity) setCategories((items) => items.map((item) => item.id === modal.entity?.id ? { ...item, ...payload.data } : item));
      else {
        setCategories((items) => [...items, { ...payload.data, products: [] }]);
        setActive(payload.data.id);
      }
    } else {
      setCategories((items) => items.map((item) => item.id === active ? {
        ...item,
        products: modal.entity ? item.products.map((product) => product.id === modal.entity?.id ? payload.data : product) : [...item.products, payload.data],
      } : item));
    }
    setModal(null);
    flash(modal.entity ? 'Değişiklikler menüye yansıdı.' : 'Yeni içerik menüye eklendi.');
  }

  async function remove(type: 'categories' | 'products', id: string) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    const response = await fetch(`/api/panel/menu/${type}/${id}`, { method: 'DELETE' });
    if (!response.ok) return setError('Kayıt silinemedi.');
    if (type === 'categories') {
      const next = categories.filter((item) => item.id !== id);
      setCategories(next);
      setActive(next[0]?.id || '');
    } else {
      setCategories((items) => items.map((item) => ({ ...item, products: item.products.filter((product) => product.id !== id) })));
    }
    flash('İçerik menüden kaldırıldı.');
  }

  async function toggleAvailability(product: Product) {
    setSaving(true);
    setError('');
    const response = await fetch(`/api/panel/menu/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: product.name,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        kicker: product.kicker || '',
        price: Number(product.price),
        preparationMin: product.preparationMin ?? undefined,
        calories: product.calories ?? undefined,
        badges: product.badges || [],
        allergens: product.allergens || [],
        ingredients: product.ingredients || [],
        isFeatured: product.isFeatured === true,
        isAvailable: !product.isAvailable,
      }),
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok || !payload?.data) return setError('Ürün yayın durumu değiştirilemedi. Lütfen yeniden deneyin.');
    setCategories((items) => items.map((item) => ({
      ...item,
      products: item.products.map((current) => current.id === product.id ? payload.data : current),
    })));
    flash(product.isAvailable ? 'Ürün geçici olarak menüden kaldırıldı.' : 'Ürün yeniden menüde yayına alındı.');
  }

  async function saveTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data: Record<string, unknown> = Object.fromEntries(new FormData(event.currentTarget).entries());
    if ('menuApiEnabled' in data) data.menuApiEnabled = data.menuApiEnabled === 'on';
    const response = await fetch('/api/panel/tenant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      const message = payload.error === 'INVALID_API_URL'
        ? 'API adresi geçerli veya güvenli değil.'
        : payload.error === 'API_URL_REQUIRED'
          ? 'Canlı API bağlantısını açmak için önce API adresini yazın.'
          : tab === 'integration' ? 'API bağlantısı kaydedilemedi.' : 'İşletme bilgileri kaydedilemedi.';
      return setError(message);
    }
    setTenant((current) => ({ ...current, ...payload.data }));
    flash(tab === 'integration' ? 'API bağlantısı kaydedildi.' : 'Marka görünümü güncellendi.');
  }

  async function testIntegration() {
    if (!integrationForm.current) return;
    const menuApiUrl = String(new FormData(integrationForm.current).get('menuApiUrl') || '').trim();
    if (!menuApiUrl) return setIntegrationResult({ ok: false, message: 'Önce test etmek istediğiniz API adresini yazın.' });
    setTestingIntegration(true);
    setIntegrationResult(null);
    try {
      const response = await fetch('/api/panel/integration/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuApiUrl }),
      });
      const payload = await response.json().catch(() => ({ message: 'API yanıtı okunamadı.' }));
      setTestingIntegration(false);
      if (!response.ok) return setIntegrationResult({ ok: false, message: payload.message || 'API bağlantısı doğrulanamadı.' });
      setIntegrationResult({ ok: true, message: `Bağlantı başarılı: ${payload.data.categoryCount} kategori ve ${payload.data.productCount} ürün okunabiliyor.` });
    } catch {
      setTestingIntegration(false);
      setIntegrationResult({ ok: false, message: 'Bağlantı kurulamadı. İnternet bağlantısını ve API adresini kontrol edin.' });
    }
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!data.password) delete data.password;
    const response = await fetch('/api/panel/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) return setError(payload.error === 'USERNAME_ALREADY_USED' ? 'Bu kullanıcı adı kullanımda.' : 'Hesap bilgileri kaydedilemedi.');
    setUser({ username: payload.data.username, displayName: payload.data.displayName });
    flash('Hesap bilgileri güncellendi.');
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/login');
  };

  const nav = (key: Tab, icon: IconName, label: string, count?: number) => (
    <button type="button" className={tab === key ? 'selected' : ''} onClick={() => { setError(''); setTab(key); }}>
      <span className="panel-nav-icon"><Icon name={icon} /></span><span>{label}</span>{typeof count === 'number' && <b>{count}</b>}
    </button>
  );

  return <main className="panel-page">
    <aside className="panel-sidebar">
      <div className="sa-logo"><div className="brand-mark">QM</div><span>qrmenülerim<sup>®</sup></span></div>
      <div className="panel-restaurant"><div>{tenant.name.slice(0, 1)}</div><span><strong>{tenant.name}</strong><small>İşletme paneli</small></span></div>
      <nav aria-label="Panel bölümleri">
        {nav('menu', 'grid', 'Menü içerikleri', productTotal)}
        {nav('appearance', 'palette', 'Görünüm ve tema')}
        {nav('integration', 'link', 'API bağlantısı')}
        {nav('analytics', 'chart', 'İçerik özeti')}
        {nav('account', 'settings', 'Hesap ayarları')}
      </nav>
      <div className="panel-sidebar-status"><i><Icon name="check" /></i><span><strong>Menünüz yayında</strong><small>Son değişiklikler anında görünür</small></span></div>
      <button className={`sa-bottom account-card ${tab === 'account' ? 'is-active' : ''}`} onClick={() => setTab('account')}>
        <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div><div><strong>{user.username}</strong><span>Hesabım · Ayarlar</span></div>
      </button>
      <button className="logout-action" onClick={logout}>⇥ Çıkış yap</button>
      <a className="panel-signature" href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümit Can Çınar tarafından geliştirildi ↗</a>
    </aside>
    <section className="panel-main">
      <header className="panel-top">
        <div><span className="eyebrow">{header.eyebrow}</span><h1>{tab === 'menu' ? tenant.name : header.title}</h1><p>{header.copy}</p></div>
        <div className="panel-top-actions"><span className="panel-live-state"><i /> CANLI MENÜ</span><a className="preview-link" href={`/${tenant.slug}`} target="_blank" rel="noreferrer"><span>Menüyü görüntüle</span><Icon name="external" /></a></div>
      </header>
      {tenant.status === 'TRIAL' && tenant.trialEndsAt && <div className="trial-banner"><span>24 SAATLİK TAM DENEME</span><p>Tüm özellikler açık · Süre bitişi <strong>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(tenant.trialEndsAt))}</strong></p><a href="https://wa.me/905541563862?text=Merhaba%2C%20deneme%20hesab%C4%B1m%C4%B1%20aktif%20etmek%20istiyorum." target="_blank" rel="noreferrer">Hesabı aktifleştir ↗</a></div>}
      {notice && <div className="admin-toast"><span>✓</span>{notice}</div>}

      {tab === 'menu' && <>
        <section className="panel-overview" aria-label="Menü özeti">
          <article className="panel-overview-live"><div className="panel-stat-head"><span>Yayın durumu</span><Icon name="check" /></div><strong><i /> Canlı</strong><small>Menünüz misafirlere açık</small></article>
          <article><div className="panel-stat-head"><span>Kategoriler</span><Icon name="folder" /></div><strong>{categories.length}</strong><small>Menü bölümü</small></article>
          <article><div className="panel-stat-head"><span>Satıştaki ürünler</span><Icon name="grid" /></div><strong>{availableProductTotal}<em> / {productTotal}</em></strong><small>Şu anda menüde görünür</small></article>
          <article><div className="panel-stat-head"><span>Hazırlık puanı</span><Icon name="sparkles" /></div><strong>{healthScore}<em>/100</em></strong><small>{healthScore === 100 ? 'Tüm temel bilgiler hazır' : 'Geliştirilecek alanlar var'}</small></article>
        </section>
        <section className="panel-toolbar">
          <div><span className="eyebrow">İÇERİK KÜTÜPHANESİ</span><h2>Kategoriler ve ürünler</h2><p>Kategoriyi seçin; ürünleri düzenleyin veya tek dokunuşla yayından kaldırın.</p></div>
          <div><button className="secondary-action" onClick={() => { setError(''); setModal({ type: 'category' }); }}><Icon name="plus" /> Kategori oluştur</button><button className="primary-action" onClick={() => { if (!active) return setError('Önce bir kategori oluşturun.'); setError(''); setModal({ type: 'product' }); }}><Icon name="plus" /> Yeni ürün</button></div>
        </section>
        {error && <div className="form-error">{error}</div>}
        <div className="category-layout">
          <aside className="category-list" aria-label="Menü kategorileri">
            <header><span>KATEGORİLER</span><b>{categories.length}</b></header>
            {categories.map((item) => <button key={item.id} className={item.id === active ? 'category-row active' : 'category-row'} onClick={() => setActive(item.id)}><span>{item.name.slice(0, 1)}</span><strong>{item.name}<small>{item.products.length} ürün</small></strong><i>›</i></button>)}
            {!categories.length && <div className="table-empty"><strong>Henüz kategori yok</strong><span>Menünüzü düzenlemek için ilk kategorinizi oluşturun.</span><button className="row-action" onClick={() => setModal({ type: 'category' })}><Icon name="plus" /> Kategori oluştur</button></div>}
          </aside>
          <section className="product-list">
            <header><div><span className="eyebrow">SEÇİLİ KATEGORİ</span><h2>{category?.name || 'Henüz kategori yok'}</h2>{category?.description && <p>{category.description}</p>}</div>{category && <div><button className="row-action" onClick={() => setModal({ type: 'category', entity: category })}><Icon name="edit" /> Kategoriyi düzenle</button><button className="row-action row-action-danger" onClick={() => remove('categories', category.id)}><Icon name="trash" /> Sil</button></div>}</header>
            {category && <div className="product-table-head"><span>Ürün</span><span>Hazırlık</span><span>Fiyat</span><span>İşlemler</span></div>}
            {category?.products.map((product) => <article className={`product-row ${product.isAvailable ? '' : 'is-unavailable'}`} key={product.id}>
              <div className="panel-product-image" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{product.imageUrl ? '' : '✦'}</div>
              <div className="product-row-copy"><span className={`product-state ${product.isAvailable ? 'is-live' : ''}`}>{product.isAvailable ? 'Satışta' : 'Kapalı'}</span><strong>{product.name}</strong><p>{product.description || 'Açıklama eklenmemiş.'}</p></div>
              <span className="product-time">{product.preparationMin ? `◷ ${product.preparationMin} dk` : 'Süre yok'}</span>
              <strong className="product-price">₺{Number(product.price).toLocaleString('tr-TR')}</strong>
              <span className="product-actions"><button className="row-action product-publish-action" disabled={saving} onClick={() => toggleAvailability(product)}><Icon name={product.isAvailable ? 'pause' : 'play'} />{product.isAvailable ? 'Yayından kaldır' : 'Yayına al'}</button><button className="row-action" onClick={() => setModal({ type: 'product', entity: product })}><Icon name="edit" /> Düzenle</button><button className="row-action row-action-danger" onClick={() => remove('products', product.id)}><Icon name="trash" /> Sil</button></span>
            </article>)}
            {category && !category.products.length && <div className="empty-panel"><strong>Bu kategori henüz boş</strong><span>Misafirlerinizin görebileceği ilk ürünü ekleyin.</span><button className="primary-action" onClick={() => setModal({ type: 'product' })}><Icon name="plus" /> İlk ürünü ekle</button></div>}
          </section>
        </div>
      </>}

      {tab === 'appearance' && <form className="tenant-section panel-form-section" onSubmit={saveTenant}><span className="eyebrow">İŞLETME BİLGİLERİ</span><h2>QR menü görünümü</h2><p>Menünüzü açan misafirlerin ilk gördüğü başlık, kapak ve iletişim bilgilerini buradan yönetin.</p><div className="panel-section-note"><strong>İyi bir ilk izlenim için</strong><span>Yatay ve yüksek çözünürlüklü bir kapak görseli, kısa bir karşılama cümlesi ve güncel servis saatleri kullanın.</span></div><div className="form-grid"><label className="wide">Kısa açıklama<textarea name="description" defaultValue={tenant.description || ''} placeholder="İşletmenizi ve mutfağınızı birkaç cümleyle anlatın." /></label><label className="wide">Kapak görseli adresi<input name="coverUrl" type="url" defaultValue={tenant.coverUrl || ''} placeholder="https://…" /><small>Görselin doğrudan açılan güvenli bağlantısını yapıştırın.</small></label><label>Adres<input name="address" defaultValue={tenant.address || ''} /></label><label>Telefon<input name="phone" defaultValue={tenant.phone || ''} /></label><label>Üst başlık<input name="eyebrow" defaultValue={String(settings.eyebrow || '')} placeholder="Örn. MEZE · OCAKBAŞI · BAR" /></label><label>Instagram kullanıcı adı<input name="instagram" defaultValue={String(settings.instagram || '')} /></label><label>Karşılama başlığı<input name="tagline" defaultValue={String(settings.tagline || '')} /></label><label>Servis saatleri<input name="openingHours" defaultValue={String(settings.openingHours || '')} /></label><label>Ortalama bekleme<input name="averageWait" defaultValue={String(settings.averageWait || '')} /></label><label className="wide">Duyuru metni<input name="announcement" defaultValue={String(settings.announcement || '')} placeholder="Misafirlerinize göstermek istediğiniz güncel bilgi" /></label></div>{error && <div className="form-error">{error}</div>}<footer><button className="primary-action" disabled={saving}>{saving ? 'Kaydediliyor…' : 'Görünümü kaydet'}</button></footer></form>}

      {tab === 'integration' && <form ref={integrationForm} className="tenant-section panel-form-section" onSubmit={saveTenant}><span className="eyebrow">HARİCİ MENÜ KAYNAĞI</span><h2>Menü API bağlantısı</h2><p>Mevcut sisteminizdeki menü verisini güvenli biçimde bağlayın. Kaydetmeden önce kategori ve ürünlerin okunabildiğini test edebilirsiniz.</p><div className="form-grid"><label className="wide">Menü API adresi<input name="menuApiUrl" type="url" defaultValue={String(settings.menuApiUrl || '')} placeholder="https://api.ornek.com/menu/{{slug}}" /><small>Tam API adresini yazın. {'{{slug}}'} alanı bu işletmenin menü koduyla otomatik değiştirilir.</small></label><input type="hidden" name="menuApiEnabled" value="off" /><label className="check-label wide"><input name="menuApiEnabled" type="checkbox" defaultChecked={settings.menuApiEnabled === true} /><span><strong>QR menü içeriğini bu adresten canlı olarak al</strong><small>Bağlantıyı açmadan önce “Bağlantıyı test et” adımını kullanmanızı öneririz.</small></span></label>{integrationResult && <div className={`integration-result wide ${integrationResult.ok ? 'is-success' : 'is-error'}`} role="status"><strong>{integrationResult.ok ? 'Bağlantı doğrulandı' : 'Bağlantı doğrulanamadı'}</strong><span>{integrationResult.message}</span></div>}<div className="integration-note wide"><strong>Bağlantı açıkken</strong><span>Kategori, ürün, fiyat, görsel, hazırlık süresi, rozet ve porsiyon bilgileri API kaynağından okunur. Kaynak yanıt vermezse kayıtlı menünüz kesintisiz gösterilir.</span></div><div className="integration-note wide"><strong>Desteklenen veri yapısı</strong><span>JSON yanıtında categories dizisi bulunmalıdır. Ürünler kategori içindeki items veya products dizisinde ya da üst seviyedeki products dizisinde categoryId ile gönderilebilir.</span></div><div className="integration-note wide"><strong>Güvenlik ve sınırlar</strong><span>Yerel ağ adresleri engellenir, bağlantı sekiz saniyede zaman aşımına uğrar ve en fazla 2 MB büyüklüğündeki JSON yanıtları işlenir.</span></div></div>{error && <div className="form-error">{error}</div>}<footer className="integration-actions"><button type="button" className="secondary-action" disabled={testingIntegration || saving} onClick={testIntegration}>{testingIntegration ? 'Bağlantı test ediliyor…' : 'Bağlantıyı test et'}</button><button className="primary-action" disabled={saving || testingIntegration}>{saving ? 'Kaydediliyor…' : 'API bağlantısını kaydet'}</button></footer></form>}

      {tab === 'analytics' && <><section className="sa-stats panel-summary-grid"><div><span>Toplam kategori</span><strong>{categories.length}</strong><small>Menüde listelenen gruplar</small></div><div><span>Toplam ürün</span><strong>{productTotal}</strong><small>QR menüdeki tüm içerikler</small></div><div><span>Satışta</span><strong>{availableProductTotal}</strong><small>Misafirlerin görebildiği ürünler</small></div><div><span>Öne çıkan</span><strong>{allProducts.filter((product) => product.isFeatured).length}</strong><small>Şefin seçkisi alanında</small></div></section><section className="menu-health"><div className="health-score"><strong>{healthScore}<small>/100</small></strong><span>Menü hazırlık puanı</span></div><div><span className="eyebrow">YAYINA HAZIRLIK</span><h2>Menünüzü güçlendirecek adımlar</h2><p>Eksik adımları tamamladığınızda misafirleriniz daha güvenilir ve açıklayıcı bir menü deneyimi yaşar.</p><ul><li className={tenant.coverUrl ? 'done' : ''}>Kapak görseli</li><li className={tenant.description ? 'done' : ''}>İşletme açıklaması</li><li className={tenant.phone && tenant.address ? 'done' : ''}>İletişim bilgileri</li><li className={productTotal >= 3 ? 'done' : ''}>En az 3 ürün</li></ul></div></section></>}
      {tab === 'account' && <form className="tenant-section panel-form-section" onSubmit={saveAccount}><span className="eyebrow">GİRİŞ BİLGİLERİ</span><h2>Hesabım</h2><p>Bu bilgiler yalnızca işletme panelinize giriş yapmak için kullanılır.</p><div className="panel-section-note"><strong>Güvenlik önerisi</strong><span>En az 8 karakterli, başka hesaplarda kullanmadığınız güçlü bir şifre seçin.</span></div><div className="form-grid"><label>Görünen ad<input name="displayName" required defaultValue={user.displayName} /></label><label>Kullanıcı adı<input name="username" required defaultValue={user.username} autoCapitalize="none" /></label><label className="wide">Yeni şifre<input name="password" type="password" minLength={8} placeholder="Değiştirmek istemiyorsanız boş bırakın" autoComplete="new-password" /><small>Şifrenizi değiştirmiyorsanız bu alanı boş bırakabilirsiniz.</small></label></div>{error && <div className="form-error">{error}</div>}<footer className="account-actions"><button type="button" className="secondary-action" onClick={logout}>Güvenli çıkış</button><button className="primary-action" disabled={saving}>{saving ? 'Kaydediliyor…' : 'Hesabı kaydet'}</button></footer></form>}
    </section>
    {modal && <div className="sa-modal-backdrop" onClick={() => setModal(null)}><form className="tenant-modal" onSubmit={saveMenu} onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" aria-label="Pencereyi kapat" onClick={() => setModal(null)}>×</button><span className="eyebrow">{modal.type === 'category' ? 'KATEGORİ' : 'ÜRÜN'} {modal.entity ? 'DÜZENLE' : 'EKLE'}</span><h2>{modal.entity ? 'Bilgileri güncelle' : modal.type === 'category' ? 'Kategori oluştur' : 'Ürün ekle'}</h2><div className="form-grid">{modal.type === 'category' ? <><label className="wide">Kategori adı<input name="name" required defaultValue={(modal.entity as Category | undefined)?.name || ''} /></label><label className="wide">Kısa açıklama<input name="description" defaultValue={(modal.entity as Category | undefined)?.description || ''} /></label><label className="wide">Görsel adresi<input name="imageUrl" type="url" defaultValue={(modal.entity as Category | undefined)?.imageUrl || ''} placeholder="https://…" /></label></> : <><label>Ürün adı<input name="name" required defaultValue={(modal.entity as Product | undefined)?.name || ''} /></label><label>Fiyat (₺)<input name="price" type="number" min="0" step="0.01" required defaultValue={(modal.entity as Product | undefined)?.price || ''} /></label><label className="wide">Açıklama<input name="description" defaultValue={(modal.entity as Product | undefined)?.description || ''} /></label><label className="wide">Ürün görseli adresi<input name="imageUrl" type="url" defaultValue={(modal.entity as Product | undefined)?.imageUrl || ''} placeholder="https://…" /></label><label>Hazırlık süresi (dk)<input name="preparationMin" type="number" min="0" defaultValue={(modal.entity as Product | undefined)?.preparationMin || ''} /></label><label>Kalori<input name="calories" type="number" min="0" defaultValue={(modal.entity as Product | undefined)?.calories || ''} /></label><label>Vurgu rozeti<input name="kicker" defaultValue={(modal.entity as Product | undefined)?.kicker || ''} placeholder="Örn. ŞEFİN SEÇİMİ" /></label><label>Rozetler<input name="badges" defaultValue={(modal.entity as Product | undefined)?.badges?.join(', ') || ''} placeholder="Vegan, çok sevilen" /></label><label className="wide">İçindekiler<input name="ingredients" defaultValue={(modal.entity as Product | undefined)?.ingredients?.join(', ') || ''} placeholder="Nohut, tahin, limon" /></label><label className="wide">Alerjenler<input name="allergens" defaultValue={(modal.entity as Product | undefined)?.allergens?.join(', ') || ''} placeholder="Gluten, süt" /></label><label className="check-label wide"><input name="isFeatured" type="checkbox" defaultChecked={(modal.entity as Product | undefined)?.isFeatured} /><span><strong>Şefin seçkisinde göster</strong><small>Ürünü menünün öne çıkanlar alanında vurgular.</small></span></label><label className="check-label wide"><input name="isAvailable" type="checkbox" defaultChecked={(modal.entity as Product | undefined)?.isAvailable ?? true} /><span><strong>Menüde satışa açık</strong><small>Kapatırsanız ürün silinmez; misafir menüsünde geçici olarak gizlenir.</small></span></label></>}</div>{error && <div className="form-error">{error}</div>}<footer><button type="button" className="secondary-action" onClick={() => setModal(null)}>Vazgeç</button><button className="primary-action" disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button></footer></form></div>}
  </main>;
}
