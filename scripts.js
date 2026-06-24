/**
 * Premium Portfolio Logic Controller
 * Manages SPA routing, state store (LocalStorage), custom liquid cursor,
 * image uploads, canvas compression, photo filters, lightboxes, and physics sliders.
 */

// --- INITIAL DEFAULT IMAGES DATA ---
const DEFAULT_ARTWORKS = [
  {
    id: 'default-1',
    title: 'TCS iON NQT-IT Certificate',
    description: 'National Qualifier Test certification for Information Technology. Verifies aptitude in core algorithms, systems infrastructure, and technical competencies.',
    url: 'assets/cert_nqt.png',
    tags: ['NQT-IT', 'TCS iON', 'Aptitude'],
    glowColor: '#b91c1c',
    glowColorRgb: '185, 28, 28',
    date: 'Jun 24, 2026'
  },
  {
    id: 'default-2',
    title: 'Python Programming Certificate',
    description: 'Certification for Python beginner and intermediate programming fundamentals. Covers data structures, procedural automation, and core code syntaxes.',
    url: 'assets/cert_python.png',
    tags: ['Python', 'Programming', 'Automation'],
    glowColor: '#06b6d4',
    glowColorRgb: '6, 182, 212',
    date: 'Jun 24, 2026'
  },
  {
    id: 'default-3',
    title: 'Internship Certificate',
    description: 'Professional software engineering internship certificate awarded by Squeens Software Private Limited, verifying practical training in web layouts and database flows.',
    url: 'assets/cert_internship.png',
    tags: ['Internship', 'Web Dev', 'Industry'],
    glowColor: '#b89047',
    glowColorRgb: '184, 144, 71',
    date: 'Jun 24, 2026'
  }
];

// --- INITIAL DEFAULT PROJECTS DATA ---
const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    title: 'E-Commerce Website - Premium Keychain',
    date: 'August 2025 - Present',
    techs: ['React.js', 'Node.js', 'MongoDB', 'Razorpay'],
    description: 'Developed and deployed a premium e-commerce website. Integrated Razorpay payment processors, SMTP email triggers for order validation, and optimized page load times.',
    link: 'https://github.com/prithivicr7',
    glowColor: '#06b6d4',
    glowColorRgb: '6, 182, 212'
  },
  {
    id: 'proj-2',
    title: 'AI Parking Allotment System',
    date: 'December 2024',
    techs: ['Python', 'OpenCV', 'TensorFlow', 'MySQL'],
    description: 'Engineered an automated slot allocation and camera-based tracking system. Implemented Haar cascades for slot occupancy detection and machine learning models for license plate indexing.',
    link: 'https://github.com/prithivicr7',
    glowColor: '#b91c1c',
    glowColorRgb: '185, 28, 28'
  },
  {
    id: 'proj-3',
    title: 'Library Management System',
    date: 'July 2023',
    techs: ['Java', 'MySQL', 'Agile'],
    description: 'Led a team of four developers following Agile methodologies. Engineered database search protocols that decreased catalog indexing latency by 40% and reduced post-launch bugs by 30%.',
    link: 'https://github.com/prithivicr7',
    glowColor: '#b89047',
    glowColorRgb: '184, 144, 71'
  }
];

// --- PORTFOLIO STATE STORE ---
let portfolioState = {
  artworks: [],
  projects: []
};

