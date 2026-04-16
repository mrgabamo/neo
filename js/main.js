/* ============================================================
   Neo Fertilizantes — main.js
   Global functionality: nav, animations, scroll, homepage data
   ============================================================ */

'use strict';

/* ── Page Loader ── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('hidden');
  }, 800);
});

/* ── Navbar scroll behaviour ── */
const navbar = document.getElementById('navbar');
let lastScroll = 0;

if (navbar) {
  const onScroll = () => {
    const scrollY = window.scrollY;

    if (scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      // On the homepage (has hero section) keep transparent at top
      if (!document.querySelector('.hero')) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    lastScroll = scrollY;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ── Mobile Nav ── */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('active');
    hamburger.classList.toggle('active');
    if (isOpen) {
      mobileNav.style.display = 'none';
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      requestAnimationFrame(() => {
        mobileNav.classList.remove('open');
      });
    } else {
      mobileNav.style.display = 'flex';
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mobileNav.classList.add('open');
        });
      });
    }
  });
}

function closeMobileNav() {
  if (!hamburger || !mobileNav) return;
  hamburger.classList.remove('active');
  mobileNav.classList.remove('open');
  mobileNav.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => { mobileNav.style.display = 'none'; }, 400);
}

window.closeMobileNav = closeMobileNav;

/* ── Scroll Reveal Animations ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Stats Counter Animation ── */
function animateCounter(el, target, suffix = '') {
  const duration = 1800;
  const startTime = performance.now();
  const startVal = 0;

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(startVal + (target - startVal) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      if (!isNaN(target)) animateCounter(el, target, suffix);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => statsObserver.observe(el));

/* ── Product Card Builder ── */
function buildProductCard(product, animDelay = 0) {
  const card = document.createElement('a');
  card.href = `produto.html?id=${encodeURIComponent(product.id)}`;
  card.className = 'product-card reveal';
  if (animDelay) card.style.transitionDelay = `${animDelay}s`;

  const categoryColor = getCategoryColor(product.category);
  const packLabel = getPackagingLabel(product.packaging_type);

  card.innerHTML = `
    <div class="product-card-image">
      ${product.image
        ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
        : `<div class="product-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>${product.brand}</span>
           </div>`
      }
      <div class="product-card-badge">
        <span class="badge badge-primary" style="background:${categoryColor.bg};color:${categoryColor.text};border-color:${categoryColor.border}">
          ${product.subcategory || product.category}
        </span>
      </div>
    </div>
    <div class="product-card-body">
      <div class="product-card-brand">${product.brand}</div>
      <div class="product-card-name">${product.name}</div>
      <div class="product-card-variant">${[product.variant, product.packaging_size].filter(Boolean).join(' · ')}</div>
      <div class="product-card-meta">
        ${packLabel ? `<span class="badge badge-neutral">${packLabel}</span>` : ''}
        ${product.active_ingredient ? `<span class="badge badge-neutral" style="font-size:0.65rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${product.active_ingredient}">P.A.</span>` : ''}
      </div>
    </div>
    <div class="product-card-footer">
      <span class="product-card-link">
        Ver detalhes
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </span>
      ${product.leaflet_url
        ? `<a href="${product.leaflet_url}" target="_blank" rel="noopener" onclick="event.stopPropagation()"
             class="badge badge-primary" style="text-decoration:none" title="Ver bula">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
             Bula
           </a>`
        : ''
      }
    </div>
  `;

  return card;
}

function getCategoryColor(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('defensivo'))               return { bg: 'rgba(255,80,80,0.1)',   text: '#FF5050', border: 'rgba(255,80,80,0.2)' };
  if (c.includes('fertilizante'))            return { bg: 'rgba(0,200,120,0.1)',   text: '#00C878', border: 'rgba(0,200,120,0.2)' };
  if (c.includes('jardinage') || c.includes('agrícola') || c.includes('agricola')) return { bg: 'rgba(255,180,0,0.1)', text: '#FFB400', border: 'rgba(255,180,0,0.2)' };
  if (c.includes('colheita'))                return { bg: 'rgba(150,100,255,0.1)', text: '#9664FF', border: 'rgba(150,100,255,0.2)' };
  return { bg: 'rgba(0,232,255,0.1)', text: '#00E8FF', border: 'rgba(0,232,255,0.2)' };
}

function getPackagingLabel(type) {
  const map = {
    'GL': 'Galão', 'LT': 'Litro', 'BD': 'Balde', 'SC': 'Saco',
    'PCT': 'Pacote', 'PC': 'Pacote', 'IBD': 'IBC', 'KG': 'Kg',
    'UND': 'Unidade', 'PAR': 'Par', 'MT': 'Metro', 'Bag': 'Big Bag',
    'FRASCO': 'Frasco', 'ENVELOPE': 'Envelope',
  };
  return map[type] || type || '';
}

window.buildProductCard = buildProductCard;
window.getCategoryColor  = getCategoryColor;

/* ── Homepage: Load Featured Products ── */
async function loadHomepageData() {
  if (!document.getElementById('featuredProducts')) return;

  try {
    const res = await fetch('data/products.json?v=2');
    const data = await res.json();

    // Category counts
    const counts = {};
    data.products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

    const setCount = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${counts[key] || 0} produtos`;
    };
    setCount('count-defensivos',    'Defensivos');
    setCount('count-fertilizantes', 'Fertilizantes');
    setCount('count-equipamentos',  'Jardinagem/Uso Agrícola');
    setCount('count-colheita',      'Produtos para colheita');

    // Featured: 1 from each category + Neo brand items
    const featured = [];
    const cats = ['Defensivos', 'Fertilizantes', 'Jardinagem/Uso Agrícola', 'Produtos para colheita'];
    cats.forEach(cat => {
      const items = data.products.filter(p => p.category === cat);
      if (items.length) featured.push(items[Math.floor(Math.random() * Math.min(5, items.length))]);
    });

    const grid = document.getElementById('featuredProducts');
    if (grid) {
      grid.innerHTML = '';
      featured.forEach((p, i) => {
        const card = buildProductCard(p, i * 0.05);
        grid.appendChild(card);
        setTimeout(() => revealObserver.observe(card), 50);
      });
    }

    // Brands marquee
    loadBrandsMarquee(data.brands);

  } catch (err) {
    console.warn('Could not load products.json', err);
  }
}

function loadBrandsMarquee(brands) {
  const track = document.getElementById('brandsTrack');
  if (!track) return;

  // Duplicate for seamless loop
  const all = [...brands, ...brands];
  track.innerHTML = all.map(b => `
    <div class="brand-chip">${b.name}</div>
  `).join('');
}

loadHomepageData();

/* ── Smooth anchor scrolling ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
