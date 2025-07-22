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

// ✅ सुधार: इनफिनिट स्क्रॉल के लिए नए वेरिएबल्स
let allImagesData = []; // images.json से आया सारा डेटा यहाँ स्टोर होगा
let filteredImagesData = []; // फ़िल्टर होने के बाद इमेज का डेटा यहाँ रहेगा
let currentImageIndex = 0; // कितनी इमेज दिख चुकी हैं, उसका हिसाब रखेगा
const imagesPerLoad = 100; // एक बार में कितनी इमेज लोड करनी हैं
let isLoading = false; // यह सुनिश्चित करने के लिए कि एक साथ कई बार लोडिंग शुरू न हो

let selectedTags = new Set();
let isPopupOpen = false;
let zoomSize = 140;

// ✅ Responsive Zoom System
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
    allImagesData = images; // सारा डेटा वेरिएबल में स्टोर करें
    filteredImagesData = images; // शुरुआत में फ़िल्टर की हुई लिस्ट पूरी लिस्ट होगी
    loadMoreImages(); // पहली बार कुछ इमेज लोड करें
  })
  .catch(err => console.error("❌ Error loading images:", err));


// ✅ सुधार: इमेज लोड करने का नया फंक्शन
function loadMoreImages() {
    if (isLoading) return; // अगर पहले से लोड हो रहा है, तो कुछ न करें
    isLoading = true;

    // डेटा के अगले बैच को चुनें
    const batch = filteredImagesData.slice(currentImageIndex, currentImageIndex + imagesPerLoad);

    batch.forEach(img => {
      const div = document.createElement("div");
      div.className = "image-item";
      div.setAttribute("data-tags", img.tags.join(",")); 
      div.innerHTML = `<img data-src="${img.filename}" class="lazy" alt="${img.filename.replace('.webp', '.png')}" />`;
      imageGrid.appendChild(div);
    });

    initializeLazyLoading(); // नई आई इमेज पर लेज़ी लोडिंग शुरू करें
    currentImageIndex += imagesPerLoad; // इंडेक्स को आगे बढ़ाएं
    isLoading = false;
}

// ✅ लेज़ी लोडिंग के लिए Intersection Observer
function initializeLazyLoading() {
  const lazyImages = document.querySelectorAll('img.lazy');
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove("lazy");
          lazyImage.onload = () => lazyImage.style.opacity = '1'; 
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Fallback for older browsers
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
      // ✅ सुधार: अब filterImages को कॉल होगा
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

  document.querySelectorAll(".remove-tag").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tag = e.target.dataset.tag;
      selectedTags.delete(tag);
      filterImages();
    });
  });
}

// ✅ सुधार: filterImages फंक्शन को पूरी तरह से बदल दिया गया है
function filterImages() {
    if (selectedTags.size === 0) {
        filteredImagesData = allImagesData;
    } else {
        filteredImagesData = allImagesData.filter(item => {
            const tags = item.tags;
            return [...selectedTags].every(tag => tags.includes(tag));
        });
    }

    // ग्रिड को साफ करें और फिर से शुरू करें
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

// ✅ लाइटबॉक्स का लॉजिक
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

// ✅ Clear All बटन के लिए Click Listener
clearFiltersBtn.addEventListener('click', function() {
    selectedTags.clear();
    document.querySelectorAll('#subcategoryButtons .tag-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    updateSelectedTagsDisplay();
    filterImages();
});

// ✅ सुधार: स्क्रॉल करने पर और इमेज लोड करने का लॉजिक
window.addEventListener('scroll', () => {
    // अगर उपयोगकर्ता पेज के नीचे के करीब पहुँच गया है और लोड करने के लिए और इमेज हैं
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && currentImageIndex < filteredImagesData.length) {
        loadMoreImages();
    }
});