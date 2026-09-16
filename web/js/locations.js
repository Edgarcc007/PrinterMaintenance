const LocationsPage = {
    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = App.loading();

        try {
            const locations = await API.getLocations();

            content.innerHTML = `
                <div class="toolbar">
                    <span class="record-count">${locations.length} location(s)</span>
                    <button class="btn btn-primary" onclick="LocationsPage.openAdd()">
                        <span class="material-icons">add</span> New Location
                    </button>
                </div>
                <div class="card">
                    <div class="table-wrapper">
                        <table>
                            <thead><tr>
                                <th>ID</th><th>Name</th><th>Description</th><th></th>
                            </tr></thead>
                            <tbody>
                                ${locations.length ? locations.map(l => `<tr>
                                    <td>${l.id}</td>
                                    <td><strong>${l.name}</strong></td>
                                    <td>${l.description || '—'}</td>
                                    <td>
                                        <button class="btn btn-flat btn-sm" onclick="LocationsPage.openEdit(${l.id}, '${l.name.replace(/'/g, "\\'")}', '${(l.description || '').replace(/'/g, "\\'")}')" title="Edit">
                                            <span class="material-icons" style="font-size:16px">edit</span>
                                        </button>
                                        <button class="btn btn-flat btn-sm" onclick="LocationsPage.remove(${l.id})" title="Delete" style="color:var(--danger)">
                                            <span class="material-icons" style="font-size:16px">delete</span>
                                        </button>
                                    </td>
                                </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:32px;">No locations</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            content.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load locations: ${e.message}</div>`;
        }
    },

    formHtml(name = '', desc = '') {
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label>Name *</label>
                    <input id="fLocName" value="${name}">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input id="fLocDesc" value="${desc}">
                </div>
            </div>`;
    },

    openAdd() {
        App.openModal('New Location', this.formHtml(),
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="LocationsPage.save()">Save</button>`);
    },

    openEdit(id, name, desc) {
        this._editId = id;
        App.openModal('Edit Location', this.formHtml(name, desc),
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="LocationsPage.save(${id})">Save Changes</button>`);
    },

    async save(id = null) {
        const data = {
            name: document.getElementById('fLocName').value.trim(),
            description: document.getElementById('fLocDesc').value.trim() || null
        };
        if (!data.name) { App.toast('Name is required', 'error'); return; }
        try {
            if (id) await API.updateLocation(id, data);
            else await API.createLocation(data);
            App.closeModal();
            App.toast(id ? 'Location updated' : 'Location created');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async remove(id) {
        if (!confirm('Delete this location?')) return;
        try {
            await API.deleteLocation(id);
            App.toast('Location deleted');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    }
};
