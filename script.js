// ===============================
// CONFIGURACIÓN GLOBAL
// ===============================
const MotionLib = window.Motion;
const { animate, stagger } = MotionLib;

let currentSection = 0;
let currentSlide = 0;
let isAutoplay = false;
let autoplayInterval;
let pausedByHover = false;

const CONFIG = {
  particleColors: ["#FC99C4", "#D87387", "#BA52AD", "#5C2179"],
  slideDuration: 0.8,
  autoplayDelay: 4000,
  heartChance: 0.3,
  carousel: {
    slideDuration: 500,
    autoplayDelay: 3000
  }
};


// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  initAnimations();
  initMusicControl();
  initNavigation();
  initCarousel();
  initParticles();
  initInteractiveEffects();
  initCustomCursor();
  startHeartAnimation();
});

// ===== ANIMACIONES INICIALES =====
function initAnimations() {
  animate(".nav-dot", { opacity: [0, 1], x: [50, 0] }, { duration: 0.8, delay: stagger(0.1) });
  animate(".music-control", { opacity: [0, 1], y: [-50, 0] }, { duration: 1, delay: 0.5 });
  animate(".letter", { opacity: [0, 1], y: [100, 0], rotateX: [90, 0] }, { duration: 1.2, delay: stagger(0.2), easing: "ease-out" });
}

// ===== CONTROL DE MÚSICA =====
function initMusicControl() {
  const btn = document.getElementById("musicControl");
  const music = document.getElementById("backgroundMusic");
  const icon = document.getElementById("musicIcon");
  let isPlaying = false;

  btn.addEventListener("click", () => {
    isPlaying ? music.pause() : music.play().catch(() => {
      notify('🎵 Añade "star-shopping.mp3" para escuchar la canción');
    });

    icon.setAttribute("icon", isPlaying ? "mdi:music" : "mdi:pause");
    isPlaying = !isPlaying;
    animate(btn, { scale: [1, 1.1, 1] }, { duration: 0.3 });
  });
}

// ===== NAVEGACIÓN ENTRE SECCIONES =====
function initNavigation() {
  document.addEventListener("click", e => {
    if (e.target.classList.contains("nav-dot")) {
      goToSection([...document.querySelectorAll(".nav-dot")].indexOf(e.target));
    }
  });

  document.addEventListener("keydown", e => {
    if (["ArrowDown", " "].includes(e.key)) goToSection((currentSection + 1) % getSections().length);
    if (e.key === "ArrowUp") goToSection((currentSection - 1 + getSections().length) % getSections().length);
  });

  let scrollTimeout;
  window.addEventListener("wheel", e => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      e.deltaY > 0 ? nextSection() : prevSection();
    }, 100);
  }, { passive: true });
}

function getSections() {
  return document.querySelectorAll("[data-section]");
}

function goToSection(index) {
  if (index === currentSection) return;
  currentSection = index;
  document.querySelectorAll(".nav-dot").forEach(dot => dot.classList.remove("active"));
  document.querySelectorAll(".nav-dot")[index].classList.add("active");
  getSections()[index].scrollIntoView({ behavior: "smooth" });
  animate(getSections()[index], { opacity: [0.8, 1], scale: [0.95, 1] }, { duration: 0.8 });
}

function nextSection() {
  goToSection((currentSection + 1) % getSections().length);
}

function prevSection() {
  goToSection((currentSection - 1 + getSections().length) % getSections().length);
}



