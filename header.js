(function () {
  // ─── CSS ───────────────────────────────────────────────────────────────────
  const css = `
    /* Header */
    #header {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(10,10,10,0.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      transition: box-shadow 0.3s;
    }
    .header-inner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; max-width: 1200px; margin: 0 auto;
    }
    .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .logo-icon {
      width: 44px; height: 44px; background: #FFC300;
      border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .logo-icon svg { width: 22px; height: 22px; }
    .logo-text { display: flex; flex-direction: column; line-height: 1; }
    .logo-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .logo-sub { font-size: 9px; font-weight: 600; letter-spacing: 2px; color: #FFC300; text-transform: uppercase; }
    nav { display: flex; align-items: center; gap: 4px; }
    nav a {
      font-size: 14px; font-weight: 500; color: #b0b0b0;
      text-decoration: none; padding: 8px 16px; border-radius: 6px;
      transition: color 0.2s, background 0.2s;
    }
    nav a:hover, nav a.active { color: #fff; background: rgba(255,255,255,0.06); }
    nav a.active { color: #FFC300; }
    .header-icons { display: flex; align-items: center; gap: 6px; }
    .header-icon-btn {
      position: relative; display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 10px;
      color: #b0b0b0; text-decoration: none;
      transition: background 0.15s, color 0.15s; cursor: pointer;
    }
    .header-icon-btn:hover { background: rgba(255,195,0,0.12); color: #FFC300; }
    .cart-badge {
      position: absolute; top: 4px; right: 4px;
      background: #FFC300; color: #0A0A0A;
      font-size: 9px; font-weight: 800; line-height: 1;
      min-width: 16px; height: 16px; border-radius: 999px;
      display: flex; align-items: center; justify-content: center; padding: 0 3px;
    }
    .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 6px; }
    .hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: 0.3s; }
    .mobile-nav {
      display: none; flex-direction: column;
      background: #1a1a1a; border-top: 1px solid rgba(255,255,255,0.08);
    }
    .mobile-nav.open { display: flex; }
    .mobile-nav a {
      font-size: 15px; font-weight: 500; color: #b0b0b0;
      text-decoration: none; padding: 14px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.05); transition: color 0.2s;
    }
    .mobile-nav a:hover, .mobile-nav a.active { color: #fff; }
    @media (max-width: 768px) {
      nav { display: none; }
      .hamburger { display: flex; }
    }

    /* Cart Drawer */
    .cart-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.65);
      z-index: 900; opacity: 0; pointer-events: none;
      transition: opacity 0.3s; backdrop-filter: blur(3px);
    }
    .cart-overlay.open { opacity: 1; pointer-events: all; }
    .cart-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 95vw;
      background: #161616; border-left: 1px solid rgba(255,255,255,0.09);
      z-index: 901; display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
      box-shadow: -20px 0 60px rgba(0,0,0,0.5);
    }
    .cart-drawer.open { transform: translateX(0); }
    .cart-hd {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 24px 16px;
    }
    .cart-hd-title {
      font-size: 15px; font-weight: 800; letter-spacing: 1.5px;
      text-transform: uppercase; color: #fff; margin: 0;
    }
    .cart-hd-title span { color: #FFC300; margin-left: 6px; }
    .cart-close-btn {
      width: 34px; height: 34px; border-radius: 8px;
      background: rgba(255,255,255,0.07); border: none;
      color: #b0b0b0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .cart-close-btn:hover { background: rgba(255,195,0,0.15); color: #FFC300; }
    .cart-divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0 24px; }
    .cart-body { flex: 1; overflow-y: auto; padding: 16px 24px; }
    .cart-body::-webkit-scrollbar { width: 4px; }
    .cart-body::-webkit-scrollbar-thumb { background: rgba(255,195,0,0.3); border-radius: 4px; }
    .cart-empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 220px; gap: 14px; color: #666;
    }
    .cart-empty-state svg { opacity: 0.25; }
    .cart-empty-state p { font-size: 14px; }
    .cart-item {
      display: flex; gap: 14px; align-items: flex-start;
      padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .cart-item-img {
      width: 66px; height: 66px; border-radius: 10px;
      background: #222; overflow: hidden; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 28px;
    }
    .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
    .cart-item-info { flex: 1; min-width: 0; }
    .cart-item-name { font-size: 13px; font-weight: 600; color: #fff; margin: 0 0 4px; line-height: 1.35; }
    .cart-item-price { font-size: 14px; font-weight: 900; color: #FFC300; margin: 0; }
    .cart-item-qty { font-size: 11px; color: #666; margin: 4px 0 0; }
    .cart-item-remove {
      background: none; border: none; color: #666; cursor: pointer;
      padding: 4px; border-radius: 6px; flex-shrink: 0; transition: color 0.15s, background 0.15s;
    }
    .cart-item-remove:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .cart-ft { padding: 16px 24px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
    .cart-subtotal-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
      color: #666; margin-bottom: 16px;
    }
    .cart-subtotal-row strong { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: 0; }
    .cart-ft-btns { display: flex; gap: 10px; }
    .btn-cart-view {
      flex: 1; padding: 13px; border-radius: 10px;
      background: #FFC300; color: #0A0A0A;
      font-weight: 800; font-size: 12px; letter-spacing: 1px;
      text-transform: uppercase; border: none; cursor: pointer;
      transition: background 0.15s; font-family: inherit;
    }
    .btn-cart-view:hover { background: #E8A000; }
    .btn-cart-checkout {
      flex: 1; padding: 13px; border-radius: 10px;
      background: #fff; color: #0A0A0A;
      font-weight: 800; font-size: 12px; letter-spacing: 1px;
      text-transform: uppercase; border: none; cursor: pointer;
      transition: background 0.15s; font-family: inherit;
    }
    .btn-cart-checkout:hover { background: #ddd; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  const _token   = localStorage.getItem('artcolor_token');
  const _usuario = JSON.parse(localStorage.getItem('artcolor_usuario') || 'null');
  const _isAdmin = _usuario && _usuario.tipo === 'admin';

  // Link e label do botão de conta
  const contaHref  = _token ? (_isAdmin ? 'admin/index.html' : 'painel/index.html') : 'login.html';
  const contaTitle = _token ? (_usuario.nome.split(' ')[0]) : 'Entrar';

  // ─── ACTIVE NAV ────────────────────────────────────────────────────────────
  const isProdutos = window.location.pathname.includes('produtos');

  // ─── HEADER HTML ───────────────────────────────────────────────────────────
  const headerHTML = `
    <header id="header">
      <div class="header-inner">
        <a href="index.html" class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 12L12 4L21 12" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 9.5V20H18V9.5" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-name">artcolor</span>
            <span class="logo-sub">Comunicação Visual</span>
          </div>
        </a>
        <nav>
          <a href="index.html#inicio">Início</a>
          <a href="index.html#sobre">Sobre</a>
          <a href="index.html#servicos">Serviços</a>
          <a href="index.html#portfolio">Portfólio</a>
          <a href="index.html#contato">Contato</a>
          <a href="produtos.html" ${isProdutos ? 'class="active"' : ''}>Produtos</a>
        </nav>
        <div class="header-icons">
          <a href="${contaHref}" class="header-icon-btn" title="${contaTitle}" style="${_token ? 'color:#FFC300' : ''}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </a>
          <a href="#" class="header-icon-btn" title="Carrinho" onclick="openCart(); return false;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span class="cart-badge">0</span>
          </a>
        </div>
        <div class="hamburger" onclick="toggleMenu()"><span></span><span></span><span></span></div>
      </div>
      <div class="mobile-nav" id="mobileNav">
        <a href="index.html#inicio" onclick="closeMenu()">Início</a>
        <a href="index.html#sobre" onclick="closeMenu()">Sobre</a>
        <a href="index.html#servicos" onclick="closeMenu()">Serviços</a>
        <a href="index.html#portfolio" onclick="closeMenu()">Portfólio</a>
        <a href="index.html#contato" onclick="closeMenu()">Contato</a>
        <a href="produtos.html" onclick="closeMenu()" ${isProdutos ? 'class="active"' : ''}>Produtos</a>
        <a href="${contaHref}" onclick="closeMenu()" style="${_token ? 'color:#FFC300' : ''}">${contaTitle}</a>
      </div>
    </header>
  `;

  const placeholder = document.getElementById('site-header');
  if (placeholder) placeholder.outerHTML = headerHTML;

  // ─── CART DRAWER HTML ──────────────────────────────────────────────────────
  const cartHTML = `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <div class="cart-drawer" id="cartDrawer">
      <div class="cart-hd">
        <p class="cart-hd-title">Carrinho <span id="cartCount">0</span></p>
        <button class="cart-close-btn" onclick="closeCart()" aria-label="Fechar carrinho">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <hr class="cart-divider">
      <div class="cart-body" id="cartBody">
        <div class="cart-empty-state" id="cartEmpty">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <p>Seu carrinho está vazio</p>
        </div>
        <div id="cartItemsList"></div>
      </div>
      <div class="cart-ft">
        <div class="cart-subtotal-row">
          <span>Subtotal:</span>
          <strong id="cartSubtotal">R$ 0,00</strong>
        </div>
        <div class="cart-ft-btns">
          <button class="btn-cart-view" onclick="window.location.href='carrinho.html'">Ver Carrinho</button>
          <button class="btn-cart-checkout" onclick="window.location.href='checkout.html'">Finalizar Pedido</button>
        </div>
      </div>
    </div>
  `;

  const cartWrap = document.createElement('div');
  cartWrap.innerHTML = cartHTML;
  document.body.appendChild(cartWrap);

  // ─── FUNCTIONS ─────────────────────────────────────────────────────────────
  window.toggleMenu = function () {
    document.getElementById('mobileNav').classList.toggle('open');
  };
  window.closeMenu = function () {
    document.getElementById('mobileNav').classList.remove('open');
  };

  const CART_KEY = 'artcolor_cart';
  window.cartItems = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

  window.saveCart = function () {
    localStorage.setItem(CART_KEY, JSON.stringify(window.cartItems));
  };
  window.formatBRL = function (val) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  window.openCart = function () {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
  };
  window.closeCart = function () {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.style.overflow = '';
  };
  window.removeCartItem = function (id) {
    window.cartItems = window.cartItems.filter(i => String(i.id) !== String(id));
    saveCart(); renderCart(); updateCartBadge();
  };

  // Event delegation: captura clique em qualquer botão de remoção dentro do drawer
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-remove-id]');
    if (!btn) return;
    e.stopPropagation();
    window.removeCartItem(btn.getAttribute('data-remove-id'));
  });
  // Normaliza itens do carrinho (suporta formato antigo e novo de produto.html)
  function _normalizeItem(i) {
    return {
      id:         i.id,
      name:       i.name  || i.nome,
      price:      i.price || i.preco || 0,
      qty:        i.qty   || i.quantidade || 1,
      img:        i.img   || i.imagem || null,
      slug:       i.slug  || null
    };
  }

  window.renderCart = function () {
    // Recarrega do localStorage para pegar itens adicionados por produto.html
    window.cartItems = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

    const list = document.getElementById('cartItemsList');
    const empty = document.getElementById('cartEmpty');
    const subtotalEl = document.getElementById('cartSubtotal');
    const countEl = document.getElementById('cartCount');

    const items = window.cartItems.map(_normalizeItem);
    const total = items.reduce((s, i) => s + i.qty, 0);
    if (countEl) countEl.textContent = total;

    if (items.length === 0) {
      if (empty) empty.style.display = 'flex';
      if (list) list.innerHTML = '';
      if (subtotalEl) subtotalEl.textContent = 'R$ 0,00';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (subtotalEl) subtotalEl.textContent = formatBRL(items.reduce((s, i) => s + i.price * i.qty, 0));
    if (list) list.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.img
            ? `<img src="${item.img}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`
            : '🛍️'}
        </div>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">${formatBRL(item.price)}</p>
          <p class="cart-item-qty">Qtd: ${item.qty}</p>
        </div>
        <button class="cart-item-remove" data-remove-id="${item.id}" title="Remover">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`).join('');
  };
  window.updateCartBadge = function () {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]').map(_normalizeItem);
    const total = items.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
  };
  // Alias usado por produto.html
  window.atualizarContadorCarrinho = window.updateCartBadge;
  window.addToCart = function (item) {
    const existing = window.cartItems.find(i => i.id === item.id);
    if (existing) { existing.qty += (item.qty || 1); }
    else { window.cartItems.push({ ...item, qty: item.qty || 1 }); }
    saveCart(); updateCartBadge();
  };

  // ─── STICKY HEADER SHADOW ──────────────────────────────────────────────────
  window.addEventListener('scroll', function () {
    const h = document.getElementById('header');
    if (h) h.style.boxShadow = window.scrollY > 20 ? '0 2px 20px rgba(0,0,0,0.5)' : 'none';
  }, { passive: true });

  updateCartBadge();
})();
