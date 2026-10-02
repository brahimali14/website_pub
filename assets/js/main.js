/**
 * BRAHIM INFORMATIQUE — Main Application Script
 * Gère l'i18n (FR/AR), la persistance, la navigation d'ancres, le menu burger,
 * l'observation des sections actives et le fallback d'images.
 */

(function () {
  'use strict';

  // --- Configuration & Sélecteurs ---
  const STORAGE_KEY = 'brahim_lang';
  const DEFAULT_LANG = 'fr';
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  const headerEl = document.getElementById('main-header');
  const navMenu = document.getElementById('nav-menu');
  const navToggle = document.getElementById('nav-toggle');
  const langBtns = document.querySelectorAll('.lang-btn');
  const metaDesc = document.querySelector('meta[name="description"]');

  // --- 1. Gestion de la Langue (i18n) ---
  function getSavedLanguage() {
    // 1. Paramètre d'URL éventuel (?lang=ar ou ?lang=fr)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang === 'ar' || urlLang === 'fr') {
        return urlLang;
      }
    } catch (e) {
      // Ignorer
    }

    // 2. Mémorisation dans localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'fr') {
        return saved;
      }
    } catch (e) {
      console.warn('LocalStorage non disponible pour la langue:', e);
    }
    return DEFAULT_LANG;
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;

    // Mise à jour des attributs HTML
    htmlEl.setAttribute('lang', lang);
    htmlEl.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    if (lang === 'ar') {
      bodyEl.classList.add('lang-ar');
    } else {
      bodyEl.classList.remove('lang-ar');
    }

    // Mise à jour du titre et de la meta description
    if (translations[lang].pageTitle) {
      document.title = translations[lang].pageTitle;
    }
    if (metaDesc && translations[lang].pageDescription) {
      metaDesc.setAttribute('content', translations[lang].pageDescription);
    }

    // Traduction de tous les éléments data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key] !== undefined) {
        el.textContent = translations[lang][key];
      }
    });

    // Mise à jour de l'état actif des boutons de langue
    langBtns.forEach(function (btn) {
      const btnLang = btn.getAttribute('data-lang');
      const isActive = btnLang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Mémorisation dans localStorage
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Impossible de sauvegarder la langue:', e);
    }
  }

  // Écouteurs sur les boutons de sélection de langue
  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const targetLang = this.getAttribute('data-lang');
      setLanguage(targetLang);
    });
  });

  // Initialisation immédiate de la langue
  const initialLang = getSavedLanguage();
  setLanguage(initialLang);

  // --- 2. Menu Burger Mobile & Accessibilité ---
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('is-open', !isExpanded);
      navToggle.classList.toggle('is-active', !isExpanded);
    });

    // Fermer le menu lors d'un clic sur un lien d'ancre
    const navLinks = navMenu.querySelectorAll('a[href^="#"]');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('is-active');
      });
    });

    // Fermeture avec la touche Échap
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('is-active');
      }
    });
  }

  // --- 3. Défilement Doux avec Compensation du Header Fixe ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = headerEl ? headerEl.offsetHeight : 70;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- 4. Style du Header au Défilement ---
  function handleScroll() {
    if (!headerEl) return;
    if (window.scrollY > 20) {
      headerEl.classList.add('header-scrolled');
    } else {
      headerEl.classList.remove('header-scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // --- 5. Observer de Sections Actives pour la Navigation ---
  if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            const href = link.getAttribute('href');
            if (href === '#' + id) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // --- 6. Fallback Robuste pour Toutes les Images ---
  window.handleImgError = function (img) {
    if (img.dataset.hasFailed) return;
    img.dataset.hasFailed = 'true';
    const fallback = img.getAttribute('data-fallback') || 'assets/img/fallback_image.svg';
    img.src = fallback;
    img.classList.add('img-fallback-active');
  };

  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () {
      window.handleImgError(img);
    });
  });

  console.log('BRAHIM INFORMATIQUE — Application initialisée avec succès.');
})();
