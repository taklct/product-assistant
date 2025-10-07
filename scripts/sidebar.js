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

  const NEW_CHAT_OVERLAY_ID = 'new-chat-overlay';
  const NEW_CHAT_INPUT_SELECTOR = '[data-new-chat-input]';

  const overlayState = {
    textarea: null,
  };

  const getMainContent = () => document.getElementById('main-content');

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

    main.classList.add('relative');

    const overlay = document.createElement('div');
    overlay.id = NEW_CHAT_OVERLAY_ID;
    overlay.className = 'absolute inset-0 z-20 hidden overflow-y-auto bg-white/95 backdrop-blur-sm';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-labelledby', `${NEW_CHAT_OVERLAY_ID}-heading`);
    overlay.setAttribute('aria-describedby', `${NEW_CHAT_OVERLAY_ID}-description`);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors';
    closeButton.innerHTML = '<span class="sr-only">Close new chat</span><i class="fa-solid fa-xmark text-lg"></i>';
    closeButton.addEventListener('click', hideOverlay);

    const container = document.createElement('div');
    container.className = 'min-h-full flex flex-col items-center justify-center text-center gap-6 px-4 py-16';

    const heading = document.createElement('h2');
    heading.id = `${NEW_CHAT_OVERLAY_ID}-heading`;
    heading.className = 'text-3xl sm:text-4xl font-semibold text-gray-900';
    heading.textContent = 'Welcome to AI Assistant';

    const description = document.createElement('p');
    description.id = `${NEW_CHAT_OVERLAY_ID}-description`;
    description.className = 'text-base sm:text-lg text-gray-600 max-w-2xl';
    description.textContent = "I'm here to help you with product requirements, documentation, and project planning. How can I assist you today?";

    const form = document.createElement('form');
    form.className = 'w-full max-w-3xl mt-10';
    form.setAttribute('aria-label', 'Start a new chat with the AI assistant');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });

    const composerFrame = document.createElement('div');
    composerFrame.className = 'border border-gray-200 bg-white rounded-3xl shadow-lg p-4';

    const composerContainer = document.createElement('div');
    composerContainer.className = 'max-w-4xl mx-auto';

    const attachmentsPreview = document.createElement('div');
    attachmentsPreview.className = 'flex flex-wrap gap-2 mb-3 hidden';

    const relativeContainer = document.createElement('div');
    relativeContainer.className = 'relative';

    const dropOverlay = document.createElement('div');
    dropOverlay.className = 'drop-overlay hidden absolute inset-0 rounded-3xl border-2 border-dashed border-navy/40 bg-white/80 flex items-center justify-center text-navy font-medium z-20';
    dropOverlay.textContent = 'Drop files to attach';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'relative flex items-center w-full bg-white border border-gray-200 rounded-full shadow-sm p-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-navy/50';

    const attachmentButton = document.createElement('button');
    attachmentButton.type = 'button';
    attachmentButton.className = 'w-10 h-10 flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-100 rounded-full transition-all ml-2';
    attachmentButton.innerHTML = '<i class="fa-solid fa-plus text-lg"></i>';

    const textarea = document.createElement('textarea');
    textarea.className = 'flex-1 w-full p-2 bg-transparent border-none resize-none focus:ring-0 text-sm text-gray-800 placeholder-gray-500';
    textarea.setAttribute('rows', '1');
    const existingPlaceholder = document.querySelector('#chat-input')?.getAttribute('placeholder');
    textarea.setAttribute('placeholder', existingPlaceholder || 'Message the assistant...');
    textarea.setAttribute('aria-label', existingPlaceholder || 'Message the assistant');
    textarea.setAttribute('data-new-chat-input', 'true');
    textarea.addEventListener('input', () => autoResizeTextarea(textarea));

    const actions = document.createElement('div');
    actions.className = 'flex items-center space-x-1 pr-2';

    const voiceButton = document.createElement('button');
    voiceButton.type = 'button';
    voiceButton.className = 'w-10 h-10 flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-100 rounded-full transition-all shrink-0';
    voiceButton.innerHTML = '<i class="fa-solid fa-microphone text-lg"></i>';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-navy hover:text-white transition-all control-btn shrink-0';
    submitButton.innerHTML = '<span class="sr-only">Send message</span><i class="fa-solid fa-arrow-up"></i>';

    const commandMenu = document.createElement('div');
    commandMenu.className = 'command-menu hidden absolute bottom-full left-16 mb-3 w-72 bg-white rounded-2xl border border-gray-200 overflow-hidden z-30';
    commandMenu.innerHTML = [
      '<div class="px-4 py-3 border-b border-gray-100">',
      '<p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Slash commands</p>',
      '</div>',
      '<ul class="max-h-64 overflow-y-auto py-2"></ul>',
    ].join('');

    const attachmentMenu = document.createElement('div');
    attachmentMenu.className = 'hidden absolute bottom-full left-0 mb-3 w-60 bg-white rounded-2xl border border-gray-200 shadow-xl z-30';
    attachmentMenu.innerHTML = [
      '<button type="button" class="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">',
      '<i class="fa-solid fa-arrow-up-from-bracket text-navy"></i>',
      '<span>Upload from computer</span>',
      '</button>',
      '<button type="button" class="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">',
      '<i class="fa-solid fa-link text-navy"></i>',
      '<span>Add reference link</span>',
      '</button>',
      '<button type="button" class="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">',
      '<i class="fa-solid fa-note-sticky text-navy"></i>',
      '<span>Add quick note</span>',
      '</button>',
    ].join('');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.className = 'hidden';

    actions.append(voiceButton, submitButton);
    inputWrapper.append(attachmentButton, textarea, actions, commandMenu, attachmentMenu);
    relativeContainer.append(dropOverlay, inputWrapper);
    composerContainer.append(attachmentsPreview, relativeContainer);
    composerFrame.append(composerContainer, fileInput);
    form.appendChild(composerFrame);

    container.append(heading, description, form);
    overlay.append(closeButton, container);
    main.appendChild(overlay);

    overlayState.textarea = textarea;

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

    const main = getMainContent();
    if (main) {
      main.dataset.newChatVisible = 'true';
    }

    const textarea = overlayState.textarea || overlay.querySelector(NEW_CHAT_INPUT_SELECTOR);
    if (textarea) {
      overlayState.textarea = textarea;
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
