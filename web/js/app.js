const App = {
    currentPage: null,

    pages: {
        dashboard: DashboardPage,
        printers: PrintersPage,
        maintenance: MaintenancePage,
        schedules: SchedulesPage,
        locations: LocationsPage,
        categories: CategoriesPage
    },

    init() {
        this.bindNav();
        this.bindModal();
        this.bindMenuToggle();
        window.addEventListener('hashchange', () => this.route());
        this.route();
    },

    route() {
        const hash = location.hash.slice(1) || 'dashboard';
        this.navigate(hash);
    },

    navigate(page) {
        const handler = this.pages[page];
        if (!handler) return;

        this.currentPage = page;

        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.page === page);
        });

        const titles = {
            dashboard: 'Dashboard',
            printers: 'Printers',
            maintenance: 'Maintenance History',
            schedules: 'Maintenance Schedules',
            locations: 'Locations',
            categories: 'Categories'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        handler.render();

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    },

    bindNav() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                location.hash = page;
            });
        });
    },

    bindModal() {
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    },

    bindMenuToggle() {
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    },

    openModal(title, bodyHtml, footerHtml = '') {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalFooter').innerHTML = footerHtml;
        document.getElementById('modalOverlay').classList.add('open');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('open');
    },

    toast(message, type = 'success') {
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    loading() {
        return '<div class="loading"><div class="spinner"></div><span>Loading...</span></div>';
    },

    empty(icon, text) {
        return `<div class="empty-state"><span class="material-icons">${icon}</span><p>${text}</p></div>`;
    },

    statusBadge(status) {
        const map = {
            'Active': 'active', 'In Repair': 'repair', 'Inactive': 'inactive', 'Retired': 'retired',
            'Preventive': 'preventive', 'Corrective': 'corrective',
            'Completed': 'completed', 'Pending': 'pending', 'In Progress': 'pending'
        };
        return `<span class="badge badge-${map[status] || 'active'}">${status}</span>`;
    },

    daysClass(days) {
        if (days < 0) return 'days-overdue';
        if (days <= 7) return 'days-warn';
        return 'days-ok';
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
