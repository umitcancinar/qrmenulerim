'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PERSONAL_SITE, whatsappUrl } from '@/lib/platform';

type Payload = { data?: { redirectTo: string; slug: string; trialEndsAt: string }; error?: string; details?: Record<string, string[]> };

const messages: Record<string, string> = {
  SLUG_ALREADY_USED: 'Bu menü bağlantısı kullanılıyor. Başka bir bağlantı deneyin.',
  USERNAME_ALREADY_USED: 'Bu kullanıcı adı kullanılıyor. Başka bir kullanıcı adı deneyin.',
  RATE_LIMITED: 'Kısa sürede çok fazla deneme hesabı istendi. Bir saat sonra tekrar deneyin veya WhatsApp’tan bize ulaşın.',
  INVALID_INPUT: 'Bilgileri kontrol edin; tüm zorunlu alanları geçerli biçimde doldurun.',
};

export default function TrialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Payload['data']>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/trials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...raw, accepted: raw.accepted === 'on' }) });
      const payload = await response.json().catch(() => ({ error: 'UNEXPECTED_RESPONSE' })) as Payload;
      setLoading(false);
      if (!response.ok || !payload.data) {
        const detail = payload.details && Object.values(payload.details).flat().find(Boolean);
        return setError(detail || messages[payload.error || ''] || 'Hesap oluşturulamadı. Lütfen tekrar deneyin.');
      }
      setCreated(payload.data);
    } catch {
      setLoading(false); setError('Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    }
  }

  return <main className="trial-page">
    <section className="trial-aside"><Link className="landing-brand light-brand" href="/"><span>QM</span><div><strong>qrmenülerim</strong><small>DİJİTAL MENÜ SİSTEMİ</small></div></Link><div className="trial-aside-copy"><span className="hero-kicker"><i /> 24 SAAT EKSİKSİZ DENEYİM</span><h1>Menünüzü<br /><em>bugün yayına alın.</em></h1><p>Tüm özellikleri gerçek işletme profilinizle deneyin. Hazır örnek içerikle başlayın; ürünlerinizi, fiyatlarınızı ve görünümünüzü panelden düzenleyin.</p><ul><li><span>✓</span> Kredi kartı gerekmez</li><li><span>✓</span> Kategori ve ürün yönetimi</li><li><span>✓</span> Tema, favoriler ve canlı menü</li><li><span>✓</span> API bağlantısı</li></ul></div><div className="trial-quote"><span>“</span><p>İyi tasarlanmış bir menü, misafire daha sipariş vermeden işletmenizin kalitesini hissettirir.</p></div></section>
    <section className="trial-form-wrap">
      <Link className="auth-mobile-brand" href="/"><span>QM</span><strong>qrmenülerim</strong></Link>
      {created ? <div className="trial-success"><div className="success-mark">✓</div><span className="eyebrow">HESABINIZ HAZIR</span><h2>Hoş geldiniz.<br />24 saatlik denemeniz başladı.</h2><p>Örnek kategorileriniz ve ürünleriniz hazırlandı. Panelde markanızı kişiselleştirip menünüzü hemen paylaşabilirsiniz.</p><div className="success-details"><span>Menü adresiniz</span><a href={`/${created.slug}`} target="_blank" rel="noreferrer">qrmenulerim.store/{created.slug} ↗</a><span>Deneme bitişi</span><strong>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(created.trialEndsAt))}</strong></div><button className="button button-primary" onClick={() => router.replace(created.redirectTo)}>Yönetim paneline geç <span>↗</span></button></div> : <form className="trial-form" onSubmit={submit}><div className="form-heading"><span className="eyebrow">24 SAAT ÜCRETSİZ</span><h2>İşletme profilinizi oluşturun.</h2><p>Bu bilgilerle yönetim panelinize giriş yapabilir ve menünüzü düzenleyebilirsiniz.</p></div><div className="form-grid"><label>İşletme adı<input name="name" required minLength={2} placeholder="Örn. A Lezzet Evi" autoFocus /></label><label>Menü bağlantısı<input name="slug" placeholder="a-lezzet-evi" /><small>Boş bırakırsanız işletme adınızdan otomatik oluşturulur.</small></label><label>Adınız ve soyadınız<input name="ownerName" required minLength={2} placeholder="Yetkili kişi" /></label><label>Telefon<input name="phone" required inputMode="tel" placeholder="05xx xxx xx xx" /></label><label>Kullanıcı adı<input name="username" required minLength={3} pattern="[a-zA-Z0-9_.-]+" placeholder="alezzet" autoComplete="username" /><small>Harf, rakam, nokta, tire veya alt çizgi kullanabilirsiniz.</small></label><label>Şifre<span className="password-field"><input name="password" required type={showPassword ? 'text' : 'password'} minLength={8} placeholder="En az 8 karakter" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Gizle' : 'Göster'}</button></span></label><label className="check-label wide"><input name="accepted" type="checkbox" required /> 24 saatlik deneme koşullarını ve deneme bittikten sonra içeriklerimin yedi gün saklanacağını kabul ediyorum.</label></div>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary submit-wide" disabled={loading}>{loading ? 'Profil hazırlanıyor…' : 'Ücretsiz hesabı oluştur'} <span>↗</span></button><small className="form-help">Yardıma mı ihtiyacınız var? <a href={whatsappUrl()} target="_blank" rel="noreferrer">WhatsApp’tan bize yazın.</a></small></form>}
      <footer className="global-signature">Zaten hesabınız var mı? <Link href="/login">Panele giriş</Link><span>·</span>Tasarım ve geliştirme <a href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümit Can Çınar ↗</a></footer>
    </section>
  </main>;
}
