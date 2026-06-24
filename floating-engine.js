/**
 * Premium 2D Physics Floating Image Engine
 * Handles drifting, bounding box collisions, momentum dragging/throwing,
 * 3D parallax tilting on hover, and soft collision pushing between cards.
 */

class FloatingEngine {
  constructor() {
    this.container = null;
    this.cards = [];
    this.animationFrameId = null;
    
    // Global Physics Settings
    this.settings = {
      speedFactor: 1.0,
      bounciness: 0.8,
      friction: 0.98,
      enableCollisions: true,
      enableGravity: false
    };

    // Screen Dimensions
    this.width = 0;
    this.height = 0;

    // Track Mouse for Parallax Tilting
    this.mouseX = 0;
    this.mouseY = 0;

    // Bind event handlers
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.loop = this.loop.bind(this);
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);

    // Start physics loops
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.clear();
  }

  handleResize() {
    if (!this.container) return;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    // Recalculate limits for existing cards
    this.cards.forEach(card => {
      card.clampToBoundaries(this.width, this.height);
    });
  }

  handleMouseMove(e) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  clear() {
    this.cards.forEach(card => card.destroy());
    this.cards = [];
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  addCard(item, onInspect) {
    const cardInstance = new FloatingCard(item, this.container, onInspect);
    // Randomize initial position and small drift velocity
    cardInstance.x = Math.random() * (this.width - 250);
    cardInstance.y = Math.random() * (this.height - 250);
    
    // Safety check in case random numbers cause clipping
    if (cardInstance.x < 0) cardInstance.x = 10;
    if (cardInstance.y < 0) cardInstance.y = 10;

    cardInstance.vx = (Math.random() - 0.5) * 1.5;
    cardInstance.vy = (Math.random() - 0.5) * 1.5;

    this.cards.push(cardInstance);
    return cardInstance;
  }

  removeCard(id) {
    const index = this.cards.findIndex(card => card.id === id);
    if (index !== -1) {
      this.cards[index].destroy();
      this.cards.splice(index, 1);
    }
  }

  loop() {
    if (!this.container) return;

    const dt = 1; // Simulation step multiplier

    // 1. Process physics and boundary bounces
    this.cards.forEach(card => {
      if (card.isDragging) return;

      // Apply heavy gravity if enabled
      if (this.settings.enableGravity) {
        card.vy += 0.15; // Gravity acceleration vector
      } else {
        // Subtle constant natural organic drift (tiny random acceleration)
        card.vx += (Math.random() - 0.5) * 0.05;
        card.vy += (Math.random() - 0.5) * 0.05;
      }

      // Apply drag friction (inertial slowing)
      card.vx *= this.settings.friction;
      card.vy *= this.settings.friction;

      // Update positions
      card.x += card.vx * this.settings.speedFactor * dt;
      card.y += card.vy * this.settings.speedFactor * dt;

      // Border bounds bouncing
      const bounce = this.settings.bounciness;
      const margin = 0.5;

      if (card.x <= 0) {
        card.x = 0;
        card.vx = Math.abs(card.vx) * bounce;
      } else if (card.x >= this.width - card.width) {
        card.x = this.width - card.width;
        card.vx = -Math.abs(card.vx) * bounce;
      }

      if (card.y <= 0) {
        card.y = 0;
        card.vy = Math.abs(card.vy) * bounce;
      } else if (card.y >= this.height - card.height) {
        card.y = this.height - card.height;
        card.vy = -Math.abs(card.vy) * bounce;
      }
    });

    // 2. Perform card-to-card collisions (push-away & velocity swaps)
    if (this.settings.enableCollisions && this.cards.length > 1) {
      for (let i = 0; i < this.cards.length; i++) {
        for (let j = i + 1; j < this.cards.length; j++) {
          const c1 = this.cards[i];
          const c2 = this.cards[j];
          
          this.resolveCollision(c1, c2);
        }
      }
    }

    // 3. Render layouts and custom visual tilts
    this.cards.forEach(card => {
      card.render(this.mouseX, this.mouseY);
    });

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  resolveCollision(c1, c2) {
    // Get center points of both cards
    const r1 = {
      x: c1.x + c1.width / 2,
      y: c1.y + c1.height / 2,
      w: c1.width,
      h: c1.height
    };
    const r2 = {
      x: c2.x + c2.width / 2,
      y: c2.y + c2.height / 2,
      w: c2.width,
      h: c2.height
    };

    // Horizontal and vertical distance between centers
    const dx = r2.x - r1.x;
    const dy = r2.y - r1.y;

    // Minimum distance required to not overlap
    const minX = (r1.w + r2.w) / 2;
    const minY = (r1.h + r2.h) / 2;

    const overlapX = minX - Math.abs(dx);
    const overlapY = minY - Math.abs(dy);

    // If both overlap, collision is happening
    if (overlapX > 0 && overlapY > 0) {
      // Resolve along the axis of minimum overlap
      if (overlapX < overlapY) {
        const sign = dx > 0 ? 1 : -1;
        
        // Push apart (only adjust if not dragged)
        if (!c1.isDragging && !c2.isDragging) {
          c1.x -= (overlapX / 2) * sign;
          c2.x += (overlapX / 2) * sign;
          
          // Swap and damp X velocities
          const tempVx = c1.vx;
          c1.vx = c2.vx * this.settings.bounciness;
          c2.vx = tempVx * this.settings.bounciness;
        } else if (c1.isDragging && !c2.isDragging) {
          c2.x += overlapX * sign;
          c2.vx = c1.vx * 1.2;
        } else if (!c1.isDragging && c2.isDragging) {
          c1.x -= overlapX * sign;
          c1.vx = c2.vx * 1.2;
        }
      } else {
        const sign = dy > 0 ? 1 : -1;
        
        if (!c1.isDragging && !c2.isDragging) {
          c1.y -= (overlapY / 2) * sign;
          c2.y += (overlapY / 2) * sign;
          
          // Swap and damp Y velocities
          const tempVy = c1.vy;
          c1.vy = c2.vy * this.settings.bounciness;
          c2.vy = tempVy * this.settings.bounciness;
        } else if (c1.isDragging && !c2.isDragging) {
          c2.y += overlapY * sign;
          c2.vy = c1.vy * 1.2;
        } else if (!c1.isDragging && c2.isDragging) {
          c1.y -= overlapY * sign;
          c1.vy = c2.vy * 1.2;
        }
      }
    }
  }
}

class FloatingCard {
  constructor(item, container, onInspect) {
    this.id = item.id;
    this.item = item;
    this.container = container;
    this.onInspect = onInspect;

    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    // Card sizes (standard matches CSS styles)
    this.width = 240;
    this.height = 250; 

    // Interactivity state
    this.isDragging = false;
    this.isHovered = false;
    
    // Drag tracks
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.lastTime = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Rotation interpolation
    this.rotX = 0;
    this.rotY = 0;

    this.createElement();
    this.bindEvents();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'floating-card';
    this.element.id = `card-${this.id}`;
    
    // Set custom glowing color styling variables
    this.element.style.setProperty('--glow-color', this.item.glowColor);
    this.element.style.setProperty('--glow-color-rgb', this.item.glowColorRgb);
    
    // HTML contents
    let tagHTML = '';
    if (this.item.tags && Array.isArray(this.item.tags)) {
      tagHTML = this.item.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('');
    }

    this.element.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${this.item.url}" class="card-img" alt="${this.item.title}">
      </div>
      <div class="card-meta">
        <h4 class="card-title">${this.item.title}</h4>
        <div class="card-tags">
          ${tagHTML}
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
  }

  bindEvents() {
    // Mouse down start drag
    this.element.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only left click
      this.startDrag(e.clientX, e.clientY);
    });

    // Touch start drag
    this.element.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return;
      this.startDrag(e.touches[0].clientX, e.touches[0].clientY);
    });

    // Hover tracks
    this.element.addEventListener('mouseenter', () => {
      this.isHovered = true;
      document.body.classList.add('hovering');
    });

    this.element.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.rotX = 0;
      this.rotY = 0;
      document.body.classList.remove('hovering');
    });

    // Inspect triggers (Double click or tap)
    this.element.addEventListener('dblclick', () => {
      if (this.onInspect) this.onInspect(this.item);
    });
  }

  startDrag(clientX, clientY) {
    this.isDragging = true;
    this.element.style.cursor = 'grabbing';
    
    const rect = this.element.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    this.dragOffsetX = clientX - rect.left;
    this.dragOffsetY = clientY - rect.top;
    
    this.lastMouseX = clientX;
    this.lastMouseY = clientY;
    this.lastTime = performance.now();

    // Bring clicked card to front
    const allCards = this.container.querySelectorAll('.floating-card');
    allCards.forEach(card => card.style.zIndex = '1');
    this.element.style.zIndex = '10';

    // Move handlers to window to track dragging outside bounds safely
    const moveHandler = (e) => {
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);
      if (x !== undefined && y !== undefined) {
        this.trackDrag(x, y);
      }
    };

    const endHandler = () => {
      this.stopDrag();
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', endHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', endHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', endHandler);
    window.addEventListener('touchmove', moveHandler, { passive: true });
    window.addEventListener('touchend', endHandler);
  }

  trackDrag(clientX, clientY) {
    if (!this.isDragging) return;

    const containerRect = this.container.getBoundingClientRect();
    
    // Set position relative to container
    this.x = clientX - containerRect.left - this.dragOffsetX;
    this.y = clientY - containerRect.top - this.dragOffsetY;

    // Track mouse speed for momentum throw calculations
    const now = performance.now();
    const dt = now - this.lastTime;
    
    if (dt > 10) { // Throttle calculations slightly for smooth movement
      const dx = clientX - this.lastMouseX;
      const dy = clientY - this.lastMouseY;
      
      // Calculate velocities
      this.vx = dx / (dt / 16); // Normalise to roughly 60fps frame delta
      this.vy = dy / (dt / 16);

      this.lastMouseX = clientX;
      this.lastMouseY = clientY;
      this.lastTime = now;
    }
  }

  stopDrag() {
    this.isDragging = false;
    this.element.style.cursor = 'none';

    // Cap velocity to avoid crazy warping speeds
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const maxSpeed = 15;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }
  }

  clampToBoundaries(width, height) {
    if (this.x < 0) this.x = 0;
    if (this.x > width - this.width) this.x = width - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y > height - this.height) this.y = height - this.height;
  }

  render(mouseX, mouseY) {
    if (!this.element) return;

    // Handle 3D Parallax Tilting on Hover
    if (this.isHovered && !this.isDragging) {
      const cardRect = this.element.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      
      // Relative mouse delta to card center
      const dx = (mouseX + this.container.getBoundingClientRect().left) - cardCenterX;
      const dy = (mouseY + this.container.getBoundingClientRect().top) - cardCenterY;

      // Limit max angle rotation to 18 degrees
      const maxRot = 18;
      const targetRotX = -(dy / (cardRect.height / 2)) * maxRot;
      const targetRotY = (dx / (cardRect.width / 2)) * maxRot;

      // Lerp for liquid-smooth tilt transition
      this.rotX += (targetRotX - this.rotX) * 0.15;
      this.rotY += (targetRotY - this.rotY) * 0.15;
    } else {
      // Lerp back to zero tilt
      this.rotX += (0 - this.rotX) * 0.15;
      this.rotY += (0 - this.rotY) * 0.15;
    }

    // Apply exact transforms
    if (this.isDragging) {
      // Direct placement during drag
      this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0px) scale(1.02)`;
    } else {
      // Smooth movement and 3D tilts
      this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0px) rotateX(${this.rotX}deg) rotateY(${this.rotY}deg)`;
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Export instance and classes globally
window.floatingEngine = new FloatingEngine();
window.FloatingEngine = FloatingEngine;
window.FloatingCard = FloatingCard;
