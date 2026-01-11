import { getDB } from '../db/database.js';
import { Grid, html } from 'gridjs';
import "gridjs/dist/theme/mermaid.css";

export class ManageData {
    constructor(container) {
        this.container = container;
        this.activeTab = 'buildings';
        this.editingId = null;
        this.gridInstance = null; // Store active grid instance
        this.render();
    }

    async render() {
        this.formatDate = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

        this.container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Manage Property Data</h2>

        <div class="flex flex-wrap gap-2 mb-6">
            <button class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.activeTab === 'buildings' ? 'bg-white text-gray-900 border-2 border-gray-900' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}" data-tab="buildings">Buildings</button>
            <button class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.activeTab === 'units' ? 'bg-white text-gray-900 border-2 border-gray-900' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}" data-tab="units">Units</button>
            <button class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.activeTab === 'tenants' ? 'bg-white text-gray-900 border-2 border-gray-900' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}" data-tab="tenants">Tenants</button>
            <button class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.activeTab === 'leases' ? 'bg-white text-gray-900 border-2 border-gray-900' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}" data-tab="leases">Leases</button>
        </div>

        <div id="tab-content" class="flex flex-col gap-6">
            <!-- Dynamic Form Content -->
        </div>
      </div>
    `;

        // Tab Listeners
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                this.editingId = null;
                this.render();
            });
        });

        await this.renderTabContent();
    }

    async renderTabContent() {
        const contentDiv = this.container.querySelector('#tab-content');
        if (!contentDiv) return;

        const db = await getDB();

        // --- Helper to Render Grid.js ---
        const renderGrid = (columns, data, storeName) => {
            // Destroy previous instance logic not needed as we clear parent, but good to be safe if reusing container
            this.gridInstance = null;

            // Wrapper to hold selector + grid
            const wrapper = document.createElement('div');
            wrapper.className = 'mt-4';

            // Page Size Selector
            const controls = document.createElement('div');
            controls.className = 'flex justify-end mb-2';
            const sizeSel = document.createElement('select');
            sizeSel.className = 'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
            [10, 20, 50, 100].forEach(size => {
                const opt = document.createElement('option');
                opt.value = size;
                opt.textContent = `Show ${size}`;
                if (size === 50) opt.selected = true;
                sizeSel.appendChild(opt);
            });
            sizeSel.addEventListener('change', (e) => {
                const limit = parseInt(e.target.value);
                if (this.gridInstance) {
                    this.gridInstance.updateConfig({ pagination: { limit } }).forceRender();
                }
            });
            controls.appendChild(sizeSel);
            wrapper.appendChild(controls);

            const gridContainer = document.createElement('div');
            gridContainer.id = 'grid-container';
            wrapper.appendChild(gridContainer);

            // Map data to array format for Grid.js
            const formattedData = data.map(item => [
                ...columns.map(col => col.formatter ? col.formatter(item[col.id], item) : item[col.id]),
                html(`
                    <div class="flex gap-2 justify-center">
                        <button class="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm btn-edit" data-store="${storeName}" data-id="${item.id}">Edit</button>
                        <button class="px-3 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors text-sm btn-delete" data-store="${storeName}" data-id="${item.id}">Del</button>
                    </div>
                `)
            ]);

            const gridConfig = {
                columns: [
                    ...columns.map(c => ({ name: c.name, width: c.width, sort: { enabled: true } })),
                    { name: 'Actions', sort: false, width: '150px' }
                ],
                data: formattedData,
                search: true,
                sort: true,
                pagination: {
                    limit: 50,
                    enabled: true
                },
                className: {
                    table: 'min-w-full',
                    thead: 'border-b border-gray-200 bg-gray-50',
                    th: 'text-left py-3 px-4 text-sm text-gray-600 font-semibold',
                    td: 'py-3 px-4 text-sm border-b border-gray-100',
                    container: 'overflow-x-auto',
                    footer: 'flex items-center justify-between p-4 text-sm text-gray-600',
                    search: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4'
                }
            };

            this.gridInstance = new Grid(gridConfig).render(gridContainer);
            return wrapper;
        }

        // ------------------- BUILDINGS -------------------
        if (this.activeTab === 'buildings') {
            const buildings = await db.getAll('buildings');
            const columns = [
                { id: 'name', name: 'Name' },
                { id: 'address', name: 'Address' },
                { id: 'showWhenDashboardIsLoaded', name: 'Default?', formatter: (cell) => cell ? html('<span class="text-blue-600 font-bold">Yes</span>') : 'No' },
                { id: 'createdAt', name: 'Created', formatter: (cell) => this.formatDate(cell) }
            ];

            contentDiv.innerHTML = `
            <div class="grid md:grid-cols-3 gap-8 items-start">
                <div class="md:col-span-1">
                    <form id="form-building" class="flex flex-col gap-4 sticky top-4">
                        <h3 class="text-base font-semibold text-gray-900 mb-2">${this.editingId ? 'Edit' : 'Add New'} Building</h3>
                        <input type="text" name="name" placeholder="Building Name" required class="" />
                        <input type="text" name="address" placeholder="Address" required class="" />
                        <div class="flex items-center gap-2 px-1">
                            <input type="checkbox" name="showWhenDashboardIsLoaded" id="show-when-dashboard-is-loaded" class="w-4 h-4" />
                            <label for="show-when-dashboard-is-loaded" class="text-sm text-gray-700">Show When Dashboard is Loaded</label>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'}</button>
                            ${this.editingId ? '<button type="button" class="btn">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="md:col-span-2" id="table-wrapper"></div>
            </div>`;

            this.setupFormHandler(contentDiv, 'buildings', async (formData) => ({
                name: formData.get('name'),
                address: formData.get('address'),
                showWhenDashboardIsLoaded: formData.get('showWhenDashboardIsLoaded') === 'on'
            }));

            contentDiv.querySelector('#table-wrapper').appendChild(renderGrid(columns, buildings, 'buildings'));

            // ------------------- UNITS -------------------
        } else if (this.activeTab === 'units') {
            const buildings = await db.getAll('buildings');
            const units = await db.getAll('units');

            const buildingMap = {}; buildings.forEach(b => buildingMap[b.id] = b.name);

            const enrichedUnits = units.map(u => ({
                ...u,
                buildingName: buildingMap[u.buildingId] || 'Unknown'
            }));

            const columns = [
                { id: 'unitNumber', name: 'Unit' },
                { id: 'buildingName', name: 'Building' },
                { id: 'status', name: 'Status', formatter: (cell) => html(`<span class="px-2 py-0.5 rounded text-xs border ${cell === 'Occupied' ? 'bg-green-900/30 text-green-400 border-green-800' : cell === 'Vacant' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-red-900/30 text-red-400 border-red-800'}">${cell}</span>`) },
                { id: 'createdAt', name: 'Created', formatter: (cell) => this.formatDate(cell) }
            ];

            contentDiv.innerHTML = `
             <div class="grid md:grid-cols-3 gap-8 items-start">
                <div class="md:col-span-1">
                    <form id="form-unit" class="flex flex-col gap-4 sticky top-4">
                        <h3 class="text-base font-semibold text-gray-900 mb-2">${this.editingId ? 'Edit' : 'Add New'} Unit</h3>
                        <select name="buildingId" required class="">
                            <option value="">Select Building...</option>
                            ${buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                        <input type="text" name="unitNumber" placeholder="Unit Number" required class="" />
                        <select name="status" class="">
                            <option value="Vacant">Vacant</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                        <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'}</button>
                            ${this.editingId ? '<button type="button" class="btn">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="md:col-span-2" id="table-wrapper"></div>
             </div>`;

            this.setupFormHandler(contentDiv, 'units', async (formData) => ({
                buildingId: parseInt(formData.get('buildingId')),
                unitNumber: formData.get('unitNumber'),
                status: formData.get('status')
            }));

            contentDiv.querySelector('#table-wrapper').appendChild(renderGrid(columns, enrichedUnits, 'units'));

            // ------------------- TENANTS -------------------
        } else if (this.activeTab === 'tenants') {
            const tenants = await db.getAll('tenants');
            const columns = [
                { id: 'name', name: 'Name' },
                { id: 'contact', name: 'Contact' },
                { id: 'createdAt', name: 'Created', formatter: (cell) => this.formatDate(cell) }
            ];

            contentDiv.innerHTML = `
            <div class="grid md:grid-cols-3 gap-8 items-start">
                <div class="md:col-span-1">
                    <form id="form-tenant" class="flex flex-col gap-4 sticky top-4">
                        <h3 class="text-base font-semibold text-gray-900 mb-2">${this.editingId ? 'Edit' : 'Add New'} Tenant</h3>
                        <input type="text" name="name" placeholder="Full Name" required class="" />
                        <input type="text" name="contact" placeholder="Phone / Email" required class="" />
                         <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'}</button>
                            ${this.editingId ? '<button type="button" class="btn">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="md:col-span-2" id="table-wrapper"></div>
            </div>`;

            this.setupFormHandler(contentDiv, 'tenants', async (formData) => ({
                name: formData.get('name'),
                contact: formData.get('contact')
            }));

            contentDiv.querySelector('#table-wrapper').appendChild(renderGrid(columns, tenants, 'tenants'));

            // ------------------- LEASES -------------------
        } else if (this.activeTab === 'leases') {
            const units = await db.getAll('units');
            const tenants = await db.getAll('tenants');
            const leases = await db.getAll('leases');
            const unitMap = {}; units.forEach(u => unitMap[u.id] = `Unit ${u.unitNumber}`);
            const tenantMap = {}; tenants.forEach(t => tenantMap[t.id] = t.name);

            const enrichedLeases = leases.map(l => ({
                ...l,
                unitName: unitMap[l.unitId] || 'Unknown',
                tenantName: tenantMap[l.tenantId] || 'Unknown'
            }));

            const columns = [
                { id: 'unitName', name: 'Unit' },
                { id: 'tenantName', name: 'Tenant' },
                { id: 'rentAmount', name: 'Rent', formatter: (cell) => html(`<span class="text-green-400 font-mono">₹${cell}</span>`) },
                { id: 'createdAt', name: 'Created', formatter: (cell) => this.formatDate(cell) }
            ];

            contentDiv.innerHTML = `
            <div class="grid md:grid-cols-3 gap-8 items-start">
                <div class="md:col-span-1">
                    <form id="form-lease" class="flex flex-col gap-4 sticky top-4">
                        <h3 class="text-base font-semibold text-gray-900 mb-2">${this.editingId ? 'Edit' : 'Create'} Lease Agreement</h3>
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <label class="text-xs text-gray-600 mb-1 block">Unit</label>
                                <select name="unitId" required class="w-full">
                                    <option value="">Select Unit...</option>
                                    ${units.map(u => `<option value="${u.id}">Unit ${u.unitNumber}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-gray-600 mb-1 block">Tenant</label>
                                <select name="tenantId" required class="w-full">
                                    <option value="">Select Tenant...</option>
                                    ${tenants.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <label class="text-xs text-gray-600 mb-1 block">Start Date</label>
                                <input type="date" name="startDate" required class="w-full" />
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-gray-600 mb-1 block">End Date</label>
                                <input type="date" name="endDate" required class="w-full" />
                            </div>
                        </div>
                        <div>
                             <label class="text-xs text-gray-600 mb-1 block">Rent Amount (₹)</label>
                             <input type="number" name="rentAmount" required placeholder="0.00" class="w-full" />
                        </div>
                         <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Create'}</button>
                            ${this.editingId ? '<button type="button" class="btn">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="md:col-span-2" id="table-wrapper"></div>
            </div>`;

            this.setupFormHandler(contentDiv, 'leases', async (formData) => {
                if (new Date(formData.get('endDate')) <= new Date(formData.get('startDate'))) {
                    alert('End Date must be after Start Date');
                    throw new Error('Invalid Date');
                }
                return {
                    unitId: parseInt(formData.get('unitId')),
                    tenantId: parseInt(formData.get('tenantId')),
                    startDate: formData.get('startDate'),
                    endDate: formData.get('endDate'),
                    rentAmount: parseFloat(formData.get('rentAmount'))
                };
            });
            contentDiv.querySelector('#table-wrapper').appendChild(renderGrid(columns, enrichedLeases, 'leases'));
        }

        // Global Event Delegation for Edit/Delete actions
        if (!this.actionsBound) {
            this.container.addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                if (btn.classList.contains('btn-delete')) {
                    const store = btn.dataset.store;
                    const id = parseInt(btn.dataset.id);
                    const error = await this.checkDependencies(store, id);
                    if (error) {
                        alert(`Cannot delete: ${error}`);
                        return;
                    }
                    if (confirm('Are you sure? This cannot be undone.')) {
                        await db.delete(store, id);
                        this.render(); // Re-render to refresh grid
                    }
                }

                if (btn.classList.contains('btn-edit')) {
                    this.editingId = parseInt(btn.dataset.id);
                    const store = btn.dataset.store;
                    const record = await db.get(store, this.editingId);
                    await this.render(); // Re-render to switch form to Edit mode
                    const form = this.container.querySelector('form');
                    this.populateForm(form, record);
                    form.scrollIntoView({ behavior: 'smooth' });
                }
            });
            this.actionsBound = true;
        }

        const cancelBtn = contentDiv.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.editingId = null;
                this.render();
            });
        }
    }

    async checkDependencies(store, id) {
        const db = await getDB();

        if (store === 'buildings') {
            const units = await db.getAll('units');
            if (units.some(u => u.buildingId === id)) return 'This building has Units linked to it.';
            const expenses = await db.getAll('expenses');
            if (expenses.some(e => e.linkType === 'building' && parseInt(e.linkTargetId) === id)) return 'This building has Expenses linked to it.';
        }

        if (store === 'units') {
            const leases = await db.getAll('leases');
            if (leases.some(l => l.unitId === id)) return 'This unit has Leases linked to it.';
            const expenses = await db.getAll('expenses');
            if (expenses.some(e => e.linkType === 'unit' && parseInt(e.linkTargetId) === id)) return 'This unit has Expenses linked to it.';
        }

        if (store === 'tenants') {
            const leases = await db.getAll('leases');
            if (leases.some(l => l.tenantId === id)) return 'This tenant has Leases linked to them.';
        }

        if (store === 'leases') {
            const payments = await db.getAll('payments');
            if (payments.some(p => p.leaseId === id)) return 'This lease has Payments recorded against it.';
        }

        return null;
    }

    setupFormHandler(contentDiv, storeName, dataMapper) {
        contentDiv.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = new FormData(e.target);
                const data = await dataMapper(formData);
                const db = await getDB();

                if (this.editingId) {
                    data.id = this.editingId;
                    await db.put(storeName, data);
                    alert('Updated successfully!');
                    this.editingId = null;
                } else {
                    await db.add(storeName, data);
                    alert('Added successfully!');
                }
                this.render();
            } catch (err) {
                console.error(err);
            }
        });
    }

    populateForm(form, data) {
        for (const [key, value] of Object.entries(data)) {
            const input = form.elements[key];
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                } else {
                    input.value = value;
                }
            }
        }
    }
}
