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

// ✅ सुधार: टैग्स को दो अलग-अलग सेट में बांटा गया
let selectedCategoryTags = new Set(); // 'Category' 📁 के लिए (OR लॉजिक)
let selectedFilterTags = new Set(); // बाकी सब के लिए (AND लॉजिक)

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


// ✅ Load images
fetch("images.json")
  .then(res => res.json())
  .then(images => {
    images.forEach(img => {
      const div = document.createElement("div");
      div.className = "image-item";
      div.setAttribute("data-tags", img.tags.join(",")); 
      div.innerHTML = `<img data-src="${img.filename}" class="lazy" alt="${img.filename.replace('.webp', '.png')}" />`;
      imageGrid.appendChild(div);
    });
    filterImages();
    initializeLazyLoading();
  })
  .catch(err => console.error("❌ Error loading images:", err));


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
  
  // ✅ सुधार: 'Category' बटन को एक ख़ास ID दी गई
  if (category === 'Category') {
      btn.id = 'mainCategoryBtn';
  }

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
      toggleTag(tag, subBtn, category); // ✅ सुधार: कैटेगरी का नाम भी भेजा गया
      updateSelectedTagsDisplay();
      filterImages();
    });
    subcategoryButtons.appendChild(subBtn);
  });
}

// ✅ सुधार: toggleTag फंक्शन को अपडेट किया गया ताकि वह सही सेट में टैग्स डाले
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

// ✅ सुधार: updateSelectedTagsDisplay फंक्शन को अपडेट किया गया ताकि वह दोनों सेट से टैग्स दिखाए
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

// ✅ सुधार: filterImages फंक्शन में नया AND/OR लॉजिक डाला गया
function filterImages() {
  const allImages = document.querySelectorAll(".image-item");
  allImages.forEach(item => {
    const imageTags = item.dataset.tags.split(",");
    
    // OR लॉजिक 'Category' के लिए
    const categoryMatch = selectedCategoryTags.size === 0 || 
                          [...selectedCategoryTags].some(tag => imageTags.includes(tag));
                          
    // AND लॉजिक बाकी फिल्टर्स के लिए
    const filterMatch = selectedFilterTags.size === 0 || 
                        [...selectedFilterTags].every(tag => imageTags.includes(tag));
    
    // इमेज तभी दिखेगी जब दोनों शर्तें पूरी होंगी
    if (categoryMatch && filterMatch) {
        item.style.display = "block";
    } else {
        item.style.display = "none";
    }
  });
}

document.addEventListener("click", function (event) {
  if (isPopupOpen && !popup.contains(event.target) && !event.target.classList.contains("tag-btn")) {
    popup.classList.add("hidden");
    isPopupOpen = false;
  }
});

// लाइटबॉक्स को खोलने और बंद करने का लॉजिक
imageGrid.addEventListener('click', function(e) {
  if (e.target.tagName === 'IMG') {
    lightbox.classList.remove('hidden');
    const highQualitySrc = e.target.src.replace('.webp', '.png');
    lightboxImage.src = highQualitySrc;
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
    selectedCategoryTags.clear();
    selectedFilterTags.clear();
    document.querySelectorAll('#subcategoryButtons .tag-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    updateSelectedTagsDisplay();
    filterImages();
});
