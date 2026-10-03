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

    // Traduction des attributs aria-label (data-i18n-aria)
    const ariaElements = document.querySelectorAll('[data-i18n-aria]');
    ariaElements.forEach(function (el) {
      const key = el.getAttribute('data-i18n-aria');
      if (translations[lang] && translations[lang][key] !== undefined) {
        el.setAttribute('aria-label', translations[lang][key]);
      }
    });

    // Synchronisation de l'URL sans rechargement
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      // Ignorer
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

  const SUN_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const MOON_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

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
    htmlEl.classList.toggle('theme-light', theme === 'light');
    try { htmlEl.style.colorScheme = theme; } catch (e) {}

    if (bodyEl) {
      bodyEl.setAttribute('data-theme', theme);
      bodyEl.classList.toggle('theme-light', theme === 'light');
    }

    const lang = htmlEl.getAttribute('lang') || 'fr';
    const dict = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : (typeof translations !== 'undefined' ? translations.fr : null);

    if (themeToggleBtn) {
      if (theme === 'light') {
        themeToggleBtn.innerHTML = MOON_ICON;
        const label = dict ? dict.themeToggleDark : 'Mode sombre';
        themeToggleBtn.setAttribute('title', label);
        themeToggleBtn.setAttribute('aria-label', label);
      } else {
        themeToggleBtn.innerHTML = SUN_ICON;
        const label = dict ? dict.themeToggleLight : 'Mode clair';
        themeToggleBtn.setAttribute('title', label);
        themeToggleBtn.setAttribute('aria-label', label);
      }
    }

    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'light' ? '#f8fafc' : '#000a16');
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Impossible de sauvegarder le thème:', e);
    }
  }

  let lastToggleTime = 0;
  window.toggleTheme = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    const now = Date.now();
    if (now - lastToggleTime < 350) return;
    lastToggleTime = now;

    const current = htmlEl.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', window.toggleTheme);
  }

  // Initialisation du thème
  setTheme(getSavedTheme());

  // --- 8. Modale de Zoom des Profils de l'Équipe ---
  const profileModal = document.getElementById('profile-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalAvatarImg = document.getElementById('modal-avatar-img');
  const modalName = document.getElementById('modal-name');
  const modalRole = document.getElementById('modal-role');
  const modalPhoneLink = document.getElementById('modal-phone-link');
  const modalPhoneNumber = document.getElementById('modal-phone-number');
  const modalEmailLink = document.getElementById('modal-email-link');
  const modalEmailAddress = document.getElementById('modal-email-address');

  function openProfileModal(card) {
    if (!profileModal) return;

    const avatarImg = card.querySelector('.team-avatar-img');
    const nameEl = card.querySelector('.team-name');
    const roleEl = card.querySelector('.team-role-text');
    const phoneEl = card.querySelector('.phone-link .ltr-text') || card.querySelector('.team-contact-item:first-child .ltr-text') || card.querySelector('[data-i18n*="Phone"]');
    const emailEl = card.querySelector('.email-link .ltr-text') || card.querySelector('.team-contact-item:last-child .ltr-text') || card.querySelector('[data-i18n*="Email"]');

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
    if (phoneEl) {
      const pVal = phoneEl.textContent.trim();
      const cleanPhone = pVal.replace(/\s+/g, '');
      if (modalPhoneNumber) modalPhoneNumber.textContent = pVal;
      if (modalPhoneLink) modalPhoneLink.setAttribute('href', 'tel:' + cleanPhone);
    }
    if (emailEl) {
      const eVal = emailEl.textContent.trim();
      if (modalEmailAddress) modalEmailAddress.textContent = eVal;
      if (modalEmailLink) modalEmailLink.setAttribute('href', 'mailto:' + eVal);
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

    card.addEventListener('click', function (e) {
      if (e.target.closest('.team-contact-link') || e.target.closest('a[href^="tel:"], a[href^="mailto:"]')) {
        return;
      }
      openProfileModal(this);
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.team-contact-link') || e.target.closest('a[href^="tel:"], a[href^="mailto:"]')) {
          return;
        }
        e.preventDefault();
        openProfileModal(this);
      }
    });
  });

  // Éviter que les clics sur les liens de contact ne déclenchent d'autres écouteurs
  document.querySelectorAll('.team-contact-link, a[href^="tel:"], a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  });

  // Gestion du retour en haut pour le widget dock flottant
  const dockTopBtn = document.getElementById('dock-top-btn');
  if (dockTopBtn) {
    dockTopBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

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

  // --- 9. Modale de Présentation des Services & Récit d'Expertise ---
  const serviceModal = document.getElementById('service-modal');
  const serviceModalCloseBtn = document.getElementById('service-modal-close-btn');
  const serviceModalBadge = document.getElementById('service-modal-badge');
  const serviceModalTitle = document.getElementById('service-modal-title');
  const serviceModalImg = document.getElementById('service-modal-img');
  const serviceModalStory = document.getElementById('service-modal-story');
  const serviceModalBullets = document.getElementById('service-modal-bullets');
  const serviceModalScrollBtn = document.getElementById('service-modal-scroll-btn');

  let currentActiveServiceId = null;

  const serviceImages = {
    '1': 'assets/img/mobile.jpg',
    '2': 'assets/img/logiciels.jpg',
    '3': 'assets/img/web.jpg',
    '4': 'assets/img/cameras.jpg',
    '5': 'assets/img/materiel.jpg',
    '6': 'assets/img/support.jpg'
  };

  function updateServiceModalContent(id) {
    if (!serviceModal) return;
    const currentLang = htmlEl.getAttribute('lang') || getSavedLanguage() || 'fr';
    const dict = (typeof translations !== 'undefined' && translations[currentLang]) ? translations[currentLang] : (translations ? translations.fr : null);
    if (!dict) return;

    currentActiveServiceId = id;

    if (serviceModalBadge) {
      serviceModalBadge.textContent = dict[`detail${id}Tag`] || '';
    }
    if (serviceModalTitle) {
      serviceModalTitle.textContent = dict[`detail${id}Title`] || '';
    }
    if (serviceModalImg && serviceImages[id]) {
      serviceModalImg.src = serviceImages[id];
      serviceModalImg.alt = dict[`detail${id}Title`] || 'Service';
    }
    if (serviceModalStory) {
      serviceModalStory.textContent = dict[`detail${id}Story`] || dict[`detail${id}Desc`] || '';
    }
    if (serviceModalBullets) {
      serviceModalBullets.innerHTML = '';
      for (let b = 1; b <= 3; b++) {
        const bulletText = dict[`detail${id}Bullet${b}`];
        if (bulletText) {
          const li = document.createElement('li');
          li.className = 'service-modal-bullet-item';
          li.innerHTML = `
            <svg class="service-modal-bullet-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>${bulletText}</span>
          `;
          serviceModalBullets.appendChild(li);
        }
      }
    }
  }

  function openServiceModal(id) {
    if (!serviceModal) return;
    updateServiceModalContent(id);
    serviceModal.classList.add('is-active');
    bodyEl.style.overflow = 'hidden';
    if (serviceModalCloseBtn) serviceModalCloseBtn.focus();
  }

  function closeServiceModal() {
    if (!serviceModal) return;
    serviceModal.classList.remove('is-active');
    bodyEl.style.overflow = '';
  }

  // Écouteurs sur les 6 cartes de services
  document.querySelectorAll('.srv-card[data-service-id]').forEach(function (card) {
    const id = card.getAttribute('data-service-id');
    card.addEventListener('click', function () {
      openServiceModal(id);
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openServiceModal(id);
      }
    });
  });

  if (serviceModalCloseBtn) {
    serviceModalCloseBtn.addEventListener('click', closeServiceModal);
  }

  if (serviceModalScrollBtn) {
    serviceModalScrollBtn.addEventListener('click', function () {
      const targetId = currentActiveServiceId;
      closeServiceModal();
      if (targetId) {
        const targetRow = document.getElementById(`service-row-${targetId}`);
        if (targetRow) {
          const headerHeight = headerEl ? headerEl.offsetHeight : 70;
          const targetPos = targetRow.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });
        }
      }
    });
  }

  if (serviceModal) {
    serviceModal.addEventListener('click', function (e) {
      if (e.target === serviceModal) {
        closeServiceModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && serviceModal.classList.contains('is-active')) {
        closeServiceModal();
      }
    });
  }

  // Synchronisation de la modale active lors du changement de langue
  const originalSetLanguage = setLanguage;
  setLanguage = function(lang) {
    originalSetLanguage(lang);
    if (currentActiveServiceId && serviceModal && serviceModal.classList.contains('is-active')) {
      updateServiceModalContent(currentActiveServiceId);
    }
  };

  console.log('BRAHIM INFORMATIQUE — Application initialisée avec succès.');
})();