// Load state from local storage or pre-populate defaults
function initializeState() {
  const stored = localStorage.getItem('prithivi_portfolio_state');
  if (stored) {
    try {
      portfolioState = JSON.parse(stored);
      // Force upgrade old default items to new God of War variants
      portfolioState.artworks = portfolioState.artworks.map(art => {
        const match = DEFAULT_ARTWORKS.find(d => d.id === art.id);
        return match ? match : art;
      });
      // Ensure defaults are present if array was cleared
      if (portfolioState.artworks.length === 0) {
        portfolioState.artworks = [...DEFAULT_ARTWORKS];
      }

      // Check, upgrade and initialize projects list
      if (portfolioState.projects) {
        // Filter out any older test projects that contain "portfolio"
        portfolioState.projects = portfolioState.projects.filter(p => !p.title.toLowerCase().includes('portfolio'));
        
        // Ensure "AI Parking Allotment System" is loaded, replacing "Library Management System" (id: proj-2)
        const hasParking = portfolioState.projects.some(p => p.title.toLowerCase().includes('parking'));
        if (!hasParking) {
          portfolioState.projects = portfolioState.projects.filter(p => p.id !== 'proj-2');
          portfolioState.projects.push(DEFAULT_PROJECTS[1]);
        }

        // Ensure "Library Management System" (id: proj-3) is loaded
        const hasLibrary = portfolioState.projects.some(p => p.title.toLowerCase().includes('library'));
        if (!hasLibrary) {
          portfolioState.projects = portfolioState.projects.filter(p => p.id !== 'proj-3');
          portfolioState.projects.push(DEFAULT_PROJECTS[2]);
        }
      } else {
        portfolioState.projects = [...DEFAULT_PROJECTS];
      }
      saveState();
    } catch (e) {
      console.error('Failed to parse portfolio state, loading defaults.', e);
      portfolioState.artworks = [...DEFAULT_ARTWORKS];
      portfolioState.projects = [...DEFAULT_PROJECTS];
    }
  } else {
    portfolioState.artworks = [...DEFAULT_ARTWORKS];
    portfolioState.projects = [...DEFAULT_PROJECTS];
    saveState();
  }
}

function saveState() {
  localStorage.setItem('prithivi_portfolio_state', JSON.stringify(portfolioState));
}

// --- LIQUID CUSTOM CURSOR ---
function initCustomCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let ringX = 0, ringY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth position interpolation (lerp) loop
  function tickCursor() {
    // Fast follow for the solid core
    cursorX += (mouseX - cursorX) * 0.25;
    cursorY += (mouseY - cursorY) * 0.25;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    // Slower lagged follow for the trailing ring
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;

    requestAnimationFrame(tickCursor);
  }
  tickCursor();

  // Attach hover classes to interactive tags
  const interactables = 'a, button, input, textarea, select, .color-option, .filter-btn, .floating-card';
  
  // Delegate event listener to body to automatically catch dynamically added items
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target.matches && e.target.matches(interactables)) {
      document.body.classList.add('hovering');
    }
  }, true);

  document.body.addEventListener('mouseleave', (e) => {
    if (e.target.matches && e.target.matches(interactables)) {
      document.body.classList.remove('hovering');
    }
  }, true);
}

// --- SCROLL NAVIGATION & SPA ROUTER CONTROLS ---
function initScrollNavigation() {
  const navLinks = document.querySelectorAll('nav .nav-links li');
  const sections = document.querySelectorAll('.page-section');

  // IntersectionObserver to highlight navigation tabs dynamically on scroll
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -55% 0px', // Triggers when section occupies the main viewport area
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    // Skip scroll syncing if the dashboard is active
    const dashEl = document.getElementById('dashboard-view');
    if (dashEl && dashEl.style.display === 'flex') return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(item => {
          if (item.getAttribute('data-page') === id) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Anchor smooth scroll behavior correction for direct clicks
  navLinks.forEach(link => {
    const anchor = link.querySelector('a');
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      
      if (targetId === '#dashboard') {
        showDashboard(true);
        history.pushState(null, null, '#dashboard');
      } else {
        showDashboard(false);
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
          // Update URL hash without jumping
          history.pushState(null, null, targetId);
        }
      }
    });
  });

  // Handle back/forward button hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#home';
    if (hash === '#dashboard') {
      showDashboard(true);
    } else {
      showDashboard(false);
      const targetSection = document.querySelector(hash);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Sync initial load routing
  const initialHash = window.location.hash;
  if (initialHash === '#dashboard') {
    showDashboard(true);
  }
}

// --- PHYSICS GALLERY RENDERER ---
function loadGalleryCards() {
  if (window.floatingEngine) {
    window.floatingEngine.clear();
    portfolioState.artworks.forEach(item => {
      window.floatingEngine.addCard(item, openLightbox);
    });
  }
}

