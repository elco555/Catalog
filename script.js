const CONTACT_EMAIL = 'lhnn8229@gmail.com';

const categoryNames = {
  all: 'הכל',
  shoes: 'נעליים',
  bags: 'תיקים',
  clothes: 'בגדים',
  watches: 'שעונים'
};

let productsData = [];

/* ===================================================
   1. תפריט קטגוריות (המבורגר + Drawer) - פועל בכל העמודים
=================================================== */
function initDrawer() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('category-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerClose = document.getElementById('drawer-close');

  if (!hamburgerBtn || !drawer || !drawerOverlay) return;

  function openDrawer() {
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
    hamburgerBtn.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const grid = document.getElementById('products-grid');
      const category = link.dataset.category;
      if (grid) {
        // אנחנו כבר בעמוד הקטלוג - נסנן במקום לנווט מחדש
        e.preventDefault();
        document.querySelectorAll('.drawer-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        renderProducts(category);
        closeDrawer();
        const url = new URL(window.location);
        url.searchParams.set('category', category);
        window.history.replaceState({}, '', url);
      }
      // בכל עמוד אחר - הקישור ינווט ל-index.html?category=... כברירת מחדל
    });
  });

  // סגירה עם מקש Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}

/* ===================================================
   2. עמוד הקטלוג הראשי (index.html)
=================================================== */
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
    const initialCategory = params.get('category') || 'all';

    document.querySelectorAll('.drawer-link').forEach(l => {
      l.classList.toggle('active', l.dataset.category === initialCategory);
    });

    renderProducts(initialCategory);
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">שגיאה בטעינת המוצרים. נסה לרענן את הדף.</p>';
    console.error(err);
  }
}

function showSkeleton() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-img"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line" style="width:40%"></div>
    `;
    grid.appendChild(skeleton);
  }
}

function renderProducts(category) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  const filtered = category === 'all'
    ? productsData
    : productsData.filter(p => p.category === category);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state">לא נמצאו מוצרים בקטגוריה זו.</p>';
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-thumb" onclick="goToProduct('${product.id}')">
        <img src="${product.images[0]}" alt="${product.name}">
        <span class="product-badge">${categoryNames[product.category] || ''}</span>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-price">${product.price} ${product.currency}</div>
        <a href="#" class="buy-btn" onclick="trackClick('${product.id}', '${product.buyLink}'); return false;">קנה עכשיו</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

// מעקב קליקים - כאן אפשר לחבר Google Analytics / Facebook Pixel
function trackClick(productId, buyLink) {
  console.log('Click tracked for product:', productId);

  // דוגמה לחיבור Google Analytics (gtag) - יש להסיר את ההערה לאחר התקנת GA
  // if (typeof gtag === 'function') {
  //   gtag('event', 'buy_click', { 'product_id': productId });
  // }

  window.open(buyLink, '_blank');
}

/* ===================================================
   3. עמוד מוצר בודד (product.html)
=================================================== */
function initProductPage() {
  const container = document.getElementById('product-container');
  if (!container) return;

  loadProduct();
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const res = await fetch('products.json');
  const products = await res.json();
  const product = products.find(p => p.id === id);

  const container = document.getElementById('product-container');

  if (!product) {
    container.innerHTML = '<p style="padding:20px;">המוצר לא נמצא</p>';
    return;
  }

  document.title = product.name + ' - עולם המותגים';

  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="index.html">עולם המותגים</a>
      &nbsp;\u203a&nbsp;
      <a href="index.html?category=${product.category}">${categoryNames[product.category] || ''}</a>
      &nbsp;\u203a&nbsp;
      <span>${product.name}</span>
    `;
  }

  container.innerHTML = `
    <div class="gallery">
      <div class="gallery-main">
        <img id="main-image" src="${product.images[0]}" alt="${product.name}">
        <span class="zoom-hint">🔍 לחץ להגדלה</span>
      </div>
      <div class="gallery-thumbs">
        ${product.images.map((img, i) => `<img src="${img}" class="${i === 0 ? 'active-thumb' : ''}" onclick="changeMainImage('${img}', this)">`).join('')}
      </div>
    </div>
    <div class="product-details">
      <h2>${product.name}</h2>
      <div class="product-price">${product.price} ${product.currency}</div>
      <p>${product.description}</p>
      <a href="#" class="buy-btn" onclick="trackClick('${product.id}', '${product.buyLink}'); return false;">קנה עכשיו</a>
    </div>
  `;

  document.getElementById('main-image').addEventListener('click', () => {
    openLightbox(document.getElementById('main-image').src, product.name);
  });
}