function initCarousel() {
  const container = document.querySelector(".main-carousel-container");
  const track = document.getElementById("carouselTrack");
  const slides = document.querySelectorAll(".carousel-slide");
  const indicators = document.querySelectorAll(".indicator");
  const thumbnails = document.querySelectorAll(".thumbnail-item");

  if (!track || slides.length === 0) return;

  // Delegación de eventos (botones, indicadores, thumbnails, autoplay, fullscreen)
  document.addEventListener("click", e => {
    if (e.target.closest("#prevBtn")) { prevSlide(); }
    if (e.target.closest("#nextBtn")) { nextSlide(); }
    if (e.target.classList.contains("indicator")) { goToSlide(Number(e.target.dataset.slide)); }
    if (e.target.closest(".thumbnail-item")) {
      const idx = [...document.querySelectorAll(".thumbnail-item")]
        .indexOf(e.target.closest(".thumbnail-item"));
      goToSlide(idx);
    }
    if (e.target.closest("#autoplayBtn")) toggleAutoplay();
    if (e.target.closest("#fullscreenBtn")) openFullscreen();
  });

  // Pausa en hover (solo si estaba corriendo)
  if (container) {
    container.addEventListener("mouseenter", () => {
      if (isAutoplay) { stopAutoplay(); pausedByHover = true; }
    });
    container.addEventListener("mouseleave", () => {
      if (pausedByHover) { startAutoplay(); pausedByHover = false; }
    });
  }

  // Recalcula posición en resize
  window.addEventListener("resize", () => {
    applyTransform(currentSlide);
  });

  // Inicia
  goToSlide(0);
  // Autoplay ON por defecto (si no lo quieres, comenta la siguiente línea)
  startAutoplay();
  updateAutoplayButton();
}

function goToSlide(index) {
  const slides = document.querySelectorAll(".carousel-slide");
  const total = slides.length;
  if (total === 0) return;

  if (index < 0) index = total - 1;
  if (index >= total) index = 0;

  currentSlide = index;

  applyTransform(index);
  updateActiveStates(index);
  animateActiveSlide(index);
  resetAutoplayIfRunning();
}

function applyTransform(index) {
  const track = document.getElementById("carouselTrack");
  const slides = document.querySelectorAll(".carousel-slide");
  const total = slides.length;
  if (!track || total === 0) return;

  // Mueve exactamente 1/total por slide
  const offsetPercent = (index * 100) / total;
  track.style.transform = `translateX(-${offsetPercent}%)`;
}

function updateActiveStates(index) {
  const slides = document.querySelectorAll(".carousel-slide");
  const indicators = document.querySelectorAll(".indicator");
  const thumbnails = document.querySelectorAll(".thumbnail-item");

  [slides, indicators, thumbnails].forEach(group => {
    group.forEach(el => el.classList.remove("active"));
    if (group[index]) group[index].classList.add("active");
  });
}

function animateActiveSlide(index) {
  const slides = document.querySelectorAll(".carousel-slide");
  const slide = slides[index];
  if (!slide) return;

  slide.style.transition = "transform 200ms ease, opacity 200ms ease";
  slide.style.opacity = "0.7";
  slide.style.transform = "scale(0.98)";
  setTimeout(() => {
    slide.style.opacity = "1";
    slide.style.transform = "scale(1)";
  }, CONFIG.slideDuration);
}

function nextSlide() {
  goToSlide(currentSlide + 1);
}

function prevSlide() {
  goToSlide(currentSlide - 1);
}

function startAutoplay() {
  stopAutoplay();
  autoplayInterval = setInterval(nextSlide, CONFIG.autoplayDelay);
  isAutoplay = true;
  updateAutoplayButton();
}

function stopAutoplay() {
  if (autoplayInterval) clearInterval(autoplayInterval);
  autoplayInterval = null;
  isAutoplay = false;
  updateAutoplayButton();
}

function toggleAutoplay() {
  isAutoplay ? stopAutoplay() : startAutoplay();
}

function resetAutoplayIfRunning() {
  if (isAutoplay) {
    // Reinicia el temporizador para que el usuario tenga tiempo tras un clic
    startAutoplay();
  }
}

function updateAutoplayButton() {
  const btn = document.getElementById("autoplayBtn");
  if (!btn) return;
  const icon = btn.querySelector("iconify-icon");
  const span = btn.querySelector("span");
  if (icon) icon.setAttribute("icon", isAutoplay ? "mdi:pause" : "mdi:play");
  if (span) span.textContent = isAutoplay ? "Pausar" : "Auto-play";
}


