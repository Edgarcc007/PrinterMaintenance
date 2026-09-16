const CategoriesPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = App.loading();

        try {
            const categories = await API.getCategories();

            content.innerHTML = `
                <div class="toolbar">
                    <span class="record-count">${categories.length} category(ies)</span>
                    <button class="btn btn-primary" onclick="CategoriesPage.openAdd()">
                        <span class="material-icons">add</span> New Category
                    </button>
                </div>
                <div class="card">
                    <div class="table-wrapper">
                        <table>
                            <thead><tr>
                                <th>ID</th><th>Name</th><th>Type</th><th>Description</th>
                                <th>Est. Minutes</th><th>Frequency (days)</th><th>Applies To</th><th></th>
                            </tr></thead>
                            <tbody>
                                ${categories.length ? categories.map(c => `<tr>
                                    <td>${c.id}</td>
                                    <td><strong>${c.name}</strong></td>
                                    <td>${App.statusBadge(c.type)}</td>
                                    <td>${c.description || '—'}</td>
                                    <td style="text-align:center">${c.estimated_minutes || '—'}</td>
                                    <td style="text-align:center">${c.frequency_days || '—'}</td>
                                    <td>${c.applies_to || 'Both'}</td>
                                    <td>
                                        <button class="btn btn-flat btn-sm" onclick="CategoriesPage.remove(${c.id})" title="Delete" style="color:var(--danger)">
                                            <span class="material-icons" style="font-size:16px">delete</span>
                                        </button>
                                    </td>
                                </tr>`).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">No categories</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            content.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load categories: ${e.message}</div>`;
        }
    },

    formHtml() {
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label>Name *</label>
                    <input id="fCatName">
                </div>
                <div class="form-group">
                    <label>Type *</label>
                    <select id="fCatType">
                        <option value="Preventive">Preventive</option>
                        <option value="Corrective">Corrective</option>
                    </select>
                </div>
                <div class="form-group full">
                    <label>Description</label>
                    <input id="fCatDesc">
                </div>
                <div class="form-group">
                    <label>Estimated Minutes</label>
                    <input type="number" id="fCatMin" value="30">
                </div>
                <div class="form-group">
                    <label>Frequency (days)</label>
                    <input type="number" id="fCatFreq">
                </div>
                <div class="form-group">
                    <label>Applies To</label>
                    <select id="fCatApplies">
                        <option value="Both">Both</option>
                        <option value="Zebra">Zebra</option>
                        <option value="Honeywell">Honeywell</option>
                    </select>
                </div>
            </div>`;
    },

    openAdd() {
        App.openModal('New Category', this.formHtml(),
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="CategoriesPage.save()">Save</button>`);
    },

    async save() {
        const data = {
            name: document.getElementById('fCatName').value.trim(),
            type: document.getElementById('fCatType').value,
            description: document.getElementById('fCatDesc').value.trim() || null,
            estimated_minutes: document.getElementById('fCatMin').value ? parseInt(document.getElementById('fCatMin').value) : 30,
            frequency_days: document.getElementById('fCatFreq').value ? parseInt(document.getElementById('fCatFreq').value) : null,
            applies_to: document.getElementById('fCatApplies').value
        };
        if (!data.name) { App.toast('Name is required', 'error'); return; }
        try {
            await API.createCategory(data);
            App.closeModal();
            App.toast('Category created');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async remove(id) {
        if (!confirm('Delete this category?')) return;
        try {
            await API.deleteCategory(id);
            App.toast('Category deleted');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    }
};
