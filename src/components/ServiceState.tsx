import Link from 'next/link';
import { CONTACT_PHONE_DISPLAY, PERSONAL_SITE, whatsappUrl } from '@/lib/platform';

export default function ServiceState({
  kind,
  businessName,
  deletionAt,
  panel = false,
}: {
  kind: 'SUSPENDED' | 'TRIAL_EXPIRED' | 'DELETED';
  businessName: string;
  deletionAt?: Date | null;
  panel?: boolean;
}) {
  const suspended = kind === 'SUSPENDED';
  const deleted = kind === 'DELETED';
  const title = suspended ? 'Bu menü şu anda askıda.' : deleted ? 'Bu deneme profili kapatıldı.' : 'Deneme süreniz sona erdi.';
  const copy = suspended
    ? `${businessName} menüsü geçici olarak yayından kaldırılmıştır. Hesabın yeniden açılması için ekibimizle iletişime geçebilirsiniz.`
    : deleted
      ? 'Deneme sonrası yedi günlük saklama süresi dolduğu için profil artık erişilebilir değil. Yeni bir kurulum için bize ulaşın.'
      : '24 saatlik tam erişim süreniz tamamlandı. Menünüz ve içerikleriniz kısa bir süre daha güvenle saklanıyor.';
  const message = suspended
    ? `Merhaba, ${businessName} menüsünün askı durumuyla ilgili destek almak istiyorum.`
    : `Merhaba, ${businessName} deneme hesabımı aktif bir hesaba dönüştürmek istiyorum.`;

  return <main className="service-page">
    <section className="service-card">
      <Link className="service-brand" href="/"><span>QM</span><strong>qrmenülerim</strong></Link>
      <div className={`service-orbit ${suspended ? 'is-suspended' : ''}`}><span>{suspended ? 'Ⅱ' : '24'}</span></div>
      <span className="eyebrow">{suspended ? 'YAYIN DURUMU' : 'DENEME PROGRAMI'}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
      {!suspended && !deleted && deletionAt && <div className="service-warning"><strong>İçerikleriniz hâlâ kayıtlı.</strong><span>{deletionAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihine kadar iletişime geçilmezse profil ve içerikleri kalıcı olarak silinir.</span></div>}
      <div className="service-actions">
        <a className="button button-primary" href={whatsappUrl(message)} target="_blank" rel="noreferrer">WhatsApp’tan ulaş <span>↗</span></a>
        {panel && <Link className="button button-ghost" href="/">Ana sayfaya dön</Link>}
      </div>
      <small>Destek hattı · {CONTACT_PHONE_DISPLAY}</small>
    </section>
    <footer className="global-signature">Tasarlayan ve geliştiren <a href={PERSONAL_SITE} target="_blank" rel="noreferrer">Ümican Çınar ↗</a></footer>
  </main>;
}
