'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { PERSONAL_SITE, whatsappUrl } from '@/lib/platform';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  createdAt: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  scheduledDeletionAt: string | null;
  suspendedAt: string | null;
  users: { id: string; displayName: string; username: string; role: string; isActive: boolean }[];
  _count: { products: number; categories: number };
};
type View = 'overview' | 'customers' | 'analytics' | 'api' | 'settings';
type ApiPayload = { data?: Tenant; error?: string; details?: Record<string, string[]> };

const statusLabel = { ACTIVE: 'Aktif', TRIAL: 'Deneme', SUSPENDED: 'Askıda' } as const;
const date = (value: string | null) => value ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function errorMessage(payload: ApiPayload, fallback: string) {
  if (payload.error === 'SLUG_ALREADY_USED') return 'Bu menü bağlantısı zaten kullanılıyor.';
  if (payload.error === 'USERNAME_ALREADY_USED') return 'Bu kullanıcı adı zaten kullanılıyor.';
  if (payload.error === 'INVALID_SLUG') return 'Geçerli bir menü bağlantısı yazın.';
  if (payload.error === 'CONFIRMATION_MISMATCH') return 'Silme onayı işletme adıyla eşleşmedi.';
  const detail = payload.details && Object.values(payload.details).flat().find(Boolean);
  return detail || fallback;
}

async function jsonRequest(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({ error: 'UNEXPECTED_RESPONSE' })) as ApiPayload;
    return { response, payload };
  } catch {
    return { response: null, payload: { error: 'NETWORK_ERROR' } as ApiPayload };
  }
}

