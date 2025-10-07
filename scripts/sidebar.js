(function () {
  const SIDEBAR_COLLAPSED_KEY = 'ai-assistant-sidebar-collapsed';
  const DESKTOP_BREAKPOINT = '(min-width: 1024px)';
  const ACTIVE_CLASSES = ['bg-sky/10', 'text-navy', 'font-medium'];
  const INACTIVE_CLASS = 'text-gray-600';

  const isSidebarScript = (script) => Boolean(script?.src && /sidebar\.js(\?.*)?$/.test(script.src));

  const findSidebarScript = () => {
    if (typeof document === 'undefined') {
      return null;
    }

    if (isSidebarScript(document.currentScript)) {
      return document.currentScript;
    }

    const scripts = Array.from(document.getElementsByTagName('script'));
    return scripts.reverse().find((script) => isSidebarScript(script)) || null;
  };

  const computeAppBaseUrl = () => {
    if (typeof window === 'undefined') {
      return '/';
    }

    try {
      const script = findSidebarScript();
      if (script?.src) {
        const scriptUrl = new URL(script.src, window.location.href);
        const baseUrl = new URL('../', scriptUrl);
        return baseUrl.href;
      }
    } catch (error) {
      /* noop */
    }

    try {
      return new URL('.', window.location.href).href;
    } catch (error) {
      return `${window.location.origin}/`;
    }
  };

  const APP_BASE_URL = computeAppBaseUrl();

  const resolveAppUrl = (href) => {
    if (!href) {
      return null;
    }

    try {
      return new URL(href, APP_BASE_URL).href;
    } catch (error) {
      return href;
    }
  };

  const namespace = window.AIAssistant = window.AIAssistant || {};
  namespace.baseUrl = APP_BASE_URL;
  namespace.resolveAppUrl = resolveAppUrl;

  const getPersistedSidebarCollapsed = () => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  const persistSidebarCollapsed = (collapsed) => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
    } catch (error) {
      /* noop */
    }
  };

  const highlightSidebarLink = (sidebar, linkKey) => {
    if (!sidebar || !linkKey) {
      return;
    }

    const candidates = sidebar.querySelectorAll('[data-sidebar-link]');
    candidates.forEach((candidate) => {
      candidate.classList.remove(...ACTIVE_CLASSES);
      candidate.classList.add(INACTIVE_CLASS);
    });

    const activeElement = sidebar.querySelector(`[data-sidebar-link="${linkKey}"]`);
    if (!activeElement) {
      return;
    }

    activeElement.classList.add(...ACTIVE_CLASSES);
    activeElement.classList.remove(INACTIVE_CLASS);
  };

  const createSyncSidebarIcons = (sidebar, toggleButton, collapseIcon, expandIcon) => () => {
    if (!sidebar || !toggleButton || !collapseIcon || !expandIcon) {
      return;
    }

    const isCollapsed = sidebar.classList.contains('collapsed');
    collapseIcon.classList.toggle('hidden', isCollapsed);
    expandIcon.classList.toggle('hidden', !isCollapsed);
    toggleButton.setAttribute('aria-expanded', (!isCollapsed).toString());
    toggleButton.setAttribute('aria-label', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  };

  const initSidebar = (options = {}) => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
      return null;
    }

    const settings = {
      activeLink: null,
      ...options,
    };

    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const collapseIcon = document.querySelector('[data-icon-collapse]');
    const expandIcon = document.querySelector('[data-icon-expand]');
    const desktopBreakpoint = window.matchMedia(DESKTOP_BREAKPOINT);

    const syncSidebarIcons = createSyncSidebarIcons(
      sidebar,
      sidebarToggle,
      collapseIcon,
      expandIcon,
    );

    const closeMobileSidebar = (silent = false) => {
      sidebar.classList.remove('mobile-open');
      sidebarBackdrop?.classList.remove('visible');
      document.body.classList.remove('sidebar-mobile-open');

      if (!silent) {
        syncSidebarIcons();
      }
    };

    const openMobileSidebar = () => {
      sidebar.classList.add('mobile-open');
      sidebarBackdrop?.classList.add('visible');
      document.body.classList.add('sidebar-mobile-open');
    };

    const applyDesktopSidebarState = () => {
      const shouldCollapse = getPersistedSidebarCollapsed();
      sidebar.classList.toggle('collapsed', shouldCollapse);
      syncSidebarIcons();
    };

    const toggleSidebar = () => {
      if (window.innerWidth < 1024) {
        if (sidebar.classList.contains('mobile-open')) {
          closeMobileSidebar();
        } else {
          openMobileSidebar();
        }
        return;
      }

      const isCollapsed = sidebar.classList.toggle('collapsed');
      persistSidebarCollapsed(isCollapsed);
      syncSidebarIcons();
    };

    const handleBreakpointChange = () => {
      if (desktopBreakpoint.matches) {
        closeMobileSidebar(true);
        applyDesktopSidebarState();
      } else {
        sidebar.classList.remove('collapsed');
        syncSidebarIcons();
      }
    };

    sidebarToggle?.addEventListener('click', toggleSidebar);
    mobileSidebarToggle?.addEventListener('click', openMobileSidebar);
    sidebarBackdrop?.addEventListener('click', () => closeMobileSidebar());

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMobileSidebar();
      }
    });

    sidebar.querySelectorAll('[data-sidebar-link], a, button').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
          closeMobileSidebar();
        }
      });
    });

    desktopBreakpoint.addEventListener('change', handleBreakpointChange);
    handleBreakpointChange();
    syncSidebarIcons();
    highlightSidebarLink(sidebar, settings.activeLink);

    return {
      highlight: (linkKey) => highlightSidebarLink(sidebar, linkKey),
      collapse: () => sidebar.classList.add('collapsed'),
      expand: () => sidebar.classList.remove('collapsed'),
    };
  };

  const NEW_CHAT_OVERLAY_ID = 'new-chat-view';
  const NEW_CHAT_INPUT_SELECTOR = '[data-new-chat-input]';

  const overlayState = {
    textarea: null,
  };

  const getMainContent = () => document.getElementById('main-content');
  const getRightPanel = () => document.getElementById('right-panel');

  const hideMainSiblings = (overlay) => {
    const main = getMainContent();
    if (!main || !overlay) {
      return;
    }

    Array.from(main.children).forEach((child) => {
      if (!(child instanceof HTMLElement) || child === overlay) {
        return;
      }

      if (!child.classList.contains('hidden')) {
        child.dataset.newChatHidden = 'true';
        child.classList.add('hidden');
      }
    });
  };

  const restoreMainSiblings = () => {
    const main = getMainContent();
    if (!main) {
      return;
    }

    Array.from(main.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) {
        return;
      }

      if (child.dataset.newChatHidden === 'true') {
        child.classList.remove('hidden');
        delete child.dataset.newChatHidden;
      }
    });
  };

  const hideRightPanel = () => {
    const panel = getRightPanel();
    if (!panel || panel.classList.contains('hidden')) {
      return;
    }

    panel.dataset.newChatHidden = 'true';
    panel.classList.add('hidden');
  };

  const restoreRightPanel = () => {
    const panel = getRightPanel();
    if (!panel) {
      return;
    }

    if (panel.dataset.newChatHidden === 'true') {
      panel.classList.remove('hidden');
      delete panel.dataset.newChatHidden;
    }
  };

  const findOverlay = () => {
    const main = getMainContent();
    if (!main) {
      overlayState.textarea = null;
      return null;
    }

    const overlay = main.querySelector(`#${NEW_CHAT_OVERLAY_ID}`);
    if (!overlay) {
      overlayState.textarea = null;
      return null;
    }

    overlayState.textarea = overlay.querySelector(NEW_CHAT_INPUT_SELECTOR);
    return overlay;
  };

  const isOverlayVisible = () => {
    const overlay = findOverlay();
    return Boolean(overlay && !overlay.classList.contains('hidden'));
  };

  const autoResizeTextarea = (textarea) => {
    if (!textarea) {
      return;
    }

    const element = textarea;
    element.style.height = 'auto';
    const nextHeight = Math.min(element.scrollHeight, 200);
    element.style.height = `${nextHeight}px`;
  };

  const hideOverlay = () => {
    const overlay = findOverlay();
    if (!overlay) {
      return;
    }

    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');

    restoreMainSiblings();
    restoreRightPanel();

    const main = getMainContent();
    if (main) {
      delete main.dataset.newChatVisible;
    }

    if (overlayState.textarea) {
      overlayState.textarea.value = '';
      overlayState.textarea.style.height = '';
    }
  };

  const createOverlay = () => {
    const main = getMainContent();
    if (!main) {
      return null;
    }

    const overlay = document.createElement('div');
    overlay.id = NEW_CHAT_OVERLAY_ID;
    overlay.className = 'flex-1 flex flex-col bg-white hidden';
    overlay.setAttribute('role', 'region');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-labelledby', `${NEW_CHAT_OVERLAY_ID}-heading`);
    overlay.setAttribute('aria-describedby', `${NEW_CHAT_OVERLAY_ID}-description`);

    overlay.innerHTML = `
      <header id="new-chat-header" class="flex items-center justify-between h-16 border-b border-gray-200 px-6 bg-white">
          <div class="flex items-center space-x-4">
              <h2 id="${NEW_CHAT_OVERLAY_ID}-heading" class="text-lg font-semibold text-gray-800">New Chat</h2>
          </div>
          <div class="flex items-center space-x-3">
              <button class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" type="button">
                  <i class="fa-solid fa-share-nodes"></i>
              </button>
              <button class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" type="button">
                  <i class="fa-solid fa-download"></i>
              </button>
              <button class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" type="button">
                  <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
          </div>
      </header>

      <div id="new-chat-messages" class="flex-1 overflow-y-auto p-6 space-y-6">
          <div id="new-chat-welcome" class="text-center py-16">
              <div class="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-6">
                  <i class="fa-solid fa-robot text-white text-3xl"></i>
              </div>
              <h3 id="${NEW_CHAT_OVERLAY_ID}-description" class="text-2xl font-semibold text-gray-800 mb-3">Start a New Conversation</h3>
              <p class="text-gray-600 max-w-lg mx-auto text-lg">I'm ready to help you with any questions or tasks. What would you like to work on today?</p>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
                  <div class="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 cursor-pointer transition-all">
                      <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <i class="fa-solid fa-lightbulb text-blue-600 text-xl"></i>
                      </div>
                      <h4 class="font-semibold text-gray-800 mb-2">Generate Ideas</h4>
                      <p class="text-sm text-gray-600">Brainstorm creative solutions and innovative concepts</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 cursor-pointer transition-all">
                      <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <i class="fa-solid fa-code text-green-600 text-xl"></i>
                      </div>
                      <h4 class="font-semibold text-gray-800 mb-2">Code Review</h4>
                      <p class="text-sm text-gray-600">Analyze and improve your code quality</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 cursor-pointer transition-all">
                      <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <i class="fa-solid fa-file-text text-purple-600 text-xl"></i>
                      </div>
                      <h4 class="font-semibold text-gray-800 mb-2">Write Documentation</h4>
                      <p class="text-sm text-gray-600">Create clear and comprehensive documentation</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 cursor-pointer transition-all">
                      <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <i class="fa-solid fa-chart-bar text-orange-600 text-xl"></i>
                      </div>
                      <h4 class="font-semibold text-gray-800 mb-2">Analyze Data</h4>
                      <p class="text-sm text-gray-600">Extract insights from your data sets</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 cursor-pointer transition-all">
                      <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <i class="fa-solid fa-bug text-red-600 text-xl"></i>
                      </div>
                      <h4 class="font-semibold text-gray-800 mb-2">Debug Issues</h4>
                      <p class="text-sm text-gray-600">Identify and solve technical problems</p>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 cursor-pointer transition-all">
                      <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <i class="fa-solid fa-tasks text-indigo-600 text-xl"></i>
                      </div>
                      <h4 class="font-semibold text-gray-800 mb-2">Plan Projects</h4>
                      <p class="text-sm text-gray-600">Organize tasks and create project roadmaps</p>
                  </div>
              </div>
          </div>
      </div>

      <div id="new-chat-input-area" class="border-t border-gray-200 p-4 bg-white">
          <div class="max-w-4xl mx-auto">
              <div class="relative flex items-center w-full bg-white border border-gray-200 rounded-full shadow-sm p-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-navy/50">
                  <i class="fa-solid fa-plus text-gray-500 pl-4 pr-2"></i>
                  <textarea id="new-chat-input" placeholder="How can I help you today?" rows="1" class="flex-1 w-full p-2 bg-transparent border-none resize-none focus:ring-0 text-sm text-gray-800 placeholder-gray-500" data-new-chat-input="true"></textarea>
                  <div class="flex items-center space-x-1 pr-2">
                      <button class="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-100 rounded-full transition-all" type="button">
                          <i class="fa-solid fa-microphone text-lg"></i>
                      </button>
                      <button class="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-navy hover:text-white transition-all control-btn" type="button">
                          <i class="fa-solid fa-arrow-up"></i>
                      </button>
                  </div>
              </div>
          </div>
      </div>
    `;

    main.appendChild(overlay);

    const textarea = overlay.querySelector('#new-chat-input');
    if (textarea) {
      textarea.addEventListener('input', () => autoResizeTextarea(textarea));
      overlayState.textarea = textarea;
    }

    return overlay;
  };

  const ensureOverlay = () => findOverlay() || createOverlay();

  const showOverlay = () => {
    const overlay = ensureOverlay();
    if (!overlay) {
      return;
    }

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');

    hideMainSiblings(overlay);
    hideRightPanel();

    const main = getMainContent();
    if (main) {
      main.dataset.newChatVisible = 'true';
    }

    const chatHistory = window.AIAssistant?.chatHistory;
    if (chatHistory && typeof chatHistory.createChat === 'function') {
      const activeLink = document.body?.dataset?.activeSidebarLink || '';
      const projectId = activeLink && activeLink.startsWith('project-') ? activeLink : null;
      chatHistory.createChat({ title: 'New Chat', projectId });
    }

    const textarea = overlayState.textarea || overlay.querySelector(NEW_CHAT_INPUT_SELECTOR);
    if (textarea) {
      overlayState.textarea = textarea;
      textarea.value = '';
      textarea.style.height = '';
      autoResizeTextarea(textarea);
      textarea.focus();
    }
  };

  const bindNewChatButton = () => {
    const button = document.getElementById('sidebar-new-chat');
    if (!button || button.dataset.newChatOverlayBound === 'true') {
      return;
    }

    button.dataset.newChatOverlayBound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      showOverlay();
    });
  };

  const initializeNewChatOverlay = () => {
    bindNewChatButton();
    hideOverlay();
  };

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape' && isOverlayVisible()) {
      hideOverlay();
    }
  };

  document.addEventListener('keydown', handleEscapeKey);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNewChatOverlay);
  } else {
    initializeNewChatOverlay();
  }

  document.addEventListener('ai-assistant:init-page', () => {
    // Reset any cached references because the DOM may have been replaced.
    overlayState.textarea = null;
    initializeNewChatOverlay();
  });

  window.AIAssistant = window.AIAssistant || {};
  window.AIAssistant.initSidebar = initSidebar;
  window.AIAssistant.newChatOverlay = {
    show: showOverlay,
    hide: hideOverlay,
  };
})();
