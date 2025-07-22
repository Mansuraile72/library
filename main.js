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
const toastNotification = document.getElementById("toast-notification");

// ✅ इनफिनिट स्क्रॉल के लिए वेरिएबल्स
let allImagesData = []; 
let filteredImagesData = []; 
let currentImageIndex = 0; 
const imagesPerLoad = 100;
let isLoading = false; 

let selectedTags = new Set();
let isPopupOpen = false;
let zoomSize = 100;

// ✅ Responsive Zoom System
function updateZoom() {
  document.documentElement.style.setProperty('--img-size', `${zoomSize}px`);
}
zoomInBtn.addEventListener("click", () => {
  zoomSize = Math.min(zoomSize + 20, 400);
  updateZoom();
  checkAndLoadMore(); // सुधार: ज़ूम इन के बाद चेक करें कि और इमेज लोड करनी है या नहीं
});
zoomOutBtn.addEventListener("click", () => {
  zoomSize = Math.max(zoomSize - 20, 50);
  updateZoom();
  checkAndLoadMore(); // सुधार: ज़ूम आउट के बाद चेक करें कि और इमेज लोड करनी है या नहीं
});
updateZoom();

// ✅ स्क्रॉल पर हेडर दिखाने/छिपाने के लिए लॉजिक
let lastScrollTop = 0;
const krantikariArea = document.querySelector('.krantikari-area');
window.addEventListener("scroll", function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) { 
        krantikariArea.classList.add('hidden-nav');
    } else {
        krantikariArea.classList.remove('hidden-nav');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, false);

// ✅ Load images (सिर्फ एक बार)
fetch("images.json")
  .then(res => res.json())
  .then(images => {
    allImagesData = images;
    filteredImagesData = images;
    loadMoreImages();
  })
  .catch(err => console.error("❌ Error loading images:", err));

// ✅ सुधार: यह फंक्शन चेक करेगा कि स्क्रीन भरने के लिए और इमेज चाहिए या नहीं
function checkAndLoadMore() {
    if (isLoading) return;
    // अगर स्क्रॉलबार नहीं है और लोड करने के लिए और इमेज हैं
    if (document.body.scrollHeight <= window.innerHeight && currentImageIndex < filteredImagesData.length) {
        loadMoreImages();
    }
}

// ✅ इमेज लोड करने का फंक्शन
function loadMoreImages() {
    if (isLoading) return;
    isLoading = true;

    const batch = filteredImagesData.slice(currentImageIndex, currentImageIndex + imagesPerLoad);

    batch.forEach(img => {
      const div = document.createElement("div");
      div.className = "image-item";
      div.setAttribute("data-tags", img.tags.join(",")); 
      div.innerHTML = `<img data-src="${img.filename}" class="lazy" alt="${img.filename.replace('.webp', '.png')}" />`;
      imageGrid.appendChild(div);
    });

    initializeLazyLoading();
    currentImageIndex += imagesPerLoad;
    isLoading = false;
    
    // लोड होने के बाद फिर से चेक करें, ताकि स्क्रीन पूरी तरह भर जाए
    setTimeout(checkAndLoadMore, 100); 
}

// ✅ लेज़ी लोडिंग के लिए Intersection Observer
function initializeLazyLoading() {
  const lazyImages = document.querySelectorAll('img.lazy:not(.observed)');
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove("lazy");
          lazyImage.classList.add("observed");
          lazyImage.onload = () => lazyImage.style.opacity = '1'; 
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        img.style.opacity = '1';
    });
  }
}

// ✅ Load Krantikari buttons
Object.keys(categories).forEach(category => {
  const btn = document.createElement("button");
  btn.className = "tag-btn large-btn";
  btn.innerText = `${emojiMap[category] || ""} ${category}`;
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
    if (selectedTags.has(tag)) subBtn.classList.add("active");
    subBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTag(tag, subBtn);
      filterImages();
    });
    subcategoryButtons.appendChild(subBtn);
  });
}

function toggleTag(tag, btn) {
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag);
    btn.classList.remove("active");
  } else {
    selectedTags.add(tag);
    btn.classList.add("active");
  }
  updateSelectedTagsDisplay();
}

function updateSelectedTagsDisplay() {
  selectedTagsDisplay.innerHTML = "";
  selectedTags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "selected-tag";
    span.innerHTML = `${emojiMap[tag] || ""} ${tag} <span class="remove-tag" data-tag="${tag}">&times;</span>`;
    selectedTagsDisplay.appendChild(span);
  });
  
  if (selectedTags.size > 0) {
      clearFiltersBtn.classList.remove('hidden');
  } else {
      clearFiltersBtn.classList.add('hidden');
  }
}

// ✅ सुधार: टैग हटाने का लॉजिक अब इस नए Event Listener से चलेगा
selectedTagsDisplay.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-tag')) {
        const tagToRemove = e.target.dataset.tag;
        selectedTags.delete(tagToRemove);

        // पॉपअप में संबंधित बटन को भी डीएक्टिवेट करें
        const subcategoryButtons = document.querySelectorAll('#subcategoryButtons .tag-btn');
        subcategoryButtons.forEach(btn => {
            if(btn.innerText.includes(tagToRemove)){
                btn.classList.remove('active');
            }
        });
        
        updateSelectedTagsDisplay();
        filterImages();
    }
});

function filterImages() {
    if (selectedTags.size === 0) {
        filteredImagesData = allImagesData;
    } else {
        filteredImagesData = allImagesData.filter(item => {
            const tags = item.tags;
            return [...selectedTags].every(tag => tags.includes(tag));
        });
    }
    imageGrid.innerHTML = '';
    currentImageIndex = 0;
    loadMoreImages();
}

document.addEventListener("click", function (event) {
  if (isPopupOpen && !popup.contains(event.target) && !event.target.classList.contains("tag-btn")) {
    popup.classList.add("hidden");
    isPopupOpen = false;
  }
});

// लाइटबॉक्स का लॉजिक
imageGrid.addEventListener('click', function(e) {
  if (e.target.tagName === 'IMG') {
    const clickedImage = e.target;
    const highQualitySrc = clickedImage.src.replace('.webp', '.png');
    lightboxImage.src = highQualitySrc;
    lightbox.classList.remove('hidden');
    
    const fullPath = clickedImage.alt;
    const filenameOnly = fullPath.substring(fullPath.lastIndexOf('/') + 1);
    const filenameToCopy = filenameOnly.replace('.png', '.svg');
    
    navigator.clipboard.writeText(filenameToCopy).then(() => {
        toastNotification.classList.remove('hidden');
        setTimeout(() => {
            toastNotification.classList.add('hidden');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
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

// Clear All बटन के लिए Click Listener
clearFiltersBtn.addEventListener('click', function() {
    selectedTags.clear();
    document.querySelectorAll('#subcategoryButtons .tag-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    updateSelectedTagsDisplay();
    filterImages();
});

// स्क्रॉल करने पर और इमेज लोड करने का लॉजिक
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && currentImageIndex < filteredImagesData.length) {
        loadMoreImages();
    }
});
