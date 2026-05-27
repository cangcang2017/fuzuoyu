const fs = require('fs');
const path = require('path');

const PIC_ROOT = path.join(__dirname, '..', 'pic');
const OUT_FILE = path.join(__dirname, '..', 'js', 'gallery-data.js');
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.tif', '.tiff', '.jfif']);

function slugify(str) {
  return str
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'cat';
}

function shouldSkipDir(name) {
  return name === '__MACOSX' || name.startsWith('.') || name === 'ps源文件' || name.includes('ps源');
}

// 把“同一类产品”的不同变体（颜色/编号/主图等）合并到同一个品类
// 目的是：减少首页分类数量、避免同一品类反复展示。
function getFamilyName(name) {
  if (/牵引绳/.test(name)) return '牵引绳';
  if (/慢食碗/.test(name)) return '慢食碗';
  if (/梳毛刷/.test(name)) return '梳毛刷';
  if (/训狗器/.test(name)) return '训狗器';
  if (/饮水器/.test(name)) return '饮水器';
  if (/喂食器/.test(name)) return '喂食器';
  if (/猫砂盆/.test(name)) return '猫砂盆';
  if (/胸背/.test(name)) return '胸背';
  if (/安全带/.test(name)) return '车载安全带';
  if (/魔术布/.test(name)) return '猫咪魔术布';
  return name;
}

function walk(dir, relativeParts = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const images = [];
  const subdirs = [];

  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (shouldSkipDir(ent.name)) continue;
      subdirs.push({ full, name: ent.name });
    } else if (EXTS.has(path.extname(ent.name).toLowerCase())) {
      images.push({
        file: ent.name,
        src: path.relative(path.join(__dirname, '..'), full).split(path.sep).join('/'),
      });
    }
  }

  if (images.length > 0 && relativeParts.length > 0) {
    const catPath = relativeParts.join('/');
    const catName = relativeParts[relativeParts.length - 1];
    return [{ key: catPath, name: catName, path: catPath, images }, ...subdirs.flatMap(s => walk(s.full, [...relativeParts, s.name]))];
  }

  return subdirs.flatMap(s => walk(s.full, [...relativeParts, s.name]));
}

if (!fs.existsSync(PIC_ROOT)) {
  console.error('pic folder not found');
  process.exit(1);
}

const topDirs = fs.readdirSync(PIC_ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !shouldSkipDir(d.name));

let allCategories = [];
for (const td of topDirs) {
  const base = path.join(PIC_ROOT, td.name);
  const subs = fs.readdirSync(base, { withFileTypes: true })
    .filter(d => d.isDirectory() && !shouldSkipDir(d.name));

  if (subs.length === 0) {
    const found = walk(base, [td.name]);
    allCategories.push(...found);
  } else {
    for (const sub of subs) {
      const found = walk(path.join(base, sub.name), [td.name, sub.name]);
      allCategories.push(...found);
    }
    // also images directly in base?
    const direct = walk(base, [td.name]).filter(c => c.path === td.name);
    allCategories.push(...direct);
  }
}

// Dedupe by path
const map = new Map();
for (const c of allCategories) {
  if (!map.has(c.key)) map.set(c.key, c);
  else {
    const existing = map.get(c.key);
    existing.images.push(...c.images);
  }
}

// Dedupe images inside each category (same src may appear multiple times)
for (const c of map.values()) {
  const seen = new Set();
  const uniq = [];
  for (const img of c.images) {
    if (!seen.has(img.src)) {
      seen.add(img.src);
      uniq.push(img);
    }
  }
  c.images = uniq;
}

// 合并到“品类/家族分类”
const familyMap = new Map();
for (const c of map.values()) {
  const familyName = getFamilyName(c.name);
  const familyKey = slugify(familyName);
  if (!familyMap.has(familyKey)) {
    familyMap.set(familyKey, {
      idKey: familyKey,
      name: familyName,
      images: [],
    });
  }
  familyMap.get(familyKey).images.push(...c.images);
}

// 家族内去重
for (const f of familyMap.values()) {
  const seen = new Set();
  const uniq = [];
  for (const img of f.images) {
    if (!seen.has(img.src)) {
      seen.add(img.src);
      uniq.push(img);
    }
  }
  f.images = uniq;
}

const categories = [...familyMap.values()]
  .map((f, i) => {
    const slug = `${f.idKey}-${i}`;
    return {
      id: slug,
      name: f.name,
      path: f.name,
      count: f.images.length,
      images: f.images.map((img, idx) => ({
        id: `${slug}-${idx + 1}`,
        title: path.parse(img.file).name,
        src: img.src,
        caption: `${f.name} · ${img.file}`,
      })),
    };
  })
  .filter(c => c.count > 0)
  .sort((a, b) => b.count - a.count);

const output = `// 自动生成：node scripts/build-gallery.js
window.GALLERY_DATA = ${JSON.stringify({ categories }, null, 2)};
`;

fs.writeFileSync(OUT_FILE, output, 'utf8');
console.log(`Wrote ${categories.length} categories, ${categories.reduce((s, c) => s + c.count, 0)} images to js/gallery-data.js`);
categories.forEach(c => console.log(`  ${c.count}\t${c.name}`));
