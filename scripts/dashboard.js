'use strict';

(function () {
    const DASHBOARD_PAGE_KEY = 'dashboard';

    const TASK_STATUS_CONFIG = [
        {
            key: 'backlog',
            label: 'Backlog',
            cardClass: 'bg-gray-50',
            iconClass: 'fa-solid fa-inbox',
            iconBg: 'bg-gray-500',
            metricText: 'text-gray-800',
        },
        {
            key: 'in-progress',
            label: 'In Progress',
            cardClass: 'bg-blue-50',
            iconClass: 'fa-solid fa-play',
            iconBg: 'bg-blue-500',
            metricText: 'text-gray-800',
        },
        {
            key: 'review',
            label: 'In Review',
            cardClass: 'bg-orange-50',
            iconClass: 'fa-solid fa-eye',
            iconBg: 'bg-orange-500',
            metricText: 'text-gray-800',
        },
        {
            key: 'blocked',
            label: 'Blocked',
            cardClass: 'bg-red-50',
            iconClass: 'fa-solid fa-ban',
            iconBg: 'bg-red-500',
            metricText: 'text-gray-800',
        },
        {
            key: 'testing',
            label: 'Testing',
            cardClass: 'bg-purple-50',
            iconClass: 'fa-solid fa-vial',
            iconBg: 'bg-purple-500',
            metricText: 'text-gray-800',
        },
        {
            key: 'completed',
            label: 'Completed',
            cardClass: 'bg-green-50',
            iconClass: 'fa-solid fa-check',
            iconBg: 'bg-green-500',
            metricText: 'text-gray-800',
        },
    ];

    const PRIORITY_COLOR_CONFIG = {
        gray: {
            card: 'bg-gray-50 border border-gray-200',
            badge: 'bg-gray-500 text-white',
        },
        red: {
            card: 'bg-red-50 border border-red-200',
            badge: 'bg-red-500 text-white',
        },
        orange: {
            card: 'bg-orange-50 border border-orange-200',
            badge: 'bg-orange-500 text-white',
        },
        blue: {
            card: 'bg-blue-50 border border-blue-200',
            badge: 'bg-blue-500 text-white',
        },
        green: {
            card: 'bg-green-50 border border-green-200',
            badge: 'bg-green-500 text-white',
        },
        purple: {
            card: 'bg-purple-50 border border-purple-200',
            badge: 'bg-purple-500 text-white',
        },
        yellow: {
            card: 'bg-yellow-50 border border-yellow-200',
            badge: 'bg-yellow-500 text-white',
        },
        indigo: {
            card: 'bg-indigo-50 border border-indigo-200',
            badge: 'bg-indigo-500 text-white',
        },
        teal: {
            card: 'bg-teal-50 border border-teal-200',
            badge: 'bg-teal-500 text-white',
        },
    };

    const DELIVERABLE_STATUS_CONFIG = {
        Released: {
            chipClass: 'bg-green-100 text-green-800',
        },
        'In QA': {
            chipClass: 'bg-yellow-100 text-yellow-800',
        },
        'In Progress': {
            chipClass: 'bg-blue-100 text-blue-800',
        },
    };

    const PRIORITY_COMPARISON_SCENARIOS = {
        'Previous Quarter': [
            { name: 'Security Compliance', previousRank: 3, delta: 2, direction: 'up', reason: 'Moved up due to new regulatory requirements' },
            { name: 'Performance Optimization', previousRank: 1, delta: -1, direction: 'down', reason: 'Deprioritized after completing major optimizations' },
            { name: 'Feature Development', previousRank: 2, delta: -1, direction: 'down', reason: 'Shifted focus to infrastructure and security' },
            { name: 'API Integration', previousRank: 6, delta: 2, direction: 'up', reason: 'Elevated due to partner integration requirements' },
            { name: 'Mobile Platform', previousRank: null, delta: 0, direction: 'new', reason: 'Added based on user feedback and market demand' },
            { name: 'Legacy System Migration', previousRank: 8, delta: 0, direction: 'removed', reason: 'Completed migration project successfully' },
        ],
        'Last Month': [
            { name: 'Security Compliance', previousRank: 2, delta: 1, direction: 'up', reason: 'Security audit introduced new controls' },
            { name: 'Performance Optimization', previousRank: 1, delta: 0, direction: 'steady', reason: 'Remains high focus for platform readiness' },
            { name: 'API Integration', previousRank: 5, delta: 1, direction: 'up', reason: 'Partner onboarding deadlines accelerated' },
            { name: 'Data Analytics', previousRank: 4, delta: -2, direction: 'down', reason: 'Paused to support compliance initiatives' },
        ],
        '6 Months Ago': [
            { name: 'Mobile Platform', previousRank: 10, delta: 3, direction: 'up', reason: 'Mobile usage metrics exceeded projections' },
            { name: 'User Experience Enhancement', previousRank: 2, delta: -3, direction: 'down', reason: 'Major UX revamp completed' },
            { name: 'Infrastructure Scaling', previousRank: 5, delta: 0, direction: 'steady', reason: 'Foundational work still ongoing' },
        ],
        'Custom Period': [
            { name: 'Security Compliance', previousRank: 4, delta: 1, direction: 'up', reason: 'Customer trust initiatives succeeded' },
            { name: 'Feature Development', previousRank: 3, delta: -1, direction: 'down', reason: 'Reallocated squads to automation' },
        ],
    };

    const selectors = {
        taskOverview: '[data-task-overview]',
        projectGrid: '[data-project-grid]',
        projectEmpty: '[data-project-empty]',
        addProjectButtons: '[data-add-project]',
        addDeliverableButton: '[data-add-deliverable]',
        deliverableGrid: '[data-deliverable-grid]',
        deliverableEmpty: '[data-deliverable-empty]',
        applyDateRange: '[data-apply-date-range]',
        rangeFrom: '[data-dashboard-range-from]',
        rangeTo: '[data-dashboard-range-to]',
        rangeError: '[data-dashboard-range-error]',
        rangeSuccess: '[data-dashboard-range-success]',
        exportReport: '[data-export-report]',
        priorityCurrent: '[data-priority-current]',
        priorityCompareSelect: '[data-priority-compare]',
        priorityComparison: '[data-priority-comparison]',
        openPriorityManager: '[data-open-priority-manager]',
        priorityRangeFrom: '[data-priority-range-from]',
        priorityRangeTo: '[data-priority-range-to]',
        priorityRangeError: '[data-priority-range-error]',
        priorityRangeSuccess: '[data-priority-range-success]',
    };

    const parseDate = (value) => {
        if (!value) {
            return null;
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }
        return parsed;
    };

    const formatDateISO = (date) => {
        if (!(date instanceof Date)) {
            return '';
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateHuman = (value) => {
        const date = value instanceof Date ? value : parseDate(value);
        if (!date) {
            return '';
        }
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

    const isDateInRange = (value, range) => {
        const date = parseDate(value);
        if (!date || !range) {
            return false;
        }
        const from = parseDate(range.from);
        const to = parseDate(range.to);
        if (!from || !to) {
            return false;
        }
        return date >= from && date <= to;
    };

    const getRangeLabel = (range) => {
        if (!range) {
            return '';
        }
        const fromText = formatDateHuman(range.from);
        const toText = formatDateHuman(range.to);
        if (!fromText || !toText) {
            return '';
        }
        return `${fromText} - ${toText}`;
    };

    const generateTasks = () => {
        const monthSnapshots = [
            {
                month: '2024-08',
                counts: { backlog: 48, 'in-progress': 12, review: 6, blocked: 5, testing: 8, completed: 22 },
            },
            {
                month: '2024-09',
                counts: { backlog: 100, 'in-progress': 20, review: 15, blocked: 8, testing: 12, completed: 45 },
            },
            {
                month: '2024-10',
                counts: { backlog: 72, 'in-progress': 26, review: 18, blocked: 6, testing: 15, completed: 60 },
            },
        ];

        const tasks = [];

        monthSnapshots.forEach((snapshot) => {
            const [year, monthString] = snapshot.month.split('-');
            const yearNum = Number(year);
            const monthIndex = Number(monthString) - 1;
            const daysInMonth = getDaysInMonth(yearNum, monthIndex);

            Object.entries(snapshot.counts).forEach(([statusKey, count]) => {
                for (let index = 0; index < count; index += 1) {
                    const day = (index % daysInMonth) + 1;
                    const dueDate = `${snapshot.month}-${String(day).padStart(2, '0')}`;
                    tasks.push({
                        id: `${snapshot.month}-${statusKey}-${index + 1}`,
                        status: statusKey,
                        title: `${TASK_STATUS_CONFIG.find((item) => item.key === statusKey)?.label || 'Task'} #${index + 1}`,
                        dueDate,
                    });
                }
            });
        });

        return tasks;
    };

    const initialState = () => ({
        dateRange: { from: '2024-09-01', to: '2024-09-30' },
        priorityRange: { from: '2024-10-01', to: '2024-12-31' },
        tasks: generateTasks(),
        projects: [
            {
                id: 'proj-pamm-rebate',
                name: 'PAMM Rebate Enhancement',
                status: 'In Progress',
                priority: 'High',
                owner: 'Sarah Chen',
                start: '2024-08-15',
                end: '2024-10-15',
                progress: 75,
                blockers: 'API Dependencies',
                summary: 'New rebate tiers and partner reporting automation.',
            },
            {
                id: 'proj-alt-platform',
                name: 'Alternative Trading Platform',
                status: 'Planning',
                priority: 'Medium',
                owner: 'Mike Johnson',
                start: '2024-09-01',
                end: '2024-11-30',
                progress: 25,
                blockers: 'None',
                summary: 'Discovery phase underway with vendor evaluations.',
            },
            {
                id: 'proj-mobile-redesign',
                name: 'Mobile App Redesign',
                status: 'Completed',
                priority: 'Low',
                owner: 'Lisa Wang',
                start: '2024-06-01',
                end: '2024-08-30',
                progress: 100,
                blockers: 'None',
                summary: 'Launched v2 mobile experience with improved retention.',
            },
        ],
        deliverables: [
            {
                id: 'deliv-mobile-app',
                name: 'Mobile Trading App v2.1',
                description: 'Enhanced trading interface with real-time market data and improved user experience.',
                status: 'Released',
                releaseDate: '2024-09-15',
                category: 'Mobile',
                lastUpdated: '2024-09-22',
            },
            {
                id: 'deliv-analytics-dashboard',
                name: 'Advanced Analytics Dashboard',
                description: 'Comprehensive trading analytics and performance metrics for portfolio management.',
                status: 'Released',
                releaseDate: '2024-09-08',
                category: 'Analytics',
                lastUpdated: '2024-09-18',
            },
            {
                id: 'deliv-reporting',
                name: 'Automated Reporting System',
                description: 'Streamlined report generation for compliance and business intelligence purposes.',
                status: 'Released',
                releaseDate: '2024-09-22',
                category: 'Automation',
                lastUpdated: '2024-09-24',
            },
            {
                id: 'deliv-mfa',
                name: 'Multi-Factor Authentication',
                description: 'Enhanced security system with biometric and SMS verification for account protection.',
                status: 'Released',
                releaseDate: '2024-08-30',
                category: 'Security',
                lastUpdated: '2024-09-05',
            },
            {
                id: 'deliv-ai-assistant',
                name: 'AI Trading Assistant',
                description: 'Intelligent trading recommendations and market analysis powered by machine learning.',
                status: 'Released',
                releaseDate: '2024-08-15',
                category: 'AI',
                lastUpdated: '2024-08-28',
            },
            {
                id: 'deliv-api-rate',
                name: 'API Rate Optimization',
                description: 'Improved API performance with intelligent caching and load balancing mechanisms.',
                status: 'Released',
                releaseDate: '2024-07-28',
                category: 'Infrastructure',
                lastUpdated: '2024-08-10',
            },
        ],
        priorities: [
            { id: 'priority-1', rank: 1, name: 'Security Compliance', description: 'Critical security updates and compliance requirements', color: 'red' },
            { id: 'priority-2', rank: 2, name: 'Performance Optimization', description: 'Platform speed and efficiency improvements', color: 'orange' },
            { id: 'priority-3', rank: 3, name: 'Feature Development', description: 'New feature rollouts and enhancements', color: 'blue' },
            { id: 'priority-4', rank: 4, name: 'API Integration', description: 'Third-party service integrations and API improvements', color: 'green' },
            { id: 'priority-5', rank: 5, name: 'User Experience Enhancement', description: 'UI/UX improvements and user journey optimization', color: 'purple' },
            { id: 'priority-6', rank: 6, name: 'Data Analytics', description: 'Advanced reporting and business intelligence features', color: 'yellow' },
            { id: 'priority-7', rank: 7, name: 'Mobile Platform', description: 'Mobile app development and cross-platform compatibility', color: 'indigo' },
            { id: 'priority-8', rank: 8, name: 'Infrastructure Scaling', description: 'System scalability and infrastructure improvements', color: 'teal' },
        ],
    });

    const state = initialState();

    const getElement = (selector, root = document) => root.querySelector(selector);
    const getElements = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const attachEvent = (element, type, handler) => {
        if (!element) {
            return;
        }
        const key = `__dashboard_${type}`;
        const existing = element[key];
        if (existing) {
            element.removeEventListener(type, existing);
        }
        element.addEventListener(type, handler);
        element[key] = handler;
    };

    const getTemplateContent = (id) => {
        const template = document.getElementById(id);
        if (!template) {
            return null;
        }
        return template.content ? template.content.cloneNode(true) : null;
    };

    const modal = (() => {
        const element = document.getElementById('dashboard-modal');
        if (!element) {
            return {
                open: () => {},
                close: () => {},
            };
        }

        const body = getElement('[data-modal-body]', element);
        const title = getElement('#dashboard-modal-title', element);
        const description = getElement('[data-modal-description]', element);
        const closeButton = getElement('[data-modal-close]', element);
        const backdrop = getElement('[data-modal-backdrop]', element);

        const modalState = { onClose: null };
        const dynamicCleanup = [];

        const cleanup = () => {
            while (dynamicCleanup.length > 0) {
                const fn = dynamicCleanup.pop();
                if (typeof fn === 'function') {
                    fn();
                }
            }
        };

        const close = () => {
            if (!element.classList.contains('hidden')) {
                element.classList.add('hidden');
                element.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('overflow-hidden');
                cleanup();
                if (typeof modalState.onClose === 'function') {
                    modalState.onClose();
                }
                modalState.onClose = null;
            }
        };

        const attachCancelHandlers = () => {
            getElements('[data-modal-cancel]', element).forEach((cancelButton) => {
                const handler = (event) => {
                    event.preventDefault();
                    close();
                };
                cancelButton.addEventListener('click', handler);
                dynamicCleanup.push(() => cancelButton.removeEventListener('click', handler));
            });
        };

        const open = ({ title: modalTitle, description: modalDescription = '', content, onClose }) => {
            if (!body || !title) {
                return;
            }

            cleanup();
            body.innerHTML = '';

            if (content instanceof HTMLElement) {
                body.appendChild(content);
            } else if (content) {
                body.appendChild(document.createTextNode(String(content)));
            }

            title.textContent = modalTitle || '';

            if (description) {
                description.textContent = modalDescription;
                description.classList.remove('hidden');
            } else {
                description.textContent = '';
                description.classList.add('hidden');
            }

            element.classList.remove('hidden');
            element.removeAttribute('aria-hidden');
            document.body.classList.add('overflow-hidden');

            modalState.onClose = typeof onClose === 'function' ? onClose : null;

            attachCancelHandlers();
        };

        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        const handleBackdrop = (event) => {
            if (event.target === backdrop) {
                close();
            }
        };

        document.addEventListener('keydown', handleKeydown);
        if (closeButton) {
            closeButton.addEventListener('click', close);
        }
        if (backdrop) {
            backdrop.addEventListener('click', handleBackdrop);
        }

        return { open, close };
    })();

    const renderTaskOverview = () => {
        const container = getElement(selectors.taskOverview);
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const counts = TASK_STATUS_CONFIG.reduce((acc, status) => {
            acc[status.key] = 0;
            return acc;
        }, {});

        state.tasks.forEach((task) => {
            if (isDateInRange(task.dueDate, state.dateRange)) {
                counts[task.status] = (counts[task.status] || 0) + 1;
            }
        });

        TASK_STATUS_CONFIG.forEach((status) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `${status.cardClass} rounded-lg p-4 text-left card-hover focus:outline-none focus:ring-2 focus:ring-navy/40`;
            card.dataset.taskStatus = status.key;

            const iconWrapper = document.createElement('div');
            iconWrapper.className = `${status.iconBg} w-9 h-9 rounded-full flex items-center justify-center mb-3 text-white`;
            const icon = document.createElement('i');
            icon.className = `${status.iconClass} text-sm`;
            iconWrapper.appendChild(icon);

            const value = document.createElement('div');
            value.className = `text-2xl font-bold ${status.metricText}`;
            value.textContent = counts[status.key] ?? 0;

            const label = document.createElement('div');
            label.className = 'text-sm text-gray-600';
            label.textContent = status.label;

            card.appendChild(iconWrapper);
            card.appendChild(value);
            card.appendChild(label);

            card.addEventListener('click', () => openTaskList(status));

            container.appendChild(card);
        });
    };

    const openTaskList = (statusConfig) => {
        if (!statusConfig) {
            return;
        }
        const tasksForStatus = state.tasks
            .filter((task) => task.status === statusConfig.key && isDateInRange(task.dueDate, state.dateRange))
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        const template = getTemplateContent('dashboard-task-list-template');
        if (!template) {
            return;
        }

        const root = template.querySelector('[data-task-list]');
        if (!root) {
            return;
        }

        const title = root.querySelector('[data-task-list-title]');
        const range = root.querySelector('[data-task-list-range]');
        const count = root.querySelector('[data-task-list-count]');
        const items = root.querySelector('[data-task-list-items]');

        if (title) {
            title.textContent = `${statusConfig.label} tasks`;
        }
        if (range) {
            range.textContent = getRangeLabel(state.dateRange);
        }
        if (count) {
            count.textContent = `${tasksForStatus.length} item${tasksForStatus.length === 1 ? '' : 's'}`;
        }
        if (items) {
            items.innerHTML = '';
            if (tasksForStatus.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'text-sm text-gray-500';
                empty.textContent = 'No tasks found in the selected period for this status.';
                items.appendChild(empty);
            } else {
                tasksForStatus.forEach((task) => {
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2';

                    const info = document.createElement('div');
                    info.className = 'flex flex-col';
                    const name = document.createElement('span');
                    name.className = 'text-sm font-medium text-gray-800';
                    name.textContent = task.title;
                    const due = document.createElement('span');
                    due.className = 'text-xs text-gray-500';
                    due.textContent = `Due ${formatDateHuman(task.dueDate)}`;
                    info.appendChild(name);
                    info.appendChild(due);

                    row.appendChild(info);
                    items.appendChild(row);
                });
            }
        }

        modal.open({
            title: `${statusConfig.label} overview`,
            content: root,
        });
    };

    const doesProjectOverlapRange = (project, range) => {
        const start = parseDate(project.start);
        const end = parseDate(project.end);
        const from = parseDate(range.from);
        const to = parseDate(range.to);
        if (!start || !end || !from || !to) {
            return false;
        }
        return start <= to && end >= from;
    };

    const createBadge = (label, classes) => {
        const badge = document.createElement('span');
        badge.className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${classes}`;
        badge.textContent = label;
        return badge;
    };

    const renderProjects = () => {
        const container = getElement(selectors.projectGrid);
        const emptyState = getElement(selectors.projectEmpty);
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const projectsInRange = state.projects.filter((project) => doesProjectOverlapRange(project, state.dateRange));

        if (emptyState) {
            emptyState.classList.toggle('hidden', projectsInRange.length > 0);
        }

        projectsInRange.forEach((project) => {
            const card = document.createElement('article');
            card.className = 'border border-gray-200 rounded-lg p-5 card-hover h-full flex flex-col';
            card.dataset.projectId = project.id;

            const header = document.createElement('div');
            header.className = 'flex items-center justify-between mb-4';

            const name = document.createElement('h4');
            name.className = 'font-semibold text-gray-800';
            name.textContent = project.name;

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'text-gray-400 hover:text-gray-600';
            editButton.setAttribute('aria-label', `Edit ${project.name}`);
            editButton.innerHTML = '<i class="fa-solid fa-pencil text-sm"></i>';
            editButton.addEventListener('click', (event) => {
                event.stopPropagation();
                openProjectForm(project.id);
            });

            header.appendChild(name);
            header.appendChild(editButton);
            card.appendChild(header);

            const details = document.createElement('dl');
            details.className = 'space-y-3 text-sm';

            const buildRow = (term, value) => {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between';

                const dt = document.createElement('dt');
                dt.className = 'text-gray-600';
                dt.textContent = term;

                const dd = document.createElement('dd');
                dd.className = 'text-gray-800 flex items-center gap-2';
                if (value instanceof HTMLElement) {
                    dd.innerHTML = '';
                    dd.appendChild(value);
                } else {
                    dd.textContent = value;
                }

                row.appendChild(dt);
                row.appendChild(dd);
                return row;
            };

            const statusBadge = createBadge(project.status, project.status === 'Completed' ? 'bg-green-100 text-green-800' : project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800');
            const priorityBadge = createBadge(project.priority, project.priority === 'High' ? 'bg-red-100 text-red-800' : project.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800');

            details.appendChild(buildRow('Status', statusBadge));
            details.appendChild(buildRow('Priority', priorityBadge));
            details.appendChild(buildRow('Owner', project.owner));
            details.appendChild(buildRow('Start', formatDateHuman(project.start)));
            details.appendChild(buildRow('End', formatDateHuman(project.end)));

            card.appendChild(details);

            const progressWrapper = document.createElement('div');
            progressWrapper.className = 'space-y-1 mt-4';

            const progressLabel = document.createElement('div');
            progressLabel.className = 'flex justify-between text-sm text-gray-600';
            progressLabel.innerHTML = '<span>Progress</span><span>' + `${project.progress}%` + '</span>';

            const progressBar = document.createElement('div');
            progressBar.className = 'w-full bg-gray-200 rounded-full h-2';
            progressBar.setAttribute('role', 'progressbar');
            progressBar.setAttribute('aria-valuemin', '0');
            progressBar.setAttribute('aria-valuemax', '100');
            progressBar.setAttribute('aria-valuenow', String(project.progress));

            const progressValue = document.createElement('div');
            progressValue.className = `${project.progress === 100 ? 'bg-green-600' : project.progress >= 60 ? 'bg-blue-600' : 'bg-orange-500'} h-2 rounded-full progress-bar`;
            progressValue.style.width = `${project.progress}%`;

            progressBar.appendChild(progressValue);
            progressWrapper.appendChild(progressLabel);
            progressWrapper.appendChild(progressBar);
            card.appendChild(progressWrapper);

            const blockers = document.createElement('p');
            blockers.className = 'text-sm mt-3 text-gray-700';
            const blockersLabel = document.createElement('span');
            blockersLabel.className = 'text-gray-600';
            blockersLabel.textContent = 'Blockers:';
            const blockersValue = document.createElement('span');
            blockersValue.className = project.blockers && project.blockers !== 'None' ? 'text-red-600 ml-1' : 'text-green-600 ml-1';
            blockersValue.textContent = project.blockers || 'None';
            blockers.appendChild(blockersLabel);
            blockers.appendChild(blockersValue);
            card.appendChild(blockers);

            if (project.summary) {
                const summary = document.createElement('p');
                summary.className = 'text-xs text-gray-500 mt-2';
                summary.textContent = project.summary;
                card.appendChild(summary);
            }

            card.addEventListener('click', () => {
                openProjectForm(project.id);
            });

            container.appendChild(card);
        });
    };

    const openProjectForm = (projectId) => {
        const template = getTemplateContent('dashboard-project-form-template');
        if (!template) {
            return;
        }
        const form = template.querySelector('form');
        if (!form) {
            return;
        }

        const project = projectId ? state.projects.find((item) => item.id === projectId) : null;
        if (project) {
            form.elements.id.value = project.id;
            form.elements.name.value = project.name;
            form.elements.owner.value = project.owner;
            form.elements.status.value = project.status;
            form.elements.priority.value = project.priority;
            form.elements.start.value = project.start;
            form.elements.end.value = project.end;
            form.elements.progress.value = project.progress;
            form.elements.blockers.value = project.blockers || '';
            form.elements.summary.value = project.summary || '';
        } else {
            form.elements.id.value = '';
        }

        const handleSubmit = (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            const progressValue = Number(payload.progress);
            if (Number.isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
                form.elements.progress.focus();
                return;
            }

            if (payload.id) {
                const existingIndex = state.projects.findIndex((item) => item.id === payload.id);
                if (existingIndex >= 0) {
                    state.projects[existingIndex] = {
                        ...state.projects[existingIndex],
                        ...payload,
                        progress: progressValue,
                    };
                }
            } else {
                const newProject = {
                    id: `proj-${Date.now()}`,
                    name: payload.name,
                    status: payload.status,
                    priority: payload.priority,
                    owner: payload.owner,
                    start: payload.start,
                    end: payload.end,
                    progress: progressValue,
                    blockers: payload.blockers || 'None',
                    summary: payload.summary || '',
                };
                state.projects.push(newProject);
            }

            modal.close();
            renderProjects();
        };

        form.addEventListener('submit', handleSubmit, { once: true });

        modal.open({
            title: project ? 'Edit project' : 'Add project',
            content: template,
            onClose: () => {
                form.removeEventListener('submit', handleSubmit);
            },
        });
    };

    const renderDeliverables = () => {
        const container = getElement(selectors.deliverableGrid);
        const emptyState = getElement(selectors.deliverableEmpty);
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const deliverablesInRange = state.deliverables.filter((deliverable) => isDateInRange(deliverable.releaseDate, state.dateRange));

        if (emptyState) {
            emptyState.classList.toggle('hidden', deliverablesInRange.length > 0);
        }

        deliverablesInRange
            .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
            .forEach((deliverable) => {
                const card = document.createElement('article');
                card.className = 'border border-gray-200 rounded-lg p-4 card-hover h-full flex flex-col gap-3 focus-within:ring-2 focus-within:ring-navy/40';
                card.tabIndex = 0;
                card.dataset.deliverableId = deliverable.id;

                const header = document.createElement('div');
                header.className = 'flex items-center justify-between';

                const iconWrapper = document.createElement('div');
                iconWrapper.className = 'w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600';
                iconWrapper.innerHTML = '<i class="fa-solid fa-box"></i>';

                const statusConfig = DELIVERABLE_STATUS_CONFIG[deliverable.status] || { chipClass: 'bg-gray-100 text-gray-700' };
                const status = createBadge(deliverable.status, statusConfig.chipClass);

                header.appendChild(iconWrapper);
                header.appendChild(status);

                const name = document.createElement('h4');
                name.className = 'font-medium text-gray-800';
                name.textContent = deliverable.name;

                const description = document.createElement('p');
                description.className = 'text-sm text-gray-600 flex-1';
                description.textContent = deliverable.description;

                const release = document.createElement('p');
                release.className = 'text-xs text-gray-500';
                release.textContent = `Released: ${formatDateHuman(deliverable.releaseDate)}`;

                card.appendChild(header);
                card.appendChild(name);
                card.appendChild(description);
                card.appendChild(release);

                const openDetail = () => openDeliverableDetail(deliverable.id);
                card.addEventListener('click', openDetail);
                card.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDetail();
                    }
                });

                container.appendChild(card);
            });
    };

    const openDeliverableDetail = (deliverableId) => {
        const deliverable = state.deliverables.find((item) => item.id === deliverableId);
        if (!deliverable) {
            return;
        }

        const template = getTemplateContent('dashboard-deliverable-detail-template');
        if (!template) {
            return;
        }

        const root = template.querySelector('[data-deliverable-detail]');
        if (!root) {
            return;
        }

        const statusConfig = DELIVERABLE_STATUS_CONFIG[deliverable.status] || { chipClass: 'bg-gray-100 text-gray-700' };
        const statusBadge = root.querySelector('[data-detail-status]');
        if (statusBadge) {
            statusBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.chipClass}`;
            statusBadge.textContent = deliverable.status;
        }

        const title = root.querySelector('[data-detail-title]');
        if (title) {
            title.textContent = deliverable.name;
        }

        const category = root.querySelector('[data-detail-category]');
        if (category) {
            category.textContent = deliverable.category;
        }

        const description = root.querySelector('[data-detail-description]');
        if (description) {
            description.textContent = deliverable.description;
        }

        const release = root.querySelector('[data-detail-release]');
        if (release) {
            release.textContent = formatDateHuman(deliverable.releaseDate);
        }

        const updated = root.querySelector('[data-detail-updated]');
        if (updated) {
            updated.textContent = formatDateHuman(deliverable.lastUpdated || deliverable.releaseDate);
        }

        const editButton = root.querySelector('[data-detail-edit]');
        if (editButton) {
            editButton.addEventListener('click', (event) => {
                event.preventDefault();
                modal.close();
                openDeliverableForm(deliverable.id);
            }, { once: true });
        }

        modal.open({
            title: 'Deliverable details',
            content: root,
        });
    };

    const openDeliverableForm = (deliverableId) => {
        const template = getTemplateContent('dashboard-deliverable-form-template');
        if (!template) {
            return;
        }
        const form = template.querySelector('form');
        if (!form) {
            return;
        }

        const deliverable = deliverableId ? state.deliverables.find((item) => item.id === deliverableId) : null;
        if (deliverable) {
            form.elements.id.value = deliverable.id;
            form.elements.name.value = deliverable.name;
            form.elements.status.value = deliverable.status;
            form.elements.releaseDate.value = deliverable.releaseDate;
            form.elements.category.value = deliverable.category;
            form.elements.description.value = deliverable.description;
        } else {
            form.elements.id.value = '';
        }

        const handleSubmit = (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            if (payload.id) {
                const existingIndex = state.deliverables.findIndex((item) => item.id === payload.id);
                if (existingIndex >= 0) {
                    state.deliverables[existingIndex] = {
                        ...state.deliverables[existingIndex],
                        ...payload,
                        lastUpdated: formatDateISO(new Date()),
                    };
                }
            } else {
                const newDeliverable = {
                    id: `deliverable-${Date.now()}`,
                    name: payload.name,
                    description: payload.description,
                    status: payload.status,
                    releaseDate: payload.releaseDate,
                    category: payload.category,
                    lastUpdated: formatDateISO(new Date()),
                };
                state.deliverables.push(newDeliverable);
            }

            modal.close();
            renderDeliverables();
        };

        form.addEventListener('submit', handleSubmit, { once: true });

        modal.open({
            title: deliverable ? 'Edit deliverable' : 'Add deliverable',
            content: template,
            onClose: () => form.removeEventListener('submit', handleSubmit),
        });
    };

    const renderPriorities = () => {
        const container = getElement(selectors.priorityCurrent);
        if (!container) {
            return;
        }
        container.innerHTML = '';

        const sorted = [...state.priorities].sort((a, b) => a.rank - b.rank);

        sorted.forEach((priority) => {
            const colorConfig = PRIORITY_COLOR_CONFIG[priority.color] || PRIORITY_COLOR_CONFIG.gray;

            const card = document.createElement('article');
            card.className = `flex items-center justify-between p-4 rounded-lg ${colorConfig.card || 'bg-gray-50 border border-gray-200'}`;
            card.dataset.priorityId = priority.id;

            const left = document.createElement('div');
            left.className = 'flex items-center space-x-4';

            const badge = document.createElement('span');
            badge.className = `w-8 h-8 ${colorConfig?.badge || 'bg-gray-500 text-white'} rounded-full flex items-center justify-center text-sm font-bold`;
            badge.textContent = priority.rank;

            const info = document.createElement('div');
            const title = document.createElement('span');
            title.className = 'text-sm font-medium text-gray-800';
            title.textContent = priority.name;
            const description = document.createElement('p');
            description.className = 'text-xs text-gray-600';
            description.textContent = priority.description;
            info.appendChild(title);
            info.appendChild(description);

            left.appendChild(badge);
            left.appendChild(info);

            const actions = document.createElement('div');
            actions.className = 'flex items-center space-x-2';

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'text-gray-400 hover:text-gray-600';
            editButton.setAttribute('aria-label', `Edit ${priority.name}`);
            editButton.innerHTML = '<i class="fa-solid fa-pencil text-sm"></i>';
            editButton.addEventListener('click', (event) => {
                event.stopPropagation();
                openPriorityEdit(priority.id);
            });

            const reorderButton = document.createElement('button');
            reorderButton.type = 'button';
            reorderButton.className = 'text-gray-400 hover:text-gray-600';
            reorderButton.setAttribute('aria-label', `Reorder ${priority.name}`);
            reorderButton.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
            reorderButton.addEventListener('click', (event) => {
                event.stopPropagation();
                openPriorityManager(priority.id);
            });

            actions.appendChild(editButton);
            actions.appendChild(reorderButton);

            card.appendChild(left);
            card.appendChild(actions);

            container.appendChild(card);
        });
    };

    const openPriorityEdit = (priorityId) => {
        const template = getTemplateContent('dashboard-priority-edit-template');
        if (!template) {
            return;
        }
        const form = template.querySelector('form');
        if (!form) {
            return;
        }

        const priority = state.priorities.find((item) => item.id === priorityId);
        const rankSelect = form.elements.rank;
        if (rankSelect) {
            rankSelect.innerHTML = '';
            const maxRank = Math.max(state.priorities.length, priority ? priority.rank : 1);
            for (let index = 1; index <= maxRank; index += 1) {
                const option = document.createElement('option');
                option.value = String(index);
                option.textContent = `#${index}`;
                rankSelect.appendChild(option);
            }
        }

        if (priority) {
            form.elements.id.value = priority.id;
            form.elements.name.value = priority.name;
            form.elements.description.value = priority.description;
            form.elements.color.value = priority.color;
            form.elements.rank.value = String(priority.rank);
        }

        const handleSubmit = (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            const rank = Number(payload.rank);
            if (Number.isNaN(rank) || rank < 1) {
                form.elements.rank.focus();
                return;
            }

            const existing = state.priorities.find((item) => item.id === payload.id);
            if (existing) {
                existing.name = payload.name;
                existing.description = payload.description;
                existing.color = payload.color;
                existing.rank = rank;
            }

            state.priorities.sort((a, b) => a.rank - b.rank);
            state.priorities.forEach((item, index) => {
                item.rank = index + 1;
            });

            modal.close();
            renderPriorities();
        };

        form.addEventListener('submit', handleSubmit, { once: true });

        modal.open({
            title: 'Edit priority',
            content: template,
            onClose: () => form.removeEventListener('submit', handleSubmit),
        });
    };

    const createPriorityManagerRow = (priority) => {
        const colorConfig = PRIORITY_COLOR_CONFIG[priority.color] || PRIORITY_COLOR_CONFIG.gray;

        const row = document.createElement('div');
        row.className = 'p-4 rounded-lg border border-gray-200 bg-white shadow-sm';
        row.dataset.priorityId = priority.id;

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between gap-3';

        const title = document.createElement('div');
        title.className = 'flex items-center gap-3';

        const badge = document.createElement('span');
        badge.className = `w-8 h-8 ${colorConfig.badge || 'bg-gray-500 text-white'} rounded-full flex items-center justify-center text-sm font-bold`;
        badge.textContent = priority.rank;

        const name = document.createElement('div');
        name.className = 'font-medium text-gray-800';
        name.textContent = priority.name;

        title.appendChild(badge);
        title.appendChild(name);

        const controls = document.createElement('div');
        controls.className = 'flex items-center gap-2';

        const up = document.createElement('button');
        up.type = 'button';
        up.className = 'px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100';
        up.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';

        const down = document.createElement('button');
        down.type = 'button';
        down.className = 'px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100';
        down.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50';
        remove.innerHTML = '<i class="fa-solid fa-trash"></i>';

        controls.appendChild(up);
        controls.appendChild(down);
        controls.appendChild(remove);

        header.appendChild(title);
        header.appendChild(controls);

        const description = document.createElement('textarea');
        description.className = 'mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/40';
        description.rows = 2;
        description.value = priority.description;

        const colorSelect = document.createElement('select');
        colorSelect.className = 'mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/40';
        ['red', 'orange', 'blue', 'green', 'purple', 'yellow', 'indigo', 'teal'].forEach((color) => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
            option.selected = color === priority.color;
            colorSelect.appendChild(option);
        });

        row.appendChild(header);
        row.appendChild(description);
        row.appendChild(colorSelect);

        return {
            element: row,
            updateBadge: (rank) => {
                badge.textContent = rank;
            },
            controls: { up, down, remove },
            getDescription: () => description.value.trim(),
            getColor: () => colorSelect.value,
        };
    };

    const openPriorityManager = (focusPriorityId) => {
        const template = getTemplateContent('dashboard-priority-manager-template');
        if (!template) {
            return;
        }
        const form = template.querySelector('form');
        const list = template.querySelector('[data-priority-manager-list]');
        if (!form || !list) {
            return;
        }

        let workingSet = [...state.priorities]
            .sort((a, b) => a.rank - b.rank)
            .map((priority) => ({ ...priority }));

        const rows = new Map();

        const refreshRanks = () => {
            workingSet.forEach((priority, index) => {
                priority.rank = index + 1;
                const row = rows.get(priority.id);
                if (row) {
                    row.updateBadge(priority.rank);
                }
            });
        };

        const renderList = () => {
            list.innerHTML = '';
            rows.clear();
            workingSet.forEach((priority) => {
                const row = createPriorityManagerRow(priority);
                rows.set(priority.id, row);
                row.controls.up.addEventListener('click', () => {
                    const index = workingSet.findIndex((item) => item.id === priority.id);
                    if (index > 0) {
                        [workingSet[index - 1], workingSet[index]] = [workingSet[index], workingSet[index - 1]];
                        renderList();
                    }
                });
                row.controls.down.addEventListener('click', () => {
                    const index = workingSet.findIndex((item) => item.id === priority.id);
                    if (index < workingSet.length - 1) {
                        [workingSet[index + 1], workingSet[index]] = [workingSet[index], workingSet[index + 1]];
                        renderList();
                    }
                });
                row.controls.remove.addEventListener('click', () => {
                    workingSet = workingSet.filter((item) => item.id !== priority.id);
                    renderList();
                });
                list.appendChild(row.element);
            });
            refreshRanks();
        };

        renderList();

        const addButton = template.querySelector('[data-add-priority]');
        if (addButton) {
            addButton.addEventListener('click', () => {
                const nextRank = workingSet.length + 1;
                const newPriority = {
                    id: `priority-${Date.now()}`,
                    rank: nextRank,
                    name: `New Priority #${nextRank}`,
                    description: 'Describe this priority area and goals',
                    color: 'blue',
                };
                workingSet.push(newPriority);
                renderList();
            });
        }

        const handleSubmit = (event) => {
            event.preventDefault();
            workingSet.forEach((priority) => {
                const row = rows.get(priority.id);
                if (row) {
                    priority.description = row.getDescription();
                    priority.color = row.getColor();
                }
            });
            refreshRanks();
            state.priorities = workingSet.map((priority) => ({ ...priority }));
            modal.close();
            renderPriorities();
        };

        form.addEventListener('submit', handleSubmit, { once: true });

        modal.open({
            title: 'Manage priorities',
            content: template,
            onClose: () => form.removeEventListener('submit', handleSubmit),
        });

        if (focusPriorityId) {
            const row = rows.get(focusPriorityId)?.element;
            if (row) {
                setTimeout(() => {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    };

    const renderPriorityComparison = () => {
        const container = getElement(selectors.priorityComparison);
        const select = getElement(selectors.priorityCompareSelect);
        if (!container || !select) {
            return;
        }

        container.innerHTML = '';
        const selectedScenario = PRIORITY_COMPARISON_SCENARIOS[select.value] || [];

        selectedScenario.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'p-4 bg-gray-50 border border-gray-200 rounded-lg';

            const header = document.createElement('div');
            header.className = 'flex items-center justify-between mb-2';

            const name = document.createElement('span');
            name.className = 'text-sm font-medium text-gray-800';
            name.textContent = item.name;

            const movement = document.createElement('div');
            movement.className = 'flex items-center space-x-2 text-xs';

            if (item.previousRank) {
                const previous = document.createElement('span');
                previous.className = 'text-gray-500';
                previous.textContent = `Was #${item.previousRank}`;
                movement.appendChild(previous);
            } else if (item.direction === 'new') {
                const previous = document.createElement('span');
                previous.className = 'text-gray-500';
                previous.textContent = 'New';
                movement.appendChild(previous);
            }

            const icon = document.createElement('i');
            const delta = document.createElement('span');
            delta.className = 'font-medium';

            switch (item.direction) {
                case 'up':
                    icon.className = 'fa-solid fa-arrow-up text-green-600 text-sm';
                    delta.classList.add('text-green-600');
                    delta.textContent = `+${item.delta}`;
                    break;
                case 'down':
                    icon.className = 'fa-solid fa-arrow-down text-red-600 text-sm';
                    delta.classList.add('text-red-600');
                    delta.textContent = `${item.delta}`;
                    break;
                case 'steady':
                    icon.className = 'fa-solid fa-minus text-gray-500 text-sm';
                    delta.classList.add('text-gray-600');
                    delta.textContent = '0';
                    break;
                case 'removed':
                    icon.className = 'fa-solid fa-minus text-gray-500 text-sm';
                    delta.classList.add('text-gray-600');
                    delta.textContent = 'Removed';
                    break;
                default:
                    icon.className = 'fa-solid fa-plus text-blue-600 text-sm';
                    delta.classList.add('text-blue-600');
                    delta.textContent = 'Added';
            }

            movement.appendChild(icon);
            movement.appendChild(delta);

            header.appendChild(name);
            header.appendChild(movement);

            const reason = document.createElement('p');
            reason.className = 'text-xs text-gray-600';
            reason.textContent = item.reason;

            card.appendChild(header);
            card.appendChild(reason);
            container.appendChild(card);
        });
    };

    const showFeedback = (element, message, type = 'success') => {
        if (!element) {
            return;
        }
        element.textContent = message;
        element.classList.remove('hidden');
        element.classList.toggle('text-green-600', type === 'success');
        element.classList.toggle('text-red-600', type === 'error');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    };

    const handleDateRangeUpdate = () => {
        const fromInput = getElement(selectors.rangeFrom);
        const toInput = getElement(selectors.rangeTo);
        const error = getElement(selectors.rangeError);
        const success = getElement(selectors.rangeSuccess);
        const from = parseDate(fromInput?.value);
        const to = parseDate(toInput?.value);
        if (!from || !to || from > to) {
            showFeedback(error, 'Please select a valid date range where the start date is before the end date.', 'error');
            return;
        }
        state.dateRange = { from: formatDateISO(from), to: formatDateISO(to) };
        renderTaskOverview();
        renderProjects();
        renderDeliverables();
        showFeedback(success, `Dashboard updated for ${getRangeLabel(state.dateRange)}.`, 'success');
    };

    const handlePriorityRangeUpdate = () => {
        const fromInput = getElement(selectors.priorityRangeFrom);
        const toInput = getElement(selectors.priorityRangeTo);
        const error = getElement(selectors.priorityRangeError);
        const success = getElement(selectors.priorityRangeSuccess);
        const from = parseDate(fromInput?.value);
        const to = parseDate(toInput?.value);
        if (!from || !to || from > to) {
            showFeedback(error, 'Enter a valid timeframe for tracking priority updates.', 'error');
            return false;
        }
        state.priorityRange = { from: formatDateISO(from), to: formatDateISO(to) };
        showFeedback(success, `Tracking priority changes for ${getRangeLabel(state.priorityRange)}.`, 'success');
        return true;
    };

    const exportReport = () => {
        const filename = `ai-assistant-dashboard-${state.dateRange.from}-to-${state.dateRange.to}.json`;
        const report = {
            generatedAt: new Date().toISOString(),
            range: state.dateRange,
            metrics: TASK_STATUS_CONFIG.map((config) => ({
                status: config.label,
                count: state.tasks.filter((task) => task.status === config.key && isDateInRange(task.dueDate, state.dateRange)).length,
            })),
            projects: state.projects.filter((project) => doesProjectOverlapRange(project, state.dateRange)),
            deliverables: state.deliverables.filter((deliverable) => isDateInRange(deliverable.releaseDate, state.dateRange)),
            priorities: state.priorities.map((priority) => ({
                rank: priority.rank,
                name: priority.name,
                description: priority.description,
            })),
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const bindEvents = () => {
        const applyButton = getElement(selectors.applyDateRange);
        attachEvent(applyButton, 'click', handleDateRangeUpdate);

        const exportButton = getElement(selectors.exportReport);
        attachEvent(exportButton, 'click', exportReport);

        getElements(selectors.addProjectButtons).forEach((button) => {
            attachEvent(button, 'click', () => openProjectForm());
        });

        const addDeliverable = getElement(selectors.addDeliverableButton);
        attachEvent(addDeliverable, 'click', () => openDeliverableForm());

        const prioritySelect = getElement(selectors.priorityCompareSelect);
        attachEvent(prioritySelect, 'change', renderPriorityComparison);

        const priorityManagerButton = getElement(selectors.openPriorityManager);
        attachEvent(priorityManagerButton, 'click', () => {
            if (handlePriorityRangeUpdate()) {
                openPriorityManager();
            }
        });
    };

    const render = () => {
        renderTaskOverview();
        renderProjects();
        renderDeliverables();
        renderPriorities();
        renderPriorityComparison();
    };

    const initializeInputs = () => {
        const fromInput = getElement(selectors.rangeFrom);
        const toInput = getElement(selectors.rangeTo);
        if (fromInput) {
            fromInput.value = state.dateRange.from;
        }
        if (toInput) {
            toInput.value = state.dateRange.to;
        }
        const priorityFromInput = getElement(selectors.priorityRangeFrom);
        const priorityToInput = getElement(selectors.priorityRangeTo);
        if (priorityFromInput) {
            priorityFromInput.value = state.priorityRange.from;
        }
        if (priorityToInput) {
            priorityToInput.value = state.priorityRange.to;
        }
    };

    const init = () => {
        if (!document.body || document.body.dataset.activeSidebarLink !== DASHBOARD_PAGE_KEY) {
            return;
        }
        initializeInputs();
        bindEvents();
        render();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    document.addEventListener('ai-assistant:init-page', (event) => {
        if (!event?.detail || event.detail.page === DASHBOARD_PAGE_KEY) {
            initializeInputs();
            bindEvents();
            render();
        }
    });
})();