// --- LIGHTBOX INTERACTIVE DETAILS MODAL ---
let activeInspectId = null;

function openLightbox(item) {
  const modal = document.getElementById('lightbox-modal');
  const imgView = document.getElementById('modal-image-view');
  const titleText = document.getElementById('modal-title-text');
  const descText = document.getElementById('modal-desc-text');
  const dateText = document.getElementById('modal-date-text');
  const refText = document.getElementById('modal-ref-text');
  const tagsContainer = document.getElementById('modal-tags-container');

  activeInspectId = item.id;
  imgView.src = item.url;
  titleText.textContent = item.title;
  descText.textContent = item.description;
  dateText.textContent = `Uploaded on: ${item.date}`;
  refText.textContent = `#${item.id.toString().substring(0, 8)}`;

  // Inject tags
  tagsContainer.innerHTML = '';
  if (item.tags) {
    item.tags.forEach(tag => {
      const tagChip = document.createElement('span');
      tagChip.className = 'modal-tag';
      tagChip.textContent = tag;
      tagsContainer.appendChild(tagChip);
    });
  }

  // Show modal container
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  document.body.style.overflow = 'hidden'; // Lock base scroll
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 400);
  document.body.style.overflow = ''; // Unlock scroll
  activeInspectId = null;
}

function initLightboxEvents() {
  const closeBtn = document.getElementById('modal-close');
  const modal = document.getElementById('lightbox-modal');
  const deleteBtn = document.getElementById('modal-delete-btn');

  closeBtn.addEventListener('click', closeLightbox);
  
  // Close clicking outer bounds
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  // Escape key close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeLightbox();
    }
  });

  // Delete Card handler
  deleteBtn.addEventListener('click', () => {
    if (!activeInspectId) return;

    if (confirm('Are you sure you want to delete this artwork? This action is permanent.')) {
      // Remove from memory state
      portfolioState.artworks = portfolioState.artworks.filter(art => art.id !== activeInspectId);
      saveState();

      // Remove from physics canvas
      if (window.floatingEngine) {
        window.floatingEngine.removeCard(activeInspectId);
      }

      // Close modal
      closeLightbox();
    }
  });
}

// --- PHOTO UPLOADING HUB & CANVAS FILTERS ---
let rawUploadedImage = null; // Caches raw original Image object before compression
let selectedGlowHex = '#b91c1c';
let selectedGlowRgb = '185, 28, 28';
let activeFilter = 'normal';

function initUploadHub() {
  const dropZone = document.getElementById('upload-drop-zone');
  const fileSelector = document.getElementById('file-selector');
  const dropPrompt = document.getElementById('drop-prompt');
  const previewPanel = document.getElementById('preview-panel');
  const previewCanvas = document.getElementById('preview-canvas');
  const cancelPreviewBtn = document.getElementById('btn-cancel-preview');
  
  const uploadForm = document.getElementById('portfolio-upload-form');
  const colorOptions = document.querySelectorAll('.color-option');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Trigger click on file selector
  dropZone.addEventListener('click', (e) => {
    // Avoid double trigger when clicking items inside dropzone panel
    if (e.target.closest('#preview-panel') || e.target.closest('#btn-cancel-preview') || e.target.closest('#filter-bar')) {
      return;
    }
    fileSelector.click();
  });

  // Drag & Drop visual highlights
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileSelector.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Close/Discard current preview
  cancelPreviewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploadZone();
  });

  // Color picker handler
  colorOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      colorOptions.forEach(btn => btn.classList.remove('active'));
      opt.classList.add('active');
      
      selectedGlowHex = opt.getAttribute('data-color');
      selectedGlowRgb = opt.getAttribute('data-rgb');
    });
  });

  // Filter button triggers
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterBtns.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      
      activeFilter = btn.getAttribute('data-filter');
      applyCanvasFilter();
    });
  });

  // Form submission: launch to floating gallery
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!rawUploadedImage) {
      alert('Please select or drag an image first!');
      return;
    }

    const titleInput = document.getElementById('upload-title');
    const descInput = document.getElementById('upload-desc');
    const tagsInput = document.getElementById('upload-tags');

    // Parse comma separated tags
    const tags = tagsInput.value.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Grab the final filtered image from canvas (JPEG format, 0.8 quality compression)
    const finalDataUrl = previewCanvas.toDataURL('image/jpeg', 0.8);

    // Create item
    const newItem = {
      id: Date.now().toString(),
      title: titleInput.value,
      description: descInput.value,
      url: finalDataUrl,
      tags: tags.length > 0 ? tags : ['Creative'],
      glowColor: selectedGlowHex,
      glowColorRgb: selectedGlowRgb,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    // Update state and save
    portfolioState.artworks.push(newItem);
    saveState();

    // Dynamically insert card in physics canvas
    if (window.floatingEngine) {
      window.floatingEngine.addCard(newItem, openLightbox);
    }

    // Reset inputs
    uploadForm.reset();
    resetUploadZone();

    // Close dashboard and scroll to Gallery section
    showDashboard(false);
    setTimeout(() => {
      const gallerySection = document.getElementById('gallery');
      if (gallerySection) {
        gallerySection.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, null, '#gallery');
      }
    }, 100);
  });
}

