(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const { initSidebar } = window.AIAssistant || {};
    if (typeof initSidebar !== 'function') {
      return;
    }

    const activeLink = document.body?.dataset?.activeSidebarLink || null;
    const sidebarInstance = initSidebar({ activeLink });

    if (!window.AIAssistant) {
      window.AIAssistant = {};
    }

    window.AIAssistant.sidebar = sidebarInstance;
  });
})();
