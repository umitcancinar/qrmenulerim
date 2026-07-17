'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const payload = await response.json(); setLoading(false);
    if (!response.ok) return setError('Kullanıcı adı veya şifre hatalı.');
    router.replace(payload.data.redirectTo);
  }
  return <main className="auth-page"><section className="auth-aside"><div className="brand-mark">QM</div><span className="eyebrow">QR MENÜLERİM</span><h1>Her masada<br /><i>hatırlanan</i> bir deneyim.</h1><p>Markanıza ait modern dijital menüyü tek panelden yönetin.</p></section><section className="auth-form-wrap"><form onSubmit={submit} className="auth-card"><span className="eyebrow">HOŞ GELDİNİZ</span><h2>Panele giriş yapın</h2><p>Size atanmış kullanıcı bilgilerinizle devam edin.</p><label>Kullanıcı adı<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required /></label><label>Şifre<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></label>{error && <div className="form-error">{error}</div>}<button disabled={loading}>{loading ? 'Giriş yapılıyor…' : 'Giriş yap'}</button></form></section></main>;
}
