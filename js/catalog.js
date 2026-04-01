/* ============================================================
   Neo Fertilizantes — catalog.js
   Client-side filtering, search, and rendering for catalogo.html
   ============================================================ */

'use strict';

let allProducts = [];
let allCategories = [];
let filteredProducts = [];

const searchInput      = document.getElementById('searchInput');
const categoryFilter   = document.getElementById('categoryFilter');
const subcategoryFilter = document.getElementById('subcategoryFilter');
const brandFilter      = document.getElementById('brandFilter');
const clearFiltersBtn  = document.getElementById('clearFilters');
const resultsCount     = document.getElementById('resultsCount');
const activeFiltersText = document.getElementById('activeFiltersText');
const productsGrid     = document.getElementById('productsGrid');
const gridViewBtn      = document.getElementById('gridViewBtn');
const listViewBtn      = document.getElementById('listViewBtn');
const quickChips       = document.querySelectorAll('[data-quick]');

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

/* ── Load & Init ── */
async function init() {
  try {
    const res = await fetch('data/products.json');
    const data = await res.json();
    allProducts = data.products;
    allCategories = data.categories;

    populateBrandFilter(allProducts);
    readUrlParams();
    applyFilters();
    bindEvents();

  } catch (err) {
    console.error('Failed to load products:', err);
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="catalog-empty">
          <p>Erro ao carregar os produtos. Por favor, tente novamente.</p>
        </div>`;
    }
  }
}

function populateBrandFilter(products) {
  const brands = [...new Set(products.map(p => p.brand))].sort();
  brands.forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand;
    opt.textContent = brand;
    brandFilter.appendChild(opt);
  });
}

function populateSubcategoryFilter(category) {
  subcategoryFilter.innerHTML = '<option value="">Subcategoria</option>';
  if (!category) return;

  const subs = [...new Set(
    allProducts
      .filter(p => p.category === category && p.subcategory)
      .map(p => p.subcategory)
  )].sort();

  subs.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    subcategoryFilter.appendChild(opt);
  });
}

/* ── URL Param Support ── */
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('categoria') || params.get('category') || '';
  const brand = params.get('marca') || params.get('brand') || '';
  const search = params.get('q') || '';

  if (cat) {
    categoryFilter.value = cat;
    populateSubcategoryFilter(cat);
    syncQuickChips(cat);
  }
  if (brand) brandFilter.value = brand;
  if (search) searchInput.value = search;
}

function updateUrlParams() {
  const params = new URLSearchParams();
  if (categoryFilter.value)    params.set('categoria', categoryFilter.value);
  if (subcategoryFilter.value) params.set('sub', subcategoryFilter.value);
  if (brandFilter.value)       params.set('marca', brandFilter.value);
  if (searchInput.value)       params.set('q', searchInput.value);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  history.replaceState(null, '', newUrl);
}

/* ── Filter Logic ── */
function applyFilters() {
  const search   = searchInput.value.toLowerCase().trim();
  const category = categoryFilter.value;
  const subcat   = subcategoryFilter.value;
  const brand    = brandFilter.value;

  filteredProducts = allProducts.filter(p => {
    if (category && p.category !== category) return false;
    if (subcat && p.subcategory !== subcat) return false;
    if (brand && p.brand !== brand) return false;
    if (search) {
      const haystack = [p.name, p.brand, p.variant, p.category,
        p.subcategory, p.active_ingredient, p.code].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  renderProducts();
  updateResultsInfo();
  updateClearButton();
  updateUrlParams();
}

/* ── Rendering ── */
function renderProducts() {
  if (!productsGrid) return;

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = `
      <div class="catalog-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2" style="margin:0 auto var(--space-lg)">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <h3 style="margin-bottom:var(--space-sm);font-size:1.1rem">Nenhum produto encontrado</h3>
        <p style="color:var(--text-muted);font-size:0.875rem">Tente ajustar os filtros ou termos de busca.</p>
        <button class="btn btn-ghost" onclick="clearAllFilters()" style="margin-top:var(--space-lg)">Limpar filtros</button>
      </div>`;
    return;
  }

  // Build fragment for performance
  const fragment = document.createDocumentFragment();

  filteredProducts.forEach((product, i) => {
    const card = buildProductCard(product, Math.min(i * 0.02, 0.3));
    fragment.appendChild(card);
  });

  productsGrid.innerHTML = '';
  productsGrid.appendChild(fragment);

  // Trigger reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  productsGrid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function updateResultsInfo() {
  if (resultsCount) resultsCount.textContent = filteredProducts.length;

  if (activeFiltersText) {
    const parts = [];
    if (categoryFilter.value) parts.push(categoryFilter.value);
    if (subcategoryFilter.value) parts.push(subcategoryFilter.value);
    if (brandFilter.value) parts.push(brandFilter.value);
    if (searchInput.value) parts.push(`"${searchInput.value}"`);

    activeFiltersText.textContent = parts.length
      ? ` em: ${parts.join(' › ')}`
      : '';
  }
}

function updateClearButton() {
  if (!clearFiltersBtn) return;
  const hasFilters = categoryFilter.value || subcategoryFilter.value ||
                     brandFilter.value || searchInput.value;
  clearFiltersBtn.style.display = hasFilters ? 'flex' : 'none';
}

function clearAllFilters() {
  searchInput.value = '';
  categoryFilter.value = '';
  subcategoryFilter.innerHTML = '<option value="">Subcategoria</option>';
  brandFilter.value = '';
  syncQuickChips('all');
  applyFilters();
}

window.clearAllFilters = clearAllFilters;

function syncQuickChips(value) {
  quickChips.forEach(chip => {
    const q = chip.dataset.quick;
    chip.classList.toggle('active', q === value || (value === '' && q === 'all'));
  });
}

/* ── Event Binding ── */
function bindEvents() {
  const debouncedFilter = debounce(applyFilters, 250);

  searchInput?.addEventListener('input', debouncedFilter);

  categoryFilter?.addEventListener('change', () => {
    populateSubcategoryFilter(categoryFilter.value);
    subcategoryFilter.value = '';
    syncQuickChips(categoryFilter.value || 'all');
    applyFilters();
  });

  subcategoryFilter?.addEventListener('change', applyFilters);
  brandFilter?.addEventListener('change', applyFilters);

  clearFiltersBtn?.addEventListener('click', clearAllFilters);

  // Quick chips
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.quick;
      categoryFilter.value = val === 'all' ? '' : val;
      populateSubcategoryFilter(categoryFilter.value);
      subcategoryFilter.value = '';
      syncQuickChips(val);
      applyFilters();
    });
  });

  // View toggle
  gridViewBtn?.addEventListener('click', () => {
    gridViewBtn.classList.add('active');
    listViewBtn?.classList.remove('active');
    if (productsGrid) {
      productsGrid.style.gridTemplateColumns = '';
      productsGrid.classList.remove('list-view');
    }
  });

  listViewBtn?.addEventListener('click', () => {
    listViewBtn.classList.add('active');
    gridViewBtn?.classList.remove('active');
    if (productsGrid) {
      productsGrid.style.gridTemplateColumns = '1fr';
      productsGrid.classList.add('list-view');
    }
  });
}

// Initialize
init();
