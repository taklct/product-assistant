(function () {
  const SUPPORTS_HISTORY = typeof window !== 'undefined' && typeof window.history?.pushState === 'function';
  if (!SUPPORTS_HISTORY) {
    return;
  }

  const isSameOrigin = (url) => {
    try {
      const target = new URL(url, window.location.href);
      return target.origin === window.location.origin;
    } catch (error) {
      return false;
    }
  };

  const shouldHandleLink = (anchor) => {
    if (!anchor || anchor.target && anchor.target !== '_self') {
      return false;
    }

    if (anchor.hasAttribute('download') || anchor.getAttribute('rel') === 'external') {
      return false;
    }

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) {
      return false;
    }

    if (anchor.dataset.noSpa === 'true') {
      return false;
    }

    return isSameOrigin(href);
  };

  const copyBodyAttributes = (source, target) => {
    Array.from(target.attributes).forEach((attr) => target.removeAttribute(attr.name));
    Array.from(source.attributes).forEach((attr) => target.setAttribute(attr.name, attr.value));
  };

  const executeInlineScripts = (doc) => {
    const scripts = Array.from(doc.querySelectorAll('body script')).filter((script) => !script.src);
    scripts.forEach((script) => {
      const clone = document.createElement('script');
      Array.from(script.attributes).forEach((attr) => clone.setAttribute(attr.name, attr.value));
      clone.textContent = script.textContent ?? '';
      document.body.appendChild(clone);
      document.body.removeChild(clone);
    });
  };

  const setNavigationStatus = (value) => {
    window.AIAssistant = window.AIAssistant || {};
    window.AIAssistant.navigation = window.AIAssistant.navigation || {};
    window.AIAssistant.navigation.isNavigating = value;
  };

  const reinitializeSharedComponents = ({ dispatchPageEvent = true } = {}) => {
    const activeLink = document.body?.dataset?.activeSidebarLink || null;

    if (typeof window.AIAssistant?.initSidebar === 'function') {
      const sidebarInstance = window.AIAssistant.initSidebar({ activeLink });
      if (!window.AIAssistant) {
        window.AIAssistant = {};
      }
      window.AIAssistant.sidebar = sidebarInstance;
    }

    const projectFolders = window.AIAssistant?.projectFolders;
    if (projectFolders && typeof projectFolders.render === 'function') {
      document.querySelectorAll('[data-project-folders]').forEach((container) => {
        projectFolders.render(container);
      });
    }

    const initTopbar = window.AIAssistant?.topbar?.init;
    if (typeof initTopbar === 'function') {
      initTopbar();
    }

    if (dispatchPageEvent) {
      const initEvent = new CustomEvent('ai-assistant:init-page', {
        detail: { page: activeLink || null },
      });
      document.dispatchEvent(initEvent);
    }
  };

  const updateDocument = (newDoc) => {
    if (!newDoc || !newDoc.body) {
      return false;
    }

    document.title = newDoc.title || document.title;
    copyBodyAttributes(newDoc.body, document.body);
    document.body.innerHTML = newDoc.body.innerHTML;
    executeInlineScripts(newDoc);
    setNavigationStatus(false);
    reinitializeSharedComponents();
    window.scrollTo(0, 0);
    return true;
  };

  const fetchDocument = async (url) => {
    const response = await fetch(url, {
      headers: { 'X-Requested-With': 'ai-assistant-spa' },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to load: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/html');
  };

  let navigating = false;

  const navigate = async (url, { replace = false, isPopState = false } = {}) => {
    if (!url || navigating) {
      return;
    }

    navigating = true;

    const target = new URL(url, window.location.href);
    if (target.href === window.location.href && !replace && !isPopState) {
      navigating = false;
      return;
    }

    try {
      setNavigationStatus(true);

      const doc = await fetchDocument(target.href);
      const updated = updateDocument(doc);
      if (!updated) {
        throw new Error('Invalid document');
      }

      if (!isPopState) {
        const method = replace ? 'replaceState' : 'pushState';
        window.history[method]({}, '', target.href);
      }
    } catch (error) {
      window.location.href = target.href;
    } finally {
      setNavigationStatus(false);
      navigating = false;
    }
  };

  const handleLinkClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchor = event.target.closest('a');
    if (!anchor || !shouldHandleLink(anchor)) {
      return;
    }

    event.preventDefault();
    navigate(anchor.href);
  };

  const handlePopState = () => {
    navigate(window.location.href, { replace: true, isPopState: true });
  };

  document.addEventListener('click', handleLinkClick);
  window.addEventListener('popstate', handlePopState);

  window.AIAssistant = window.AIAssistant || {};
  window.AIAssistant.navigation = {
    go: (url) => navigate(url),
    replace: (url) => navigate(url, { replace: true }),
    isSpaReady: true,
    isNavigating: false,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      reinitializeSharedComponents({ dispatchPageEvent: false });
    });
  } else {
    reinitializeSharedComponents({ dispatchPageEvent: false });
  }
})();