function changeMainImage(src, thumb) {
  document.getElementById('main-image').src = src;
  document.querySelectorAll('.gallery-thumbs img').forEach(t => t.classList.remove('active-thumb'));
  thumb.classList.add('active-thumb');
}

/* ===================================================
   4. Lightbox - תצוגת תמונה במסך מלא עם זום
=================================================== */
function initLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  if (!overlay) return;

  const img = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const fullscreenBtn = document.getElementById('lightbox-fullscreen');

  let scale = 1, posX = 0, posY = 0;
  let isDragging = false, startX = 0, startY = 0;
  let lastTouchDist = null;
  let lastTapTime = 0;

  function applyTransform() {
    img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    img.classList.toggle('zoomed', scale > 1);
  }

  function resetTransform() {
    scale = 1; posX = 0; posY = 0;
    applyTransform();
  }

  window.openLightbox = function (src, alt) {
    img.src = src;
    img.alt = alt || '';
    resetTransform();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeLightbox() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen();
  }

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox();
  });

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      overlay.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });

  // לחיצה כפולה (דסקטופ) - זום פנימה/יציאה
  img.addEventListener('dblclick', () => {
    scale = scale > 1 ? 1 : 2.2;
    posX = 0; posY = 0;
    applyTransform();
  });

  // גלגלת עכבר - זום
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale += e.deltaY < 0 ? 0.15 : -0.15;
    scale = Math.min(Math.max(scale, 1), 4);
    if (scale === 1) { posX = 0; posY = 0; }
    applyTransform();
  }, { passive: false });

  // גרירה (Pan) בעכבר כשמוגדל
  img.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true;
    img.classList.add('dragging');
    startX = e.clientX - posX;
    startY = e.clientY - posY;
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    img.classList.remove('dragging');
  });

  // מגע: פינץ' זום + גרירה + הקשה כפולה
  img.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lastTouchDist = getTouchDist(e.touches);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        scale = scale > 1 ? 1 : 2.2;
        posX = 0; posY = 0;
        applyTransform();
      }
      lastTapTime = now;
      if (scale > 1) {
        isDragging = true;
        startX = e.touches[0].clientX - posX;
        startY = e.touches[0].clientY - posY;
      }
    }
  });

  img.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      if (lastTouchDist) {
        const delta = (dist - lastTouchDist) * 0.01;
        scale = Math.min(Math.max(scale + delta, 1), 4);
        applyTransform();
      }
      lastTouchDist = dist;
    } else if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      posX = e.touches[0].clientX - startX;
      posY = e.touches[0].clientY - startY;
      applyTransform();
    }
  }, { passive: false });

  img.addEventListener('touchend', () => {
    lastTouchDist = null;
    isDragging = false;
  });

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/* ===================================================
   5. עמוד אודות / צור קשר (about.html)
=================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('form-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      status.textContent = 'נא למלא את כל השדות.';
      return;
    }

    const subject = encodeURIComponent(`פנייה חדשה מהאתר מאת ${name}`);
    const body = encodeURIComponent(`שם: ${name}\nאימייל: ${email}\n\nהודעה:\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    status.textContent = 'נפתח עבורך אימייל עם הפנייה. שלח אותו כדי שנקבל את ההודעה שלך.';
    form.reset();
  });
}

/* ===================================================
   אתחול כללי
=================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initDrawer();
  initCatalogPage();
  initProductPage();
  initLightbox();
  initContactForm();
});
