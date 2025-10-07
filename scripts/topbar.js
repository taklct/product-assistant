'use strict';

(function () {
    const FLAG_NAME = 'topbarInitialized';

    const toClassList = (value, fallback = []) => {
        if (typeof value !== 'string' || value.trim() === '') {
            return [...fallback];
        }
        return value
            .split(/\s+/)
            .map((token) => token.trim())
            .filter(Boolean);
    };

    const buildIcon = (dataset) => {
        if (!dataset.topbarIcon) {
            return null;
        }

        const iconWrapper = document.createElement('div');
        const wrapperClasses = [
            dataset.topbarIconWrapperClass || 'w-10 h-10 rounded-lg flex items-center justify-center',
            dataset.topbarIconBg || 'bg-navy/10',
        ];
        iconWrapper.className = wrapperClasses.filter(Boolean).join(' ');

        const iconElement = document.createElement('i');
        const iconClasses = [
            dataset.topbarIcon,
            dataset.topbarIconColor || 'text-navy',
            dataset.topbarIconSize || 'text-lg',
        ];
        iconElement.className = iconClasses.filter(Boolean).join(' ');

        iconWrapper.appendChild(iconElement);
        return iconWrapper;
    };

    const applyTextContent = (container, dataset) => {
        if (dataset.topbarTitle) {
            const titleTag = dataset.topbarTitleTag || 'h2';
            const titleElement = document.createElement(titleTag);
            titleElement.className = dataset.topbarTitleClass || 'text-lg font-semibold text-gray-800';
            if (dataset.topbarTitleId) {
                titleElement.id = dataset.topbarTitleId;
            }
            titleElement.textContent = dataset.topbarTitle;
            container.appendChild(titleElement);
        }

        if (dataset.topbarSubtitle) {
            const subtitleElement = document.createElement('p');
            subtitleElement.className = dataset.topbarSubtitleClass || 'text-xs text-gray-500';
            if (dataset.topbarSubtitleId) {
                subtitleElement.id = dataset.topbarSubtitleId;
            }
            subtitleElement.textContent = dataset.topbarSubtitle;
            container.appendChild(subtitleElement);
        }
    };

    const renderTopbar = (header) => {
        if (!header || header.dataset[FLAG_NAME] === 'true') {
            return;
        }

        const dataset = header.dataset;
        const leading = header.querySelector('[data-topbar-leading]');
        const actions = header.querySelector('[data-topbar-actions]');

        if (leading) {
            leading.remove();
        }

        if (actions) {
            actions.remove();
        }

        const baseClasses = [
            'flex',
            'items-center',
            'justify-between',
            dataset.topbarSize || 'h-16',
            'border-b',
            'border-gray-200',
            ...toClassList(dataset.topbarPadding, ['px-4', 'lg:px-6']),
            'bg-white',
        ];

        const extraClasses = toClassList(dataset.topbarExtraClasses);
        header.className = [...new Set([...baseClasses, ...extraClasses].filter(Boolean))].join(' ');
        header.innerHTML = '';

        const leftContainer = document.createElement('div');
        leftContainer.className = dataset.topbarLeftClass || 'flex items-center space-x-3 lg:space-x-4';

        if (leading) {
            leftContainer.appendChild(leading);
        }

        const icon = buildIcon(dataset);
        if (icon) {
            leftContainer.appendChild(icon);
        }

        const textContainer = document.createElement('div');
        textContainer.className = dataset.topbarTextClass || '';
        applyTextContent(textContainer, dataset);

        if (textContainer.childNodes.length > 0) {
            leftContainer.appendChild(textContainer);
        }

        header.appendChild(leftContainer);

        if (actions) {
            const classesToAdd = toClassList(dataset.topbarActionsClass, ['flex', 'items-center', 'space-x-3']);
            if (classesToAdd.length > 0) {
                actions.classList.add(...classesToAdd);
            }
            header.appendChild(actions);
        }

        header.dataset[FLAG_NAME] = 'true';
    };

    const initTopbars = (root = document) => {
        if (!root) {
            return;
        }
        const headers = root.querySelectorAll('[data-topbar]');
        headers.forEach(renderTopbar);
    };

    const ensureGlobalNamespace = () => {
        window.AIAssistant = window.AIAssistant || {};
        window.AIAssistant.topbar = window.AIAssistant.topbar || {};
        window.AIAssistant.topbar.init = initTopbars;
    };

    const onReady = () => initTopbars();

    ensureGlobalNamespace();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady, { once: true });
    } else {
        onReady();
    }

    document.addEventListener('ai-assistant:init-page', () => initTopbars());
})();