export default function SuperadminClient({ initialTenants, username }: { initialTenants: Tenant[]; username: string }) {
  const [tenants, setTenants] = useState(initialTenants);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('overview');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const filtered = useMemo(() => tenants.filter((tenant) =>
    `${tenant.name} ${tenant.slug} ${tenant.users[0]?.username || ''}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')),
  ), [query, tenants]);
  const totalProducts = tenants.reduce((sum, tenant) => sum + tenant._count.products, 0);
  const totalCategories = tenants.reduce((sum, tenant) => sum + tenant._count.categories, 0);
  const activeMenus = tenants.filter((tenant) => tenant.status === 'ACTIVE').length;
  const trials = tenants.filter((tenant) => tenant.status === 'TRIAL').length;

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  async function createTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true); setError('');
    const raw = Object.fromEntries(new FormData(form).entries());
    const data = { ...raw, starterMenu: raw.starterMenu === 'on' };
    const { response, payload } = await jsonRequest('/api/superadmin/tenants', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    setSaving(false);
    if (!response?.ok || !payload.data) return setError(errorMessage(payload, 'Müşteri oluşturulamadı. Lütfen bilgileri kontrol edip tekrar deneyin.'));
    setTenants((items) => [payload.data!, ...items]);
    form.reset(); setOpen(false); flash(`${payload.data.name} başarıyla oluşturuldu.`);
  }

  async function updateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true); setError('');
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const data: Record<string, unknown> = { ...raw, restartTrial: raw.restartTrial === 'on' };
    if (!data.password) delete data.password;
    const { response, payload } = await jsonRequest(`/api/superadmin/tenants/${editing.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    setSaving(false);
    if (!response?.ok || !payload.data) return setError(errorMessage(payload, 'Değişiklikler kaydedilemedi.'));
    setTenants((items) => items.map((item) => item.id === editing.id ? payload.data! : item));
    setEditing(null); flash('Müşteri hesabı güncellendi.');
  }

  async function deleteTenant(tenant: Tenant) {
    const confirmation = window.prompt(`Bu işlem geri alınamaz. Devam etmek için işletme adını aynen yazın:\n${tenant.name}`);
    if (confirmation === null) return;
    setSaving(true); setError('');
    const { response, payload } = await jsonRequest(`/api/superadmin/tenants/${tenant.id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation }),
    });
    setSaving(false);
    if (!response?.ok) return setError(errorMessage(payload, 'Müşteri silinemedi.'));
    setTenants((items) => items.filter((item) => item.id !== tenant.id));
    setEditing(null); flash(`${tenant.name} ve tüm içerikleri silindi.`);
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!data.password) delete data.password;
    const { response, payload } = await jsonRequest('/api/panel/account', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    setSaving(false);
    if (!response?.ok) return setError(errorMessage(payload, 'Hesap kaydedilemedi.'));
    flash('Superadmin hesabı güncellendi.');
  }

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    flash('API adresi panoya kopyalandı.');
  };
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/login'); };
  const switchView = (key: View) => { setView(key); setError(''); };

  const nav = (key: View, icon: string, label: string, badge?: number) => <button type="button" className={view === key ? 'selected' : ''} onClick={() => switchView(key)}><span>{icon}</span>{label}{badge !== undefined && <b>{badge}</b>}</button>;

  const directory = <section className="tenant-section tenant-directory">
    <header><div><span className="eyebrow">MÜŞTERİ DİZİNİ</span><h2>Markalar</h2><p>Yayın, deneme ve hesap durumlarını tek noktadan yönetin.</p></div><label className="sa-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Marka, adres veya kullanıcı ara…" /></label></header>
    <div className="tenant-table">
      <div className="tenant-head"><span>MARKA</span><span>MENÜ ADRESİ</span><span>İÇERİK</span><span>DURUM</span><span /></div>
      {filtered.map((tenant) => <article key={tenant.id}>
        <div className="tenant-name"><div>{tenant.name.slice(0, 1)}</div><p><strong>{tenant.name}</strong><small>{tenant.users[0]?.displayName || 'Sahip yok'} · @{tenant.users[0]?.username || '—'}</small></p></div>
        <a href={`/${tenant.slug}`} target="_blank" rel="noreferrer"><strong>/{tenant.slug}</strong><small>Canlı menüyü aç ↗</small></a>
        <span><strong>{tenant._count.categories} kategori</strong><small>{tenant._count.products} ürün</small></span>
        <em className={`status ${tenant.status.toLowerCase()}`}>{statusLabel[tenant.status]}</em>
        <button type="button" className="row-action" aria-label={`${tenant.name} ayarları`} onClick={() => { setError(''); setEditing(tenant); }}>Yönet</button>
      </article>)}
      {!filtered.length && <div className="table-empty">Aramanıza uygun müşteri bulunamadı.</div>}
    </div>
  </section>;

  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-logo" href="/"><span>QM</span><div><strong>qrmenülerim</strong><small>COMMAND CENTER</small></div></Link>
      <div className="admin-workspace"><span>YÖNETİM ALANI</span><strong>Platform operasyonu</strong></div>
      <nav>{nav('overview', '⌂', 'Genel bakış')}{nav('customers', '◎', 'Müşteriler', tenants.length)}{nav('analytics', '↗', 'İçerik analitiği')}{nav('api', '⌘', 'API ve bağlantılar')}{nav('settings', '⚙', 'Hesap ayarları')}</nav>
      <div className="admin-sidebar-bottom"><button className="admin-account" onClick={() => switchView('settings')}><span>{username.slice(0, 1).toUpperCase()}</span><div><strong>{username}</strong><small>Superadmin</small></div></button><button className="logout-action" onClick={logout}>Çıkış yap <span>↗</span></button><a className="panel-signature" href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümit Can Çınar tarafından geliştirildi ↗</a></div>
    </aside>

    <section className="admin-main">
      <header className="admin-top"><div><span className="eyebrow">{view === 'overview' ? 'PLATFORM NABZI' : view === 'customers' ? 'MÜŞTERİ OPERASYONU' : view === 'analytics' ? 'İÇERİK SAĞLIĞI' : view === 'api' ? 'BAĞLANTI MERKEZİ' : 'GÜVENLİK'}</span><h1>{view === 'overview' ? <>Günaydın, <i>kontrol sende.</i></> : view === 'customers' ? 'Markaları kusursuz yönet.' : view === 'analytics' ? 'İçeriğin büyük resmi.' : view === 'api' ? 'Her menü, tek bağlantı.' : 'Hesabın güvende.'}</h1><p>{view === 'overview' ? 'Yayındaki menüler, denemeler ve içerik hacmi canlı görünümde.' : view === 'customers' ? 'Hesap açın, denemeyi başlatın veya yayını tek adımda yönetin.' : view === 'analytics' ? 'Markaların menü kapsamını ve yayın durumunu karşılaştırın.' : view === 'api' ? 'Her müşteri için güncel, önbelleksiz JSON menü uç noktası.' : 'Giriş bilgilerinizi düzenli aralıklarla güncelleyin.'}</p></div>{(view === 'overview' || view === 'customers') && <button className="button button-primary" onClick={() => { setError(''); setOpen(true); }}>Yeni müşteri <span>＋</span></button>}</header>
      {notice && <div className="admin-toast"><span>✓</span>{notice}</div>}
      {error && !open && !editing && <div className="form-error">{error}</div>}

      {(view === 'overview' || view === 'analytics') && <div className="admin-stats">
        <article><span>Toplam marka</span><strong>{tenants.length.toString().padStart(2, '0')}</strong><small><i className="dot live" /> Platform genelinde</small></article>
        <article><span>{view === 'analytics' ? 'Toplam kategori' : 'Yayındaki menü'}</span><strong>{view === 'analytics' ? totalCategories : activeMenus}</strong><small><i className="dot live" /> Aktif ve erişilebilir</small></article>
        <article><span>Toplam ürün</span><strong>{totalProducts}</strong><small><i className="dot" /> Tüm markalarda</small></article>
        <article><span>Deneme profili</span><strong>{trials}</strong><small>24 saat tam erişim</small></article>
      </div>}
      {(view === 'overview' || view === 'customers') && directory}
      {view === 'analytics' && <section className="tenant-section"><span className="eyebrow">MARKA BAZLI İÇERİK</span><h2>Menü kapsamı</h2><div className="analytics-grid">{tenants.map((tenant) => { const max = Math.max(...tenants.map((item) => item._count.products), 1); return <article key={tenant.id}><header><div><strong>{tenant.name}</strong><small>/{tenant.slug}</small></div><em className={`status ${tenant.status.toLowerCase()}`}>{statusLabel[tenant.status]}</em></header><div className="metric-line"><span>Ürün kapsamı</span><b>{tenant._count.products}</b></div><div className="progress"><i style={{ width: `${Math.max(6, tenant._count.products / max * 100)}%` }} /></div><small>{tenant._count.categories} kategori · {tenant._count.products} ürün</small></article>; })}</div></section>}
      {view === 'api' && <section className="tenant-section"><span className="eyebrow">PUBLIC MENU API</span><h2>Canlı menü bağlantıları</h2><p>Menü içeriği, durum denetiminden sonra güncel JSON olarak sunulur. Askıdaki ve süresi biten profiller otomatik olarak kapanır.</p><div className="api-list">{tenants.map((tenant) => { const url = `${typeof window === 'undefined' ? 'https://qrmenulerim.store' : window.location.origin}/api/v1/public/${tenant.slug}`; return <article key={tenant.id}><div><span>GET</span><strong>/api/v1/public/{tenant.slug}</strong><small>{tenant.name} · {tenant._count.products} ürün</small></div><button className="button button-ghost" onClick={() => copy(url)}>Kopyala</button></article>; })}</div></section>}
      {view === 'settings' && <form className="tenant-section settings-card" onSubmit={saveAccount}><span className="eyebrow">SUPERADMIN HESABI</span><h2>Giriş ve güvenlik</h2><p>Yeni şifre yazmadığınız sürece mevcut şifreniz korunur.</p><div className="form-grid"><label>Kullanıcı adı<input name="username" required defaultValue={username} autoComplete="username" /></label><label>Yeni şifre<input name="password" type="password" minLength={8} placeholder="En az 8 karakter" autoComplete="new-password" /></label></div>{error && <div className="form-error">{error}</div>}<footer><button className="button button-primary" disabled={saving}>{saving ? 'Kaydediliyor…' : 'Güvenliği güncelle'}</button></footer></form>}
    </section>

    {open && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}><form className="admin-modal" onSubmit={createTenant}><button type="button" className="modal-close" onClick={() => setOpen(false)}>×</button><span className="eyebrow">YENİ MARKA</span><h2>Hazır, yayınla.</h2><p>İşletme hesabı, giriş bilgileri ve örnek menü tek işlemde güvenle oluşturulur.</p><div className="form-grid"><label>İşletme adı<input name="name" required minLength={2} placeholder="Örn. A Lezzet Evi" /></label><label>Menü bağlantısı<input name="slug" placeholder="a-lezzet-evi" /><small>Boş bırakırsanız otomatik üretilir.</small></label><label>Yetkili adı<input name="ownerName" required placeholder="Ad Soyad" /></label><label>Telefon<input name="phone" inputMode="tel" placeholder="05xx xxx xx xx" /></label><label>Kullanıcı adı<input name="username" required pattern="[a-zA-Z0-9_.-]+" placeholder="alezzet" /><small>Harf, rakam, nokta, tire veya alt çizgi.</small></label><label>İlk şifre<input name="password" type="password" minLength={8} required placeholder="En az 8 karakter" /></label><label className="wide">Hesap türü<select name="status" defaultValue="ACTIVE"><option value="ACTIVE">Aktif müşteri · Süresiz yayın</option><option value="TRIAL">Deneme · 24 saat tam erişim</option></select></label><label className="check-label wide"><input name="starterMenu" type="checkbox" defaultChecked /> Başlangıç kategorileri ve örnek ürünleri ekle</label></div>{error && <div className="form-error">{error}</div>}<footer><button type="button" className="button button-ghost" onClick={() => setOpen(false)}>Vazgeç</button><button className="button button-primary" disabled={saving}>{saving ? 'Oluşturuluyor…' : 'Müşteriyi oluştur'}</button></footer></form></div>}

    {editing && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditing(null); }}><form className="admin-modal" onSubmit={updateTenant}><button type="button" className="modal-close" onClick={() => setEditing(null)}>×</button><span className="eyebrow">MÜŞTERİ OPERASYONU</span><h2>{editing.name}</h2><div className="account-state"><div><span>Mevcut durum</span><em className={`status ${editing.status.toLowerCase()}`}>{statusLabel[editing.status]}</em></div>{editing.status === 'TRIAL' && <div><span>Deneme bitişi</span><strong>{date(editing.trialEndsAt)}</strong></div>}{editing.status === 'SUSPENDED' && <div><span>Askıya alındı</span><strong>{date(editing.suspendedAt)}</strong></div>}</div><div className="form-grid"><label>İşletme adı<input name="name" required defaultValue={editing.name} /></label><label>Yayın durumu<select name="status" defaultValue={editing.status}><option value="ACTIVE">Aktif · yayında</option><option value="TRIAL">Deneme · 24 saat</option><option value="SUSPENDED">Askıda · yayın kapalı</option></select></label><label>Yetkili adı<input name="ownerName" required defaultValue={editing.users[0]?.displayName || ''} /></label><label>Kullanıcı adı<input name="username" required defaultValue={editing.users[0]?.username || ''} /></label><label className="wide">Yeni şifre<input name="password" type="password" minLength={8} placeholder="Değiştirmeyecekseniz boş bırakın" /></label>{editing.status === 'TRIAL' && <label className="check-label wide"><input name="restartTrial" type="checkbox" /> Deneme süresini şimdi yeniden başlat (24 saat)</label>}</div>{error && <div className="form-error">{error}</div>}<div className="modal-links"><a href={`/${editing.slug}`} target="_blank" rel="noreferrer">Menüyü aç ↗</a>{editing.phone && <a href={whatsappUrl(`Merhaba ${editing.users[0]?.displayName || ''}, ${editing.name} hesabınız hakkında iletişime geçiyoruz.`)} target="_blank" rel="noreferrer">WhatsApp ↗</a>}</div><footer className="split-footer"><button type="button" className="danger-action" disabled={saving} onClick={() => deleteTenant(editing)}>Hesabı kalıcı sil</button><button className="button button-primary" disabled={saving}>{saving ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}</button></footer></form></div>}
  </main>;
}
