'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PERSONAL_SITE, whatsappUrl } from '@/lib/platform';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const payload = await response.json().catch(() => ({})); setLoading(false);
      if (!response.ok) return setError('Kullanıcı adı veya şifre eşleşmedi. Bilgilerinizi kontrol edin.');
      router.replace(payload.data.redirectTo);
    } catch {
      setLoading(false); setError('Bağlantı kurulamadı. Lütfen tekrar deneyin.');
    }
  }
  return <main className="login-page"><section className="login-showcase"><Link className="landing-brand light-brand" href="/"><span>QM</span><div><strong>qrmenülerim</strong><small>DİJİTAL MENÜ STÜDYOSU</small></div></Link><div className="login-copy"><span className="hero-kicker"><i /> Yönetim paneli</span><h1>Menünüz<br /><em>hep elinizin altında.</em></h1><p>Ürünleri güncelleyin, fiyatları değiştirin ve marka görünümünüzü tek panelden yönetin.</p></div><div className="login-dashboard-preview"><header><span>Bugünkü görünüm</span><i>CANLI</i></header><strong>Menünüz yayında</strong><div><span><b>14</b><small>Ürün</small></span><span><b>05</b><small>Kategori</small></span><span><b>4.9</b><small>Deneyim</small></span></div></div></section><section className="login-form-side"><form onSubmit={submit} className="login-card"><span className="eyebrow">TEKRAR HOŞ GELDİNİZ</span><h2>Panelinize giriş yapın.</h2><p>Size ait kullanıcı bilgileriyle güvenli biçimde devam edin.</p><label>Kullanıcı adı<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required autoFocus placeholder="kullaniciadi" /></label><label>Şifre<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} autoComplete="current-password" required placeholder="••••••••" /></label>{error && <div className="form-error">{error}</div>}<button className="button button-primary submit-wide" disabled={loading}>{loading ? 'Giriş yapılıyor…' : 'Giriş yap'} <span>↗</span></button><div className="login-help"><span>Hesabınız yok mu? <Link href="/deneme">24 saat ücretsiz deneyin</Link></span><a href={whatsappUrl('Merhaba, QR Menülerim panel girişim için desteğe ihtiyacım var.')} target="_blank" rel="noreferrer">Giriş desteği ↗</a></div></form><footer className="global-signature">Tasarım ve geliştirme <a href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümit Can Çınar ↗</a></footer></section></main>;
}
