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
      <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl">Manage Property Data</h2>
        </div>

        <div class="flex gap-2 border-b border-gray-600 mb-4 overflow-x-auto">
            <button class="tab-btn px-4 py-2 whitespace-nowrap ${this.activeTab === 'buildings' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="buildings">Buildings</button>
            <button class="tab-btn px-4 py-2 whitespace-nowrap ${this.activeTab === 'units' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="units">Units</button>
            <button class="tab-btn px-4 py-2 whitespace-nowrap ${this.activeTab === 'tenants' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="tenants">Tenants</button>
            <button class="tab-btn px-4 py-2 whitespace-nowrap ${this.activeTab === 'leases' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="leases">Leases</button>
        </div>

        <div id="tab-content" class="flex flex-col gap-8">
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
            sizeSel.className = 'bg-slate-900 border border-slate-600 p-1 rounded text-white text-xs outline-none focus:border-blue-500';
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
            // formatting happens here to simpler values or HTML
            const formattedData = data.map(item => [
                ...columns.map(col => col.formatter ? col.formatter(item[col.id], item) : item[col.id]),
                html(`
                    <div class="flex gap-2 justify-end">
                        <button class="p-1 px-3 text-xs font-medium rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all btn-edit" data-store="${storeName}" data-id="${item.id}">Edit</button>
                        <button class="p-1 px-3 text-xs font-medium rounded border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all btn-delete" data-store="${storeName}" data-id="${item.id}">Delete</button>
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
                    table: 'w-full text-left border-collapse',
                    thead: 'bg-slate-800 text-gray-300',
                    th: 'p-3 font-semibold border-b border-gray-600',
                    td: 'p-3 border-b border-gray-700 text-gray-300',
                    container: 'shadow-lg rounded-lg overflow-hidden border border-slate-700 bg-slate-800/20',
                    footer: 'bg-slate-800/50 p-3',
                    search: 'p-2 bg-slate-900 border border-slate-600 text-white rounded mb-2 w-full outline-none focus:border-blue-500'
                },
                style: {
                    th: { 'background-color': 'rgba(30, 41, 59, 0.9)' },
                    td: { 'background-color': 'rgba(30, 41, 59, 0.4)' },
                    footer: { 'background-color': 'rgba(30, 41, 59, 0.9)' }
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
                { id: 'createdAt', name: 'Created', formatter: (cell) => this.formatDate(cell) }
            ];

            contentDiv.innerHTML = `
            <div class="grid md:grid-cols-3 gap-8 items-start">
                <div class="md:col-span-1">
                    <form id="form-building" class="flex flex-col gap-4 sticky top-4 bg-slate-800/50 p-4 rounded border border-slate-700">
                        <h3 class="text-lg font-semibold border-b border-gray-700 pb-2">${this.editingId ? 'Edit' : 'Add New'} Building</h3>
                        <input type="text" name="name" placeholder="Building Name" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                        <input type="text" name="address" placeholder="Address" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                        <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'}</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="md:col-span-2" id="table-wrapper"></div>
            </div>`;

            this.setupFormHandler(contentDiv, 'buildings', async (formData) => ({
                name: formData.get('name'),
                address: formData.get('address')
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
                    <form id="form-unit" class="flex flex-col gap-4 sticky top-4 bg-slate-800/50 p-4 rounded border border-slate-700">
                        <h3 class="text-lg font-semibold border-b border-gray-700 pb-2">${this.editingId ? 'Edit' : 'Add New'} Unit</h3>
                        <select name="buildingId" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white">
                            <option value="">Select Building...</option>
                            ${buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                        <input type="text" name="unitNumber" placeholder="Unit Number" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                        <select name="status" class="bg-slate-900 border border-slate-600 p-2 rounded text-white">
                            <option value="Vacant">Vacant</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                        <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'}</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
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
                    <form id="form-tenant" class="flex flex-col gap-4 sticky top-4 bg-slate-800/50 p-4 rounded border border-slate-700">
                        <h3 class="text-lg font-semibold border-b border-gray-700 pb-2">${this.editingId ? 'Edit' : 'Add New'} Tenant</h3>
                        <input type="text" name="name" placeholder="Full Name" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                        <input type="text" name="contact" placeholder="Phone / Email" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                         <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'}</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
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
                    <form id="form-lease" class="flex flex-col gap-4 sticky top-4 bg-slate-800/50 p-4 rounded border border-slate-700">
                        <h3 class="text-lg font-semibold border-b border-gray-700 pb-2">${this.editingId ? 'Edit' : 'Create'} Lease Agreement</h3>
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <label class="text-xs text-gray-500">Unit</label>
                                <select name="unitId" required class="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white">
                                    <option value="">Select Unit...</option>
                                    ${units.map(u => `<option value="${u.id}">Unit ${u.unitNumber}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-gray-500">Tenant</label>
                                <select name="tenantId" required class="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white">
                                    <option value="">Select Tenant...</option>
                                    ${tenants.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <label class="text-xs text-gray-500">Start Date</label>
                                <input type="date" name="startDate" required class="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                            </div>
                            <div class="flex-1">
                                <label class="text-xs text-gray-500">End Date</label>
                                <input type="date" name="endDate" required class="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                            </div>
                        </div>
                        <div>
                             <label class="text-xs text-gray-500">Rent Amount (₹)</label>
                             <input type="number" name="rentAmount" required placeholder="0.00" class="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                        </div>
                         <div class="flex gap-2 mt-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Create'}</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
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
                input.value = value;
            }
        }
    }
}
