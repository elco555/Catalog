const CONTACT_EMAIL = 'lhnn8229@gmail.com';

const categoryNames = {
  all: 'הכל', shoes: 'נעליים', bags: 'תיקים', clothes: 'בגדים', watches: 'שעונים', electronics: 'אלקטרוניקה', jewelry: 'תכשיטים', Hats: 'כובעים', Sunglasses: 'משקפי שמש', Belts: 'חגורות', Scarves: 'צעיפים',
};

/* חושף את מיפוי הקטגוריות גלובלית כדי ש-site-additions.js ישתמש באותו מקור ולא ייצור כפילות */
window.categoryNames = categoryNames;

/* מיפוי שמות מותגים - שדה brand בכל מוצר יכול להכיל כמה מותגים מופרדים בפסיק (למשל סט משולב) */
const BRAND_LABELS = {
  adidas: 'אדידס',
  hermes: 'הרמס',
  lv: 'לואי ויטון',
  chanel: 'שאנל',
  fendi: 'פנדי',
  dior: 'דיאור',
  rolex: 'רולקס',
  patek_philippe: 'פטק פיליפ',
  tous: 'TOUS',
  polo: 'פולו',
  north_face: 'The North Face',
  generic: 'ללא מותג',
};
window.BRAND_LABELS = BRAND_LABELS;

/* מחלץ מהמוצר מערך מותגים נקי (תומך בשדה brand עם כמה מותגים מופרדים בפסיק) */
function getProductBrands(product) {
  if (!product || !product.brand) return [];
  return String(product.brand).split(',').map((b) => b.trim()).filter(Boolean);
}
window.getProductBrands = getProductBrands;

function brandLabel(brandKey) {
  return BRAND_LABELS[brandKey] || brandKey;
}
window.brandLabel = brandLabel;

let productsData = [];
let activeCategory = 'all';
let activeBrands = [];

function applyFilters() {
  renderProducts(activeCategory, activeBrands);
  const url = new URL(window.location);
  url.searchParams.set('category', activeCategory);
  if (activeBrands.length) url.searchParams.set('brand', activeBrands.join(','));
  else url.searchParams.delete('brand');
  window.history.replaceState({}, '', url);
}
window.applyFilters = applyFilters;
window.getActiveCategory = () => activeCategory;
window.getActiveBrands = () => activeBrands.slice();
window.setActiveBrands = function (brands) {
  activeBrands = Array.isArray(brands) ? brands : [];
  applyFilters();
};

function buildProductImages(product) {
  return Array.from({ length: product.imageCount }, (_, i) => `${product.imageFolder}/${product.imageCode} (${i + 1}).jpg`);
}
window.buildProductImages = buildProductImages;

function initDrawer() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('category-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerClose = document.getElementById('drawer-close');
  if (!hamburgerBtn || !drawer || !drawerOverlay) return;

  function openDrawer() {
    drawer.classList.add('open'); drawerOverlay.classList.add('open');
    hamburgerBtn.classList.add('open'); document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open'); drawerOverlay.classList.remove('open');
    hamburgerBtn.classList.remove('open'); document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const grid = document.getElementById('products-grid');
      const category = link.dataset.category;
      if (grid) {
        e.preventDefault();
        document.querySelectorAll('.drawer-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        activeCategory = category;
        applyFilters();
        closeDrawer();
      }
    });
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
}

/* ===== עודכן: מוסיף גם דעיכה/הופעה חלקה של הפס העליון הצבעוני
   בזמן גלילה, יחד עם הפס הדביק הלבן שנשאר עם הלוגו ===== */
function initStickyBar() {
  const bar = document.getElementById('sticky-topbar');
  const header = document.querySelector('.site-header');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const isScrolled = window.scrollY > 140;
    bar.classList.toggle('visible', isScrolled);
    if (header) header.classList.toggle('header-fading', isScrolled);
  });
}

function initCatalogPage() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  loadProducts();
}

