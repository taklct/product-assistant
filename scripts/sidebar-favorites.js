(function () {
  const STORAGE_KEY = 'ai-assistant-favorites';
  const FAVORITES_ACTIVE_CLASSES = ['bg-sky/10', 'text-navy', 'font-medium'];
  const FAVORITES_INACTIVE_CLASS = 'text-gray-600';
  const FAVORITE_ICON_ACTIVE_CLASSES = ['fa-solid', 'text-yellow-500'];
  const FAVORITE_ICON_INACTIVE_CLASSES = ['fa-regular', 'text-gray-400'];

  const elementRegistry = new Map();
  const toggleRegistry = new Map();
  const toggleClickHandlers = new WeakMap();
  const toggleKeyHandlers = new WeakMap();

  let favorites = [];
  let observer = null;
  let favoritesButton = null;
  let favoritesCloseButton = null;
  let favoritesView = null;
  let favoritesList = null;
  let favoritesEmptyState = null;
  let favoritesCountBadge = null;
  let favoritesOpen = false;

  const resolveHref = (href) => {
    if (!href) {
      return null;
    }

    const resolver = window.AIAssistant?.resolveAppUrl;
    if (typeof resolver === 'function') {
      return resolver(href);
    }

    try {
      return new URL(href, window.location.href).href;
    } catch (error) {
      return href;
    }
  };

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => ({
          id: typeof item.id === 'string' ? item.id : null,
          label: typeof item.label === 'string' ? item.label : null,
          type: typeof item.type === 'string' ? item.type : null,
          href: resolveHref(typeof item.href === 'string' && item.href ? item.href : null),
        }))
        .filter((item) => item.id && item.label);
    } catch (error) {
      return [];
    }
  };

  const persistFavorites = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      /* noop */
    }
  };

  const ensureSet = (registry, key) => {
    if (!registry.has(key)) {
      registry.set(key, new Set());
    }

    return registry.get(key);
  };

  const normalizeFavorite = (data = {}) => ({
    id: data.id,
    label: data.label || 'Untitled',
    type: data.type || 'item',
    href: resolveHref(data.href || null),
  });

  const isFavorite = (id) => favorites.some((item) => item.id === id);

  const getFavoriteById = (id) => favorites.find((item) => item.id === id) || null;

  const updateFavoriteIcon = (toggle, active) => {
    if (!toggle) {
      return;
    }

    toggle.setAttribute('aria-pressed', active ? 'true' : 'false');
    toggle.dataset.favoriteActive = active ? 'true' : 'false';

    const icon = toggle.querySelector('i');
    if (!icon) {
      return;
    }

    FAVORITE_ICON_ACTIVE_CLASSES.forEach((cls) => icon.classList.toggle(cls, active));
    FAVORITE_ICON_INACTIVE_CLASSES.forEach((cls) => icon.classList.toggle(cls, !active));

    const label = toggle.dataset.favoriteLabel;
    const actionText = active ? 'Remove from favorites' : 'Add to favorites';
    if (label) {
      toggle.setAttribute('aria-label', `${actionText}: ${label}`);
    } else {
      toggle.setAttribute('aria-label', actionText);
    }
  };

  const updateFavoritableState = (element, active) => {
    if (!element) {
      return;
    }

    element.dataset.favoriteActive = active ? 'true' : 'false';
  };

  const refreshFavoriteUI = (id, active) => {
    const toggles = toggleRegistry.get(id);
    if (toggles) {
      toggles.forEach((toggle) => updateFavoriteIcon(toggle, active));
    }

    const elements = elementRegistry.get(id);
    if (elements) {
      elements.forEach((element) => updateFavoritableState(element, active));
    }

    updateFavoritesCount();
    renderFavoritesPanel();
  };

  const addFavorite = (data) => {
    const normalized = normalizeFavorite(data);
    const existing = getFavoriteById(normalized.id);

    if (existing) {
      const hasChanges = existing.label !== normalized.label || existing.href !== normalized.href || existing.type !== normalized.type;
      if (!hasChanges) {
        return;
      }

      favorites = favorites.map((item) => (item.id === normalized.id ? normalized : item));
    } else {
      favorites = [...favorites, normalized];
    }

    persistFavorites();
    refreshFavoriteUI(normalized.id, true);
  };

  const removeFavorite = (id) => {
    const exists = isFavorite(id);
    if (!exists) {
      return;
    }

    favorites = favorites.filter((item) => item.id !== id);
    persistFavorites();
    refreshFavoriteUI(id, false);
  };

  const toggleFavorite = (data) => {
    if (!data || !data.id) {
      return;
    }

    if (isFavorite(data.id)) {
      removeFavorite(data.id);
    } else {
      addFavorite(data);
    }
  };

  const describeFavorite = (favorite) => {
    switch (favorite.type) {
      case 'chat':
        return 'Chat';
      case 'file':
        return 'File';
      default:
        return 'Item';
    }
  };

  const createFavoriteListItem = (favorite) => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm gap-4';

    const main = favorite.href ? document.createElement('a') : document.createElement('div');
    main.className = 'flex items-center space-x-3 flex-1 min-w-0';

    if (favorite.href) {
      main.href = favorite.href;
      main.classList.add('hover:text-navy');
    }

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0';

    const icon = document.createElement('i');
    const iconClass = favorite.type === 'chat' ? 'fa-regular fa-comment text-base' : 'fa-regular fa-file-lines text-base';
    icon.className = iconClass;
    iconWrapper.append(icon);

    const textWrapper = document.createElement('div');
    textWrapper.className = 'flex flex-col min-w-0';

    const title = document.createElement('span');
    title.className = 'text-sm font-semibold text-gray-800 truncate';
    title.textContent = favorite.label;

    const meta = document.createElement('span');
    meta.className = 'inline-flex items-center px-2 py-0.5 rounded-full bg-sky/10 text-navy text-xs font-medium uppercase tracking-wide mt-1 w-max';
    meta.textContent = describeFavorite(favorite);

    textWrapper.append(title, meta);
    main.append(iconWrapper, textWrapper);

    const actions = document.createElement('div');
    actions.className = 'flex items-center space-x-2 flex-shrink-0';

    if (favorite.href) {
      const openLink = document.createElement('a');
      openLink.href = favorite.href;
      openLink.className = 'px-3 py-1.5 text-xs font-medium text-navy border border-navy/30 rounded-lg transition-colors hover:bg-navy hover:text-white';
      openLink.textContent = 'Open';
      actions.append(openLink);
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors';
    removeButton.setAttribute('aria-label', `Remove ${favorite.label} from favorites`);

    const removeIcon = document.createElement('i');
    removeIcon.className = 'fa-solid fa-xmark text-sm';
    removeButton.append(removeIcon);

    removeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeFavorite(favorite.id);
    });

    actions.append(removeButton);
    item.append(main, actions);

    return item;
  };

  const renderFavoritesPanel = () => {
    if (!favoritesList || !favoritesEmptyState) {
      return;
    }

    favoritesList.innerHTML = '';

    if (!favorites.length) {
      favoritesList.classList.add('hidden');
      favoritesEmptyState.classList.remove('hidden');
      return;
    }

    favoritesList.classList.remove('hidden');
    favoritesEmptyState.classList.add('hidden');

    const sorted = [...favorites].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    sorted.forEach((favorite) => {
      const item = createFavoriteListItem(favorite);
      favoritesList.append(item);
    });
  };

  const updateFavoritesCount = () => {
    if (!favoritesCountBadge) {
      return;
    }

    if (favorites.length) {
      favoritesCountBadge.textContent = String(favorites.length);
      favoritesCountBadge.classList.remove('hidden');
    } else {
      favoritesCountBadge.classList.add('hidden');
    }
  };

  const highlightFavoritesButton = (active) => {
    if (!favoritesButton) {
      return;
    }

    favoritesButton.setAttribute('aria-expanded', active ? 'true' : 'false');
    favoritesButton.dataset.favoritesOpen = active ? 'true' : 'false';

    FAVORITES_ACTIVE_CLASSES.forEach((cls) => favoritesButton.classList.toggle(cls, active));
    favoritesButton.classList.toggle(FAVORITES_INACTIVE_CLASS, !active);
  };

  const highlightActiveSidebarLink = () => {
    const activeLink = document.body?.dataset?.activeSidebarLink;
    const sidebar = window.AIAssistant?.sidebar;

    if (activeLink && sidebar && typeof sidebar.highlight === 'function') {
      sidebar.highlight(activeLink);
    }
  };

  const updatePanelVisibility = (silent = false) => {
    if (favoritesView) {
      favoritesView.classList.toggle('hidden', !favoritesOpen);
    }

    highlightFavoritesButton(favoritesOpen);

    if (!silent) {
      if (favoritesOpen) {
        const sidebar = window.AIAssistant?.sidebar;
        if (sidebar && typeof sidebar.highlight === 'function') {
          sidebar.highlight('favorites');
        }
      } else {
        highlightActiveSidebarLink();
      }
    }
  };

  const openFavoritesPanel = () => {
    if (favoritesOpen) {
      return;
    }

    favoritesOpen = true;
    renderFavoritesPanel();
    updatePanelVisibility();
  };

  const closeFavoritesPanel = ({ silent = false } = {}) => {
    if (!favoritesOpen) {
      updatePanelVisibility(silent);
      return;
    }

    favoritesOpen = false;
    updatePanelVisibility(silent);
  };

  const toggleFavoritesPanel = () => {
    if (favoritesOpen) {
      closeFavoritesPanel();
    } else {
      openFavoritesPanel();
    }
  };

  const registerToggle = (toggle, data) => {
    if (!toggle || toggle.dataset.favoriteToggleInitialized === 'true') {
      updateFavoriteIcon(toggle, isFavorite(data.id));
      return;
    }

    toggle.dataset.favoriteId = data.id;
    toggle.dataset.favoriteLabel = data.label;
    toggle.dataset.favoriteToggleInitialized = 'true';

    const handleClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(data);
    };

    const handleKeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleFavorite(data);
      }
    };

    toggle.addEventListener('click', handleClick);
    toggle.addEventListener('keydown', handleKeydown);

    toggleClickHandlers.set(toggle, handleClick);
    toggleKeyHandlers.set(toggle, handleKeydown);

    ensureSet(toggleRegistry, data.id).add(toggle);
    updateFavoriteIcon(toggle, isFavorite(data.id));

    const action = isFavorite(data.id) ? 'Remove from favorites' : 'Add to favorites';
    toggle.setAttribute('aria-label', `${action}: ${data.label}`);
  };

  const unregisterToggle = (toggle) => {
    if (!toggle) {
      return;
    }

    const id = toggle.dataset.favoriteId;
    if (id) {
      const toggles = toggleRegistry.get(id);
      if (toggles) {
        toggles.delete(toggle);
        if (!toggles.size) {
          toggleRegistry.delete(id);
        }
      }
    }

    const clickHandler = toggleClickHandlers.get(toggle);
    if (clickHandler) {
      toggle.removeEventListener('click', clickHandler);
      toggleClickHandlers.delete(toggle);
    }

    const keyHandler = toggleKeyHandlers.get(toggle);
    if (keyHandler) {
      toggle.removeEventListener('keydown', keyHandler);
      toggleKeyHandlers.delete(toggle);
    }
  };

  const registerFavoritableElement = (element) => {
    if (!element || element.dataset.favoriteInitialized === 'true') {
      return;
    }

    const { favoriteId, favoriteLabel, favoriteType, favoriteHref } = element.dataset;
    if (!favoriteId) {
      return;
    }

    const data = {
      id: favoriteId,
      label: favoriteLabel || element.textContent.trim() || 'Untitled',
      type: favoriteType || 'item',
      href: favoriteHref || null,
    };

    element.dataset.favoriteInitialized = 'true';
    ensureSet(elementRegistry, data.id).add(element);
    updateFavoritableState(element, isFavorite(data.id));

    const stored = getFavoriteById(data.id);
    if (stored && (stored.label !== data.label || stored.href !== data.href || stored.type !== data.type)) {
      favorites = favorites.map((item) => (item.id === data.id ? normalizeFavorite(data) : item));
      persistFavorites();
      renderFavoritesPanel();
    }

    const toggles = element.querySelectorAll('[data-favorite-toggle]');
    toggles.forEach((toggle) => registerToggle(toggle, data));
  };

  const unregisterFavoritableElement = (element) => {
    if (!element) {
      return;
    }

    const { favoriteId } = element.dataset;
    if (!favoriteId) {
      return;
    }

    const elements = elementRegistry.get(favoriteId);
    if (elements) {
      elements.delete(element);
      if (!elements.size) {
        elementRegistry.delete(favoriteId);
      }
    }

    const toggles = element.querySelectorAll('[data-favorite-toggle]');
    toggles.forEach((toggle) => unregisterToggle(toggle));
  };

  const observeMutations = () => {
    if (observer) {
      observer.disconnect();
    }

    if (!document.body) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          if (node.matches('[data-favoritable]')) {
            registerFavoritableElement(node);
          }

          node.querySelectorAll?.('[data-favoritable]').forEach((child) => registerFavoritableElement(child));
        });

        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          if (node.matches('[data-favoritable]')) {
            unregisterFavoritableElement(node);
          }

          node.querySelectorAll?.('[data-favoritable]').forEach((child) => unregisterFavoritableElement(child));
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  const handleFavoritesButtonClick = (event) => {
    event.preventDefault();
    toggleFavoritesPanel();
  };

  const bindFavoritesButton = (button) => {
    if (favoritesButton === button) {
      return;
    }

    if (favoritesButton) {
      favoritesButton.removeEventListener('click', handleFavoritesButtonClick);
    }

    favoritesButton = button;
    favoritesButton?.addEventListener('click', handleFavoritesButtonClick);
  };

  const handleFavoritesCloseClick = (event) => {
    event.preventDefault();
    closeFavoritesPanel();
  };

  const bindCloseButton = (button) => {
    if (favoritesCloseButton === button) {
      return;
    }

    if (favoritesCloseButton) {
      favoritesCloseButton.removeEventListener('click', handleFavoritesCloseClick);
    }

    favoritesCloseButton = button;
    favoritesCloseButton?.addEventListener('click', handleFavoritesCloseClick);
  };

  const handleSidebarLinkClick = (event) => {
    const target = event.target.closest('[data-sidebar-link]');
    if (!target) {
      return;
    }

    if (target.dataset.sidebarLink === 'favorites') {
      return;
    }

    closeFavoritesPanel();
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape' && favoritesOpen) {
      closeFavoritesPanel();
      favoritesButton?.focus();
    }
  };

  const syncFromStorage = (event) => {
    if (event?.key && event.key !== STORAGE_KEY) {
      return;
    }

    favorites = loadFavorites();

    toggleRegistry.forEach((toggles, id) => {
      const active = isFavorite(id);
      toggles.forEach((toggle) => updateFavoriteIcon(toggle, active));
    });

    elementRegistry.forEach((elements, id) => {
      const active = isFavorite(id);
      elements.forEach((element) => updateFavoritableState(element, active));
    });

    updateFavoritesCount();
    renderFavoritesPanel();
  };

  const collectReferences = () => {
    favoritesView = document.querySelector('[data-favorites-view]');
    favoritesList = document.querySelector('[data-favorites-list]');
    favoritesEmptyState = document.querySelector('[data-favorites-empty]');
    favoritesCountBadge = document.querySelector('[data-favorites-count]');

    bindFavoritesButton(document.querySelector('[data-sidebar-link="favorites"]'));
    bindCloseButton(document.querySelector('[data-favorites-close]'));
  };

  const registerExistingFavoritables = () => {
    document.querySelectorAll('[data-favoritable]').forEach((element) => {
      registerFavoritableElement(element);
    });
  };

  const initialize = () => {
    favorites = loadFavorites();

    collectReferences();
    registerExistingFavoritables();

    updateFavoritesCount();
    renderFavoritesPanel();
    observeMutations();
    closeFavoritesPanel({ silent: true });
  };

  const initOnce = () => {
    document.addEventListener('click', handleSidebarLinkClick);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('storage', syncFromStorage);
  };

  initOnce();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  document.addEventListener('ai-assistant:init-page', () => {
    collectReferences();
    registerExistingFavoritables();
    updateFavoritesCount();
    renderFavoritesPanel();
    closeFavoritesPanel({ silent: true });
  });

  window.AIAssistant = window.AIAssistant || {};
  window.AIAssistant.favorites = {
    getAll: () => favorites.map((favorite) => ({ ...favorite })),
    isFavorite,
    add: (data) => addFavorite(normalizeFavorite(data)),
    remove: removeFavorite,
    toggle: toggleFavorite,
    register: registerFavoritableElement,
    refresh: renderFavoritesPanel,
  };
})();
