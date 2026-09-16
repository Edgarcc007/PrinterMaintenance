const MaintenancePage = {
    printers: [],
    categories: [],

    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = App.loading();

        try {
            const [records, printers, categories] = await Promise.all([
                API.getRecords(),
                API.getPrinters(),
                API.getCategories()
            ]);
            this.printers = printers;
            this.categories = categories;

            content.innerHTML = `
                <div class="toolbar">
                    <div class="toolbar-left">
                        <select class="filter-select" id="filterPrinter">
                            <option value="">All Printers</option>
                            ${printers.map(p => `<option value="${p.id}">${p.brand} ${p.model} (${p.serial_number})</option>`).join('')}
                        </select>
                        <select class="filter-select" id="filterType">
                            <option value="">All Types</option>
                            <option value="Preventive">Preventive</option>
                            <option value="Corrective">Corrective</option>
                        </select>
                        <span class="record-count" id="recordCount">${records.length} record(s)</span>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-secondary" onclick="MaintenancePage.exportExcel()">
                            <span class="material-icons">download</span> Export
                        </button>
                        <button class="btn btn-primary" onclick="MaintenancePage.openAdd()">
                            <span class="material-icons">add</span> New Record
                        </button>
                    </div>
                </div>
                <div class="card">
                    <div class="table-wrapper">
                        <table>
                            <thead><tr>
                                <th>Date</th><th>Printer</th><th>Location</th><th>Type</th>
                                <th>Category</th><th>Performed By</th><th>Duration</th><th>Status</th><th></th>
                            </tr></thead>
                            <tbody id="recordsBody">
                                ${this.renderRows(records)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            document.getElementById('filterPrinter').addEventListener('change', () => this.applyFilters());
            document.getElementById('filterType').addEventListener('change', () => this.applyFilters());
        } catch (e) {
            content.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load records: ${e.message}</div>`;
        }
    },

    renderRows(records) {
        if (!records.length) return '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:32px;">No records found</td></tr>';
        return records.map(r => `<tr>
            <td>${r.performed_at ? r.performed_at.slice(0, 10) : '—'}</td>
            <td><strong>${r.printer ? r.printer.brand + ' ' + r.printer.model : '—'}</strong></td>
            <td>${r.printer?.location?.name || '—'}</td>
            <td>${App.statusBadge(r.type)}</td>
            <td>${r.category?.name || '—'}</td>
            <td>${r.performed_by}</td>
            <td>${r.duration_minutes ? r.duration_minutes + ' min' : '—'}</td>
            <td>${App.statusBadge(r.status || 'Completed')}</td>
            <td>
                <button class="btn btn-flat btn-sm" onclick="MaintenancePage.openEdit(${r.id})" title="Edit">
                    <span class="material-icons" style="font-size:16px">edit</span>
                </button>
            </td>
        </tr>`).join('');
    },

    async applyFilters() {
        const printerId = document.getElementById('filterPrinter').value;
        const type = document.getElementById('filterType').value;
        let params = '?';
        if (printerId) params += `printer_id=${printerId}&`;
        if (type) params += `type=${type}&`;

        try {
            const records = await API.getRecords(params);
            document.getElementById('recordsBody').innerHTML = this.renderRows(records);
            document.getElementById('recordCount').textContent = `${records.length} record(s)`;
        } catch (e) { App.toast(e.message, 'error'); }
    },

    formHtml(r = {}) {
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label>Printer *</label>
                    <select id="fPrinter">
                        <option value="">Select...</option>
                        ${this.printers.map(p => `<option value="${p.id}" ${r.printer_id === p.id ? 'selected' : ''}>${p.brand} ${p.model} (${p.serial_number})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select id="fCategory">
                        <option value="">Select...</option>
                        ${this.categories.map(c => `<option value="${c.id}" ${r.category_id === c.id ? 'selected' : ''}>${c.name} (${c.type})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select id="fType">
                        ${['Preventive', 'Corrective'].map(t => `<option value="${t}" ${r.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Performed By *</label>
                    <input id="fPerformedBy" value="${r.performed_by || ''}">
                </div>
                <div class="form-group">
                    <label>Duration (minutes)</label>
                    <input type="number" id="fDuration" value="${r.duration_minutes || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="fRecStatus">
                        ${['Completed', 'Pending', 'In Progress'].map(s => `<option value="${s}" ${(r.status || 'Completed') === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group full">
                    <label>Findings</label>
                    <textarea id="fFindings">${r.findings || ''}</textarea>
                </div>
                <div class="form-group full">
                    <label>Actions Taken</label>
                    <textarea id="fActions">${r.actions_taken || ''}</textarea>
                </div>
                <div class="form-group full">
                    <label>Parts Replaced</label>
                    <textarea id="fParts">${r.parts_replaced || ''}</textarea>
                </div>
            </div>`;
    },

    getFormData() {
        const data = {
            printer_id: parseInt(document.getElementById('fPrinter').value),
            category_id: parseInt(document.getElementById('fCategory').value),
            type: document.getElementById('fType').value,
            performed_by: document.getElementById('fPerformedBy').value.trim(),
            duration_minutes: document.getElementById('fDuration').value ? parseInt(document.getElementById('fDuration').value) : null,
            status: document.getElementById('fRecStatus').value,
            findings: document.getElementById('fFindings').value.trim() || null,
            actions_taken: document.getElementById('fActions').value.trim() || null,
            parts_replaced: document.getElementById('fParts').value.trim() || null
        };
        if (!data.printer_id || !data.category_id || !data.performed_by) {
            App.toast('Printer, Category and Performed By are required', 'error');
            return null;
        }
        return data;
    },

    openAdd(prefill = {}) {
        App.openModal('New Maintenance Record', this.formHtml(prefill),
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="MaintenancePage.save()">Save Record</button>`);
    },

    async openEdit(id) {
        try {
            const r = await API.getRecord(id);
            this._editId = id;
            App.openModal(`Edit Record #${id}`, this.formHtml(r),
                `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                 <button class="btn btn-primary" onclick="MaintenancePage.save(${id})">Save Changes</button>`);
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async save(id = null) {
        const data = this.getFormData();
        if (!data) return;
        try {
            if (id) {
                const { printer_id, category_id, type, ...updateData } = data;
                await API.updateRecord(id, updateData);
            } else {
                await API.createRecord(data);
            }
            App.closeModal();
            App.toast(id ? 'Record updated' : 'Record created');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    exportExcel() {
        window.open('/api/export/maintenance', '_blank');
    }
};