async function loadProducts() {
  showSkeleton();
  try {
    const res = await fetch('products.json');
    productsData = await res.json();
    const params = new URLSearchParams(window.location.search);
    activeCategory = params.get('category') || 'all';
    activeBrands = (params.get('brand') || '').split(',').map((b) => b.trim()).filter(Boolean);
    document.querySelectorAll('.drawer-link').forEach(l => l.classList.toggle('active', l.dataset.category === activeCategory));
    renderProducts(activeCategory, activeBrands);
    document.dispatchEvent(new CustomEvent('products-data-ready', { detail: { products: productsData } }));
  } catch (err) {
    document.getElementById('products-grid').innerHTML = '<p class="empty-state">שגיאה בטעינת המוצרים. נסה לרענן את הדף.</p>';
    console.error(err);
  }
}

function showSkeleton() {
  const grid = document.getElementById('products-grid');
  grid.classList.remove('grouped-view');
  grid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `<div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line" style="width:40%"></div>`;
    grid.appendChild(skeleton);
  }
}

/* בונה כרטיס מוצר בודד - פונקציה משותפת שמשמשת גם בתצוגה שטוחה וגם בתצוגה המחולקת לקטגוריות.
   התמונה הראשית בכרטיס תומכת בהחלקה (swipe) ימינה/שמאלה למעבר בין תמונות המוצר, בלי כפתורים -
   רק אם למוצר יש יותר מתמונה אחת. הקלקה רגילה (בלי החלקה) עדיין פותחת את דף המוצר. */
function buildProductCard(product) {
  const images = buildProductImages(product);
  const productBrands = getProductBrands(product);
  let imgIndex = 0;

  const card = document.createElement('div');
  card.className = 'product-card';

  const thumb = document.createElement('div');
  thumb.className = 'product-thumb';

  const img = document.createElement('img');
  img.src = images[0];
  img.alt = product.name;
  img.loading = 'lazy';
  thumb.appendChild(img);

  const catLabel = categoryNames[product.category];
  if (catLabel) {
    const catBadge = document.createElement('span');
    catBadge.className = 'product-badge';
    catBadge.textContent = catLabel;
    thumb.appendChild(catBadge);
  }

  if (productBrands.length) {
    const brandBadge = document.createElement('span');
    brandBadge.className = 'product-badge brand-badge';
    brandBadge.textContent = brandLabel(productBrands[0]);
    thumb.appendChild(brandBadge);
  }

  let dots = null;
  if (images.length > 1) {
    dots = document.createElement('div');
    dots.className = 'thumb-dots';
    images.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'thumb-dot' + (i === 0 ? ' active' : '');
      dots.appendChild(dot);
    });
    thumb.appendChild(dots);
  }

  function updateImage(newIndex) {
    imgIndex = (newIndex + images.length) % images.length;
    img.src = images[imgIndex];
    if (dots) {
      dots.querySelectorAll('.thumb-dot').forEach((d, i) => d.classList.toggle('active', i === imgIndex));
    }
  }

  if (images.length > 1) {
    let touchStartX = 0, touchStartY = 0, moved = false, suppressClick = false;
    thumb.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      moved = false;
    }, { passive: true });
    thumb.addEventListener('touchmove', (e) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > 8 && dx > dy) moved = true;
    }, { passive: true });
    thumb.addEventListener('touchend', (e) => {
      if (!moved) return;
      suppressClick = true;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 30) {
        if (dx < 0) updateImage(imgIndex + 1);
        else updateImage(imgIndex - 1);
      }
      setTimeout(() => { suppressClick = false; }, 50);
    });
    thumb.addEventListener('click', (e) => {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
      goToProduct(product.id);
    });
  } else {
    thumb.addEventListener('click', () => goToProduct(product.id));
  }

  const info = document.createElement('div');
  info.className = 'product-info';
  info.innerHTML = `
    <h3>${product.name}</h3>
    <div class="product-price">${product.price} ${product.currency}</div>
    <a href="#" class="buy-btn" onclick="trackClick('${product.id}', '${product.buyLink}'); return false;">קנה עכשיו</a>`;

  card.appendChild(thumb);
  card.appendChild(info);
  return card;
}

/* מציג את המוצרים בדף הבית: כאשר הקטגוריה הנבחרת היא "הכל" - המוצרים מחולקים
   לסקציות לפי קטגוריה (כל קטגוריה עם כותרת ורשת משלה). כאשר נבחרה קטגוריה
   ספציפית - מוצגת רשת שטוחה רגילה, כמו קודם. */
