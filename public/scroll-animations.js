/**
 * Scroll Reveal Animation System
 * Automatically reveals elements when they enter the viewport
 */

(function() {
  'use strict';
  
  // Configuration
  const config = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  // Initialize Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        
        // Optionally unobserve after revealing (one-time animation)
        // observer.unobserve(entry.target);
      }
    });
  }, config);
  
  // Observe all elements with scroll-reveal classes
  function initScrollAnimations() {
    const revealElements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .stagger-item'
    );
    
    revealElements.forEach(el => {
      observer.observe(el);
    });
    
    console.log(`🎬 Scroll animations initialized for ${revealElements.length} elements`);
  }
  
  // Add stagger animation classes
  function addStaggerAnimations() {
    const containers = document.querySelectorAll('[data-stagger]');
    
    containers.forEach(container => {
      const children = container.children;
      Array.from(children).forEach((child, index) => {
        child.classList.add('stagger-item');
        child.style.animationDelay = `${index * 0.1}s`;
      });
    });
  }
  
  // Smooth scroll for anchor links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
  
  // Parallax effect for hero sections
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;
    
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(el => {
        const speed = el.dataset.parallax || 0.5;
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    });
  }
  
  // Add entrance animations to cards
  function animateCards() {
    const cards = document.querySelectorAll('.feature-card, .stat-card, .card, .complaint-card');
    cards.forEach((card, index) => {
      card.classList.add('scroll-reveal');
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }
  
  // Counter animation for numbers
  function animateCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.counter);
      const duration = parseInt(counter.dataset.duration || 2000);
      const start = 0;
      const increment = target / (duration / 16); // 60fps
      
      let current = start;
      
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };
      
      // Start animation when element is visible
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCounter();
            counterObserver.unobserve(entry.target);
          }
        });
      });
      
      counterObserver.observe(counter);
    });
  }
  
  // Add ripple effect to buttons
  function addRippleEffect() {
    const buttons = document.querySelectorAll('.btn, button, .action-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          top: ${y}px;
          left: ${x}px;
          pointer-events: none;
          animation: rippleEffect 0.6s ease-out;
        `;
        
        // Ensure button has position relative
        if (getComputedStyle(this).position === 'static') {
          this.style.position = 'relative';
        }
        this.style.overflow = 'hidden';
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });
    
    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rippleEffect {
        from {
          transform: scale(0);
          opacity: 1;
        }
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Page transition effect
  function addPageTransition() {
    // Fade in on page load
    document.body.style.opacity = '0';
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
      }, 100);
    });
    
    // Fade out on page leave (for internal links)
    document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Only apply to internal links that aren't anchors
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          e.preventDefault();
          document.body.style.opacity = '0';
          setTimeout(() => {
            window.location.href = href;
          }, 300);
        }
      });
    });
  }
  
  // Typing effect for hero text
  function initTypingEffect() {
    const typingElements = document.querySelectorAll('[data-typing]');
    
    typingElements.forEach(element => {
      const text = element.textContent;
      const speed = parseInt(element.dataset.typingSpeed || 50);
      element.textContent = '';
      element.style.borderRight = '2px solid';
      element.style.animation = 'blink 0.7s step-end infinite';
      
      let i = 0;
      const typeWriter = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(typeWriter, speed);
        } else {
          element.style.borderRight = 'none';
        }
      };
      
      // Start typing when visible
      const typingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            typeWriter();
            typingObserver.unobserve(entry.target);
          }
        });
      });
      
      typingObserver.observe(element);
    });
    
    // Add blink animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 50% { border-color: transparent; }
        51%, 100% { border-color: currentColor; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize all animations
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAll);
    } else {
      initAll();
    }
  }
  
  function initAll() {
    initScrollAnimations();
    addStaggerAnimations();
    initSmoothScroll();
    initParallax();
    animateCards();
    animateCounters();
    addRippleEffect();
    initTypingEffect();
    
    console.log('✨ All animations initialized successfully!');
  }
  
  // Start initialization
  init();
  
  // Expose utility functions globally
  window.CityVoiceAnimations = {
    reveal: initScrollAnimations,
    stagger: addStaggerAnimations,
    smoothScroll: initSmoothScroll,
    parallax: initParallax,
    counters: animateCounters
  };
})();
