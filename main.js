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
// ✅ सुधार: नए स्टिकी हेडर का reference
const stickyHeader = document.getElementById("stickyHeader");

// इनफिनिट स्क्रॉल और फिल्टरिंग के लिए वेरिएबल्स
let allImageData = [];
let filteredImageData = [];
let currentImageIndex = 0;
const BATCH_SIZE = 50; 

let selectedCategoryTags = new Set();
let selectedFilterTags = new Set();

let isPopupOpen = false;
let zoomSize = 100;
let popupCloseTimeout;

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

// ✅ सुधार: बॉडी पैडिंग सेट करने का लॉजिक
function setBodyPadding() {
    const headerHeight = stickyHeader.offsetHeight;
    document.body.style.paddingTop = `${headerHeight}px`;
}

// ✅ सुधार: स्क्रॉल पर सिर्फ एक कंटेनर को छिपाने/दिखाने का लॉजिक
let lastScrollTop = 0;
window.addEventListener("scroll", function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) { 
        stickyHeader.classList.add('hidden');
    } else {
        stickyHeader.classList.remove('hidden');
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
    if (sentinelObserver) sentinelObserver.disconnect();
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

  btn.addEventListener("mouseenter", (e) => {
    clearTimeout(popupCloseTimeout);
    openPopup(category, e.target);
  });

  btn.addEventListener("mouseleave", () => {
    popupCloseTimeout = setTimeout(() => {
        closePopup();
    }, 300);
  });

  krantikariButtons.appendChild(btn);
});

popup.addEventListener('mouseenter', () => {
    clearTimeout(popupCloseTimeout);
});
popup.addEventListener('mouseleave', () => {
    closePopup();
});

function closePopup() {
    popup.classList.add('hidden');
    isPopupOpen = false;
}

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
      if(selectedCategoryTags.has(tagToRemove)) {
          selectedCategoryTags.delete(tagToRemove);
      } else {
          selectedFilterTags.delete(tagToRemove);
      }
      updateSelectedTagsDisplay();
      filterImages();
    });
  });
  setTimeout(setBodyPadding, 0);
}

function filterImages() {
    filteredImageData = allImageData.filter(item => {
        const imageTags = item.tags;
        
        const categoryMatch = selectedCategoryTags.size === 0 || 
                              [...selectedCategoryTags].some(tag => imageTags.includes(tag));
                              
        const filterMatch = selectedFilterTags.size === 0 || 
                            [...selectedFilterTags].every(tag => imageTags.includes(tag));
        
        return categoryMatch && filterMatch;
    });

    startRendering();
}

document.addEventListener("click", function (event) {
  if (isPopupOpen && !popup.contains(event.target) && !event.target.classList.contains("tag-btn")) {
    closePopup();
  }
});

// लाइटबॉक्स और कॉपी फंक्शन
imageGrid.addEventListener('click', function(e) {
  if (e.target.tagName === 'IMG') {
    lightbox.classList.remove('hidden');
    const highQualitySrc = e.target.src.replace('.webp', '.png');
    lightboxImage.src = highQualitySrc;

    const fullPath = e.target.alt; 
    const pathParts = fullPath.split('/');
    const filenameOnly = pathParts[pathParts.length - 1];
    const svgFilename = filenameOnly.replace(/\.png$/, '.svg'); 

    navigator.clipboard.writeText(svgFilename).then(() => {
      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.textContent = `Copied: ${svgFilename}`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
});

function closeLightbox() {
  lightbox.classList.add('hidden');
}
closeLightboxBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function(e) {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// Clear All बटन
clearFiltersBtn.addEventListener('click', function() {
    selectedCategoryTags.clear();
    selectedFilterTags.clear();
    document.querySelectorAll('#subcategoryButtons .tag-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    updateSelectedTagsDisplay();
    filterImages();
});

// पेज लोड होने पर और विंडो का आकार बदलने पर बॉडी पैडिंग सेट करें
window.addEventListener('load', setBodyPadding);
window.addEventListener('resize', setBodyPadding);