function renderProducts(category, brands = []) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  grid.classList.remove('grouped-view');

  let filtered = category === 'all' ? productsData : productsData.filter(p => p.category === category);
  if (brands && brands.length) {
    filtered = filtered.filter(p => getProductBrands(p).some(b => brands.includes(b)));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state">לא נמצאו מוצרים התואמים את הסינון שנבחר.</p>';
    return;
  }

  if (category === 'all') {
    grid.classList.add('grouped-view');

    const groups = {};
    filtered.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });

    const definedOrder = Object.keys(categoryNames).filter((k) => k !== 'all');
    const orderedCats = definedOrder.filter((c) => groups[c] && groups[c].length);
    Object.keys(groups).forEach((c) => { if (!orderedCats.includes(c)) orderedCats.push(c); });

    orderedCats.forEach((cat) => {
      const section = document.createElement('section');
      section.className = 'category-section';

      const title = document.createElement('h2');
      title.className = 'category-section-title';
      title.textContent = categoryNames[cat] || cat;

      const innerGrid = document.createElement('div');
      innerGrid.className = 'category-products-grid';
      groups[cat].forEach((product) => innerGrid.appendChild(buildProductCard(product)));

      section.appendChild(title);
      section.appendChild(innerGrid);
      grid.appendChild(section);
    });
  } else {
    filtered.forEach((product) => grid.appendChild(buildProductCard(product)));
  }
}

function goToProduct(id) { window.location.href = `product.html?id=${id}`; }

function trackClick(productId, buyLink) {
  console.log('Click tracked for product:', productId);
  window.open(buyLink, '_blank');
}

