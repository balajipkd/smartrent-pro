import { getDB } from '../db/database.js';

export class ManageData {
    constructor(container) {
        this.container = container;
        this.activeTab = 'buildings';
        this.editingId = null; // Track if we are editing a specific ID
        this.render();
    }

    async render() {
        this.container.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl">Manage Property Data</h2>
        </div>

        <div class="flex gap-2 border-b border-gray-600 mb-4">
            <button class="tab-btn px-4 py-2 ${this.activeTab === 'buildings' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="buildings">Buildings</button>
            <button class="tab-btn px-4 py-2 ${this.activeTab === 'units' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="units">Units</button>
            <button class="tab-btn px-4 py-2 ${this.activeTab === 'tenants' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="tenants">Tenants</button>
            <button class="tab-btn px-4 py-2 ${this.activeTab === 'leases' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}" data-tab="leases">Leases</button>
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
                this.editingId = null; // Reset edit mode on tab switch
                this.render();
            });
        });

        await this.renderTabContent();
    }

    async renderTabContent() {
        const contentDiv = this.container.querySelector('#tab-content');
        const db = await getDB();

        // Helper to generate Action buttons
        const actions = (store, id) => `
        <div class="flex gap-2">
            <button class="text-blue-400 hover:text-blue-300 btn-edit" data-store="${store}" data-id="${id}">Edit</button>
            <button class="text-red-400 hover:text-red-300 btn-delete" data-store="${store}" data-id="${id}">Delete</button>
        </div>
    `;

        // Bind Action Listeners after rendering
        const bindActions = () => {
            contentDiv.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Are you sure? This cannot be undone.')) {
                        await db.delete(btn.dataset.store, parseInt(btn.dataset.id));
                        this.render();
                    }
                });
            });

            contentDiv.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', async () => {
                    this.editingId = parseInt(btn.dataset.id);
                    const record = await db.get(btn.dataset.store, this.editingId);
                    this.populateForm(contentDiv.querySelector('form'), record);
                    // Update header
                    contentDiv.querySelector('h3').textContent = `Edit ${this.activeTab.slice(0, -1)}`; // Remove 's' roughly
                    contentDiv.querySelector('button[type="submit"]').textContent = 'Update';

                    // Scroll to form
                    contentDiv.scrollIntoView({ behavior: 'smooth' });
                });
            });
        };

        if (this.activeTab === 'buildings') {
            const buildings = await db.getAll('buildings');

            contentDiv.innerHTML = `
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <form id="form-building" class="flex flex-col gap-4">
                        <h3 class="text-lg font-semibold">${this.editingId ? 'Edit' : 'Add New'} Building</h3>
                        <input type="text" name="name" placeholder="Building Name (e.g. Sunset Heights)" required />
                        <input type="text" name="address" placeholder="Address" required />
                        
                        <div class="flex gap-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'} Building</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="mt-4">
                    <h3 class="text-lg font-semibold mb-2">Existing Buildings</h3>
                    <table class="w-full text-left border-collapse">
                        <thead><tr class="border-b border-gray-600"><th class="p-2">Name</th><th class="p-2">Address</th><th class="p-2">Actions</th></tr></thead>
                        <tbody>
                            ${buildings.map(b => `
                                <tr class="border-b border-gray-700">
                                    <td class="p-2">${b.name}</td>
                                    <td class="p-2 text-gray-400">${b.address}</td>
                                    <td class="p-2">${actions('buildings', b.id)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

            this.setupFormHandler(contentDiv, 'buildings', async (formData) => ({
                name: formData.get('name'),
                address: formData.get('address')
            }));

        } else if (this.activeTab === 'units') {
            const buildings = await db.getAll('buildings');
            const units = await db.getAll('units');
            const buildingMap = {};
            buildings.forEach(b => buildingMap[b.id] = b.name);

            contentDiv.innerHTML = `
             <div class="grid md:grid-cols-2 gap-8">
                <div>
                   <form id="form-unit" class="flex flex-col gap-4">
                        <h3 class="text-lg font-semibold">${this.editingId ? 'Edit' : 'Add New'} Unit</h3>
                        <select name="buildingId" required>
                            <option value="">Select Building...</option>
                            ${buildings.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                        <input type="text" name="unitNumber" placeholder="Unit Number (e.g. 101, 2B)" required />
                        <select name="status">
                            <option value="Vacant">Vacant</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                         <div class="flex gap-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'} Unit</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="mt-4">
                    <h3 class="text-lg font-semibold mb-2">Existing Units</h3>
                    <table class="w-full text-left border-collapse">
                        <thead><tr class="border-b border-gray-600"><th class="p-2">Unit</th><th class="p-2">Building</th><th class="p-2">Status</th><th class="p-2">Actions</th></tr></thead>
                        <tbody>
                            ${units.map(u => `
                                <tr class="border-b border-gray-700">
                                    <td class="p-2 font-bold">${u.unitNumber}</td>
                                    <td class="p-2">${buildingMap[u.buildingId] || 'Unknown'}</td>
                                    <td class="p-2"><span class="${u.status === 'Occupied' ? 'text-green-400' : 'text-blue-400'}">${u.status}</span></td>
                                    <td class="p-2">${actions('units', u.id)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
             </div>
        `;

            this.setupFormHandler(contentDiv, 'units', async (formData) => ({
                buildingId: parseInt(formData.get('buildingId')),
                unitNumber: formData.get('unitNumber'),
                status: formData.get('status')
            }));

        } else if (this.activeTab === 'tenants') {
            const tenants = await db.getAll('tenants');

            contentDiv.innerHTML = `
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                   <form id="form-tenant" class="flex flex-col gap-4">
                        <h3 class="text-lg font-semibold">${this.editingId ? 'Edit' : 'Add New'} Tenant</h3>
                        <input type="text" name="name" placeholder="Full Name" required />
                        <input type="text" name="contact" placeholder="Phone / Email" required />
                         <div class="flex gap-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Add'} Tenant</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="mt-4">
                    <h3 class="text-lg font-semibold mb-2">Existing Tenants</h3>
                    <table class="w-full text-left border-collapse">
                        <thead><tr class="border-b border-gray-600"><th class="p-2">Name</th><th class="p-2">Contact</th><th class="p-2">Actions</th></tr></thead>
                        <tbody>
                            ${tenants.map(t => `
                                <tr class="border-b border-gray-700">
                                    <td class="p-2">${t.name}</td>
                                    <td class="p-2 text-gray-400">${t.contact}</td>
                                    <td class="p-2">${actions('tenants', t.id)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

            this.setupFormHandler(contentDiv, 'tenants', async (formData) => ({
                name: formData.get('name'),
                contact: formData.get('contact')
            }));

        } else if (this.activeTab === 'leases') {
            const units = await db.getAll('units');
            const tenants = await db.getAll('tenants');
            const leases = await db.getAll('leases');
            const unitMap = {}; units.forEach(u => unitMap[u.id] = `Unit ${u.unitNumber}`);
            const tenantMap = {}; tenants.forEach(t => tenantMap[t.id] = t.name);

            contentDiv.innerHTML = `
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <form id="form-lease" class="flex flex-col gap-4">
                        <h3 class="text-lg font-semibold">${this.editingId ? 'Edit' : 'Create'} Lease Agreement</h3>
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <label>Unit</label>
                                <select name="unitId" required>
                                    <option value="">Select Unit...</option>
                                    ${units.map(u => `<option value="${u.id}">Unit ${u.unitNumber}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex-1">
                                <label>Tenant</label>
                                <select name="tenantId" required>
                                    <option value="">Select Tenant...</option>
                                    ${tenants.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <label>Start Date</label>
                                <input type="date" name="startDate" required />
                            </div>
                            <div class="flex-1">
                                <label>End Date</label>
                                <input type="date" name="endDate" required />
                            </div>
                        </div>
                        <div>
                             <label>Rent Amount (₹)</label>
                             <input type="number" name="rentAmount" required placeholder="0.00" />
                        </div>
                         <div class="flex gap-2">
                            <button type="submit" class="btn btn-primary flex-1">${this.editingId ? 'Update' : 'Create'} Lease</button>
                            ${this.editingId ? '<button type="button" class="btn btn-cancel">Cancel</button>' : ''}
                        </div>
                    </form>
                </div>
                <div class="mt-4">
                    <h3 class="text-lg font-semibold mb-2">Active Leases</h3>
                    <table class="w-full text-left border-collapse">
                        <thead><tr class="border-b border-gray-600"><th class="p-2">Unit</th><th class="p-2">Tenant</th><th class="p-2">Rent</th><th class="p-2">Actions</th></tr></thead>
                        <tbody>
                            ${leases.map(l => `
                                <tr class="border-b border-gray-700">
                                    <td class="p-2">${unitMap[l.unitId] || 'Unknown'}</td>
                                    <td class="p-2">${tenantMap[l.tenantId] || 'Unknown'}</td>
                                    <td class="p-2 text-green-400">₹${l.rentAmount}</td>
                                    <td class="p-2">${actions('leases', l.id)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

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
        }

        bindActions();

        // Bind Cancel Listener
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
            if (leases.some(l => l.unitId === id)) return 'This unit has Leases linked to it.'; // Active or inactive keys

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
                    // Update
                    // We need to preserve original ID, but ID is keyPath.
                    // In IndexedDB add vs put. Put updates if key exists.
                    // We need to pass the ID in the object if using in-line keys, or as 2nd arg if out-of-line.
                    // Our schema uses in-line keys { keyPath: 'id' }.
                    data.id = this.editingId;
                    await db.put(storeName, data);
                    alert('Updated successfully!');
                    this.editingId = null;
                } else {
                    // Create
                    await db.add(storeName, data);
                    alert('Added successfully!');
                }

                this.render();
            } catch (err) {
                console.error(err);
                // Alert handled in mapper if specific error
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
