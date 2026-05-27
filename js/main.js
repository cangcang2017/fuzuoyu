// ===== 作品数据 =====
const PREVIEW_LIMIT = 2;
const categories = (window.GALLERY_DATA && window.GALLERY_DATA.categories) || [];

// ===== DOM =====
const header = document.getElementById('header');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav__link');
const filterBar = document.getElementById('filterBar');
const filterState = document.getElementById('filterState');
const galleryRoot = document.getElementById('gallery');
const portfolioSection = document.getElementById('portfolio');
const portfolioMain = document.getElementById('portfolioMain');
const categoryView = document.getElementById('categoryView');
const categoryBack = document.getElementById('categoryBack');
const categoryViewTitle = document.getElementById('categoryViewTitle');
const categoryViewMeta = document.getElementById('categoryViewMeta');
const categoryGallery = document.getElementById('categoryGallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let currentFilter = 'all';
let visiblePhotos = [];
let currentLightboxIndex = 0;
let scrollY = 0;
let activeCategoryId = null;

function encodeSrc(src) {
  return src.split('/').map((part, i) => (i === 0 ? part : encodeURIComponent(part))).join('/');
}

function getCategoryById(id) {
  return categories.find(c => c.id === id);
}

function getFilteredCategories() {
  if (currentFilter === 'all') return categories;
  return categories.filter(c => c.id === currentFilter);
}

// ===== 滚动锁定 =====
function updateBodyScrollLock() {
  const navOpen = navMenu.classList.contains('open');
  const lightboxOpen = lightbox.classList.contains('open');

  if (navOpen || lightboxOpen) {
    if (!document.body.classList.contains('nav-open') && !document.body.classList.contains('lightbox-open')) {
      scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
    }
    document.body.classList.toggle('nav-open', navOpen);
    document.body.classList.toggle('lightbox-open', lightboxOpen);
  } else {
    document.body.classList.remove('nav-open', 'lightbox-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
  }
}

function closeNav() {
  navToggle.classList.remove('open');
  navMenu.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', '打开菜单');
  updateBodyScrollLock();
}

function openNav() {
  navToggle.classList.add('open');
  navMenu.classList.add('open');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', '关闭菜单');
  updateBodyScrollLock();
}

// ===== 筛选按钮 =====
function buildFilterBar() {
  if (!filterBar) return;

  const buttons = [
    { id: 'all', label: '全部' },
    ...categories.map(c => ({ id: c.id, label: c.name })),
  ];

  filterBar.innerHTML = buttons
    .map(
      b => `<button type="button" class="filter__btn${b.id === currentFilter ? ' active' : ''}" data-filter="${b.id}">${b.label}</button>`
    )
    .join('');

  filterBar.querySelectorAll('.filter__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (categoryView && !categoryView.hidden) closeCategoryView(false);
      currentFilter = btn.dataset.filter;
      filterBar.querySelectorAll('.filter__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      renderPortfolio();
      history.replaceState(null, '', '#portfolio');
    });
  });

  renderFilterState();
}

function renderFilterState() {
  if (!filterState) return;

  if (currentFilter === 'all') {
    filterState.innerHTML = '';
    filterState.hidden = true;
    return;
  }

  const current = getCategoryById(currentFilter);
  if (!current) {
    filterState.innerHTML = '';
    filterState.hidden = true;
    return;
  }

  filterState.hidden = false;
  filterState.innerHTML = `
    <span>当前筛选：${current.name}</span>
    <button type="button" class="filter-state__reset" id="filterResetBtn">返回全部分类</button>
  `;

  const resetBtn = document.getElementById('filterResetBtn');
  resetBtn?.addEventListener('click', () => {
    currentFilter = 'all';
    buildFilterBar();
    renderPortfolio();
    history.replaceState(null, '', '#portfolio');
  });
}

// ===== 渲染作品卡片 =====
function createGalleryItem(photo, index, onClick) {
  const item = document.createElement('div');
  item.className = 'gallery__item';
  item.dataset.index = index;
  const src = encodeSrc(photo.src);
  item.innerHTML = `
    <img src="${src}" alt="${photo.title}" loading="lazy">
    <div class="gallery__overlay">
      <h3>${photo.title}</h3>
    </div>
  `;
  item.addEventListener('click', () => onClick(index));
  requestAnimationFrame(() => {
    setTimeout(() => item.classList.add('visible'), (index % PREVIEW_LIMIT) * 60);
  });
  return item;
}

function renderGalleryGrid(container, photos, startDelay = 0) {
  const grid = document.createElement('div');
  grid.className = 'gallery';
  photos.forEach((photo, index) => {
    grid.appendChild(
      createGalleryItem(photo, index, (i) => {
        visiblePhotos = photos;
        openLightbox(i);
      })
    );
  });
  container.appendChild(grid);
  return grid;
}

