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

  // --- 7. Gestion du Thème (Dark / Light Mode) ---
  const THEME_KEY = 'brahim_theme';
  const themeToggleBtn = document.getElementById('theme-toggle');

  const SUN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const MOON_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {
      console.warn('LocalStorage non disponible pour le thème:', e);
    }
    return 'dark'; // Thème officiel par défaut
  }

  function setTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);

    if (themeToggleBtn) {
      if (theme === 'light') {
        themeToggleBtn.innerHTML = MOON_ICON;
        themeToggleBtn.setAttribute('title', 'Activer le mode sombre');
      } else {
        themeToggleBtn.innerHTML = SUN_ICON;
        themeToggleBtn.setAttribute('title', 'Activer le mode clair');
      }
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Impossible de sauvegarder le thème:', e);
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const current = htmlEl.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  // Initialisation du thème
  setTheme(getSavedTheme());

  // --- 8. Modale de Zoom des Profils de l'Équipe ---
  const profileModal = document.getElementById('profile-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalAvatarImg = document.getElementById('modal-avatar-img');
  const modalName = document.getElementById('modal-name');
  const modalRole = document.getElementById('modal-role');
  const modalPhone = document.getElementById('modal-phone');
  const modalEmail = document.getElementById('modal-email');

  function openProfileModal(card) {
    if (!profileModal) return;

    const avatarImg = card.querySelector('.team-avatar-img');
    const nameEl = card.querySelector('.team-name');
    const roleEl = card.querySelector('.team-role-text');
    const phoneEl = card.querySelector('.team-contact-item:first-child .ltr-text');
    const emailEl = card.querySelector('.team-contact-item:last-child .ltr-text');

    if (modalAvatarImg && avatarImg) {
      modalAvatarImg.src = avatarImg.currentSrc || avatarImg.src;
      modalAvatarImg.alt = avatarImg.alt;
    }
    if (modalName && nameEl) {
      modalName.textContent = nameEl.textContent;
    }
    if (modalRole && roleEl) {
      modalRole.textContent = roleEl.textContent;
    }
    if (modalPhone && phoneEl) {
      modalPhone.textContent = phoneEl.textContent;
    }
    if (modalEmail && emailEl) {
      modalEmail.textContent = emailEl.textContent;
    }

    profileModal.classList.add('is-active');
    bodyEl.style.overflow = 'hidden';
    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closeProfileModal() {
    if (!profileModal) return;
    profileModal.classList.remove('is-active');
    bodyEl.style.overflow = '';
  }

  document.querySelectorAll('.team-card').forEach(function (card) {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-haspopup', 'dialog');

    card.addEventListener('click', function () {
      openProfileModal(this);
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProfileModal(this);
      }
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProfileModal);
  }

  if (profileModal) {
    profileModal.addEventListener('click', function (e) {
      if (e.target === profileModal) {
        closeProfileModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && profileModal.classList.contains('is-active')) {
        closeProfileModal();
      }
    });
  }

  console.log('BRAHIM INFORMATIQUE — Application initialisée avec succès.');
})();