function handleFileSelected(file) {
  if (!file.type.match('image.*')) {
    alert('Invalid file format. Please upload an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      rawUploadedImage = img;
      
      // Setup preview panel
      document.getElementById('drop-prompt').style.display = 'none';
      document.getElementById('preview-panel').classList.add('show');
      
      // Auto apply default filter
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === 'normal') btn.classList.add('active');
      });
      activeFilter = 'normal';

      applyCanvasFilter();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function applyCanvasFilter() {
  if (!rawUploadedImage) return;

  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');

  // Limit size of canvas to compress base64 data strings for LocalStorage space safety
  const maxDim = 800;
  let width = rawUploadedImage.width;
  let height = rawUploadedImage.height;

  if (width > height) {
    if (width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    }
  } else {
    if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;

  // Clear canvas context
  ctx.clearRect(0, 0, width, height);

  // Apply context filters
  switch (activeFilter) {
    case 'grayscale':
      ctx.filter = 'grayscale(100%) saturate(110%) contrast(110%)';
      break;
    case 'sepia':
      ctx.filter = 'sepia(100%) contrast(90%) brightness(95%)';
      break;
    case 'warm':
      ctx.filter = 'saturate(140%) sepia(20%) contrast(105%) brightness(102%)';
      break;
    case 'cool':
      ctx.filter = 'hue-rotate(25deg) saturate(120%) contrast(100%)';
      break;
    case 'hue':
      ctx.filter = 'hue-rotate(90deg) saturate(180%) contrast(110%)';
      break;
    default:
      ctx.filter = 'none';
  }

  // Draw image on canvas with selected filter adjustments
  ctx.drawImage(rawUploadedImage, 0, 0, width, height);
}

function resetUploadZone() {
  rawUploadedImage = null;
  document.getElementById('file-selector').value = '';
  document.getElementById('drop-prompt').style.display = 'block';
  document.getElementById('preview-panel').classList.remove('show');
}

// --- DYNAMIC PROJECTS RENDERING ENGINE ---
function loadProjects() {
  const grid = document.getElementById('projects-grid');
  const resumeList = document.getElementById('resume-projects-list');
  if (!grid) return;

  grid.innerHTML = '';
  if (resumeList) resumeList.innerHTML = '';

  portfolioState.projects.forEach((proj, idx) => {
    // Render in main Projects grid
    const card = document.createElement('div');
    card.className = 'glass-panel project-showcase-card';
    card.style.setProperty('--glow-color', proj.glowColor);
    card.style.setProperty('--glow-color-rgb', proj.glowColorRgb);

    const techsHTML = proj.techs.map(tech => `<span class="project-tech-tag">${tech}</span>`).join('');

    card.innerHTML = `
      <div class="project-card-header">
        <h4 class="project-card-title">${proj.title}</h4>
        <span class="project-card-date">${proj.date}</span>
      </div>
      <p class="project-card-desc">${proj.description}</p>
      <div class="project-card-footer">
        <div class="project-techs">${techsHTML}</div>
        <div style="display:flex; gap:12px; align-items:center;">
          <!-- Inline project delete in case they want to clean dashboard items -->
          <button type="button" class="project-delete-btn" onclick="deleteProject('${proj.id}')" title="Delete Project">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <a href="${proj.link}" target="_blank" class="project-link-btn">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Realm
          </a>
        </div>
      </div>
    `;
    grid.appendChild(card);

    // Render in Resume quick summary list
    if (resumeList) {
      const itemBlock = document.createElement('div');
      itemBlock.className = 'project-item-block';
      itemBlock.innerHTML = `
        <h4 class="project-block-title">${proj.title}</h4>
        <span class="project-block-date">${proj.date}</span>
        <div class="project-techs">${techsHTML}</div>
        <p class="project-block-desc">${proj.description}</p>
      `;
      resumeList.appendChild(itemBlock);
    }
  });
}

// Global scope project deletion hook
window.deleteProject = function(id) {
  if (confirm('Are you sure you want to delete this project? This action is permanent.')) {
    portfolioState.projects = portfolioState.projects.filter(p => p.id !== id);
    saveState();
    loadProjects();
  }
};

// --- DASHBOARD DYNAMIC PROJECT UPLOADER ---
let selectedProjectGlowHex = '#06b6d4';
let selectedProjectGlowRgb = '6, 182, 212';

function initProjectUploader() {
  const projectForm = document.getElementById('project-upload-form');
  const colorOptions = document.querySelectorAll('#project-color-picker .color-option');
  const closeDashBtn = document.getElementById('btn-close-dashboard');

  if (closeDashBtn) {
    closeDashBtn.addEventListener('click', () => {
      showDashboard(false);
      // Return to home section
      const homeSection = document.getElementById('home');
      if (homeSection) {
        homeSection.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, null, '#home');
      }
    });
  }

  // Bind project color option picks
  colorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      colorOptions.forEach(btn => btn.classList.remove('active'));
      opt.classList.add('active');
      selectedProjectGlowHex = opt.getAttribute('data-color');
      selectedProjectGlowRgb = opt.getAttribute('data-rgb');
    });
  });

  if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const titleInput = document.getElementById('project-title');
      const dateInput = document.getElementById('project-date');
      const techsInput = document.getElementById('project-techs-input');
      const descInput = document.getElementById('project-desc');
      const linkInput = document.getElementById('project-link');

      const techs = techsInput.value.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const newProject = {
        id: 'proj-' + Date.now().toString(),
        title: titleInput.value,
        date: dateInput.value,
        techs: techs.length > 0 ? techs : ['Development'],
        description: descInput.value,
        link: linkInput.value,
        glowColor: selectedProjectGlowHex,
        glowColorRgb: selectedProjectGlowRgb
      };

      // Add to state and save
      portfolioState.projects.push(newProject);
      saveState();

      // Render update
      loadProjects();

      // Reset inputs
      projectForm.reset();
      colorOptions.forEach(btn => btn.classList.remove('active'));
      if (colorOptions[0]) colorOptions[0].classList.add('active');
      selectedProjectGlowHex = '#06b6d4';
      selectedProjectGlowRgb = '6, 182, 212';

      // Close dashboard and scroll to projects section
      showDashboard(false);
      setTimeout(() => {
        const projectsSection = document.getElementById('projects');
        if (projectsSection) {
          projectsSection.scrollIntoView({ behavior: 'smooth' });
          history.pushState(null, null, '#projects');
        }
      }, 100);
    });
  }
}

