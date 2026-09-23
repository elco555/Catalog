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
   2. מוצרים נוספים שעשויים לעניין אותך - רק בדף מוצר
   דורש קונטיינר: <div id="related-products"></div>
   (מציב אותו אחרי ה-div עם id="product-container")
------------------------------------------------------ */
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

    const related = products
      .filter((p) => p.id !== currentId && p.category === current.category)
      .slice(0, 8);

    if (related.length === 0) return;

    const buildImg = (product) =>
      typeof window.buildProductImages === 'function'
        ? window.buildProductImages(product)[0]
        : `${product.imageFolder}/${product.imageCode}-1.jpg`;

    container.innerHTML = `
      <h2 class="related-title">מוצרים נוספים שעשויים לעניין אותך</h2>
      <div class="related-scroller">
        ${related
          .map(
            (p) => `
          <div class="related-card">
            <div class="product-card">
              <div class="product-thumb" onclick="goToProduct('${p.id}')">
                <img src="${buildImg(p)}" alt="${p.name}" loading="lazy">
              </div>
              <div class="product-info">
                <h3>${p.name}</h3>
                <div class="product-price">${p.price} ${p.currency || '₪'}</div>
                <a href="#" class="buy-btn" onclick="trackClick('${p.id}', '${p.buyLink}'); return false;">קנייה מהירה</a>
              </div>
            </div>
          </div>`
          )
          .join('')}
      </div>
    `;
  } catch (err) {
    console.error('שגיאה בטעינת מוצרים נוספים:', err);
  }
}

/* -----------------------------------------------------
   3. אפקט "מתכווץ בגלילה" עדין להדר בדף הבית בלבד
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
  initRelatedProducts();
  initHomeHeaderShrink();
});
