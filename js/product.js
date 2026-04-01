/* ============================================================
   Neo Fertilizantes — product.js
   Dynamic product detail page loaded via ?id= URL param
   ============================================================ */

'use strict';

const WA_NUMBER = '5533999549873';

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    showError('Produto não encontrado. <a href="catalogo.html">Voltar ao catálogo</a>');
    return;
  }

  try {
    const res = await fetch('data/products.json');
    const data = await res.json();

    const product = data.products.find(p => p.id === productId);

    if (!product) {
      showError(`Produto "<strong>${productId}</strong>" não encontrado. <a href="catalogo.html">Ver catálogo</a>`);
      return;
    }

    renderProduct(product);
    renderRelated(product, data.products);
    updatePageMeta(product);

  } catch (err) {
    console.error('Failed to load product:', err);
    showError('Erro ao carregar o produto. <a href="catalogo.html">Voltar ao catálogo</a>');
  }
}

/* ── Meta Update ── */
function updatePageMeta(product) {
  const title = `${product.name}${product.variant ? ' ' + product.variant : ''} — Neo Fertilizantes`;
  document.title = title;
  const metaDesc = document.getElementById('pageDesc');
  if (metaDesc) {
    metaDesc.content = `${product.name} ${product.variant || ''} — ${product.brand}. ${product.active_ingredient || ''} Disponível na Neo Fertilizantes, Manhuaçu MG.`;
  }
}

/* ── Product Render ── */
function renderProduct(product) {
  // Breadcrumb
  const breadCat = document.getElementById('breadcrumbCategory');
  const breadProd = document.getElementById('breadcrumbProduct');

  if (breadCat) {
    const catParam = encodeURIComponent(product.category);
    breadCat.innerHTML = `<a href="catalogo.html?categoria=${catParam}" style="color:var(--text-secondary);transition:color var(--t-fast)" onmouseover="this.style.color='var(--neo-cyan)'" onmouseout="this.style.color='var(--text-secondary)'">${product.category}</a>`;
  }
  if (breadProd) breadProd.textContent = product.name;

  // Gallery
  const gallery = document.getElementById('productGallery');
  if (gallery) {
    if (product.image) {
      gallery.innerHTML = `
        <img src="${product.image}" alt="${product.name} ${product.variant || ''}"
             class="product-gallery-img"
             onerror="this.style.display='none';document.getElementById('galleryFallback').style.display='flex'">
        <div id="galleryFallback" class="product-gallery-placeholder" style="display:none">
          ${placeholderSVG(product.brand)}
        </div>`;
    } else {
      gallery.innerHTML = `
        <div class="product-gallery-placeholder">
          ${placeholderSVG(product.brand)}
        </div>`;
    }
  }

  // Info panel
  const info = document.getElementById('productInfo');
  if (!info) return;

  const catColor = getCategoryColor(product.category);
  const packLabel = getPackingLabel(product.packaging_type);

  info.innerHTML = `
    <!-- Brand + Category tag -->
    <div class="product-brand-tag">
      <span class="badge" style="background:${catColor.bg};color:${catColor.text};border-color:${catColor.border}">
        ${product.subcategory || product.category}
      </span>
      <span class="badge badge-neutral">${product.brand}</span>
      <span class="badge badge-neutral" style="font-family:var(--font-body);letter-spacing:0;text-transform:none">
        Cód. ${product.code}
      </span>
    </div>

    <!-- Title -->
    <h1 class="product-title">${product.name}</h1>
    ${product.variant ? `<div class="product-variant">${product.variant}</div>` : ''}

    <!-- Active Ingredient -->
    ${product.active_ingredient ? `
      <div class="product-active-ingredient">
        <div class="product-active-label">Princípio Ativo</div>
        <div class="product-active-value">${product.active_ingredient}</div>
      </div>` : ''
    }

    <!-- Specs grid -->
    <div class="product-specs">
      ${product.category ? specCard('Categoria', product.category) : ''}
      ${product.subcategory ? specCard('Subcategoria', product.subcategory) : ''}
      ${product.packaging_size ? specCard('Volume / Peso', product.packaging_size) : ''}
      ${packLabel ? specCard('Embalagem', packLabel) : ''}
    </div>

    <!-- Actions -->
    <div class="product-actions">
      <a href="${buildWaLink(product)}"
         class="btn btn-primary btn-lg" target="_blank" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Pedir via WhatsApp
      </a>

      ${product.leaflet_url ? `
        <a href="${product.leaflet_url}" class="btn btn-ghost btn-lg" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Ver Bula
        </a>` : ''
      }
    </div>

    <!-- Share / back -->
    <div style="display:flex;align-items:center;gap:var(--space-md);margin-top:var(--space-xl);padding-top:var(--space-lg);border-top:1px solid var(--border-subtle)">
      <a href="catalogo.html?categoria=${encodeURIComponent(product.category)}" class="btn btn-icon" title="Voltar ao catálogo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </a>
      <span style="font-size:0.8rem;color:var(--text-muted)">Ver mais produtos de ${product.category}</span>
    </div>
  `;

  // Trigger reveal animations
  requestAnimationFrame(() => {
    document.querySelectorAll('#productInfo .reveal, #productGallery .reveal').forEach(el => {
      el.classList.add('visible');
    });
  });
}

