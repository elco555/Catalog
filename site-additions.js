/* מיפוי שמות קטגוריות - נלקח ישירות מ-window.categoryNames שנחשף ב-script.js
   כך שאין יותר שני מקורות נפרדים שעלולים להתבדר זה מזה */
const CATEGORY_LABELS = window.categoryNames || {
  shoes: 'נעליים',
  bags: 'תיקים',
  clothes: 'בגדים',
  watches: 'שעונים',
  electronics: 'אלקטרוניקה',
  jewelry: 'תכשיטים',
  Hats: 'כובעים',
  Sunglasses: 'משקפי שמש',
  Belts: 'חגורות',
  Scarves: 'צעיפים',
};

function brandLabelOf(brandKey) {
  const labels = window.BRAND_LABELS || {};
  return labels[brandKey] || brandKey;
}

function productBrandsOf(product) {
  if (typeof window.getProductBrands === 'function') return window.getProductBrands(product);
  if (!product || !product.brand) return [];
  return String(product.brand).split(',').map((b) => b.trim()).filter(Boolean);
}

/* -----------------------------------------------------
   1. Story-Carousel קטגוריות בעיגולים - רק בדף הבית
   דורש קונטיינר: <div class="story-carousel" id="story-carousel"></div>
------------------------------------------------------ */
async function initCategoryCarousel() {
  const wrap = document.getElementById('story-carousel');
  if (!wrap) return;

  try {
    const res = await fetch('products.json');
    const products = await res.json();

    const seen = new Set();
    const categories = [];
    products.forEach((p) => {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        categories.push(p);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const activeCategory = params.get('category') || 'all';

    const buildImg = (product) =>
      typeof window.buildProductImages === 'function'
        ? window.buildProductImages(product)[0]
        : `${product.imageFolder}/${product.imageCode}-1.jpg`;

    const allCircle = `
      <a class="story-item ${activeCategory === 'all' ? 'active' : ''}" href="index.html?category=all">
        <div class="story-ring"><img src="images/logo.png" alt="הכל"></div>
        <span class="story-label">הכל</span>
      </a>`;

    const circles = categories
      .map((p) => {
        const label = CATEGORY_LABELS[p.category] || p.category;
        const isActive = activeCategory === p.category;
        return `
        <a class="story-item ${isActive ? 'active' : ''}" href="index.html?category=${encodeURIComponent(p.category)}">
          <div class="story-ring"><img src="${buildImg(p)}" alt="${label}"></div>
          <span class="story-label">${label}</span>
        </a>`;
      })
      .join('');

    wrap.innerHTML = allCircle + circles;
  } catch (err) {
    console.error('שגיאה בטעינת קרוסלת הקטגוריות:', err);
  }
}

/* -----------------------------------------------------
   2. סינון לפי מותג (Brand Filter) - רק בדף הבית
   דורש קונטיינר: #brand-filter-toggle, #brand-filter-panel, #brand-filter-list
------------------------------------------------------ */
async function initBrandFilter() {
  const toggle = document.getElementById('brand-filter-toggle');
  const panel = document.getElementById('brand-filter-panel');
  const list = document.getElementById('brand-filter-list');
  const countEl = document.getElementById('brand-filter-count');
  const clearBtn = document.getElementById('brand-filter-clear');
  const applyBtn = document.getElementById('brand-filter-apply');
  if (!toggle || !panel || !list) return;

  let products = [];
  try {
    const res = await fetch('products.json');
    products = await res.json();
  } catch (err) {
    console.error('שגיאה בטעינת נתוני מותגים:', err);
    return;
  }

  const brandCounts = {};
  products.forEach((p) => {
    productBrandsOf(p).forEach((b) => {
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    });
  });

  const availableBrands = Object.keys(brandCounts)
    .filter((b) => brandCounts[b] > 0)
    .sort((a, b) => brandLabelOf(a).localeCompare(brandLabelOf(b), 'he'));

  if (availableBrands.length === 0) {
    toggle.style.display = 'none';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  let selected = (params.get('brand') || '').split(',').map((b) => b.trim()).filter(Boolean);

  function renderList() {
    list.innerHTML = availableBrands
      .map((brand) => {
        const label = brandLabelOf(brand);
        const checked = selected.includes(brand) ? 'checked' : '';
        return `
        <label class="brand-filter-item">
          <input type="checkbox" value="${brand}" ${checked}>
          <span class="brand-filter-item-label">${label}</span>
          <span class="brand-filter-item-count">${brandCounts[brand]}</span>
        </label>`;
      })
      .join('');
  }

  function updateToggleState() {
    if (selected.length) {
      countEl.textContent = String(selected.length);
      countEl.style.display = 'inline-flex';
      toggle.classList.add('has-selection');
    } else {
      countEl.textContent = '';
      countEl.style.display = 'none';
      toggle.classList.remove('has-selection');
    }
  }

  function openPanel() {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function applySelection() {
    if (typeof window.setActiveBrands === 'function') {
      window.setActiveBrands(selected.slice());
    }
    updateToggleState();
  }

  renderList();
  updateToggleState();

  list.addEventListener('change', (e) => {
    const target = e.target;
    if (target && target.type === 'checkbox') {
      const value = target.value;
      if (target.checked) {
        if (!selected.includes(value)) selected.push(value);
      } else {
        selected = selected.filter((b) => b !== value);
      }
    }
  });

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('open')) closePanel();
    else openPanel();
  });

  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !toggle.contains(e.target)) {
      closePanel();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selected = [];
      renderList();
      applySelection();
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applySelection();
      closePanel();
    });
  }
}

