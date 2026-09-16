const SchedulesPage = {
    printers: [],
    categories: [],

    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = App.loading();

        try {
            const [schedules, printers, categories] = await Promise.all([
                API.getSchedules(),
                API.getPrinters(),
                API.getCategories('Preventive')
            ]);
            this.printers = printers;
            this.categories = categories;
            this.allCategories = await API.getCategories();

            content.innerHTML = `
                <div class="toolbar">
                    <div class="toolbar-left">
                        <span class="record-count">${schedules.length} schedule(s)</span>
                    </div>
                    <button class="btn btn-primary" onclick="SchedulesPage.openAdd()">
                        <span class="material-icons">add</span> New Schedule
                    </button>
                </div>
                <div class="card">
                    <div class="table-wrapper">
                        <table>
                            <thead><tr>
                                <th>Printer</th><th>Location</th><th>Task</th>
                                <th>Every (days)</th><th>Last Done</th><th>Next Due</th><th>Days Left</th><th></th>
                            </tr></thead>
                            <tbody>
                                ${this.renderRows(schedules)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            content.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load schedules: ${e.message}</div>`;
        }
    },

    renderRows(schedules) {
        if (!schedules.length) return '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">No schedules found</td></tr>';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return schedules.map(s => {
            const due = new Date(s.next_due_date);
            const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            const printerName = s.printer ? `${s.printer.brand} ${s.printer.model}` : '—';
            const location = s.printer?.location?.name || '—';
            const task = s.category?.name || '—';

            return `<tr>
                <td><strong>${printerName}</strong></td>
                <td>${location}</td>
                <td>${task}</td>
                <td style="text-align:center">${s.frequency_days}</td>
                <td>${s.last_performed || '—'}</td>
                <td>${s.next_due_date}</td>
                <td><span class="${App.daysClass(days)}">${days}</span></td>
                <td>
                    <button class="btn btn-flat btn-sm" onclick='SchedulesPage.perform(${JSON.stringify({
                        printer_id: s.printer_id,
                        category_id: s.category_id
                    })})' title="Perform maintenance" style="color:var(--primary)">
                        <span class="material-icons" style="font-size:16px">build</span>
                        <span style="font-size:11px">Perform</span>
                    </button>
                    <button class="btn btn-flat btn-sm" onclick="SchedulesPage.remove(${s.id})" title="Deactivate" style="color:var(--danger)">
                        <span class="material-icons" style="font-size:16px">delete</span>
                    </button>
                </td>
            </tr>`;
        }).join('');
    },

    formHtml() {
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label>Printer *</label>
                    <select id="fSchedPrinter">
                        <option value="">Select...</option>
                        ${this.printers.map(p => `<option value="${p.id}">${p.brand} ${p.model} (${p.serial_number})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Category (Preventive) *</label>
                    <select id="fSchedCategory">
                        <option value="">Select...</option>
                        ${this.categories.map(c => `<option value="${c.id}" data-freq="${c.frequency_days || ''}">${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Frequency (days) *</label>
                    <input type="number" id="fSchedFreq" min="1">
                </div>
                <div class="form-group">
                    <label>Next Due Date *</label>
                    <input type="date" id="fSchedDue" value="${new Date().toISOString().slice(0, 10)}">
                </div>
            </div>`;
    },

    openAdd() {
        App.openModal('New Schedule', this.formHtml(),
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="SchedulesPage.saveNew()">Create Schedule</button>`);

        setTimeout(() => {
            document.getElementById('fSchedCategory')?.addEventListener('change', (e) => {
                const opt = e.target.selectedOptions[0];
                const freq = opt?.dataset.freq;
                if (freq) document.getElementById('fSchedFreq').value = freq;
            });
        }, 100);
    },

    async saveNew() {
        const data = {
            printer_id: parseInt(document.getElementById('fSchedPrinter').value),
            category_id: parseInt(document.getElementById('fSchedCategory').value),
            frequency_days: parseInt(document.getElementById('fSchedFreq').value),
            next_due_date: document.getElementById('fSchedDue').value
        };
        if (!data.printer_id || !data.category_id || !data.frequency_days || !data.next_due_date) {
            App.toast('All fields are required', 'error');
            return;
        }
        try {
            await API.createSchedule(data);
            App.closeModal();
            App.toast('Schedule created');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async perform(info) {
        if (!this.allCategories?.length) {
            this.allCategories = await API.getCategories();
        }
        MaintenancePage.printers = this.printers;
        MaintenancePage.categories = this.allCategories;
        MaintenancePage.openAdd({
            printer_id: info.printer_id,
            category_id: info.category_id,
            type: 'Preventive',
            status: 'Completed'
        });
    },

    async remove(id) {
        if (!confirm('Deactivate this schedule?')) return;
        try {
            await API.deleteSchedule(id);
            App.toast('Schedule deactivated');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    }
};
