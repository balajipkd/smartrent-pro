import { getDB } from '../db/database.js';

export class PaymentForm {
  constructor(container) {
    this.container = container;
    this.render();
  }

  async render() {
    this.container.innerHTML = `
      <div class="card">
        <h2 class="text-xl mb-4">Record Rent Payment</h2>
        <form id="payment-form" class="flex flex-col gap-4">
          
          <div class="flex flex-col">
            <label for="date">Date Received *</label>
            <input type="date" id="date" name="date" required />
          </div>

          <div class="flex flex-col">
            <label for="tenant">Tenant *</label>
            <select id="tenant" name="tenant" required>
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
            <input type="number" id="amount" name="amount" min="0" step="0.01" required placeholder="0.00" />
          </div>

          <div class="flex flex-col">
            <label for="type">Payment Method</label>
            <select id="type" name="type">
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="flex flex-col">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" rows="2" placeholder="Reference number, comments..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary mt-4">Record Payment</button>
        </form>
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

    await this.loadTenants();
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

    // Find active lease for tenant
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

      // Auto-fill amount
      this.form.querySelector('#amount').value = activeLease.rentAmount;

      // Store leaseId on form for submission
      this.form.dataset.leaseId = activeLease.id;
    } else {
      this.leaseInfoDiv.classList.remove('hidden');
      this.leaseInfoDiv.innerHTML = `<p class="text-red-400">No active lease found for this tenant.</p>`;
      this.form.dataset.leaseId = '';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.form);
    const db = await getDB();
    const leaseId = this.form.dataset.leaseId;

    if (!leaseId) {
      alert('Cannot record payment: No valid lease found for selected tenant.');
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
      await db.add('payments', payment);
      if (confirm('Payment Recorded Successfully! View Receipt?')) {
        // Simple alert receipt for MVP
        alert(`
          --- RECEIPT ---
          Date: ${payment.date}
          Amount: ₹${payment.amount}
          Type: ${payment.type}
          Ref: ${Date.now()}
        `);
      }
      this.form.reset();
      this.form.querySelector('#date').valueAsDate = new Date();
      this.leaseInfoDiv.classList.add('hidden');
    } catch (err) {
      console.error(err);
      alert('Error recording payment');
    }
  }
}