function renderPortfolio() {
  if (!galleryRoot) return;
  galleryRoot.innerHTML = '';
  renderFilterState();

  const list = getFilteredCategories();
  if (!list.length) {
    galleryRoot.innerHTML = '<p class="gallery-empty">暂无作品，请将图片放入 pic 目录后运行 node scripts/build-gallery.js</p>';
    return;
  }

  list.forEach(cat => {
    const preview = cat.images.slice(0, PREVIEW_LIMIT);
    const group = document.createElement('div');
    group.className = 'gallery-group';

    const head = document.createElement('div');
    head.className = 'gallery-group__head';
    head.innerHTML = `
      <h3 class="gallery-group__title">${cat.name}</h3>
      <span class="gallery-group__count">共 ${cat.count} 张</span>
    `;

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'gallery-group__more';
    moreBtn.textContent = cat.count > PREVIEW_LIMIT ? `查看全部 →` : '查看详情 →';
    moreBtn.addEventListener('click', () => openCategoryView(cat.id));
    head.appendChild(moreBtn);

    group.appendChild(head);
    renderGalleryGrid(group, preview);
    galleryRoot.appendChild(group);
  });
}

// ===== 分类详情页 =====
function openCategoryView(categoryId) {
  const cat = getCategoryById(categoryId);
  if (!cat || !categoryView) return;

  activeCategoryId = categoryId;
  categoryViewTitle.textContent = cat.name;
  categoryViewMeta.textContent = `共 ${cat.count} 张作品`;
  categoryGallery.innerHTML = '';

  renderGalleryGrid(categoryGallery, cat.images);

  portfolioSection.hidden = true;
  categoryView.hidden = false;
  history.replaceState(null, '', `#category/${categoryId}`);
  categoryView.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCategoryView(updateHash = true) {
  if (!categoryView) return;
  categoryView.hidden = true;
  portfolioSection.hidden = false;
  activeCategoryId = null;
  if (updateHash) history.replaceState(null, '', '#portfolio');
}

categoryBack.addEventListener('click', () => closeCategoryView());

function handleHashRoute() {
  const hash = location.hash;
  const match = hash.match(/^#category\/(.+)$/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    const cat = getCategoryById(id);
    if (cat) {
      currentFilter = 'all';
      buildFilterBar();
      openCategoryView(id);
      return;
    }
  }
  if (!categoryView.hidden) closeCategoryView(false);
}

window.addEventListener('hashchange', handleHashRoute);

// ===== 灯箱 =====
function openLightbox(index) {
  currentLightboxIndex = index;
  updateLightboxImage();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  updateBodyScrollLock();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  updateBodyScrollLock();
}

function updateLightboxImage() {
  const photo = visiblePhotos[currentLightboxIndex];
  if (!photo) return;
  lightboxImg.src = encodeSrc(photo.src);
  lightboxImg.alt = photo.title;
  lightboxCaption.textContent = photo.caption || photo.title;
}

function navigateLightbox(direction) {
  currentLightboxIndex += direction;
  if (currentLightboxIndex < 0) currentLightboxIndex = visiblePhotos.length - 1;
  if (currentLightboxIndex >= visiblePhotos.length) currentLightboxIndex = 0;
  updateLightboxImage();
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
lightboxNext.addEventListener('click', () => navigateLightbox(1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (lightbox.classList.contains('open')) closeLightbox();
    else if (!categoryView.hidden) closeCategoryView();
    else if (navMenu.classList.contains('open')) closeNav();
    return;
  }
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

let touchStartX = 0;
let touchStartY = 0;

lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

lightbox.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
  navigateLightbox(dx > 0 ? -1 : 1);
}, { passive: true });

// ===== 导航 =====
navToggle.setAttribute('aria-expanded', 'false');

navToggle.addEventListener('click', () => {
  if (navMenu.classList.contains('open')) closeNav();
  else openNav();
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    closeNav();
    if (link.getAttribute('href') === '#portfolio' && !categoryView.hidden) {
      closeCategoryView();
    }
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && navMenu.classList.contains('open')) closeNav();
});

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);

  const sections = document.querySelectorAll('section[id]:not([hidden])');
  const scrollPos = window.scrollY + 100;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
});

// ===== 滚动显现 =====
const revealElements = document.querySelectorAll(
  '.section__header, .about__grid, .intent__grid, .timeline__item, .skills__group, .contact__grid, .contact__card'
);

revealElements.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

revealElements.forEach(el => revealObserver.observe(el));

// ===== 初始化 =====
buildFilterBar();
renderPortfolio();
handleHashRoute();
