import type { StandVisualStyle } from '@/lib/stand-products';
import styles from './StandVisual.module.css';

function FakeQr() {
  const size = 21;
  const finder = (x: number, y: number, left: number, top: number) => {
    const dx = x - left;
    const dy = y - top;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
    return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  };

  return <span className={styles.qr} aria-hidden="true">
    {Array.from({ length: size * size }, (_, index) => {
      const x = index % size;
      const y = Math.floor(index / size);
      const fixed = finder(x, y, 0, 0) || finder(x, y, 14, 0) || finder(x, y, 0, 14);
      const data = ((x * 3 + y * 5 + x * y) % 7 < 3) !== ((x + y) % 5 === 0);
      return <i className={fixed || data ? styles.qrDark : undefined} key={index} />;
    })}
  </span>;
}

export default function StandVisual({
  visualStyle,
  imageUrl,
  name,
  compact = false,
}: {
  visualStyle: string;
  imageUrl?: string | null;
  name: string;
  compact?: boolean;
}) {
  const tone = (['obsidian', 'atelier', 'walnut', 'prism', 'terra'].includes(visualStyle) ? visualStyle : 'obsidian') as StandVisualStyle;

  if (imageUrl) {
    return <div className={`${styles.scene} ${compact ? styles.compact : ''}`}>
      <div className={styles.customImage} style={{ backgroundImage: `url(${imageUrl})` }} role="img" aria-label={`${name} stand görseli`} />
    </div>;
  }

  return <div className={`${styles.scene} ${styles[tone]} ${compact ? styles.compact : ''}`} aria-label={`${name} tasarım önizlemesi`} role="img">
    <div className={styles.shadow} />
    <div className={styles.stand}>
      <div className={styles.standTop}><span>MENÜ</span><b>✦</b></div>
      <FakeQr />
      <div className={styles.scanCopy}><strong>QR MENÜ</strong><small>Menüyü görüntülemek için okutun</small></div>
      <div className={styles.standBrand}><i>QM</i><span>qrmenülerim</span></div>
    </div>
    <div className={styles.base} />
  </div>;
}
