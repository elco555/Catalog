let productsData = [];

async function loadProducts() {
  const res = await fetch('products.json');
  productsData = await res.json();
  renderProducts('all');
}

function renderProducts(category) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  const filtered = category === 'all'
    ? productsData
    : productsData.filter(p => p.category === category);

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.images[0]}" alt="${product.name}" onclick="goToProduct('${product.id}')">
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