/* ── Related Products ── */
function renderRelated(product, allProducts) {
  const related = allProducts
    .filter(p => p.id !== product.id && (
      p.brand === product.brand ||
      p.category === product.category
    ))
    .slice(0, 4);

  const container = document.getElementById('relatedProducts');
  if (!container || !related.length) return;

  container.innerHTML = '';

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  related.forEach((p, i) => {
    const card = buildProductCard(p, i * 0.07);
    container.appendChild(card);
    observer.observe(card);
  });
}

/* ── Helpers ── */
function specCard(label, value) {
  return `
    <div class="spec-item">
      <div class="spec-label">${label}</div>
      <div class="spec-value">${value}</div>
    </div>`;
}

function placeholderSVG(brandName) {
  return `
    <div style="text-align:center;color:var(--text-muted)">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.15">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p style="font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;margin-top:12px;opacity:0.4">${brandName || 'Produto'}</p>
    </div>`;
}

function buildWaLink(product) {
  const msg = `Olá! Tenho interesse no produto:

*${product.name}${product.variant ? ' ' + product.variant : ''}*
Marca: ${product.brand}
${product.packaging_size ? `Embalagem: ${product.packaging_size}` : ''}
${product.active_ingredient ? `P.A.: ${product.active_ingredient}` : ''}

Pode me informar disponibilidade e preço?`;

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function getPackingLabel(type) {
  const map = {
    'GL': 'Galão', 'LT': 'Litro', 'BD': 'Balde', 'SC': 'Saco',
    'PCT': 'Pacote', 'PC': 'Pacote', 'IBD': 'IBC', 'KG': 'Kg',
    'UND': 'Unidade', 'PAR': 'Par', 'MT': 'Metro', 'Bag': 'Big Bag',
    'FRASCO': 'Frasco', 'ENVELOPE': 'Envelope',
  };
  return map[type] || type || '';
}

function getCategoryColor(category) {
  const map = {
    'Defensivos':              { bg: 'rgba(255,80,80,0.1)',   text: '#FF5050', border: 'rgba(255,80,80,0.2)' },
    'Fertilizantes':           { bg: 'rgba(0,200,120,0.1)',   text: '#00C878', border: 'rgba(0,200,120,0.2)' },
    'Jardinagem/Uso Agrícola': { bg: 'rgba(255,180,0,0.1)',   text: '#FFB400', border: 'rgba(255,180,0,0.2)' },
    'Produtos para colheita':  { bg: 'rgba(150,100,255,0.1)', text: '#9664FF', border: 'rgba(150,100,255,0.2)' },
  };
  return map[category] || { bg: 'rgba(0,232,255,0.1)', text: '#00E8FF', border: 'rgba(0,232,255,0.2)' };
}

function showError(html) {
  const info = document.getElementById('productInfo');
  if (info) {
    info.innerHTML = `
      <div style="padding:var(--space-xl);text-align:center;color:var(--text-secondary)">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" style="margin:0 auto var(--space-lg)">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-size:1rem">${html}</p>
      </div>`;
  }
}

// Start
loadProduct();
