import { getDB } from '../db/database.js';
import { Grid, html } from 'gridjs';
import "gridjs/dist/theme/mermaid.css";

export class PaymentForm {
  constructor(container) {
    this.container = container;
    this.editingId = null;
    this.gridInstance = null;
    this.render();
  }

  async render() {
    this.container.innerHTML = `
      <div class="grid md:grid-cols-2 gap-8 items-start">
        <div class="card">
            <h2 class="text-xl mb-4" id="form-title">Record Rent Payment</h2>
            <form id="payment-form" class="flex flex-col gap-4">
            
            <div class="flex flex-col">
                <label for="date">Date Received *</label>
                <input type="date" id="date" name="date" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
            </div>

            <div class="flex flex-col">
                <label for="tenant">Tenant *</label>
                <select id="tenant" name="tenant" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white">
                <option value="">Loading Tenants...</option>
                </select>
            </div>

            <div class="p-4 bg-slate-800 rounded border border-slate-600 hidden" id="lease-info">
                <p class="text-sm text-gray-400">Lease Details</p>
                <div class="flex justify-between items-center mt-1">
                    <span id="unit-display" class="font-bold text-white">Unit --</span>
                    <span id="rent-display" class="font-bold text-green-400">₹0.00 / month</span>
                </div>
            </div>

            <div class="flex flex-col">
                <label for="amount">Amount (₹) *</label>
                <input type="number" id="amount" name="amount" min="0" step="0.01" required placeholder="0.00" class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
            </div>

            <div class="flex flex-col">
                <label for="type">Payment Method</label>
                <select id="type" name="type" class="bg-slate-900 border border-slate-600 p-2 rounded text-white">
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Other">Other</option>
                </select>
            </div>

            <div class="flex flex-col">
                <label for="notes">Notes</label>
                <textarea id="notes" name="notes" rows="2" placeholder="Reference number, comments..." class="bg-slate-900 border border-slate-600 p-2 rounded text-white"></textarea>
            </div>

            <div class="flex gap-2 mt-4">
                <button type="submit" class="btn btn-primary flex-1" id="btn-submit">Record Payment</button>
                <button type="button" class="btn btn-cancel hidden" id="btn-cancel">Cancel Edit</button>
            </div>
            </form>
        </div>

        <div class="card">
            <h2 class="text-xl mb-4">Payment History</h2>
            <div id="payment-grid"></div>
        </div>
      </div>
    `;

    this.form = this.container.querySelector('#payment-form');
    this.tenantSelect = this.form.querySelector('#tenant');
    this.leaseInfoDiv = this.form.querySelector('#lease-info');

    // Default date to today
    this.form.querySelector('#date').valueAsDate = new Date();

    // Event Listeners
    this.tenantSelect.addEventListener('change', (e) => this.handleTenantChange(e.target.value));
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    this.container.querySelector('#btn-cancel').addEventListener('click', () => {
      this.resetForm();
    });

    // Global listener for Grid actions
    this.container.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('btn-delete')) {
        if (confirm('Are you sure you want to delete this payment?')) {
          const db = await getDB();
          await db.delete('payments', parseInt(btn.dataset.id));
          this.renderPayments();
        }
      }

