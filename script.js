let productsData = [];

const categoryNames = {
  all: 'הכל',
  shoes: 'נעליים',
  bags: 'תיקים',
  watches: 'שעונים'
};

async function loadProducts() {
  showSkeleton();
  try {
    const res = await fetch('products.json');
    productsData = await res.json();
    renderProducts('all');
  } catch (err) {
    const grid = document.getElementById('products-grid');
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

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.category);
    });
  });
});
