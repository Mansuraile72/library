// ===== DOM refs =====
const imageGrid = document.getElementById("imageGrid");
const selectedTagsDisplay = document.getElementById("selectedTagsDisplay");
const popup = document.getElementById("popup");
const krantikariButtons = document.getElementById("krantikariButtons");
const subcategoryButtons = document.getElementById("subcategoryButtons");
const qualityToggle = document.getElementById("qualityToggle");
const subjectToggle = document.getElementById("subjectToggle");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const lightbox = document.getElementById("lightbox");
const closeLightboxBtn = document.querySelector(".close-lightbox");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const sentinel = document.getElementById("sentinel");
const stickyHeader = document.getElementById("stickyHeader");

// State
let allImageData = [];
let filteredImageData = [];
let currentImageIndex = 0;
const BATCH_SIZE = 50;

// Toggle button state
let activeQuality = "best";   // default
let activeSubject = "human";  // default

let selectedCategoryIncludeTags = new Set();
let selectedCategoryExcludeTags = new Set();
let selectedFilterIncludeTags = new Set();
let selectedFilterExcludeTags = new Set();

let isPopupOpen = false;
let zoomSize = 100;
let popupCloseTimeout;

// FLIP animation state
let activeThumb = null;        // clicked IMG element
let flyClone = null;           // animated clone element
let closing = false;

// ===== Zoom control =====
function updateZoom() { document.documentElement.style.setProperty('--img-size', `${zoomSize}px`); }
zoomInBtn.addEventListener("click", () => { zoomSize = Math.min(zoomSize + 20, 400); updateZoom(); });
zoomOutBtn.addEventListener("click", () => { zoomSize = Math.max(zoomSize - 20, 80); updateZoom(); });
updateZoom();

// Layout helpers
function setBodyPadding() {
  const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;
  document.body.style.paddingTop = `${headerHeight}px`;
}
let lastScrollTop = 0;
window.addEventListener("scroll", function () {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (stickyHeader) {
    if (scrollTop > lastScrollTop && scrollTop > 100) stickyHeader.classList.add('hidden');
    else stickyHeader.classList.remove('hidden');
  }
  lastScrollTop = Math.max(0, scrollTop);
}, false);

// Lazy loading
const lazyImageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove("lazy");
      img.onload = () => img.style.opacity = '1';
      lazyImageObserver.unobserve(img);
    }
  });
});

function renderNextBatch() {
  const batch = filteredImageData.slice(currentImageIndex, currentImageIndex + BATCH_SIZE);
  if (!batch.length) { if (sentinelObserver) sentinelObserver.disconnect(); return false; }

  batch.forEach(item => {
    const div = document.createElement("div");
    div.className = "image-item";
    div.setAttribute("data-tags", item.tags.join(","));
    const img = document.createElement("img");
    img.dataset.src = item.filename;
    img.className = "lazy";
    img.alt = item.filename.replace('.webp', '.png');
    div.appendChild(img);
    imageGrid.appendChild(div);
    lazyImageObserver.observe(img);
  });

  currentImageIndex += batch.length;
  return true;
}

function loadUntilScroll() {
  if (currentImageIndex >= filteredImageData.length) return;
  if (document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
    if (renderNextBatch()) setTimeout(loadUntilScroll, 100);
  } else {
    if (sentinelObserver) sentinelObserver.observe(sentinel);
  }
}

const sentinelObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) renderNextBatch();
});

// Data load
fetch("images.json")
  .then(r => r.json())
  .then(images => {
    allImageData = images;
    filteredImageData = images;

    // ===== डिफ़ॉल्ट Toggle सेट करें / Set Default Toggles =====
    // activeQuality और activeSubject पहले से ही "best" और "human" पर set हैं
    // अब सिर्फ फ़िल्टर करें
    filterImagesByToggles();
  })
  .catch(e => console.error("Error loading images:", e));

function startRendering() {
  imageGrid.innerHTML = '';
  currentImageIndex = 0;
  if (sentinelObserver) sentinelObserver.disconnect();
  loadUntilScroll();
}

