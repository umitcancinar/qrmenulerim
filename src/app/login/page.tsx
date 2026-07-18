'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PERSONAL_SITE, whatsappUrl } from '@/lib/platform';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return <main className="login-page">
    <section className="login-showcase">
      <Link className="landing-brand light-brand" href="/"><span>QM</span><div><strong>qrmenülerim</strong><small>DİJİTAL MENÜ SİSTEMİ</small></div></Link>
      <div className="login-copy"><span className="hero-kicker">İŞLETME YÖNETİM PANELİ</span><h1>Menünüzü tek yerden yönetin.</h1><p>Ürünleri, fiyatları ve işletme görünümünü kolayca güncelleyin. Kaydettiğiniz değişiklikler doğrudan canlı menünüzde görünsün.</p></div>
      <div className="login-dashboard-preview"><header><span>İÇERİK DURUMU</span><i>● YAYINDA</i></header><strong>Menünüz kullanıma hazır</strong><div><span><b>14</b><small>Ürün</small></span><span><b>5</b><small>Kategori</small></span><span><b>Anlık</b><small>Güncelleme</small></span></div></div>
    </section>
    <section className="login-form-side">
      <Link className="auth-mobile-brand" href="/"><span>QM</span><strong>qrmenülerim</strong></Link>
      <form onSubmit={submit} className="login-card">
        <span className="eyebrow">HOŞ GELDİNİZ</span>
        <h2>Hesabınıza giriş yapın.</h2>
        <p>Size verilen kullanıcı adı ve şifreyle güvenli biçimde devam edin.</p>
        <label>Kullanıcı adı<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required autoFocus placeholder="kullaniciadi" /></label>
        <label>Şifre<span className="password-field"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} minLength={8} autoComplete="current-password" required placeholder="En az 8 karakter" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Gizle' : 'Göster'}</button></span></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary submit-wide" disabled={loading}>{loading ? 'Giriş yapılıyor…' : 'Giriş yap'} <span>↗</span></button>
        <div className="login-help"><span>Hesabınız yok mu? <Link href="/deneme">24 saat ücretsiz deneyin</Link></span><a href={whatsappUrl('Merhaba, QR Menülerim panel girişim için desteğe ihtiyacım var.')} target="_blank" rel="noreferrer">Giriş desteği ↗</a></div>
      </form>
      <footer className="global-signature">Tasarım ve geliştirme <a href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümit Can Çınar ↗</a></footer>
    </section>
  </main>;
}