// ===== PARTÍCULAS =====
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  let particles = [];

  class Particle {
    constructor() {
      Object.assign(this, {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        size: Math.random() * 4 + 2,
        color: CONFIG.particleColors[Math.floor(Math.random() * CONFIG.particleColors.length)],
        opacity: Math.random() * 0.8 + 0.2,
        type: Math.random() < 0.5 ? "heart" : "circle"
      });
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.02;
      this.opacity -= 0.005;
    }
    draw() {
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      if (this.type === "heart") drawHeart(ctx, this.x, this.y, this.size);
      else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (Math.random() < 0.1) particles.push(new Particle());
    particles.forEach((p, i) => {
      p.update();
      p.draw();
      if (p.y < -10 || p.opacity <= 0) particles.splice(i, 1);
    });
    requestAnimationFrame(animateParticles);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  animateParticles();
}

function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
  ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size * 0.7, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.7, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
  ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
  ctx.fill();
}

// ===== EFECTOS INTERACTIVOS =====
function initInteractiveEffects() {
  document.addEventListener("click", e => {
    if (Math.random() > 0.6) createParticleElement("💖", e.clientX, e.clientY, "particle-heart", 3000);
  });

  document.addEventListener("keydown", e => {
    const keyActions = {
      h: () => spawnMultiple("💗", 8, "particle-heart", 3000, "💓 Siente los latidos"),
      s: () => spawnMultiple("⭐", 20, "particle-star", 2000, "✨ Lluvia de estrellas"),
      p: () => spawnMultiple("🌸", 25, "particle-petal", 4000, "🌸 Pétalos de rosa"),
      f: () => spawnMultiple("🎆", 12, "particle-firework", 1500, "🎆 ¡Fuegos artificiales!")
    };
    if (keyActions[e.key.toLowerCase()]) keyActions[e.key.toLowerCase()]();
  });
}

function createParticleElement(symbol, x, y, className, lifetime) {
  const el = document.createElement("div");
  el.className = className;
  el.innerHTML = symbol;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), lifetime);
}

function spawnMultiple(symbol, count, className, lifetime, message) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      createParticleElement(symbol, Math.random() * window.innerWidth, Math.random() * window.innerHeight, className, lifetime);
    }, i * 150);
  }
  if (message) notify(message);
}

// ===== CURSOR PERSONALIZADO =====
function initCustomCursor() {
  document.addEventListener("mousemove", e => {
    document.body.style.setProperty("--cursor-x", `${e.clientX}px`);
    document.body.style.setProperty("--cursor-y", `${e.clientY}px`);
    document.querySelectorAll(".letter").forEach(letter => {
      const rect = letter.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.02;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.02;
      letter.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  });
}

// ===== CORAZONES AUTOMÁTICOS =====
function startHeartAnimation() {
  setInterval(() => {
    if (Math.random() < CONFIG.heartChance) {
      createParticleElement("💕", Math.random() * window.innerWidth, window.innerHeight, "particle-heart", 6000);
    }
  }, 3000);
}

// ===== NOTIFICACIONES =====
function notify(message) {
  const el = document.createElement("div");
  el.innerHTML = `<div class="alert position-fixed" style="
    top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 2001; min-width: 300px; text-align: center;
    background: rgba(252, 153, 196, 0.9); border-radius: 25px;
    backdrop-filter: blur(10px); color: white; padding: 10px;
  ">${message}</div>`;
  document.body.appendChild(el);
  animate(el.firstElementChild, { opacity: [0, 1], y: [-50, 0] }, { duration: 0.5 });
  setTimeout(() => {
    animate(el.firstElementChild, { opacity: [1, 0], y: [0, -50] }, { duration: 0.5 }).then(() => el.remove());
  }, 3000);
}

// ===== MODO PANTALLA COMPLETA =====
function openFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
}
