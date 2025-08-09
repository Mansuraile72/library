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
const stickyHeader = document.getElementById("stickyHeader");

// ✅ सुधार: Include/Exclude फिल्टरिंग के लिए वेरिएबल्स
let allImageData = [];
let filteredImageData = [];
let currentImageIndex = 0;
const BATCH_SIZE = 50; 

let selectedCategoryIncludeTags = new Set();
let selectedCategoryExcludeTags = new Set();
let selectedFilterIncludeTags = new Set();
let selectedFilterExcludeTags = new Set();

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

// स्टिकी एलिमेंट्स की पोजीशन और बॉडी पैडिंग सेट करने का लॉजिक
function setBodyPadding() {
    const headerHeight = stickyHeader.offsetHeight;
    document.body.style.paddingTop = `${headerHeight}px`;
}

// स्क्रॉल पर हेडर और टैग्स पट्टी दिखाने/छिपाने के लिए लॉजिक
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

popup.addEventListener('mouseenter', () => clearTimeout(popupCloseTimeout));
popup.addEventListener('mouseleave', () => closePopup());

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
    
    const isInclude = (category === 'Category' ? selectedCategoryIncludeTags : selectedFilterIncludeTags).has(tag);
    const isExclude = (category === 'Category' ? selectedCategoryExcludeTags : selectedFilterExcludeTags).has(tag);

    if (isInclude) subBtn.classList.add("active-include");
    if (isExclude) subBtn.classList.add("active-exclude");

    subBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      cycleTagState(tag, subBtn, category); 
      updateSelectedTagsDisplay();
      filterImages();
    });
    subcategoryButtons.appendChild(subBtn);
  });
}

// ✅ सुधार: टैग की स्टेट बदलने का नया फंक्शन (Include -> Exclude -> Off)
function cycleTagState(tag, btn, category) {
    const includeSet = category === 'Category' ? selectedCategoryIncludeTags : selectedFilterIncludeTags;
    const excludeSet = category === 'Category' ? selectedCategoryExcludeTags : selectedFilterExcludeTags;

    if (includeSet.has(tag)) {
        // State 1: Include -> Exclude
        includeSet.delete(tag);
        excludeSet.add(tag);
        btn.classList.remove('active-include');
        btn.classList.add('active-exclude');
    } else if (excludeSet.has(tag)) {
        // State 2: Exclude -> Off
        excludeSet.delete(tag);
        btn.classList.remove('active-exclude');
    } else {
        // State 3: Off -> Include
        includeSet.add(tag);
        btn.classList.add('active-include');
    }
}

// ✅ सुधार: दोनों तरह के टैग्स (Include/Exclude) को दिखाने का लॉजिक
function updateSelectedTagsDisplay() {
  selectedTagsDisplay.innerHTML = "";
  const allIncludeTags = [...selectedCategoryIncludeTags, ...selectedFilterIncludeTags];
  const allExcludeTags = [...selectedCategoryExcludeTags, ...selectedFilterExcludeTags];

  allIncludeTags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "selected-tag included-tag"; // Include के लिए क्लास
    span.innerHTML = `+ ${tag} <span class="remove-tag" data-tag="${tag}">&times;</span>`;
    selectedTagsDisplay.appendChild(span);
  });
  
  allExcludeTags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "selected-tag excluded-tag"; // Exclude के लिए क्लास
    span.innerHTML = `- ${tag} <span class="remove-tag" data-tag="${tag}">&times;</span>`;
    selectedTagsDisplay.appendChild(span);
  });
  
  if (allIncludeTags.length > 0 || allExcludeTags.length > 0) {
      clearFiltersBtn.classList.remove('hidden');
  } else {
      clearFiltersBtn.classList.add('hidden');
  }

  document.querySelectorAll(".remove-tag").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tagToRemove = e.target.dataset.tag;
      // सभी सेट से टैग हटाएं
      selectedCategoryIncludeTags.delete(tagToRemove);
      selectedCategoryExcludeTags.delete(tagToRemove);
      selectedFilterIncludeTags.delete(tagToRemove);
      selectedFilterExcludeTags.delete(tagToRemove);
      updateSelectedTagsDisplay();
      filterImages();
    });
  });
  setTimeout(setBodyPadding, 0);
}

// ✅ सुधार: Include/Exclude वाला नया फिल्टर लॉजिक
function filterImages() {
    filteredImageData = allImageData.filter(item => {
        const imageTags = item.tags;
        
        // OR लॉजिक 'Category' के Include टैग्स के लिए
        const categoryIncludeMatch = selectedCategoryIncludeTags.size === 0 || 
                                     [...selectedCategoryIncludeTags].some(tag => imageTags.includes(tag));
        
        // AND लॉजिक बाकी फिल्टर्स के Include टैग्स के लिए
        const filterIncludeMatch = selectedFilterIncludeTags.size === 0 || 
                                   [...selectedFilterIncludeTags].every(tag => imageTags.includes(tag));

        // NOT लॉजिक 'Category' के Exclude टैग्स के लिए
        const categoryExcludeMatch = [...selectedCategoryExcludeTags].every(tag => !imageTags.includes(tag));

        // NOT लॉजिक बाकी फिल्टर्स के Exclude टैग्स के लिए
        const filterExcludeMatch = [...selectedFilterExcludeTags].every(tag => !imageTags.includes(tag));
        
        return categoryIncludeMatch && filterIncludeMatch && categoryExcludeMatch && filterExcludeMatch;
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
    }).catch(err => console.error('Failed to copy: ', err));
  }
});

function closeLightbox() {
  lightbox.classList.add('hidden');
}
closeLightboxBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Clear All बटन
clearFiltersBtn.addEventListener('click', function() {
    selectedCategoryIncludeTags.clear();
    selectedCategoryExcludeTags.clear();
    selectedFilterIncludeTags.clear();
    selectedFilterExcludeTags.clear();
    
    document.querySelectorAll('#subcategoryButtons .tag-btn.active-include, #subcategoryButtons .tag-btn.active-exclude').forEach(btn => {
        btn.classList.remove('active-include', 'active-exclude');
    });
    updateSelectedTagsDisplay();
    filterImages();
});

// पेज लोड होने पर और विंडो का आकार बदलने पर बॉडी पैडिंग सेट करें
window.addEventListener('load', setBodyPadding);
window.addEventListener('resize', setBodyPadding);