      if (btn.classList.contains('btn-edit')) {
        this.handleEdit(parseInt(btn.dataset.id));
      }
    });

    await this.loadTenants();
    await this.renderPayments();
  }

  async loadTenants() {
    const db = await getDB();
    const tenants = await db.getAll('tenants');

    this.tenantSelect.innerHTML = '<option value="">Select Tenant...</option>';
    tenants.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.name;
      this.tenantSelect.appendChild(option);
    });
  }

  async handleTenantChange(tenantId) {
    if (!tenantId) {
      this.leaseInfoDiv.classList.add('hidden');
      return;
    }

    const db = await getDB();
    const leases = await db.getAll('leases');
    const units = await db.getAll('units');

    // Find active lease for tenant logic...
    const today = new Date();
    const activeLease = leases.find(l => {
      return l.tenantId === parseInt(tenantId) &&
        new Date(l.startDate) <= today &&
        new Date(l.endDate) >= today;
    });

    if (activeLease) {
      const unit = units.find(u => u.id === activeLease.unitId);
      this.leaseInfoDiv.querySelector('#unit-display').textContent = `Unit ${unit ? unit.unitNumber : 'Unknown'}`;
      this.leaseInfoDiv.querySelector('#rent-display').textContent = `₹${activeLease.rentAmount.toFixed(2)}`;
      this.leaseInfoDiv.classList.remove('hidden');

      // Auto-fill amount only if adding new
      if (!this.editingId) {
        this.form.querySelector('#amount').value = activeLease.rentAmount;
      }

      this.form.dataset.leaseId = activeLease.id;
    } else {
      this.leaseInfoDiv.classList.remove('hidden');
      this.leaseInfoDiv.innerHTML = `<p class="text-yellow-400 text-xs">No currently active lease. Ensure tenant/lease is correct.</p>`;
    }
  }

  async renderPayments() {
    const db = await getDB();
    const payments = await db.getAll('payments');
    const tenants = await db.getAll('tenants');
    const leases = await db.getAll('leases');
    const units = await db.getAll('units'); // Fetch units

    const tenantMap = {}; tenants.forEach(t => tenantMap[t.id] = t.name);
    const leaseMap = {}; leases.forEach(l => leaseMap[l.id] = l);
    const unitMap = {}; units.forEach(u => unitMap[u.id] = `Unit ${u.unitNumber}`);

    // Sort by date desc
    payments.sort((a, b) => new Date(b.date) - new Date(a.date));

    const enrichedData = payments.map(p => {
      const lease = leaseMap[p.leaseId];
      const tenantName = lease ? (tenantMap[lease.tenantId] || 'Unknown') : 'Unknown';
      const unitName = lease ? (unitMap[lease.unitId] || 'Unknown') : 'Unknown';  // Resolve Unit

      return [
        new Date(p.date).toLocaleDateString('en-IN'),
        tenantName,
        unitName, // Add Unit
        p.amount,
        p.type, // Method
        p.notes || '-', // Notes
        p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-', // Add Created
        html(`
                <div class="flex gap-2 justify-end">
                    <button class="p-1 px-2 text-xs font-medium rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 btn-edit" data-id="${p.id}">Edit</button>
                    <button class="p-1 px-2 text-xs font-medium rounded border border-red-500/30 text-red-400 hover:bg-red-500/20 btn-delete" data-id="${p.id}">Delete</button>
                </div>
              `)
      ];
    });

    if (this.gridInstance) {
      this.gridInstance.updateConfig({
        data: enrichedData,
        columns: [
          { name: 'Date', width: '100px' },
          { name: 'Tenant', width: '120px' },
          { name: 'Unit', width: '80px' },
          { name: 'Amount', width: '100px', formatter: (cell) => `₹${cell}` },
          { name: 'Method', width: '100px' },
          { name: 'Notes', width: '150px' },
          { name: 'Created', width: '140px' },
          { name: 'Actions', width: '120px', sort: false }
        ]
      }).forceRender();
    } else {
      // Inject Selector if not exists... (existing logic)
      const container = document.getElementById('payment-grid').parentElement;
      if (!container.querySelector('.page-size-selector')) {
        const controls = document.createElement('div');
        controls.className = 'flex justify-end mb-2 page-size-selector';
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
        container.insertBefore(controls, document.getElementById('payment-grid'));
      }

      this.gridInstance = new Grid({
        columns: [
          { name: 'Date', width: '100px' },
          { name: 'Tenant', width: '120px' },
          { name: 'Unit', width: '80px' }, // Add Unit Col
          { name: 'Amount', width: '100px', formatter: (cell) => `₹${cell}` },
          { name: 'Method', width: '100px' },
          { name: 'Notes', width: '150px' },
          { name: 'Created', width: '140px' }, // Add Created Col
          { name: 'Actions', width: '120px', sort: false }
        ],
        data: enrichedData,
        search: true,
        pagination: { limit: 50 },
        className: {
          table: 'w-full text-left border-collapse text-sm',
          thead: 'bg-slate-800 text-gray-300',
          th: 'p-2 font-semibold border-b border-gray-600',
          td: 'p-2 border-b border-gray-700 text-gray-300',
          container: 'shadow-lg rounded-lg overflow-hidden border border-slate-700 bg-slate-800/20',
          search: 'p-2 bg-slate-900 border border-slate-600 text-white rounded mb-2 w-full outline-none'
        },
        style: {
          th: { 'background-color': 'rgba(30, 41, 59, 0.9)' },
          td: { 'background-color': 'rgba(30, 41, 59, 0.4)' }
        }
      }).render(document.getElementById('payment-grid'));
    }
  }

  async handleEdit(id) {
    const db = await getDB();
    const payment = await db.get('payments', id);
    const leases = await db.getAll('leases');
    const lease = leases.find(l => l.id === payment.leaseId);

    this.editingId = id;
    this.container.querySelector('#form-title').textContent = 'Edit Payment';
    this.container.querySelector('#btn-submit').textContent = 'Update Payment';
    this.container.querySelector('#btn-cancel').classList.remove('hidden');

    // Populate Form
    this.form.querySelector('#date').value = payment.date;
    this.form.querySelector('#amount').value = payment.amount;
    this.form.querySelector('#type').value = payment.type;
    this.form.querySelector('#notes').value = payment.notes;

    if (lease) {
      this.tenantSelect.value = lease.tenantId;
      // Trigger change to update active lease context (even if date might be tricky)
      await this.handleTenantChange(lease.tenantId);
      // Ensure leaseId is set correctly to the one on the payment, not just the "latest active"
      this.form.dataset.leaseId = lease.id;
    }
  }

  resetForm() {
    this.editingId = null;
    this.form.reset();
    this.form.querySelector('#date').valueAsDate = new Date();
    this.container.querySelector('#form-title').textContent = 'Record Rent Payment';
    this.container.querySelector('#btn-submit').textContent = 'Record Payment';
    this.container.querySelector('#btn-cancel').classList.add('hidden');
    this.leaseInfoDiv.classList.add('hidden');
    this.tenantSelect.value = "";
  }

  async handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.form);
    const db = await getDB();
    const leaseId = this.form.dataset.leaseId;

    if (!leaseId) {
      alert('Error: No valid lease linked.');
      return;
    }

    const payment = {
      leaseId: parseInt(leaseId),
      date: formData.get('date'),
      amount: parseFloat(formData.get('amount')),
      type: formData.get('type'),
      notes: formData.get('notes'),
      createdAt: new Date().toISOString()
    };

    try {
      if (this.editingId) {
        payment.id = this.editingId;
        const original = await db.get('payments', this.editingId);
        payment.createdAt = original.createdAt;

        await db.put('payments', payment);
        alert('Payment Updated');
        this.resetForm();
      } else {
        await db.add('payments', payment);
        if (confirm('Payment Recorded! View Receipt?')) {
          alert(`--- RECEIPT ---\nDate: ${payment.date}\nAmount: ₹${payment.amount}\nType: ${payment.type}`);
        }
        this.form.reset();
        this.form.querySelector('#date').valueAsDate = new Date();
        this.leaseInfoDiv.classList.add('hidden');
      }
      this.renderPayments();
    } catch (err) {
      console.error(err);
      alert('Error saving payment');
    }
  }
}
