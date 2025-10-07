(function () {
  const COLLAPSE_STORAGE_KEY = 'ai-assistant-chats-collapsed';
  const CHAT_STORAGE_KEY = 'ai-assistant-chat-history';
  const CONTEXT_MENU_CLASS = 'ai-assistant-context-menu';

  const DEFAULT_CHATS = [
    {
      id: 'chat-product-requirements',
      title: 'Product Requirements',
      href: 'product-requirements.html',
      projectId: null,
    },
    {
      id: 'chat-voice-of-customer',
      title: 'Voice of Customer Insights',
      href: 'customer-feedback-automation.html',
      projectId: 'project-voice-of-customer',
    },
    {
      id: 'chat-log-generation',
      title: 'Log Generation Chat',
      href: 'chats/pamm-rebate-enhancement/log-generation-chat.html',
      projectId: 'project-launch-roadmap',
    },
    {
      id: 'chat-brd-generation',
      title: 'BRD Generation Chat',
      href: 'chats/pamm-rebate-enhancement/brd-generation-chat.html',
      projectId: 'project-launch-roadmap',
    },
  ];

  const DEFAULT_CHAT_IDS = new Set(DEFAULT_CHATS.map((chat) => chat.id));

  const sectionHandlers = new WeakMap();
  const generalContainers = new Set();
  const projectContainerRegistry = new Map();

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

  const getStoredCollapsePreference = () => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  const persistCollapsePreference = (collapsed) => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? 'true' : 'false');
    } catch (error) {
      /* noop */
    }
  };

  const normalizeStoredChat = (item = {}) => {
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    if (!id) {
      return null;
    }

    const title = typeof item.title === 'string' ? item.title.trim() : null;
    const href = typeof item.href === 'string' && item.href.trim() ? item.href.trim() : null;
    const projectId = typeof item.projectId === 'string' && item.projectId.trim()
      ? item.projectId.trim()
      : null;
    const deleted = item.deleted === true;

    return {
      id,
      title,
      href,
      projectId,
      deleted,
    };
  };

  const sanitizeStoredChats = (chats = []) => chats
    .map((chat) => normalizeStoredChat(chat))
    .filter((chat) => chat);

  const loadStoredChats = () => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return sanitizeStoredChats(parsed);
    } catch (error) {
      return [];
    }
  };

  let storedChats = loadStoredChats();

  const persistChats = () => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(storedChats));
    } catch (error) {
      /* noop */
    }
  };

  const updateStoredChats = (updater, { silent = false } = {}) => {
    const next = typeof updater === 'function' ? updater(storedChats.slice()) : updater;
    storedChats = sanitizeStoredChats(next);
    persistChats();
    if (!silent) {
      notifyUpdate();
    }
  };

  const getChats = () => {
    const overrides = new Map();
    const removedDefaults = new Set();
    const custom = [];

    storedChats.forEach((chat) => {
      if (DEFAULT_CHAT_IDS.has(chat.id)) {
        if (chat.deleted) {
          removedDefaults.add(chat.id);
        } else {
          overrides.set(chat.id, chat);
        }
      } else if (!chat.deleted) {
        custom.push(chat);
      }
    });

    const combined = [];

    DEFAULT_CHATS.forEach((chat) => {
      if (removedDefaults.has(chat.id)) {
        return;
      }

      const override = overrides.get(chat.id);
      combined.push({
        ...chat,
        title: override?.title ?? chat.title,
        href: override?.href ?? chat.href ?? null,
        projectId: override?.projectId ?? chat.projectId ?? null,
        isDefault: true,
      });
    });

    custom.forEach((chat) => {
      combined.push({
        id: chat.id,
        title: chat.title || 'Untitled Chat',
        href: chat.href || null,
        projectId: chat.projectId || null,
        isDefault: false,
      });
    });

    return combined;
  };

  const getChatById = (id) => getChats().find((chat) => chat.id === id) || null;

  const chatTitleExists = (title, excludeId = null) => {
    if (!title) {
      return false;
    }

    const normalized = title.trim().toLowerCase();
    return getChats().some((chat) => chat.id !== excludeId && chat.title.trim().toLowerCase() === normalized);
  };

  const favoritesApi = () => window.AIAssistant?.favorites;

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

  const createChatRecord = ({ id, title, href, projectId } = {}) => {
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle) {
      return { chat: null, created: false };
    }

    const chatId = typeof id === 'string' && id.trim() ? id.trim() : `chat-${Date.now()}`;
    const normalizedHref = typeof href === 'string' && href.trim() ? href.trim() : null;
    const normalizedProjectId = typeof projectId === 'string' && projectId.trim() ? projectId.trim() : null;
    const existing = getChatById(chatId);
    const created = !existing;

    updateStoredChats((list) => {
      const filtered = list.filter((chat) => chat.id !== chatId);
      filtered.push({
        id: chatId,
        title: trimmedTitle,
        href: normalizedHref || existing?.href || null,
        projectId: normalizedProjectId ?? existing?.projectId ?? null,
        deleted: false,
      });
      return filtered;
    });

    return { chat: getChatById(chatId), created };
  };

  const renameChat = (id, newTitle) => {
    const trimmed = typeof newTitle === 'string' ? newTitle.trim() : '';
    if (!trimmed) {
      return false;
    }

    if (chatTitleExists(trimmed, id)) {
      return false;
    }

    const chat = getChatById(id);
    if (!chat) {
      return false;
    }

    updateStoredChats((list) => {
      const filtered = list.filter((entry) => entry.id !== id);
      filtered.push({
        id,
        title: trimmed,
        href: chat.href || null,
        projectId: chat.projectId || null,
        deleted: false,
      });
      return filtered;
    });

    const favorites = favoritesApi();
    if (favorites && typeof favorites.add === 'function') {
      favorites.add({ id, label: trimmed, type: 'chat', href: resolveHref(chat.href) });
    }

    return true;
  };

  const deleteChat = (id) => {
    const chat = getChatById(id);
    if (!chat) {
      return false;
    }

    if (DEFAULT_CHAT_IDS.has(id)) {
      updateStoredChats((list) => {
        const filtered = list.filter((entry) => entry.id !== id);
        filtered.push({
          id,
          title: chat.title,
          href: chat.href || null,
          projectId: null,
          deleted: true,
        });
        return filtered;
      });
    } else {
      updateStoredChats((list) => list.filter((entry) => entry.id !== id));
    }

    const favorites = favoritesApi();
    if (favorites && typeof favorites.remove === 'function') {
      favorites.remove(id);
    }

    return true;
  };

  const setChatProject = (id, projectId) => {
    const chat = getChatById(id);
    if (!chat) {
      return false;
    }

    const normalized = typeof projectId === 'string' && projectId.trim() ? projectId.trim() : null;

    updateStoredChats((list) => {
      const filtered = list.filter((entry) => entry.id !== id);
      filtered.push({
        id,
        title: chat.title,
        href: chat.href || null,
        projectId: normalized,
        deleted: false,
      });
      return filtered;
    });

    return true;
  };

  const moveChatsToGeneral = (projectId) => {
    if (!projectId) {
      return;
    }

    updateStoredChats((list) => list.map((chat) => (
      chat.projectId === projectId
        ? { ...chat, projectId: null }
        : chat
    )));
  };

  const requestRenameChat = (chat) => {
    const value = window.prompt('Rename chat', chat.title);
    if (value === null) {
      return;
    }

    const success = renameChat(chat.id, value);
    if (!success) {
      window.alert('Unable to rename this chat. Choose a different name.');
    }
  };

  const requestDeleteChat = (chat) => {
    const confirmed = window.confirm(`Delete "${chat.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const success = deleteChat(chat.id);
    if (!success) {
      window.alert('Unable to delete this chat.');
    }
  };

  function attachChatContextMenu(element, chat) {
    if (!element) {
      return;
    }

    element.addEventListener('contextmenu', (event) => {
      event.preventDefault();

      showContextMenu(event, [
        {
          label: 'Rename',
          onSelect: () => requestRenameChat(chat),
        },
        {
          label: 'Delete',
          destructive: true,
          onSelect: () => requestDeleteChat(chat),
        },
      ]);
    });
  }

  const createChatElement = (chat, { nested = false } = {}) => {
    const element = chat.href ? document.createElement('a') : document.createElement('button');
    element.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 text-gray-600 nav-item sidebar-icon-only w-full';
    element.dataset.sidebarLink = chat.id;
    element.dataset.favoritable = 'true';
    element.dataset.favoriteId = chat.id;
    element.dataset.favoriteLabel = chat.title;
    element.dataset.favoriteType = 'chat';

    if (chat.href) {
      const resolvedHref = resolveHref(chat.href);
      if (resolvedHref) {
        element.href = resolvedHref;
        element.dataset.favoriteHref = resolvedHref;
      }
    } else {
      element.type = 'button';
      element.setAttribute('type', 'button');
    }

    const icon = document.createElement('i');
    icon.className = 'fa-regular fa-comment text-sm';

    const label = document.createElement('span');
    label.className = 'text-sm truncate sidebar-collapsible';
    label.textContent = chat.title;

    const content = document.createElement('div');
    content.className = 'flex items-center space-x-2.5 min-w-0 sidebar-icon-only';
    content.append(icon, label);

    element.append(content);

    if (nested) {
      element.classList.add('pl-2');
    }

    attachChatContextMenu(element, chat);

    const favorites = favoritesApi();
    if (favorites && typeof favorites.register === 'function') {
      favorites.register(element);
    }

    return element;
  };

  const renderGeneralContainer = (container) => {
    if (!container) {
      return;
    }

    container.innerHTML = '';
    const chats = getChats().filter((chat) => !chat.projectId);

    if (!chats.length) {
      const empty = document.createElement('div');
      empty.className = 'px-3 py-2 text-xs text-gray-400 sidebar-collapsible';
      empty.textContent = 'No chats yet. Start a conversation to see it here.';
      container.appendChild(empty);
      return;
    }

    chats
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((chat) => {
        const element = createChatElement(chat);
        container.appendChild(element);
      });
  };

  const syncProjectToggleFromContainer = (container) => {
    if (!container) {
      return;
    }

    const wrapper = container.closest('[data-project-wrapper]');
    if (!wrapper) {
      return;
    }

    const toggle = wrapper.querySelector('[data-project-chat-toggle]');
    if (!toggle) {
      return;
    }

    const hasChats = container.dataset.projectHasChats === 'true';
    const collapsed = wrapper.dataset.projectCollapsed === 'true';

    toggle.disabled = !hasChats;
    toggle.setAttribute('aria-hidden', hasChats ? 'false' : 'true');
    toggle.classList.toggle('pointer-events-none', !hasChats);
    toggle.classList.toggle('invisible', !hasChats);

    if (hasChats) {
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    } else {
      toggle.setAttribute('aria-expanded', 'false');
    }

    const expandedIcon = toggle.querySelector('[data-project-chat-toggle-icon="expanded"]');
    const collapsedIcon = toggle.querySelector('[data-project-chat-toggle-icon="collapsed"]');
    if (expandedIcon && collapsedIcon) {
      expandedIcon.classList.toggle('hidden', collapsed);
      collapsedIcon.classList.toggle('hidden', !collapsed);
    }
  };

  const renderProjectContainer = (projectId, container) => {
    if (!container) {
      return;
    }

    container.innerHTML = '';
    const chats = getChats().filter((chat) => chat.projectId === projectId);

    if (!chats.length) {
      container.dataset.projectHasChats = 'false';
      container.classList.add('hidden');
      syncProjectToggleFromContainer(container);
      return;
    }

    container.dataset.projectHasChats = 'true';

    const collapsed = container.dataset.projectCollapsed === 'true';
    if (collapsed) {
      container.classList.add('hidden');
    } else {
      container.classList.remove('hidden');
    }

    chats
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((chat) => {
        const element = createChatElement(chat, { nested: true });
        container.appendChild(element);
      });

    syncProjectToggleFromContainer(container);
  };

  const renderGeneralContainers = () => {
    generalContainers.forEach((container) => {
      renderGeneralContainer(container);
    });
  };

  const renderProjectContainers = () => {
    projectContainerRegistry.forEach((containers, projectId) => {
      containers.forEach((container) => {
        renderProjectContainer(projectId, container);
      });
    });
  };

  const highlightActiveChat = () => {
    const activeLink = document.body?.dataset?.activeSidebarLink;
    const sidebar = window.AIAssistant?.sidebar;

    if (!activeLink || !sidebar || typeof sidebar.highlight !== 'function') {
      return;
    }

    sidebar.highlight(activeLink);
  };

  function notifyUpdate() {
    renderGeneralContainers();
    renderProjectContainers();
    highlightActiveChat();
    document.dispatchEvent(new CustomEvent('ai-assistant:chat-history-updated'));
  }

  const unregisterProjectContainer = (container) => {
    projectContainerRegistry.forEach((containers) => {
      containers.delete(container);
    });
  };

  const registerGeneralContainer = (container) => {
    if (!container) {
      return;
    }

    generalContainers.add(container);
    renderGeneralContainer(container);
  };

  const registerProjectContainer = (projectId, container) => {
    if (!container) {
      return;
    }

    unregisterProjectContainer(container);

    if (!projectId) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    if (!projectContainerRegistry.has(projectId)) {
      projectContainerRegistry.set(projectId, new Set());
    }

    projectContainerRegistry.get(projectId).add(container);
    renderProjectContainer(projectId, container);
  };

  const applySectionState = (section, collapsed) => {
    if (!section) {
      return;
    }

    const content = section.querySelector('[data-chats-content]');
    if (content) {
      content.classList.toggle('hidden', collapsed);
    }

    const toggle = section.querySelector('[data-chats-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    const expandedIcon = section.querySelector('[data-chats-icon="expanded"]');
    const collapsedIcon = section.querySelector('[data-chats-icon="collapsed"]');
    if (expandedIcon && collapsedIcon) {
      expandedIcon.classList.toggle('hidden', collapsed);
      collapsedIcon.classList.toggle('hidden', !collapsed);
    }
  };

  const bindSection = (section, collapsedPreference) => {
    if (!section) {
      return;
    }

    applySectionState(section, collapsedPreference);

    const toggle = section.querySelector('[data-chats-toggle]');
    if (!toggle) {
      return;
    }

    const existingHandler = sectionHandlers.get(section);
    if (existingHandler) {
      toggle.removeEventListener('click', existingHandler);
    }

    const handler = () => {
      const isCollapsed = section
        .querySelector('[data-chats-content]')
        ?.classList.contains('hidden') || false;
      const nextState = !isCollapsed;
      applySectionState(section, nextState);
      persistCollapsePreference(nextState);
    };

    sectionHandlers.set(section, handler);
    toggle.addEventListener('click', handler);
  };

  const initializeSections = () => {
    const collapsedPreference = getStoredCollapsePreference();
    const sections = document.querySelectorAll('[data-chats-section]');
    sections.forEach((section) => bindSection(section, collapsedPreference));
  };

  const initializeGeneralContainers = () => {
    generalContainers.clear();
    document.querySelectorAll('[data-chat-history]').forEach((container) => {
      registerGeneralContainer(container);
    });
  };

  const initializeProjectContainers = () => {
    projectContainerRegistry.clear();
    document.querySelectorAll('[data-project-chat-list]').forEach((container) => {
      const projectId = container.dataset.projectChatList || null;
      registerProjectContainer(projectId, container);
    });
  };

  const handleProjectFoldersRendered = (event) => {
    const root = event?.detail?.container || null;
    if (!root) {
      return;
    }

    root.querySelectorAll('[data-project-chat-list]').forEach((container) => {
      const projectId = container.dataset.projectChatList || null;
      registerProjectContainer(projectId, container);
    });
  };

  const handleStorageEvent = (event) => {
    if (event?.key === CHAT_STORAGE_KEY) {
      storedChats = loadStoredChats();
      notifyUpdate();
    }

    if (event?.key === COLLAPSE_STORAGE_KEY) {
      initializeSections();
    }
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
  window.addEventListener('storage', handleStorageEvent);

  document.addEventListener('ai-assistant:project-folders-rendered', handleProjectFoldersRendered);

  const initializeChatHistory = () => {
    initializeGeneralContainers();
    initializeProjectContainers();
    initializeSections();
    notifyUpdate();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatHistory);
  } else {
    initializeChatHistory();
  }

  document.addEventListener('ai-assistant:init-page', () => {
    initializeChatHistory();
    hideContextMenu();
  });

  window.AIAssistant = window.AIAssistant || {};
  window.AIAssistant.chatHistory = {
    getAll: () => getChats().map((chat) => ({ ...chat })),
    getGeneral: () => getChats().filter((chat) => !chat.projectId).map((chat) => ({ ...chat })),
    getByProject: (projectId) => getChats().filter((chat) => chat.projectId === projectId).map((chat) => ({ ...chat })),
    registerContainer: registerGeneralContainer,
    registerProjectContainer,
    createChat: createChatRecord,
    renameChat,
    deleteChat,
    assignProject: setChatProject,
    moveChatsToGeneral,
  };
})();
