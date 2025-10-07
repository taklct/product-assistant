(function () {
  const ROOT_SELECTOR = '[data-chat-input-root]';
  const cleanups = new Map();

  const hideMenu = (menu, commandItems) => {
    if (!menu) {
      return;
    }
    menu.classList.add('hidden');
    if (Array.isArray(commandItems)) {
      commandItems.forEach((item) => item.classList.remove('bg-navy/10'));
    }
  };

  const setupRoot = (root) => {
    if (!root) {
      return null;
    }

    const inputField =
      root.querySelector('[data-chat-input-field]') ||
      root.querySelector('input, textarea');
    const slashMenu = root.querySelector('[data-chat-input-menu]');
    const commandItems = slashMenu
      ? Array.from(slashMenu.querySelectorAll('[data-chat-command]'))
      : [];

    if (!inputField) {
      return null;
    }

    let selectedIndex = -1;

    const filterCommands = (value) => {
      if (!slashMenu || !commandItems.length) {
        return;
      }

      const normalized = value?.toLowerCase?.() ?? '';

      commandItems.forEach((item) => {
        const command = item.dataset.command || '';
        if (!normalized || command.toLowerCase().includes(normalized)) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
        item.classList.remove('bg-navy/10');
      });
    };

    const getVisibleItems = () =>
      commandItems.filter((item) => !item.classList.contains('hidden'));

    const updateSelection = (visibleItems) => {
      visibleItems.forEach((item, index) => {
        if (index === selectedIndex) {
          item.classList.add('bg-navy/10');
        } else {
          item.classList.remove('bg-navy/10');
        }
      });
    };

    const handleInput = (event) => {
      if (!slashMenu) {
        return;
      }

      const value = event.target?.value || '';
      if (value === '/' || value.startsWith('/')) {
        slashMenu.classList.remove('hidden');
        filterCommands(value);
        selectedIndex = -1;
        updateSelection(getVisibleItems());
      } else {
        hideMenu(slashMenu, commandItems);
        selectedIndex = -1;
      }
    };

    const handleKeydown = (event) => {
      if (!slashMenu || slashMenu.classList.contains('hidden')) {
        return;
      }

      const visibleItems = getVisibleItems();
      if (!visibleItems.length) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
        updateSelection(visibleItems);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection(visibleItems);
      } else if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault();
        const command = visibleItems[selectedIndex].dataset.command || '';
        inputField.value = `${command} `;
        hideMenu(slashMenu, commandItems);
        selectedIndex = -1;
        inputField.focus();
      } else if (event.key === 'Escape') {
        hideMenu(slashMenu, commandItems);
        selectedIndex = -1;
      }
    };

    const handleItemClick = (event) => {
      const command = event.currentTarget?.dataset?.command || '';
      inputField.value = `${command} `;
      hideMenu(slashMenu, commandItems);
      selectedIndex = -1;
      inputField.focus();
    };

    const handleDocumentClick = (event) => {
      if (!slashMenu) {
        return;
      }

      if (!root.contains(event.target)) {
        hideMenu(slashMenu, commandItems);
        selectedIndex = -1;
      }
    };

    inputField.addEventListener('input', handleInput);
    inputField.addEventListener('keydown', handleKeydown);

    commandItems.forEach((item) => {
      item.addEventListener('click', handleItemClick);
    });

    document.addEventListener('click', handleDocumentClick);

    hideMenu(slashMenu, commandItems);

    return () => {
      inputField.removeEventListener('input', handleInput);
      inputField.removeEventListener('keydown', handleKeydown);
      commandItems.forEach((item) => {
        item.removeEventListener('click', handleItemClick);
      });
      document.removeEventListener('click', handleDocumentClick);
      hideMenu(slashMenu, commandItems);
      selectedIndex = -1;
    };
  };

  const initRoots = (pageKey = null) => {
    cleanups.forEach((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    cleanups.clear();

    const roots = Array.from(document.querySelectorAll(ROOT_SELECTOR));
    roots.forEach((root) => {
      const rootKey = root.dataset.chatInputPageKey || null;
      if (pageKey && rootKey && rootKey !== pageKey) {
        return;
      }

      const cleanup = setupRoot(root);
      if (typeof cleanup === 'function') {
        cleanups.set(root, cleanup);
      }
    });
  };

  const handleInitPage = (event) => {
    const pageKey = event?.detail?.page || null;
    initRoots(pageKey);
  };

  const autoInit = () => {
    const pageKey = document.body?.dataset?.activeSidebarLink || null;
    initRoots(pageKey);
  };

  document.addEventListener('ai-assistant:init-page', handleInitPage);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
})();