/* -----------------------------------------------------
   3. מוצרים נוספים שעשויים לעניין אותך - רק בדף מוצר
   דורש קונטיינר: <div id="related-products"></div>
   מוצג כרשת אנכית (grid) שנגללת למטה, מבוססת על אותה קטגוריה
   או אותו מותג של המוצר הנוכחי (OR), עם כפתור "טען עוד".
------------------------------------------------------ */
const RELATED_INITIAL_COUNT = 8;
const RELATED_STEP = 8;

async function initRelatedProducts() {
  const container = document.getElementById('related-products');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const currentId = params.get('id');
  if (!currentId) return;

  try {
    const res = await fetch('products.json');
    const products = await res.json();
    const current = products.find((p) => p.id === currentId);
    if (!current) return;

    const currentBrands = productBrandsOf(current);

    const related = products.filter((p) => {
      if (p.id === currentId) return false;
      const sameCategory = p.category === current.category;
      const sameBrand = currentBrands.length > 0 && productBrandsOf(p).some((b) => currentBrands.includes(b));
      return sameCategory || sameBrand;
    });

    const buildImg = (product) =>
      typeof window.buildProductImages === 'function'
        ? window.buildProductImages(product)[0]
        : `${product.imageFolder}/${product.imageCode}-1.jpg`;

    if (related.length === 0) {
      container.innerHTML = `
        <h2 class="related-title">מוצרים נוספים שעשויים לעניין אותך</h2>
        <p class="related-empty">לא נמצאו מוצרים נוספים בקטגוריה או במותג הזה כרגע.</p>`;
      return;
    }

    let visibleCount = Math.min(RELATED_INITIAL_COUNT, related.length);

    function cardHTML(p) {
      const brands = productBrandsOf(p);
      return `
        <div class="related-card">
          <div class="product-card">
            <div class="product-thumb" onclick="goToProduct('${p.id}')">
              <img src="${buildImg(p)}" alt="${p.name}" loading="lazy">
              ${brands.length ? `<span class="product-badge brand-badge">${brandLabelOf(brands[0])}</span>` : ''}
            </div>
            <div class="product-info">
              <h3>${p.name}</h3>
              <div class="product-price">${p.price} ${p.currency || '₪'}</div>
              <a href="#" class="buy-btn" onclick="trackClick('${p.id}', '${p.buyLink}'); return false;">קנייה מהירה</a>
            </div>
          </div>
        </div>`;
    }

    function render() {
      const shown = related.slice(0, visibleCount);
      const hasMore = visibleCount < related.length;
      container.innerHTML = `
        <h2 class="related-title">מוצרים נוספים שעשויים לעניין אותך</h2>
        <div class="related-grid">
          ${shown.map(cardHTML).join('')}
        </div>
        ${hasMore ? '<button type="button" class="related-load-more" id="related-load-more">טען עוד מוצרים</button>' : ''}
      `;
      const loadMoreBtn = document.getElementById('related-load-more');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          visibleCount = Math.min(visibleCount + RELATED_STEP, related.length);
          render();
        });
      }
    }

    render();
  } catch (err) {
    console.error('שגיאה בטעינת מוצרים נוספים:', err);
  }
}

/* -----------------------------------------------------
   4. אפקט "מתכווץ בגלילה" עדין להדר בדף הבית בלבד
   (מתווסף מעל האפקט header-fading הקיים, לא מחליף אותו)
------------------------------------------------------ */
function initHomeHeaderShrink() {
  if (!document.body.classList.contains('home-page')) return;
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('shrink', window.scrollY > 60);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCategoryCarousel();
  initBrandFilter();
  initRelatedProducts();
  initHomeHeaderShrink();
});
