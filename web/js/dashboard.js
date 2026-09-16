const DashboardPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = App.loading();

        try {
            const [stats, overdue] = await Promise.all([
                API.getStats(),
                API.getOverdueDashboard()
            ]);

            content.innerHTML = `
                <div class="stats-grid">
                    ${this.statCard('print', 'teal', stats.total_printers, 'Total Printers')}
                    ${this.statCard('check_circle', 'green', stats.active_printers, 'Active')}
                    ${this.statCard('build', 'orange', stats.in_repair, 'In Repair')}
                    ${this.statCard('warning', 'red', stats.overdue_maintenance, 'Overdue')}
                    ${this.statCard('schedule', 'blue', stats.upcoming_7_days, 'Due in 7 Days')}
                    ${this.statCard('task_alt', 'green', stats.completed_this_month, 'Completed (Month)')}
                    ${this.statCard('handyman', 'orange', stats.corrective_this_month, 'Corrective (Month)')}
                </div>

                <div class="card">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                        <h3 style="font-size:16px; font-weight:600;">
                            <span class="material-icons" style="vertical-align:middle; color:var(--danger); margin-right:4px;">error</span>
                            Overdue Maintenance
                        </h3>
                        <span class="record-count">${overdue.length} item(s)</span>
                    </div>
                    ${overdue.length ? this.overdueTable(overdue) : App.empty('event_available', 'No overdue maintenance — great job!')}
                </div>
            `;
        } catch (e) {
            content.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load dashboard: ${e.message}</div>`;
        }
    },

    statCard(icon, color, value, label) {
        return `
            <div class="stat-card">
                <div class="stat-icon ${color}"><span class="material-icons">${icon}</span></div>
                <div>
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>`;
    },

    overdueTable(items) {
        return `
            <div class="table-wrapper"><table>
                <thead><tr>
                    <th>Printer</th><th>Serial</th><th>Location</th>
                    <th>Task</th><th>Due Date</th><th>Days Overdue</th>
                </tr></thead>
                <tbody>
                    ${items.map(i => `<tr>
                        <td><strong>${i.brand} ${i.model}</strong></td>
                        <td>${i.serial_number}</td>
                        <td>${i.location || '—'}</td>
                        <td>${i.maintenance_task}</td>
                        <td>${i.due_date}</td>
                        <td><span class="days-overdue">${i.days_overdue} days</span></td>
                    </tr>`).join('')}
                </tbody>
            </table></div>`;
    }
};
