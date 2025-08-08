// ✅ DOM references
const imageGrid = document.getElementById("imageGrid");
const selectedTagsDisplay = document.getElementById("selectedTagsDisplay");
const popup = document.getElementById("popup");
const krantikariButtons = document.getElementById("krantikariButtons");
const subcategoryButtons = document.getElementById("subcategoryButtons");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const closeLightboxBtn = document.querySelector(".close-lightbox");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const sentinel = document.getElementById("sentinel");

// ✅ इनफिनिट स्क्रॉल और फिल्टरिंग के लिए वेरिएबल्स
let allImageData = [];
let filteredImageData = [];
let currentImageIndex = 0;
const BATCH_SIZE = 50; 

let selectedCategoryTags = new Set();
let selectedFilterTags = new Set();

let isPopupOpen = false;
let zoomSize = 100;

// Responsive Zoom System
function updateZoom() {
  document.documentElement.style.setProperty('--img-size', `${zoomSize}px`);
}
zoomInBtn.addEventListener("click", () => {
  zoomSize = Math.min(zoomSize + 20, 400);
  updateZoom();
});
zoomOutBtn.addEventListener("click", () => {
  zoomSize = Math.max(zoomSize - 20, 80);
  updateZoom();
});
updateZoom();

// स्क्रॉल पर हेडर और Selected Tags सेक्शन दिखाने/छिपाने के लिए लॉजिक
let lastScrollTop = 0;
const krantikariArea = document.querySelector('.krantikari-area');
const selectedTagsSection = document.querySelector('.selected-tags-section');

window.addEventListener("scroll", function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) { 
        krantikariArea.classList.add('hidden-nav');
        selectedTagsSection.classList.add('hidden-tags');
    } else {
        krantikariArea.classList.remove('hidden-nav');
        selectedTagsSection.classList.remove('hidden-tags');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, false);

// लेज़ी लोडिंग के लिए एक ही Observer बनेगा
const lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const lazyImage = entry.target;
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.classList.remove("lazy");
            lazyImage.onload = () => lazyImage.style.opacity = '1';
            lazyImageObserver.unobserve(lazyImage);
        }
    });
});

// इमेज का अगला बैच दिखाने का फंक्शन
function renderNextBatch() {
    const batch = filteredImageData.slice(currentImageIndex, currentImageIndex + BATCH_SIZE);
    if (batch.length === 0) {
        if(sentinelObserver) sentinelObserver.disconnect();
        return false;
    }

    batch.forEach(img => {
        const div = document.createElement("div");
        div.className = "image-item";
        div.setAttribute("data-tags", img.tags.join(","));
        const imgElement = document.createElement('img');
        imgElement.dataset.src = img.filename;
        imgElement.className = 'lazy';
        imgElement.alt = img.filename.replace('.webp', '.png');
        div.appendChild(imgElement);
        imageGrid.appendChild(div);
        lazyImageObserver.observe(imgElement);
    });

    currentImageIndex += batch.length;
    return true;
}

// स्क्रीन भरने तक इमेज लोड करने का स्मार्ट फंक्शन
function loadUntilScroll() {
    if (currentImageIndex >= filteredImageData.length) return;
    
    if (document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
        if (renderNextBatch()) {
            setTimeout(loadUntilScroll, 100); 
        }
    } else {
        if(sentinelObserver) sentinelObserver.observe(sentinel);
    }
}

// इनफिनिट स्क्रॉल के लिए Observer
const sentinelObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        renderNextBatch();
    }
});

// Load images
fetch("images.json")
  .then(res => res.json())
  .then(images => {
    allImageData = images;
    filteredImageData = images;
    startRendering();
  })
  .catch(err => console.error("❌ Error loading images:", err));
  
function startRendering() {
    imageGrid.innerHTML = '';
    currentImageIndex = 0;
    sentinelObserver.disconnect();
    loadUntilScroll();
}

// Load Krantikari buttons
Object.keys(categories).forEach(category => {
  const btn = document.createElement("button");
  btn.className = "tag-btn large-btn";
  btn.innerText = `${emojiMap[category] || ""} ${category}`;
  if (category === 'Category') {
      btn.id = 'mainCategoryBtn';
  }

  // Hover पर ऑटो खोलना
  btn.addEventListener("mouseenter", (e) => {
    openPopup(category, e.target);
  });

  // Click से भी काम करे
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openPopup(category, e.target);
  });

  krantikariButtons.appendChild(btn);
});

function openPopup(category, buttonElement) {
  const rect = buttonElement.getBoundingClientRect();
  const popupWidth = 400;
  const screenWidth = window.innerWidth;
  
  let popupLeft = rect.left; 
  if (popupLeft + popupWidth > screenWidth) {
    popupLeft = screenWidth - popupWidth - 20;
  }
  popup.style.top = `${rect.bottom + 5}px`;
  popup.style.left = `${popupLeft}px`;
  
  popup.classList.remove("hidden");
  isPopupOpen = true;
  subcategoryButtons.innerHTML = "";
  categories[category].forEach(tag => {
    const subBtn = document.createElement("button");
    subBtn.className = "tag-btn small-btn";
    subBtn.innerText = `${emojiMap[tag] || ""} ${tag}`;
    
    const isSelected = selectedCategoryTags.has(tag) || selectedFilterTags.has(tag);
    if (isSelected) subBtn.classList.add("active");

    subBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTag(tag, subBtn, category); 
      updateSelectedTagsDisplay();
      filterImages();
    });
    subcategoryButtons.appendChild(subBtn);
  });
}

function toggleTag(tag, btn, category) {
  const targetSet = category === 'Category' ? selectedCategoryTags : selectedFilterTags;
  
  if (targetSet.has(tag)) {
    targetSet.delete(tag);
    btn.classList.remove("active");
  } else {
    targetSet.add(tag);
    btn.classList.add("active");
  }
}

function updateSelectedTagsDisplay() {
  selectedTagsDisplay.innerHTML = "";
  const allSelectedTags = [...selectedCategoryTags, ...selectedFilterTags];

  allSelectedTags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "selected-tag";
    span.innerHTML = `${emojiMap[tag] || ""} ${tag} <span class="remove-tag" data-tag="${tag}">&times;</span>`;
    selectedTagsDisplay.appendChild(span);
  });
  
  if (allSelectedTags.length > 0) {
      clearFiltersBtn.classList.remove('hidden');
  } else {
      clearFiltersBtn.classList.add('hidden');
  }

  document.querySelectorAll(".remove-tag").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tagToRemove = e.target.dataset.tag;
      selectedCategoryTags.delete(tagToRemove);
      selectedFilterTags.delete(tagToRemove);
      updateSelectedTagsDisplay();
      filterImages();
    });
  });
}

function filterImages() {
    filteredImageData = allImageData.filter(img => {
        const tags = img.tags;
        const matchesCategory = selectedCategoryTags.size === 0 || [...selectedCategoryTags].every(tag => tags.includes(tag));
        const matchesFilter = selectedFilterTags.size === 0 || [...selectedFilterTags].every(tag => tags.includes(tag));
        return matchesCategory && matchesFilter;
    });

    startRendering();
}
