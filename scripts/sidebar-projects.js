(function () {
  const STORAGE_KEY = 'ai-assistant-project-folders';
  const DEFAULT_FOLDERS = [
    {
      id: 'project-product-discovery',
      name: 'Product Discovery Sprint',
      href: 'product-requirements.html',
    },
    {
      id: 'project-launch-roadmap',
      name: 'Launch Readiness Roadmap',
      href: 'pamm-rebate-enhancement.html',
    },
    {
      id: 'project-voice-of-customer',
      name: 'Customer Feedback Automation',
      href: 'customer-feedback-automation.html',
    },
  ];

  const PROJECTS_COLLAPSED_STORAGE_KEY = 'ai-assistant-projects-collapsed';

  const registeredContainers = new Set();
  const sectionHandlers = new WeakMap();
  const DEFAULT_FOLDER_IDS = new Set(DEFAULT_FOLDERS.map((folder) => folder.id));
  const CONTEXT_MENU_CLASS = 'ai-assistant-context-menu';

  let sidebarWaitPromise = null;
  let contextMenu = null;

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

  const getResolvedFolderHref = (folder) => resolveHref(folder?.href || null);

  const slugify = (value) => {
    if (!value) {
      return '';
    }

    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  };

  const normalizeStoredFolder = (item = {}) => {
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    if (!id) {
      return null;
    }

    const name = typeof item.name === 'string' ? item.name.trim() : null;
    const href = typeof item.href === 'string' && item.href.trim() ? item.href.trim() : null;
    const deleted = item.deleted === true;

    return {
      id,
      name,
      href,
      deleted,
    };
  };

  const sanitizeStoredFolders = (folders = []) => folders
    .map((folder) => normalizeStoredFolder(folder))
    .filter((folder) => folder);

  const getStoredFolders = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return sanitizeStoredFolders(parsed);
    } catch (error) {
      return [];
    }
  };

  const persistFolders = (folders) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStoredFolders(folders)));
    } catch (error) {
      /* noop */
    }
  };

  const getAllFolderIds = () => new Set([
    ...DEFAULT_FOLDERS.map((folder) => folder.id),
    ...getStoredFolders().map((folder) => folder.id),
  ]);

  const getFolders = () => {
    const stored = getStoredFolders();

    const overrides = new Map();
    const removedDefaults = new Set();
    const customFolders = [];

    stored.forEach((folder) => {
      if (DEFAULT_FOLDER_IDS.has(folder.id)) {
        if (folder.deleted) {
          removedDefaults.add(folder.id);
        } else {
          overrides.set(folder.id, folder);
        }
      } else if (!folder.deleted) {
        customFolders.push(folder);
      }
    });

    const combined = [];

    DEFAULT_FOLDERS.forEach((folder) => {
      if (removedDefaults.has(folder.id)) {
        return;
      }

      const override = overrides.get(folder.id);
      combined.push({
        ...folder,
        name: override?.name ?? folder.name,
        href: override?.href ?? folder.href ?? null,
        isDefault: true,
      });
    });

    customFolders.forEach((folder) => {
      combined.push({
        id: folder.id,
        name: folder.name || 'Untitled Project',
        href: folder.href || null,
        isDefault: false,
      });
    });

    return combined;
  };

  const PROJECT_CHAT_COLLAPSED_STORAGE_KEY = 'ai-assistant-project-chat-collapsed';

  let cachedProjectChatCollapseState = null;

  const loadProjectChatCollapseState = () => {
    if (cachedProjectChatCollapseState) {
      return cachedProjectChatCollapseState;
    }

    try {
      const stored = localStorage.getItem(PROJECT_CHAT_COLLAPSED_STORAGE_KEY);
      if (!stored) {
        cachedProjectChatCollapseState = {};
        return cachedProjectChatCollapseState;
      }

      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') {
        cachedProjectChatCollapseState = {};
        return cachedProjectChatCollapseState;
      }

      cachedProjectChatCollapseState = Object.keys(parsed).reduce((accumulator, key) => {
        if (typeof parsed[key] === 'boolean') {
          accumulator[key] = parsed[key];
        }
        return accumulator;
      }, {});

      return cachedProjectChatCollapseState;
    } catch (error) {
      cachedProjectChatCollapseState = {};
      return cachedProjectChatCollapseState;
    }
  };

  const persistProjectChatCollapseState = (state) => {
    try {
      localStorage.setItem(PROJECT_CHAT_COLLAPSED_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* noop */
    }
  };

  const getProjectChatCollapsed = (projectId) => {
    const state = loadProjectChatCollapseState();
    return state[projectId] === true;
  };

  const setProjectChatCollapsed = (projectId, collapsed) => {
    const state = { ...loadProjectChatCollapseState() };

    if (collapsed) {
      state[projectId] = true;
    } else {
      delete state[projectId];
    }

    cachedProjectChatCollapseState = state;
    persistProjectChatCollapseState(state);
  };

  const applyProjectChatState = (wrapper, { collapsed }) => {
    if (!wrapper) {
      return;
    }

    wrapper.dataset.projectCollapsed = collapsed ? 'true' : 'false';

    const chats = wrapper.querySelector('[data-project-chat-list]');
    if (chats) {
      chats.dataset.projectCollapsed = collapsed ? 'true' : 'false';
      const hasChats = chats.dataset.projectHasChats === 'true';
      if (hasChats) {
        chats.classList.toggle('hidden', collapsed);
      } else {
        chats.classList.add('hidden');
      }
    }

    const toggle = wrapper.querySelector('[data-project-chat-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

      const expandedIcon = toggle.querySelector('[data-project-chat-toggle-icon="expanded"]');
      const collapsedIcon = toggle.querySelector('[data-project-chat-toggle-icon="collapsed"]');

      if (expandedIcon && collapsedIcon) {
        expandedIcon.classList.toggle('hidden', collapsed);
        collapsedIcon.classList.toggle('hidden', !collapsed);
      }
    }

    const trigger = wrapper.querySelector('[data-project-folder-trigger]');
    if (trigger && trigger.getAttribute('role') === 'button') {
      trigger.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
  };

  const syncProjectToggleAvailability = (wrapper) => {
    if (!wrapper) {
      return;
    }

    const chats = wrapper.querySelector('[data-project-chat-list]');
    const toggle = wrapper.querySelector('[data-project-chat-toggle]');

    if (!toggle) {
      return;
    }

    const hasChats = chats?.dataset.projectHasChats === 'true';
    toggle.disabled = !hasChats;
    toggle.setAttribute('aria-hidden', hasChats ? 'false' : 'true');
    toggle.classList.toggle('pointer-events-none', !hasChats);
    toggle.classList.toggle('invisible', !hasChats);

    if (!hasChats) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  };

  const toggleProjectChatVisibility = (wrapper, projectId, forcedState = null) => {
    if (!wrapper || !projectId) {
      return;
    }

    const currentCollapsed = wrapper.dataset.projectCollapsed === 'true';
    const nextCollapsed = typeof forcedState === 'boolean' ? forcedState : !currentCollapsed;
    setProjectChatCollapsed(projectId, nextCollapsed);
    applyProjectChatState(wrapper, { collapsed: nextCollapsed });
  };

  const bindProjectFolderInteractions = (folder, wrapper) => {
    if (!folder || !wrapper) {
      return;
    }

    const header = wrapper.querySelector('[data-project-folder]');
    const toggle = wrapper.querySelector('[data-project-chat-toggle]');
    const hasHref = Boolean(getResolvedFolderHref(folder));

    if (!header) {
      return;
    }

    if (!hasHref) {
      header.tabIndex = 0;
      header.setAttribute('role', 'button');

      const activateToggle = () => {
        toggleProjectChatVisibility(wrapper, folder.id);
      };

      header.addEventListener('click', (event) => {
        if (event.target.closest('[data-project-chat-toggle]')) {
          return;
        }

        activateToggle();
      });

      header.addEventListener('keydown', (event) => {
        if (event.target.closest('[data-project-chat-toggle]')) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateToggle();
        }
      });
    } else {
      header.removeAttribute('tabindex');
      header.setAttribute('role', 'presentation');
    }

    if (toggle) {
      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleProjectChatVisibility(wrapper, folder.id);
      });
    }
  };

  const createFolderElement = (folder) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-0.5';
    wrapper.dataset.projectWrapper = folder.id;

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-gray-50 text-gray-600 cursor-pointer nav-item sidebar-icon-only';
    header.dataset.sidebarLink = folder.id;
    header.dataset.projectFolder = folder.id;
    header.dataset.projectDefault = folder.isDefault ? 'true' : 'false';
    header.dataset.favoritable = 'true';
    header.dataset.favoriteId = folder.id;
    header.dataset.favoriteLabel = folder.name;
    header.dataset.favoriteType = 'file';

    const resolvedHref = getResolvedFolderHref(folder);

    if (resolvedHref) {
      header.dataset.favoriteHref = resolvedHref;
    } else {
      delete header.dataset.favoriteHref;
    }

    const infoContainer = resolvedHref ? document.createElement('a') : document.createElement('div');
    infoContainer.className = 'flex items-center space-x-2.5 min-w-0 sidebar-icon-only flex-1';

    infoContainer.classList.add('focus:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-offset-1', 'focus-visible:ring-navy/30', 'rounded');
    infoContainer.dataset.projectFolderTrigger = folder.id;

    if (resolvedHref) {
      infoContainer.href = resolvedHref;
    } else {
      infoContainer.tabIndex = 0;
      infoContainer.setAttribute('role', 'button');
    }

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-folder text-sm';

    const label = document.createElement('span');
    label.className = 'text-sm truncate sidebar-collapsible';
    label.textContent = folder.name;

    infoContainer.append(icon, label);
    header.append(infoContainer);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ml-2 text-gray-400 hover:text-gray-600 transition-colors sidebar-collapsible flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-navy/30 rounded';
    toggle.dataset.projectChatToggle = folder.id;
    toggle.setAttribute('aria-label', `Toggle chats for ${folder.name}`);
    toggle.setAttribute('aria-expanded', 'false');

    const expandedIcon = document.createElement('i');
    expandedIcon.className = 'fa-solid fa-chevron-down text-xs';
    expandedIcon.dataset.projectChatToggleIcon = 'expanded';

    const collapsedIcon = document.createElement('i');
    collapsedIcon.className = 'fa-solid fa-chevron-right text-xs hidden';
    collapsedIcon.dataset.projectChatToggleIcon = 'collapsed';

    toggle.append(expandedIcon, collapsedIcon);
    header.append(toggle);

    const chats = document.createElement('div');
    chats.className = 'ml-6 pl-3 border-l border-gray-100 space-y-0.5 hidden sidebar-collapsible';
    chats.dataset.projectChatList = folder.id;
    chats.dataset.projectCollapsed = 'false';
    chats.dataset.projectHasChats = 'false';

    const chatContainerId = `project-chat-list-${folder.id}`;
    chats.id = chatContainerId;
    toggle.setAttribute('aria-controls', chatContainerId);

    wrapper.append(header, chats);

    const collapsed = getProjectChatCollapsed(folder.id);
    applyProjectChatState(wrapper, { collapsed });
    syncProjectToggleAvailability(wrapper);
    bindProjectFolderInteractions(folder, wrapper);

    return { wrapper, element: header, chats };
  };

  const ensureContextMenu = () => {
    if (contextMenu) {
      return contextMenu;
    }

    contextMenu = document.createElement('div');
    contextMenu.className = `${CONTEXT_MENU_CLASS} hidden fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm min-w-[160px]`;
    document.body.appendChild(contextMenu);
    return contextMenu;
  };

  const hideContextMenu = () => {
    if (!contextMenu) {
      return;
    }

    contextMenu.classList.add('hidden');
    contextMenu.innerHTML = '';
  };

  const showContextMenu = (event, actions = []) => {
    if (!actions.length) {
      hideContextMenu();
      return;
    }

    const menu = ensureContextMenu();
    menu.innerHTML = '';

    actions.forEach((action) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'flex w-full items-center px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-700';
      if (action.destructive) {
        item.classList.add('text-rose-600', 'hover:bg-rose-50');
      }

      item.textContent = action.label;
      item.addEventListener('click', () => {
        hideContextMenu();
        if (typeof action.onSelect === 'function') {
          action.onSelect();
        }
      });

      menu.appendChild(item);
    });

    menu.classList.remove('hidden');

    const pointerX = event.clientX;
    const pointerY = event.clientY;
    menu.style.left = `${pointerX}px`;
    menu.style.top = `${pointerY}px`;

    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      let left = pointerX;
      let top = pointerY;

      if (rect.right > window.innerWidth) {
        left = Math.max(0, window.innerWidth - rect.width - 8);
      }

      if (rect.bottom > window.innerHeight) {
        top = Math.max(0, window.innerHeight - rect.height - 8);
      }

      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    });
  };

  const folderNameExists = (name, excludeId = null) => {
    if (!name) {
      return false;
    }

    const normalized = name.trim().toLowerCase();
    return getFolders().some((folder) => folder.id !== excludeId && folder.name.trim().toLowerCase() === normalized);
  };

  const renameFolder = (id, newName) => {
    const trimmed = typeof newName === 'string' ? newName.trim() : '';
    if (!trimmed) {
      return false;
    }

    if (folderNameExists(trimmed, id)) {
      return false;
    }

    const folders = getFolders();
    const source = folders.find((folder) => folder.id === id);
    if (!source) {
      return false;
    }

    const stored = getStoredFolders();
    const index = stored.findIndex((folder) => folder.id === id);
    const entry = {
      id,
      name: trimmed,
      href: source.href || null,
      deleted: false,
    };

    if (index >= 0) {
      stored[index] = { ...stored[index], ...entry };
    } else {
      stored.push(entry);
    }

    persistFolders(stored);
    refreshRegisteredContainers();

    const favorites = window.AIAssistant?.favorites;
    if (favorites && typeof favorites.add === 'function') {
      favorites.add({ id, label: trimmed, type: 'file', href: getResolvedFolderHref(source) });
    }

    return true;
  };

  const removeFolder = (id) => {
    const folders = getFolders();
    const target = folders.find((folder) => folder.id === id);
    if (!target) {
      return false;
    }

    const stored = getStoredFolders();

    if (DEFAULT_FOLDER_IDS.has(id)) {
      const index = stored.findIndex((folder) => folder.id === id);
      const entry = {
        id,
        name: target.name,
        href: target.href || null,
        deleted: true,
      };

      if (index >= 0) {
        stored[index] = { ...stored[index], ...entry };
      } else {
        stored.push(entry);
      }

      persistFolders(stored);
    } else {
      const next = stored.filter((folder) => folder.id !== id);
      persistFolders(next);
    }

    const favorites = window.AIAssistant?.favorites;
    if (favorites && typeof favorites.remove === 'function') {
      favorites.remove(id);
    }

    const chatHistory = window.AIAssistant?.chatHistory;
    if (chatHistory && typeof chatHistory.moveChatsToGeneral === 'function') {
      chatHistory.moveChatsToGeneral(id);
    }

    refreshRegisteredContainers();
    return true;
  };

  const requestRenameFolder = (folder) => {
    const value = window.prompt('Rename project folder', folder.name);
    if (value === null) {
      return;
    }

    const success = renameFolder(folder.id, value);
    if (!success) {
      window.alert('Unable to rename this project. Choose a different name.');
    }
  };

  const requestDeleteFolder = (folder) => {
    const confirmed = window.confirm(`Delete "${folder.name}"? Chats will move to the Chats section.`);
    if (!confirmed) {
      return;
    }

    const success = removeFolder(folder.id);
    if (!success) {
      window.alert('Unable to delete this project folder.');
    }
  };

  function dispatchProjectRenderEvent(container) {
    const event = new CustomEvent('ai-assistant:project-folders-rendered', {
      detail: { container },
    });
    document.dispatchEvent(event);
  }

  function attachProjectContextMenu(element, folder) {
    if (!element) {
      return;
    }

    element.addEventListener('contextmenu', (event) => {
      event.preventDefault();

      showContextMenu(event, [
        {
          label: 'Rename',
          onSelect: () => requestRenameFolder(folder),
        },
        {
          label: 'Delete',
          destructive: true,
          onSelect: () => requestDeleteFolder(folder),
        },
      ]);
    });
  }

  const highlightActiveLink = () => {
    const activeLink = document.body?.dataset?.activeSidebarLink;
    const sidebar = window.AIAssistant?.sidebar;

    if (!activeLink || !sidebar || typeof sidebar.highlight !== 'function') {
      return;
    }

    sidebar.highlight(activeLink);
  };

  const renderIntoContainer = (container) => {
    if (!container) {
      return;
    }

    container.innerHTML = '';

    const folders = getFolders();
    folders.forEach((folder) => {
      const { wrapper, element, chats } = createFolderElement(folder);
      container.append(wrapper);

      attachProjectContextMenu(element, folder);

      const favorites = window.AIAssistant?.favorites;
      if (favorites && typeof favorites.register === 'function') {
        favorites.register(element);
      }

      const chatHistory = window.AIAssistant?.chatHistory;
      if (chatHistory && typeof chatHistory.registerProjectContainer === 'function') {
        chatHistory.registerProjectContainer(folder.id, chats);
      }
    });

    highlightActiveLink();
    dispatchProjectRenderEvent(container);
  };

  const registerContainer = (container) => {
    if (!container || registeredContainers.has(container)) {
      renderIntoContainer(container);
      return;
    }

    registeredContainers.add(container);
    renderIntoContainer(container);
  };

  const refreshRegisteredContainers = () => {
    registeredContainers.forEach((container) => {
      renderIntoContainer(container);
    });
  };

  document.addEventListener('click', (event) => {
    if (contextMenu && !contextMenu.contains(event.target)) {
      hideContextMenu();
    }
  });

  document.addEventListener('contextmenu', (event) => {
    if (!contextMenu) {
      return;
    }

    if (event.target.closest(`.${CONTEXT_MENU_CLASS}`)) {
      return;
    }

    hideContextMenu();
  }, true);

  window.addEventListener('resize', hideContextMenu);
  window.addEventListener('blur', hideContextMenu);

  const schedule = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : (callback) => setTimeout(callback, 50);

  const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? () => performance.now()
    : () => Date.now();

  const ensureSidebarPromise = (timeout = 2500) => {
    if (sidebarWaitPromise) {
      return sidebarWaitPromise;
    }

    sidebarWaitPromise = new Promise((resolve) => {
      const start = now();

      const attempt = () => {
        const sidebar = window.AIAssistant?.sidebar;
        if (sidebar) {
          resolve(sidebar);
          return;
        }

        if (now() - start >= timeout) {
          resolve(null);
          return;
        }

        schedule(attempt);
      };

      attempt();
    });

    return sidebarWaitPromise;
  };

  const addFolder = ({ name, href, id } = {}) => {
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return { folder: null, created: false };
    }

    const existingByName = getFolders().find(
      (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingByName) {
      refreshRegisteredContainers();
      return { folder: existingByName, created: false };
    }

    const existingIds = getAllFolderIds();

    let slug = typeof id === 'string' && id.trim() ? id.trim() : slugify(trimmedName);
    if (!slug) {
      slug = `project-${Date.now()}`;
    }

    let uniqueSlug = slug;
    let counter = 1;
    while (existingIds.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter += 1;
    }

    let storedFolders = getStoredFolders().filter((entry) => entry.id !== uniqueSlug);

    const folder = {
      id: uniqueSlug,
      name: trimmedName,
      href: typeof href === 'string' && href.trim() ? href.trim() : null,
      deleted: false,
    };

    storedFolders = [...storedFolders, folder];
    persistFolders(storedFolders);
    refreshRegisteredContainers();

    return { folder, created: true };
  };

  const getStoredCollapsePreference = () => {
    try {
      return localStorage.getItem(PROJECTS_COLLAPSED_STORAGE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  const persistCollapsePreference = (collapsed) => {
    try {
      localStorage.setItem(PROJECTS_COLLAPSED_STORAGE_KEY, collapsed ? 'true' : 'false');
    } catch (error) {
      /* noop */
    }
  };

  const applyProjectSectionState = (section, collapsed) => {
    if (!section) {
      return;
    }

    const content = section.querySelector('[data-projects-content]');
    if (content) {
      content.classList.toggle('hidden', collapsed);
    }

    const toggle = section.querySelector('[data-projects-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    const expandedIcon = section.querySelector('[data-projects-icon="expanded"]');
    const collapsedIcon = section.querySelector('[data-projects-icon="collapsed"]');

    if (expandedIcon && collapsedIcon) {
      expandedIcon.classList.toggle('hidden', collapsed);
      collapsedIcon.classList.toggle('hidden', !collapsed);
    }
  };

  const bindProjectSection = (section, collapsedPreference) => {
    if (!section) {
      return;
    }

    applyProjectSectionState(section, collapsedPreference);

    const toggle = section.querySelector('[data-projects-toggle]');
    if (!toggle) {
      return;
    }

    const existingHandler = sectionHandlers.get(section);
    if (existingHandler) {
      toggle.removeEventListener('click', existingHandler);
    }

    const handler = () => {
      const isCollapsed = section
        .querySelector('[data-projects-content]')
        ?.classList.contains('hidden') || false;
      const nextState = !isCollapsed;
      applyProjectSectionState(section, nextState);
      persistCollapsePreference(nextState);
    };

    sectionHandlers.set(section, handler);
    toggle.addEventListener('click', handler);
  };

  const initializeProjectSections = () => {
    const collapsedPreference = getStoredCollapsePreference();
    const projectSections = document.querySelectorAll('[data-project-section]');
    projectSections.forEach((section) => bindProjectSection(section, collapsedPreference));
  };

  const initializeProjectContainers = () => {
    const containers = document.querySelectorAll('[data-project-folders]');
    containers.forEach((container) => registerContainer(container));
  };

  const initializeProjects = () => {
    initializeProjectContainers();
    initializeProjectSections();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProjects);
  } else {
    initializeProjects();
  }

  document.addEventListener('ai-assistant:init-page', () => {
    initializeProjects();
  });

  window.AIAssistant = window.AIAssistant || {};
  window.AIAssistant.projectFolders = {
    getDefaultFolders: () => DEFAULT_FOLDERS.map((folder) => ({ ...folder })),
    getUserFolders: () => getFolders()
      .filter((folder) => !folder.isDefault)
      .map((folder) => ({ ...folder })),
    getAllFolders: () => getFolders().map((folder) => ({ ...folder })),
    getFolderById: (id) => {
      const folder = getFolders().find((entry) => entry.id === id) || null;
      return folder ? { ...folder } : null;
    },
    render: registerContainer,
    refresh: refreshRegisteredContainers,
    addFolder,
    renameFolder,
    removeFolder,
    waitForSidebar: ensureSidebarPromise,
    isChatCollapsed: (id) => getProjectChatCollapsed(id),
    setChatCollapsed: (id, collapsed) => {
      setProjectChatCollapsed(id, collapsed);
      const wrapper = document.querySelector(`[data-project-wrapper="${id}"]`);
      if (wrapper) {
        applyProjectChatState(wrapper, { collapsed });
        syncProjectToggleAvailability(wrapper);
      }
    },
  };
})();