// ===== Toggle Buttons Creation =====
// Create Quality toggle buttons
const qualityOptions = ["best", "normal", "junk"];
qualityOptions.forEach(option => {
  const btn = document.createElement("button");
  btn.className = "toggle-btn";
  btn.innerText = `${emojiMap[option.charAt(0).toUpperCase() + option.slice(1)] || ""} ${option.charAt(0).toUpperCase() + option.slice(1)}`;
  btn.dataset.value = option;
  if (option === activeQuality) btn.classList.add("active");

  btn.addEventListener("click", () => {
    activeQuality = option;
    updateToggleButtons(qualityToggle, option);
    filterImagesByToggles();
  });

  qualityToggle.appendChild(btn);
});

// Create Subject toggle buttons
const subjectOptions = ["human", "animal", "object"];
subjectOptions.forEach(option => {
  const btn = document.createElement("button");
  btn.className = "toggle-btn";
  btn.innerText = `${emojiMap[option.charAt(0).toUpperCase() + option.slice(1)] || ""} ${option.charAt(0).toUpperCase() + option.slice(1)}`;
  btn.dataset.value = option;
  if (option === activeSubject) btn.classList.add("active");

  btn.addEventListener("click", () => {
    activeSubject = option;
    updateToggleButtons(subjectToggle, option);
    filterImagesByToggles();
  });

  subjectToggle.appendChild(btn);
});