function initProductPage() {
  const container = document.getElementById('product-container');
  if (!container) return;
  loadProduct();
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('product-container');
  try {
    const res = await fetch('products.json');
    const products = await res.json();
    const product = products.find(p => p.id === id);

    if (!product) {
      container.innerHTML = '<p style="padding:20px;">המוצר לא נמצא</p>';
      return;
    }

    const images = buildProductImages(product);
    document.title = product.name + ' - עולם המותגים';

    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
      breadcrumb.innerHTML = `
        <a href="index.html">קטלוג</a> &nbsp;\u203a&nbsp;
        <a href="index.html?category=${product.category}">${categoryNames[product.category] || ''}</a> &nbsp;\u203a&nbsp;
        <span>${product.name}</span>`;
    }

    const hasMultiple = images.length > 1;

    container.innerHTML = `
      <div class="gallery">
        <div class="gallery-main">
          ${hasMultiple ? `<button type="button" class="gallery-arrow gallery-arrow-prev" id="gallery-prev" aria-label="תמונה קודמת">&#8250;</button>` : ''}
          <img id="main-image" src="${images[0]}" alt="${product.name}">
          ${hasMultiple ? `<button type="button" class="gallery-arrow gallery-arrow-next" id="gallery-next" aria-label="תמונה הבאה">&#8249;</button>` : ''}
          <span class="zoom-hint">🔍 לחץ להגדלה</span>
        </div>
        <div class="gallery-thumbs">
          ${images.map((img, i) => `<img src="${img}" data-index="${i}" class="${i === 0 ? 'active-thumb' : ''}">`).join('')}
        </div>
      </div>
      <div class="product-details">
        <h2>${product.name}</h2>
        <div class="product-price">${product.price} ${product.currency}</div>
        <p>${product.description}</p>
        <a href="#" class="buy-btn" onclick="trackClick('${product.id}', '${product.buyLink}'); return false;">קנה עכשיו</a>
      </div>`;

    initProductGallery(images, product.name);
  } catch (err) {
    container.innerHTML = '<p class="empty-state">שגיאה בטעינת המוצר. נסה לרענן את הדף.</p>';
    console.error(err);
  }
}

/* ניהול הגלריה בדף המוצר: מעבר בין תמונות בלחיצה על חצים בשני צידי התמונה,
   או בהחלקה (swipe) ימינה/שמאלה על התמונה הראשית - וגם קליק על התמונות הקטנות. */
function initProductGallery(images, productName) {
  let currentIndex = 0;
  const mainImg = document.getElementById('main-image');
  const galleryMain = document.querySelector('.gallery-main');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  const thumbs = document.querySelectorAll('.gallery-thumbs img');
  if (!mainImg || !galleryMain) return;

  function showImage(index) {
    currentIndex = (index + images.length) % images.length;
    mainImg.src = images[currentIndex];
    mainImg.alt = productName || '';
    thumbs.forEach((t) => t.classList.toggle('active-thumb', Number(t.dataset.index) === currentIndex));
  }

  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

  thumbs.forEach((t) => {
    t.addEventListener('click', () => showImage(Number(t.dataset.index)));
  });

  let touchStartX = 0, touchStartY = 0, touchMoved = false;
  galleryMain.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
  }, { passive: true });
  galleryMain.addEventListener('touchmove', (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 10 && dx > dy) touchMoved = true;
  }, { passive: true });
  galleryMain.addEventListener('touchend', (e) => {
    if (!touchMoved) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) showImage(currentIndex + 1);
      else showImage(currentIndex - 1);
    }
  });

  mainImg.addEventListener('click', () => {
    if (touchMoved) { touchMoved = false; return; }
    openLightbox(mainImg.src, productName);
  });
}

function initLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  if (!overlay) return;
  const img = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const fullscreenBtn = document.getElementById('lightbox-fullscreen');
  let scale = 1, posX = 0, posY = 0, isDragging = false, startX = 0, startY = 0, lastTouchDist = null, lastTapTime = 0;

  function applyTransform() {
    img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    img.classList.toggle('zoomed', scale > 1);
  }
  function resetTransform() { scale = 1; posX = 0; posY = 0; applyTransform(); }

  window.openLightbox = function (src, alt) {
    img.src = src; img.alt = alt || ''; resetTransform();
    overlay.classList.add('open'); document.body.style.overflow = 'hidden';
  };
  function closeLightbox() {
    overlay.classList.remove('open'); document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen();
  }

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox(); });
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) overlay.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen();
  });

  img.addEventListener('dblclick', () => { scale = scale > 1 ? 1 : 2.2; posX = 0; posY = 0; applyTransform(); });
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale += e.deltaY < 0 ? 0.15 : -0.15;
    scale = Math.min(Math.max(scale, 1), 4);
    if (scale === 1) { posX = 0; posY = 0; }
    applyTransform();
  }, { passive: false });

  img.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true; img.classList.add('dragging');
    startX = e.clientX - posX; startY = e.clientY - posY;
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    posX = e.clientX - startX; posY = e.clientY - startY; applyTransform();
  });
  window.addEventListener('mouseup', () => { isDragging = false; img.classList.remove('dragging'); });

  img.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) { lastTouchDist = getTouchDist(e.touches); }
    else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 300) { scale = scale > 1 ? 1 : 2.2; posX = 0; posY = 0; applyTransform(); }
      lastTapTime = now;
      if (scale > 1) { isDragging = true; startX = e.touches[0].clientX - posX; startY = e.touches[0].clientY - posY; }
    }
  });
  img.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      if (lastTouchDist) { const delta = (dist - lastTouchDist) * 0.01; scale = Math.min(Math.max(scale + delta, 1), 4); applyTransform(); }
      lastTouchDist = dist;
    } else if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      posX = e.touches[0].clientX - startX; posY = e.touches[0].clientY - startY; applyTransform();
    }
  }, { passive: false });
  img.addEventListener('touchend', () => { lastTouchDist = null; isDragging = false; });

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    if (!name || !email || !message) { status.textContent = 'נא למלא את כל השדות.'; return; }
    const subject = encodeURIComponent(`פנייה חדשה מהאתר מאת ${name}`);
    const body = encodeURIComponent(`שם: ${name}\nאימייל: ${email}\n\nהודעה:\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    status.textContent = 'נפתח עבורך אימייל עם הפנייה. שלח אותו כדי שנקבל את ההודעה שלך.';
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDrawer();
  initStickyBar();
  initCatalogPage();
  initProductPage();
  initLightbox();
  initContactForm();
});
