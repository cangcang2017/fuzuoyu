// ===== 作品数据（示例图，可替换为真实作品） =====
const photos = [
  { id: 1, title: '宠物用品静物', category: 'product', src: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80', caption: '跨境电商 · 宠物用品静物拍摄' },
  { id: 2, title: '产品白底图', category: 'product', src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', caption: 'Amazon 平台 · 产品白底图' },
  { id: 3, title: '场景化棚拍', category: 'scene', src: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&q=80', caption: '场景化棚拍 · 氛围感营造' },
  { id: 4, title: '居家场景', category: 'scene', src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', caption: '宠物用品 · 居家场景外拍' },
  { id: 5, title: 'TikTok 广告帧', category: 'video', src: 'https://images.unsplash.com/photo-1611162617474-5b21e939e113?w=800&q=80', caption: 'TikTok 跨境广告 · 短视频截图' },
  { id: 6, title: '种草短视频', category: 'video', src: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80', caption: '短视频广告 · 高转化视觉' },
  { id: 7, title: '营地活动', category: 'activity', src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', caption: '梦舞文化 · 营地活动拍摄' },
  { id: 8, title: '团建纪实', category: 'activity', src: 'https://images.unsplash.com/photo-1517457373958-b5891e069ec2?w=800&q=80', caption: '公司团建 · 活动纪实' },
  { id: 9, title: '宠物零食', category: 'product', src: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80', caption: '宠物零食 · 产品静物' },
  { id: 10, title: '多材质布光', category: 'scene', src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', caption: '棚拍布光 · 多材质产品' },
  { id: 11, title: '小红书内容', category: 'video', src: 'https://images.unsplash.com/photo-1611162618071-b1993ce9ace3?w=800&q=80', caption: '新媒体 · 小红书视觉内容' },
  { id: 12, title: '校历拍摄', category: 'activity', src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', caption: '安徽科技工程大学 · 校历拍摄' },
];

// ===== DOM 元素 =====
const header = document.getElementById('header');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav__link');
const gallery = document.getElementById('gallery');
const filterBtns = document.querySelectorAll('.filter__btn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
let currentFilter = 'all';
let visiblePhotos = [...photos];
let currentLightboxIndex = 0;
let scrollY = 0;

// ===== 滚动锁定（菜单 / 灯箱） =====
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

// ===== 渲染画廊 =====
function renderGallery(filter = 'all') {
  currentFilter = filter;
  gallery.innerHTML = '';

  const filtered = filter === 'all'
    ? photos
    : photos.filter(p => p.category === filter);

  visiblePhotos = filtered;

  filtered.forEach((photo, index) => {
    const item = document.createElement('div');
    item.className = 'gallery__item';
    item.dataset.index = index;
    item.innerHTML = `
      <img src="${photo.src}" alt="${photo.title}" loading="lazy">
      <div class="gallery__overlay">
        <h3>${photo.title}</h3>
        <span>${getCategoryLabel(photo.category)}</span>
      </div>
    `;
    item.addEventListener('click', () => openLightbox(index));
    gallery.appendChild(item);

    requestAnimationFrame(() => {
      setTimeout(() => item.classList.add('visible'), index * 80);
    });
  });
}

function getCategoryLabel(category) {
  const labels = {
    product: '静物产品',
    scene: '场景棚拍',
    video: '短视频',
    activity: '活动纪实',
  };
  return labels[category] || category;
}

// ===== 筛选 =====
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGallery(btn.dataset.filter);
  });
});

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
  lightboxImg.src = photo.src.replace('w=800', 'w=1600');
  lightboxImg.alt = photo.title;
  lightboxCaption.textContent = photo.caption;
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
    else if (navMenu.classList.contains('open')) closeNav();
    return;
  }
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

// ===== 灯箱滑动切换（手机端） =====
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
  link.addEventListener('click', closeNav);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && navMenu.classList.contains('open')) {
    closeNav();
  }
});

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);

  const sections = document.querySelectorAll('section[id]');
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

// ===== 滚动显现动画 =====
const revealElements = document.querySelectorAll(
  '.section__header, .about__grid, .intent__grid, .timeline__item, .skills__group, .contact__grid, .contact__card'
);

revealElements.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
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
renderGallery();
