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
    chatId: null,
    created: false,
    messageSent: false,
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

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return map[char] || char;
  });

  const resetOverlayContent = (overlay) => {
    if (!overlay) {
      return;
    }

    const thread = overlay.querySelector('[data-new-chat-thread]');
    if (thread) {
      thread.querySelectorAll('[data-new-chat-message]').forEach((node) => {
        node.remove();
      });
    }

    const welcome = overlay.querySelector('[data-new-chat-welcome]');
    if (welcome) {
      welcome.classList.remove('hidden');
    }

    const messages = overlay.querySelector('#new-chat-messages');
    if (messages) {
      messages.scrollTop = 0;
    }

    const quickstart = overlay.querySelector('[data-new-chat-quickstart]');
    if (quickstart) {
      quickstart.scrollTop = 0;
    }
  };

  const hideOverlay = () => {
    const overlay = findOverlay();
    if (!overlay) {
      return;
    }

    const chatHistory = window.AIAssistant?.chatHistory;
    if (
      overlayState.created
      && !overlayState.messageSent
      && overlayState.chatId
      && chatHistory
      && typeof chatHistory.deleteChat === 'function'
    ) {
      chatHistory.deleteChat(overlayState.chatId);
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

    resetOverlayContent(overlay);

    overlayState.textarea = null;
    overlayState.chatId = null;
    overlayState.created = false;
    overlayState.messageSent = false;
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
      <div class="flex flex-col lg:flex-row flex-1 min-h-0">
          <section class="flex flex-col flex-1 min-h-0 bg-white" aria-labelledby="${NEW_CHAT_OVERLAY_ID}-heading">
              <header id="new-chat-header" class="flex items-center justify-between h-16 border-b border-gray-200 px-6 bg-white flex-shrink-0">
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
                      <button class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" type="button" data-new-chat-close>
                          <span class="sr-only">Close new chat</span>
                          <i class="fa-solid fa-xmark"></i>
                      </button>
                  </div>
              </header>

              <div id="new-chat-messages" class="flex-1 overflow-y-auto p-6">
                  <div data-new-chat-thread class="space-y-6">
                      <div id="new-chat-welcome" data-new-chat-welcome class="text-center py-16">
                          <div class="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-6">
                              <i class="fa-solid fa-robot text-white text-3xl"></i>
                          </div>
                          <h3 id="${NEW_CHAT_OVERLAY_ID}-description" class="text-2xl font-semibold text-gray-800 mb-3">Start a New Conversation</h3>
                          <p class="text-gray-600 max-w-lg mx-auto text-lg">I'm ready to help you with any questions or tasks. What would you like to work on today?</p>
                      </div>
                  </div>
              </div>

              <div id="new-chat-input-area" class="border-t border-gray-200 p-4 bg-white flex-shrink-0">
                  <form data-new-chat-form class="max-w-4xl mx-auto" autocomplete="off">
                      <div class="relative flex items-center w-full bg-white border border-gray-200 rounded-full shadow-sm p-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-navy/50">
                          <i class="fa-solid fa-plus text-gray-500 pl-4 pr-2"></i>
                          <textarea id="new-chat-input" placeholder="How can I help you today?" rows="1" class="flex-1 w-full p-2 bg-transparent border-none resize-none focus:ring-0 text-sm text-gray-800 placeholder-gray-500" data-new-chat-input="true"></textarea>
                          <div class="flex items-center space-x-1 pr-2">
                              <button class="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-100 rounded-full transition-all" type="button">
                                  <i class="fa-solid fa-microphone text-lg"></i>
                              </button>
                              <button class="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-navy hover:text-white transition-all control-btn" type="submit" data-new-chat-send>
                                  <i class="fa-solid fa-arrow-up"></i>
                              </button>
                          </div>
                      </div>
                  </form>
              </div>
          </section>

          <aside class="w-full lg:w-[320px] lg:max-w-[320px] border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 flex flex-col min-h-0" aria-label="Quick start templates">
              <div class="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
                  <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quick Start</h3>
                  <p class="text-xs text-gray-500 mt-1">Choose a template to prefill your message.</p>
              </div>
              <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6" data-new-chat-quickstart>
                  <section class="space-y-3">
                      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Popular Prompts</h4>
                      <div class="space-y-3">
                          <button type="button" class="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-navy hover:shadow-sm transition-all" data-new-chat-template="Brainstorm three product positioning ideas for our upcoming launch.">
                              <div class="flex items-start space-x-3">
                                  <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                      <i class="fa-solid fa-lightbulb"></i>
                                  </div>
                                  <div>
                                      <p class="text-sm font-semibold text-gray-800">Generate Ideas</p>
                                      <p class="text-xs text-gray-500">Brainstorm creative solutions and innovative concepts.</p>
                                  </div>
                              </div>
                          </button>
                          <button type="button" class="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-navy hover:shadow-sm transition-all" data-new-chat-template="Review the attached specification and list potential implementation risks.">
                              <div class="flex items-start space-x-3">
                                  <div class="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                      <i class="fa-solid fa-code"></i>
                                  </div>
                                  <div>
                                      <p class="text-sm font-semibold text-gray-800">Code Review</p>
                                      <p class="text-xs text-gray-500">Analyze and improve your code quality.</p>
                                  </div>
                              </div>
                          </button>
                          <button type="button" class="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-navy hover:shadow-sm transition-all" data-new-chat-template="Draft a one-page executive summary for the PAMM rebate enhancement project.">
                              <div class="flex items-start space-x-3">
                                  <div class="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                      <i class="fa-solid fa-file-lines"></i>
                                  </div>
                                  <div>
                                      <p class="text-sm font-semibold text-gray-800">Write Documentation</p>
                                      <p class="text-xs text-gray-500">Create clear and comprehensive documentation.</p>
                                  </div>
                              </div>
                          </button>
                      </div>
                  </section>

                  <section class="space-y-3">
                      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Next Steps</h4>
                      <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-3 text-sm text-gray-600">
                          <p>• Summarize the latest project decisions for stakeholders.</p>
                          <p>• Identify any data gaps needed for the next release.</p>
                          <p>• Draft follow-up questions for the implementation team.</p>
                      </div>
                  </section>

                  <section class="space-y-3">
                      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tips</h4>
                      <div class="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-3">
                          <p>Be as specific as possible about your goal so I can tailor the response.</p>
                          <p>Mention any deadlines or constraints that impact the solution.</p>
                          <p>Attach relevant files or links when you need detailed analysis.</p>
                      </div>
                  </section>
              </div>
          </aside>
      </div>
    `;

    main.appendChild(overlay);

    const textarea = overlay.querySelector('#new-chat-input');
    if (textarea) {
      textarea.addEventListener('input', () => autoResizeTextarea(textarea));
      overlayState.textarea = textarea;
    }

    const form = overlay.querySelector('[data-new-chat-form]');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        const message = overlayState.textarea?.value?.trim() || '';
        if (!message) {
          return;
        }

        overlayState.messageSent = true;

        const thread = overlay.querySelector('[data-new-chat-thread]');
        const welcome = overlay.querySelector('[data-new-chat-welcome]');

        if (welcome) {
          welcome.classList.add('hidden');
        }

        if (thread) {
          const bubble = document.createElement('div');
          bubble.className = 'flex justify-end';
          bubble.dataset.newChatMessage = 'true';
          bubble.innerHTML = `
            <div class="max-w-[75%] rounded-2xl bg-navy text-white px-5 py-3 shadow message-bubble">
              <p class="text-sm whitespace-pre-wrap">${escapeHtml(message)}</p>
            </div>
          `;
          thread.appendChild(bubble);

          requestAnimationFrame(() => {
            bubble.scrollIntoView({ block: 'end', behavior: 'smooth' });
          });
        }

        overlayState.textarea.value = '';
        overlayState.textarea.style.height = '';
        autoResizeTextarea(overlayState.textarea);
      });
    }

    const closeButton = overlay.querySelector('[data-new-chat-close]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        hideOverlay();
      });
    }

    overlay.querySelectorAll('[data-new-chat-template]').forEach((button) => {
      button.addEventListener('click', () => {
        const template = button.dataset.newChatTemplate || '';
        if (!overlayState.textarea) {
          return;
        }

        overlayState.textarea.value = template;
        autoResizeTextarea(overlayState.textarea);
        overlayState.textarea.focus();
      });
    });

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

    overlayState.chatId = null;
    overlayState.created = false;
    overlayState.messageSent = false;

    const chatHistory = window.AIAssistant?.chatHistory;
    if (chatHistory && typeof chatHistory.createChat === 'function') {
      const activeLink = document.body?.dataset?.activeSidebarLink || '';
      const projectId = activeLink && activeLink.startsWith('project-') ? activeLink : null;
      const { chat, created } = chatHistory.createChat({ title: 'New Chat', projectId });
      overlayState.chatId = chat?.id || null;
      overlayState.created = Boolean(created && overlayState.chatId);
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