// --- SPA VIEW ROUTER ENGINE ---
function showDashboard(visible) {
  const mainEl = document.querySelector('main');
  const footerEl = document.querySelector('footer');
  const dashEl = document.getElementById('dashboard-view');
  const navLinks = document.querySelectorAll('nav .nav-links li');

  if (visible) {
    if (mainEl) mainEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'none';
    if (dashEl) dashEl.style.display = 'flex';

    // Highlight dashboard link
    navLinks.forEach(item => {
      if (item.getAttribute('data-page') === 'dashboard') {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    document.body.style.overflowY = 'hidden'; // Disable scroll background
  } else {
    if (mainEl) mainEl.style.display = 'block';
    if (footerEl) footerEl.style.display = 'flex';
    if (dashEl) dashEl.style.display = 'none';

    document.body.style.overflowY = 'auto'; // Enable scroll

    // Restore correct navigation active state based on offset positions
    syncActiveSectionHighlight();
  }
}

function syncActiveSectionHighlight() {
  const scrollPos = window.scrollY + 200;
  const sections = document.querySelectorAll('.page-section');
  const navLinks = document.querySelectorAll('nav .nav-links li');

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.id;

    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach(item => {
        if (item.getAttribute('data-page') === id) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });
}

// --- PHYSICS CANVAS CONTROL INPUTS ---
function initPhysicsControls() {
  const toggleBtn = document.getElementById('control-toggle');
  const panel = document.getElementById('physics-panel');

  const paramSpeed = document.getElementById('param-speed');
  const paramBounce = document.getElementById('param-bounce');
  const paramFriction = document.getElementById('param-friction');
  const paramCollisions = document.getElementById('param-collisions');
  const paramGravity = document.getElementById('param-gravity');

  const valSpeed = document.getElementById('val-speed');
  const valBounce = document.getElementById('val-bounce');
  const valFriction = document.getElementById('val-friction');

  // Toggle Control panel menu
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.classList.contains('show')) {
      panel.classList.remove('show');
      setTimeout(() => { panel.style.display = 'none'; }, 300);
    } else {
      panel.style.display = 'flex';
      setTimeout(() => { panel.classList.add('show'); }, 10);
    }
  });

  // Close panel on clicking outer bounds
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !e.target.closest('#physics-panel') && e.target !== toggleBtn) {
      panel.classList.remove('show');
      setTimeout(() => { panel.style.display = 'none'; }, 300);
    }
  });

  // Slider bindings
  paramSpeed.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    valSpeed.textContent = val.toFixed(1);
    if (window.floatingEngine) window.floatingEngine.updateSettings({ speedFactor: val });
  });

  paramBounce.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    valBounce.textContent = val.toFixed(2);
    if (window.floatingEngine) window.floatingEngine.updateSettings({ bounciness: val });
  });

  paramFriction.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    valFriction.textContent = val.toFixed(2);
    if (window.floatingEngine) window.floatingEngine.updateSettings({ friction: val });
  });

  paramCollisions.addEventListener('change', (e) => {
    if (window.floatingEngine) window.floatingEngine.updateSettings({ enableCollisions: e.target.checked });
  });

  paramGravity.addEventListener('change', (e) => {
    if (window.floatingEngine) window.floatingEngine.updateSettings({ enableGravity: e.target.checked });
  });
}

// --- MAIN RUNTIME INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Load LocalStorage and default states
  initializeState();

  // Load custom magnetic tracking cursor
  initCustomCursor();

  // Run the physics canvas engine
  if (typeof window.floatingEngine === 'undefined' && typeof window.FloatingEngine !== 'undefined') {
    window.floatingEngine = new window.FloatingEngine();
  }
  if (window.floatingEngine && typeof window.floatingEngine.init === 'function') {
    window.floatingEngine.init('canvas-container');
  } else {
    console.error("FloatingEngine is not initialized properly.");
  }

  // Populate floating elements in canvas
  loadGalleryCards();

  // Populate projects list dynamically
  loadProjects();

  // Initialize scroll navigation and active nav highlights
  initScrollNavigation();

  // Set drag upload actions
  initUploadHub();

  // Set project uploader forms
  initProjectUploader();

  // Set slider bindings
  initPhysicsControls();

  // Set lightbox close triggers
  initLightboxEvents();
});
