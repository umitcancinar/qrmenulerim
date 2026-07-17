'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icons';
import type { DietTag, MenuProduct, RestaurantMenu } from './types';
import styles from './MenuExperience.module.css';

const money = (price: number) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
}).format(price);

const filterLabels: Partial<Record<DietTag, string>> = {
  vegan: 'Vegan', vegetarian: 'Vejetaryen', 'gluten-free': 'Glutensiz', spicy: 'Acılı',
};

const tagLabels: Record<DietTag, string> = {
  vegan: 'Vegan', vegetarian: 'Vejetaryen', 'gluten-free': 'Glutensiz', spicy: 'Acılı',
  popular: 'Çok sevilen', chef: 'Şefin seçimi',
};

export default function MenuExperience({ menu }: { menu: RestaurantMenu }) {
  const [activeCategory, setActiveCategory] = useState(menu.categories[0]?.id ?? 'favorites');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DietTag[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteView, setFavoriteView] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const [selectedPortion, setSelectedPortion] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('qm-theme');
    const storedFavorites = window.localStorage.getItem('qm-favorites');
    if (storedTheme === 'dark') setTheme('dark');
    if (storedFavorites) {
      try { setFavorites(JSON.parse(storedFavorites)); } catch { /* Bozuk yerel veriyi yok say. */ }
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected || infoOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected, infoOpen]);

  useEffect(() => {
    setSelectedPortion(selected?.portions?.[0]?.id ?? '');
  }, [selected]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeCategoryData = menu.categories.find((category) => category.id === activeCategory);
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
    return menu.products.filter((product) => {
      const categoryMatch = normalizedQuery
        ? `${product.name} ${product.description} ${product.ingredients.join(' ')}`.toLocaleLowerCase('tr-TR').includes(normalizedQuery)
        : favoriteView
          ? favorites.includes(product.id)
          : activeCategory === 'favorites' ? product.featured : product.categoryId === activeCategory;
      return categoryMatch && filters.every((filter) => product.tags.includes(filter));
    });
  }, [activeCategory, favoriteView, favorites, filters, menu.products, query]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem('qm-favorites', JSON.stringify(next));
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      window.localStorage.setItem('qm-theme', next);
      return next;
    });
  };

  const toggleFilter = (filter: DietTag) => {
    setFilters((current) => current.includes(filter)
      ? current.filter((item) => item !== filter)
      : [...current, filter]);
  };

  const chooseCategory = (id: string) => {
    setActiveCategory(id);
    setFavoriteView(false);
    setQuery('');
    window.setTimeout(() => document.getElementById('menu-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const showFavorites = () => {
    setFavoriteView(true);
    setQuery('');
    window.setTimeout(() => document.getElementById('menu-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const shareMenu = async () => {
    const shareData = { title: `${menu.name} Menüsü`, text: `${menu.name} dijital menüsünü keşfet.`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setToast('Menü bağlantısı kopyalandı');
      }
    } catch { /* Kullanıcının paylaşımı kapatması hata değildir. */ }
  };

  const displayedPrice = selected?.portions?.find((portion) => portion.id === selectedPortion)?.price ?? selected?.price ?? 0;
  const sectionTitle = query ? 'Arama sonuçları' : favoriteView ? 'Favori lezzetlerin' : activeCategoryData?.name;
  const sectionDescription = query
    ? `“${query}” için eşleşen tabaklar`
    : favoriteView ? 'Daha sonra kolayca bulmak için kaydettiklerin' : activeCategoryData?.description;

  return (
    <main className={`${styles.page} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />
      <div className={styles.shell}>
        <header className={styles.hero} style={{ backgroundImage: `linear-gradient(90deg, rgba(20,17,13,.92) 0%, rgba(20,17,13,.62) 47%, rgba(20,17,13,.15) 100%), url(${menu.coverUrl})` }}>
          <nav className={styles.heroNav} aria-label="Menü araçları">
            <div className={styles.wordmark}>
              <span>{menu.logoText}</span>
              <div><strong>{menu.name}</strong><small>{menu.eyebrow}</small></div>
            </div>
            <div className={styles.heroActions}>
              <button onClick={shareMenu} aria-label="Menüyü paylaş"><Icon name="share" /></button>
              <button onClick={toggleTheme} aria-label="Temayı değiştir"><Icon name={theme === 'light' ? 'moon' : 'sun'} /></button>
            </div>
          </nav>

          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{menu.eyebrow}</span>
            <h1>{menu.tagline}</h1>
            <p>{menu.description}</p>
            <div className={styles.heroMeta}>
              <span className={styles.open}><i /> Şimdi açık</span>
              <span><Icon name="clock" /> {menu.openingHours}</span>
              <span><Icon name="star" /> {menu.rating} <small>({menu.reviewCount})</small></span>
            </div>
          </div>
          <button className={styles.heroInfo} onClick={() => setInfoOpen(true)}>
            <Icon name="info" /><span>Mekân bilgileri</span><Icon name="chevron" />
          </button>
        </header>

        <div className={styles.announcement}>
          <span>BUGÜN MİRA'DA</span><p>{menu.announcement}</p><button onClick={() => chooseCategory('favorites')}>Keşfet <Icon name="chevron" /></button>
        </div>

        <section className={styles.content}>
          <div className={styles.discovery}>
            <label className={styles.search}>
              <Icon name="search" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setFavoriteView(false); }} placeholder="Bir lezzet, içerik veya ürün ara..." aria-label="Menüde ara" />
              {query && <button onClick={() => setQuery('')} aria-label="Aramayı temizle"><Icon name="close" /></button>}
            </label>
            <div className={styles.viewControls}>
              <button className={layout === 'grid' ? styles.selectedControl : ''} onClick={() => setLayout('grid')} aria-label="Kart görünümü"><Icon name="grid" /></button>
              <button className={layout === 'list' ? styles.selectedControl : ''} onClick={() => setLayout('list')} aria-label="Liste görünümü"><Icon name="list" /></button>
            </div>
          </div>

          <div className={styles.categoryRail} role="tablist" aria-label="Menü kategorileri">
            {menu.categories.map((category) => (
              <button key={category.id} role="tab" aria-selected={!favoriteView && activeCategory === category.id} className={!favoriteView && activeCategory === category.id ? styles.activeCategory : ''} onClick={() => chooseCategory(category.id)}>
                <span>{category.icon}</span>{category.name}
              </button>
            ))}
          </div>

          <div className={styles.filterBar}>
            <div className={styles.filterLabel}><Icon name="filter" /><span>Tercihler</span></div>
            <div className={styles.filters}>
              {(Object.entries(filterLabels) as [DietTag, string][]).map(([key, label]) => (
                <button key={key} onClick={() => toggleFilter(key)} className={filters.includes(key) ? styles.activeFilter : ''} aria-pressed={filters.includes(key)}>
                  {key === 'vegan' && <Icon name="leaf" />}{label}
                </button>
              ))}
              {!!filters.length && <button className={styles.clearFilters} onClick={() => setFilters([])}>Temizle</button>}
            </div>
          </div>

          <div className={styles.menuSection} id="menu-list">
            <header className={styles.sectionHeader}>
              <div><span className={styles.eyebrow}>MENÜYÜ KEŞFET</span><h2>{sectionTitle}</h2><p>{sectionDescription}</p></div>
              <span>{visibleProducts.length} ürün</span>
            </header>

            <div className={`${styles.productGrid} ${layout === 'list' ? styles.listLayout : ''}`}>
              {visibleProducts.map((product, index) => (
                <article className={styles.productCard} key={product.id} style={{ '--delay': `${Math.min(index * 45, 300)}ms` } as React.CSSProperties}>
                  <button className={styles.cardMain} onClick={() => setSelected(product)} aria-label={`${product.name} detaylarını aç`}>
                    <div className={styles.productImage} style={{ backgroundImage: `url(${product.imageUrl})` }}>
                      <div className={styles.imageShade} />
                      {product.kicker && <span className={styles.kicker}>{product.kicker}</span>}
                      <span className={styles.detailArrow}><Icon name="chevron" /></span>
                    </div>
                    <div className={styles.productCopy}>
                      <div className={styles.cardTags}>{product.tags.slice(0, 2).map((tag) => <span key={tag}>{tagLabels[tag]}</span>)}</div>
                      <div className={styles.productTitle}><h3>{product.name}</h3><strong>{money(product.price)}</strong></div>
                      <p>{product.description}</p>
                      <div className={styles.productMeta}>
                        <span><Icon name="clock" /> {product.preparationMin} dk</span>
                        {product.calories && <span>{product.calories} kcal</span>}
                      </div>
                    </div>
                  </button>
                  <button className={`${styles.favoriteButton} ${favorites.includes(product.id) ? styles.isFavorite : ''}`} onClick={() => toggleFavorite(product.id)} aria-label={favorites.includes(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
                    <Icon name="heart" />
                  </button>
                </article>
              ))}
            </div>

            {!visibleProducts.length && (
              <div className={styles.emptyState}>
                <div><Icon name="search" /></div>
                <h3>{favoriteView ? 'Henüz favorin yok' : 'Bu seçimde ürün bulamadık'}</h3>
                <p>{favoriteView ? 'Beğendiğin ürünlerdeki kalbe dokun; burada senin için saklayalım.' : 'Filtreleri temizleyebilir veya başka bir arama deneyebilirsin.'}</p>
                {!favoriteView && <button onClick={() => { setQuery(''); setFilters([]); }}>Tümünü göster</button>}
              </div>
            )}
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}><span>{menu.logoText}</span><div><strong>{menu.name}</strong><small>{menu.eyebrow}</small></div></div>
          <p>İyi ürün, açık ateş ve uzun sofralar.</p>
          <div className={styles.footerLinks}><a href={`tel:${menu.phone}`}><Icon name="phone" /> Ara</a><a href="#" onClick={(event) => event.preventDefault()}><Icon name="instagram" /> {menu.instagram}</a></div>
          <small>Menü deneyimi <b>qrmenulerim</b> ile hazırlandı.</small>
        </footer>
      </div>

      <nav className={styles.mobileNav} aria-label="Mobil menü">
        <button className={!favoriteView && !infoOpen ? styles.mobileActive : ''} onClick={() => { setFavoriteView(false); setInfoOpen(false); }}><Icon name="menu" /><span>Menü</span></button>
        <button className={favoriteView ? styles.mobileActive : ''} onClick={showFavorites}><span className={styles.navIcon}><Icon name="heart" />{!!favorites.length && <i>{favorites.length}</i>}</span><span>Favoriler</span></button>
        <button className={infoOpen ? styles.mobileActive : ''} onClick={() => setInfoOpen(true)}><Icon name="info" /><span>Mekân</span></button>
      </nav>

      {selected && (
        <div className={styles.backdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <article className={styles.productModal} role="dialog" aria-modal="true" aria-label={`${selected.name} detayları`}>
            <button className={styles.modalClose} onClick={() => setSelected(null)} aria-label="Detayı kapat"><Icon name="close" /></button>
            <div className={styles.modalVisual} style={{ backgroundImage: `linear-gradient(180deg, transparent 45%, rgba(12,10,8,.68)), url(${selected.imageUrl})` }}>
              {selected.kicker && <span>{selected.kicker}</span>}
              <button className={favorites.includes(selected.id) ? styles.isFavorite : ''} onClick={() => toggleFavorite(selected.id)} aria-label="Favori durumunu değiştir"><Icon name="heart" /></button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalTags}>{selected.tags.map((tag) => <span key={tag}>{tagLabels[tag]}</span>)}</div>
              <h2>{selected.name}</h2>
              <p className={styles.modalDescription}>{selected.description}</p>
              <div className={styles.quickFacts}>
                <span><Icon name="clock" /><strong>{selected.preparationMin} dk</strong><small>Tahmini hazırlık</small></span>
                {selected.calories && <span><Icon name="info" /><strong>{selected.calories} kcal</strong><small>Yaklaşık enerji</small></span>}
              </div>
              {!!selected.portions?.length && <div className={styles.portions}><label>Porsiyon seçimi</label>{selected.portions.map((portion) => <button key={portion.id} className={selectedPortion === portion.id ? styles.activePortion : ''} onClick={() => setSelectedPortion(portion.id)}><span>{portion.label}</span><strong>{money(portion.price)}</strong></button>)}</div>}
              <div className={styles.ingredients}><label>İçindekiler</label><div>{selected.ingredients.map((ingredient) => <span key={ingredient}>{ingredient}</span>)}</div></div>
              {!!selected.allergens.length && <div className={styles.allergy}><Icon name="info" /><span><strong>Alerjen bilgisi</strong>{selected.allergens.join(' · ')}</span></div>}
              <div className={styles.modalFooter}><div><small>Fiyat</small><strong>{money(displayedPrice)}</strong></div><button onClick={() => setToast(`${selected.name} seçimini garsona gösterebilirsin`)}>Garsona göster</button></div>
            </div>
          </article>
        </div>
      )}

      {infoOpen && (
        <div className={styles.backdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) setInfoOpen(false); }}>
          <aside className={styles.infoSheet} role="dialog" aria-modal="true" aria-label="Mekân bilgileri">
            <button className={styles.infoClose} onClick={() => setInfoOpen(false)} aria-label="Bilgileri kapat"><Icon name="close" /></button>
            <div className={styles.infoLogo}>{menu.logoText}</div><span className={styles.eyebrow}>{menu.eyebrow}</span><h2>{menu.name}</h2><p>{menu.description}</p>
            <div className={styles.ratingCard}><div><Icon name="star" /><strong>{menu.rating}</strong></div><span>{menu.reviewCount} misafir değerlendirmesi</span></div>
            <div className={styles.infoRows}>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(menu.address)}`} target="_blank" rel="noreferrer"><Icon name="map" /><span><small>Adres</small><strong>{menu.address}</strong></span><Icon name="chevron" /></a>
              <a href={`tel:${menu.phone}`}><Icon name="phone" /><span><small>Telefon</small><strong>{menu.phone}</strong></span><Icon name="chevron" /></a>
              <div><Icon name="clock" /><span><small>Servis saatleri</small><strong>{menu.openingHours}</strong></span></div>
            </div>
            <button className={styles.shareWide} onClick={shareMenu}><Icon name="share" /> Menüyü paylaş</button>
          </aside>
        </div>
      )}

      {toast && <div className={styles.toast}><span>✓</span>{toast}</div>}
    </main>
  );
}