// Update toggle button active state
function updateToggleButtons(container, activeValue) {
  container.querySelectorAll(".toggle-btn").forEach(btn => {
    if (btn.dataset.value === activeValue) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Krantikari buttons (Category only now, excluding Quality and Subject)
Object.keys(categories).forEach(category => {
  // Skip Quality and Subject as they are now toggle buttons
  if (category === 'Quality' || category === 'Subject') return;

  const btn = document.createElement("button");
  btn.className = "tag-btn large-btn";
  btn.innerText = `${emojiMap[category] || ""} ${category}`;
  if (category === 'Category') btn.id = 'mainCategoryBtn';

  btn.addEventListener("mouseenter", (e) => { clearTimeout(popupCloseTimeout); openPopup(category, e.target); });
  btn.addEventListener("mouseleave", () => { popupCloseTimeout = setTimeout(() => closePopup(), 300); });

  krantikariButtons.appendChild(btn);
});

popup.addEventListener('mouseenter', () => clearTimeout(popupCloseTimeout));
popup.addEventListener('mouseleave', () => closePopup());
function closePopup() { popup.classList.add('hidden'); isPopupOpen = false; }

function openPopup(category, buttonElement) {
  const rect = buttonElement.getBoundingClientRect();
  const popupWidth = 400;
  const screenWidth = window.innerWidth;
  let left = rect.left;
  if (left + popupWidth > screenWidth) left = screenWidth - popupWidth - 20;
  popup.style.top = `${rect.bottom + 5}px`;
  popup.style.left = `${left}px`;
  popup.classList.remove("hidden");
  isPopupOpen = true;

  subcategoryButtons.innerHTML = "";
  categories[category].forEach(tag => {
    const sub = document.createElement("button");
    sub.className = "tag-btn small-btn";
    sub.innerText = `${emojiMap[tag] || ""} ${tag}`;

    const incSet = category === 'Category' ? selectedCategoryIncludeTags : selectedFilterIncludeTags;
    const excSet = category === 'Category' ? selectedCategoryExcludeTags : selectedFilterExcludeTags;
    if (incSet.has(tag)) sub.classList.add("active-include");
    if (excSet.has(tag)) sub.classList.add("active-exclude");

    sub.addEventListener("click", (e) => { e.stopPropagation(); cycleTagState(tag, sub, category); updateSelectedTagsDisplay(); filterImagesByToggles(); });

    subcategoryButtons.appendChild(sub);
  });
}

function cycleTagState(tag, btn, category) {
  const includeSet = category === 'Category' ? selectedCategoryIncludeTags : selectedFilterIncludeTags;
  const excludeSet = category === 'Category' ? selectedCategoryExcludeTags : selectedFilterExcludeTags;

  if (includeSet.has(tag)) { includeSet.delete(tag); excludeSet.add(tag); btn.classList.remove('active-include'); btn.classList.add('active-exclude'); }
  else if (excludeSet.has(tag)) { excludeSet.delete(tag); btn.classList.remove('active-exclude'); }
  else { includeSet.add(tag); btn.classList.add('active-include'); }
}

function updateSelectedTagsDisplay() {
  selectedTagsDisplay.innerHTML = "";
  const inc = [...selectedCategoryIncludeTags, ...selectedFilterIncludeTags];
  const exc = [...selectedCategoryExcludeTags, ...selectedFilterExcludeTags];

  inc.forEach(tag => {
    const s = document.createElement("span");
    s.className = "selected-tag included-tag";
    s.textContent = `+ ${tag}`;
    selectedTagsDisplay.appendChild(s);
  });

  exc.forEach(tag => {
    const s = document.createElement("span");
    s.className = "selected-tag excluded-tag";
    s.textContent = `- ${tag}`;
    selectedTagsDisplay.appendChild(s);
  });

  if (inc.length || exc.length) clearFiltersBtn.classList.remove('hidden');
  else clearFiltersBtn.classList.add('hidden');

  setTimeout(setBodyPadding, 0);
}

function filterImages() {
  filteredImageData = allImageData.filter(item => {
    const t = item.tags;
    const catInc = selectedCategoryIncludeTags.size === 0 || [...selectedCategoryIncludeTags].some(x => t.includes(x)); // OR
    const filInc = selectedFilterIncludeTags.size === 0 || [...selectedFilterIncludeTags].every(x => t.includes(x));    // AND
    const catExc = [...selectedCategoryExcludeTags].every(x => !t.includes(x)); // NOT
    const filExc = [...selectedFilterExcludeTags].every(x => !t.includes(x));   // NOT
    return catInc && filInc && catExc && filExc;
  });
  startRendering();
}

// New filter function for toggle buttons
function filterImagesByToggles() {
  filteredImageData = allImageData.filter(item => {
    const t = item.tags;

    // Check toggle requirements (must have active quality AND active subject)
    const hasQuality = t.includes(activeQuality);
    const hasSubject = t.includes(activeSubject);

    // Check category filters (existing system for Category tags)
    const catInc = selectedCategoryIncludeTags.size === 0 || [...selectedCategoryIncludeTags].some(x => t.includes(x)); // OR
    const catExc = [...selectedCategoryExcludeTags].every(x => !t.includes(x)); // NOT

    return hasQuality && hasSubject && catInc && catExc;
  });
  startRendering();
}

document.addEventListener("click", (e) => {
  if (isPopupOpen && !popup.contains(e.target) && !e.target.classList.contains("tag-btn")) closePopup();
});

// ===== FLIP Lightbox animation =====

// Compute the centered size maintaining aspect ratio within 90vw x 90vh
function computeTargetBox(naturalW, naturalH) {
  const maxW = Math.min(window.innerWidth * 0.9, naturalW);
  const maxH = Math.min(window.innerHeight * 0.9, naturalH);
  const scale = Math.min(maxW / naturalW, maxH / naturalH);
  const w = naturalW * scale;
  const h = naturalH * scale;
  const left = window.scrollX + (window.innerWidth - w) / 2;
  const top = window.scrollY + (window.innerHeight - h) / 2;
  return { w, h, left, top };
}

function createFlyClone(fromImg, srcForModal) {
  const rect = fromImg.getBoundingClientRect();
  const clone = document.createElement('img');
  clone.className = 'fly-clone';
  clone.src = srcForModal;
  clone.style.width = rect.width + "px";
  clone.style.height = rect.height + "px";
  clone.style.transform = `translate(${window.scrollX + rect.left}px, ${window.scrollY + rect.top}px) scale(1)`;
  document.body.appendChild(clone);
  return clone;
}

function animateToCenter(clone, natW, natH, duration = 260) {
  const { w, h, left, top } = computeTargetBox(natW, natH);
  return clone.animate(
    [
      { transform: clone.style.transform },
      { transform: `translate(${left}px, ${top}px) scale(${w / parseFloat(clone.style.width)}, ${h / parseFloat(clone.style.height)})` }
    ],
    { duration, easing: 'cubic-bezier(.2,.6,.2,1)', fill: 'forwards' }
  );
}

function animateBackToThumb(clone, toRect, duration = 220) {
  const endTransform = `translate(${window.scrollX + toRect.left}px, ${window.scrollY + toRect.top}px) scale(${toRect.width / parseFloat(clone.style.width)}, ${toRect.height / parseFloat(clone.style.height)})`;
  return clone.animate(
    [
      { transform: getComputedStyle(clone).transform },
      { transform: endTransform }
    ],
    { duration, easing: 'cubic-bezier(.2,.6,.2,1)', fill: 'forwards' }
  );
}

// Open with FLIP
async function openLightboxFromThumb(thumbEl, hiSrc) {
  if (!thumbEl) return;
  activeThumb = thumbEl;
  closing = false;

  // backdrop on
  lightbox.classList.add('open');

  // make a flying clone starting at thumbnail rect
  flyClone = createFlyClone(thumbEl, hiSrc);

  // ensure we know intrinsic size
  await new Promise((resolve) => {
    if (flyClone.complete && flyClone.naturalWidth) resolve();
    else flyClone.onload = resolve;
  });

  // animate to center
  const natW = flyClone.naturalWidth;
  const natH = flyClone.naturalHeight;
  await animateToCenter(flyClone, natW, natH).finished;
}

// Close with reverse FLIP
async function closeLightboxFLIP() {
  if (!flyClone || !activeThumb || closing) { lightbox.classList.remove('open'); return; }
  closing = true;

  const toRect = activeThumb.getBoundingClientRect();
  try {
    await animateBackToThumb(flyClone, toRect).finished;
  } catch (_) { }

  // cleanup
  if (flyClone && flyClone.parentNode) flyClone.parentNode.removeChild(flyClone);
  flyClone = null;
  activeThumb = null;
  lightbox.classList.remove('open');
}

// =========================================================================
// ===== बदला हुआ कोड यहाँ है / MODIFIED CODE IS HERE =====
// =========================================================================
// Grid click → open FLIP + clipboard toast
imageGrid.addEventListener('click', async (e) => {
  if (e.target.tagName !== 'IMG') return;

  // ===== बदलाव: PNG की जगह SVG दिखाएं =====
  // .webp → .svg (PNG की जगह)
  const svgSrc = e.target.src.replace('.webp', '.svg');
  await openLightboxFromThumb(e.target, svgSrc);

  // ===== बदलाव: GitHub URL copy करें =====
  const fullPath = e.target.alt;
  const parts = fullPath.split('/');
  const filenameOnly = parts[parts.length - 1];
  const svgFilename = filenameOnly.replace(/\.png$/, '.svg');

  // GitHub Pages base URL
  const baseURL = 'https://mansuraile72.github.io/library/';

  // Full GitHub URL with proper encoding
  // Example: images/Celebration/Celebration P1 N17.png
  // Path को construct करें (images/ se pehle ka path nikalen)
  const imagePath = fullPath.replace('.png', '.svg');

  // URL encode करें (spaces को %20 में convert)
  const encodedPath = encodeURI(imagePath);

  // Final GitHub URL
  const githubURL = baseURL + encodedPath;

  // Clipboard पर GitHub URL copy करें
  navigator.clipboard.writeText(githubURL).then(() => {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = `Copied: ${githubURL}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }).catch(err => console.error('Failed to copy: ', err));
});

// Close handlers
closeLightboxBtn.addEventListener('click', closeLightboxFLIP);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightboxFLIP(); });

// Clear filters
clearFiltersBtn.addEventListener('click', function () {
  selectedCategoryIncludeTags.clear();
  selectedCategoryExcludeTags.clear();
  selectedFilterIncludeTags.clear();
  selectedFilterExcludeTags.clear();
  document.querySelectorAll('#subcategoryButtons .tag-btn.active-include, #subcategoryButtons .tag-btn.active-exclude')
    .forEach(btn => btn.classList.remove('active-include', 'active-exclude'));
  updateSelectedTagsDisplay();
  filterImagesByToggles();
});

// Init
window.addEventListener('load', setBodyPadding);
window.addEventListener('resize', setBodyPadding);