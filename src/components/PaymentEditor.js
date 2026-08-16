import { getDB } from '../db/database.js';

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Check', 'Credit Card', 'Other'];

export class PaymentEditor {
  constructor(container) {
    this.container = container;
    this.units = [];
    this.tenants = [];
    this.buildings = [];
    this.selectedUnitId = null;
    this.paymentSortDir = 'desc';
    this.render();
  }

  formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Decides how a payment's water field looks: saved (green), auto-loaded from lease (amber), or empty (blue)
  waterFieldMeta(p, lease) {
    const registered = Number(p?.water) > 0;
    const leaseWater = Number(lease?.waterCharge) || 0;
    if (registered) {
      return {
        value: p.water,
        style: 'border-color:#16a34a;background-color:#dcfce7',
        title: 'Water charge saved',
        autoload: false
      };
    }
    if (leaseWater > 0) {
      return {
        value: leaseWater,
        style: 'border-color:#f59e0b;background-color:#fffbeb',
        title: 'Auto-loaded from lease water charge — save to register',
        autoload: true
      };
    }
    return {
      value: p?.water ?? 0,
      style: 'border-color:#3b82f6;background-color:#eff6ff',
      title: '',
      autoload: false
    };
  }

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Payment Editor</h2>
            <p class="text-sm text-gray-500 mt-1">Select a unit to review and fix its leases and payments in place.</p>
          </div>
          <div class="w-full md:w-72">
            <label for="unit-select" class="text-sm font-medium text-gray-700 mb-1.5 block">Unit</label>
            <select id="unit-select">
              <option value="">Select a unit...</option>
            </select>
          </div>
        </div>

        <div id="editor-body" class="hidden flex flex-col gap-8">
          <section>
            <h3 class="text-base font-semibold text-gray-900 mb-3">Leases for this unit</h3>
            <div id="leases-wrapper" class="overflow-x-auto"></div>
          </section>

          <section>
            <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 class="text-base font-semibold text-gray-900">Payments for this unit</h3>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                  <label for="payments-sort" class="text-xs text-gray-500">Sort by date</label>
                  <select id="payments-sort" class="text-xs">
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
                <span id="payments-total" class="text-sm text-gray-500"></span>
                <button id="save-all-payments" class="btn btn-primary text-xs hidden">Save all changes</button>
              </div>
            </div>
            <p class="text-xs text-gray-400 mb-2">Tip: type the water amount then press <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> to save that row, or use <b>Save all changes</b> after editing several rows.</p>
            <div class="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
              <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm" style="background:#fffbeb;border:1px solid #f59e0b"></span> Auto-loaded from lease (unsaved)</span>
              <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm" style="background:#dcfce7;border:1px solid #16a34a"></span> Saved / registered</span>
            </div>
            <div id="payments-wrapper" class="overflow-x-auto"></div>
          </section>
        </div>

        <div id="editor-empty" class="text-sm text-gray-500 py-10 text-center">
          Choose a unit above to begin editing.
        </div>
      </div>
    `;

    this.unitSelect = this.container.querySelector('#unit-select');
    this.editorBody = this.container.querySelector('#editor-body');
    this.editorEmpty = this.container.querySelector('#editor-empty');
    this.leasesWrapper = this.container.querySelector('#leases-wrapper');
    this.paymentsWrapper = this.container.querySelector('#payments-wrapper');
    this.paymentsTotal = this.container.querySelector('#payments-total');
    this.saveAllBtn = this.container.querySelector('#save-all-payments');
    this.paymentsSort = this.container.querySelector('#payments-sort');

    this.paymentsSort.value = this.paymentSortDir;
    this.paymentsSort.addEventListener('change', (e) => {
      this.paymentSortDir = e.target.value;
      if (this.payments) this.renderPaymentsTable();
    });

    this.unitSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      this.selectedUnitId = val ? parseInt(val) : null;
      if (this.selectedUnitId) {
        this.loadUnitData();
      } else {
        this.editorBody.classList.add('hidden');
        this.editorEmpty.classList.remove('hidden');
      }
    });

    this.saveAllBtn.addEventListener('click', () => this.saveAllPayments());

    if (!this.actionsBound) {
      this.container.addEventListener('click', (e) => this.handleAction(e));
      // Press Enter in any payment field to save that row
      this.container.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const row = e.target.closest('tr[data-payment-id]');
        if (row) {
          e.preventDefault();
          this.savePayment(row, row.querySelector('.btn-save-payment'));
        }
      });
      this.actionsBound = true;
    }

    await this.loadUnits();
  }

  async loadUnits() {
    const db = await getDB();
    [this.units, this.buildings, this.tenants] = await Promise.all([
      db.getAll('units'),
      db.getAll('buildings'),
      db.getAll('tenants')
    ]);

    const buildingMap = {};
    this.buildings.forEach(b => buildingMap[b.id] = b.name);

    // Group units by building using optgroups
    const groups = {};
    this.units.forEach(u => {
      const key = buildingMap[u.buildingId] || 'Unassigned';
      (groups[key] = groups[key] || []).push(u);
    });

    let optionsHtml = '<option value="">Select a unit...</option>';
    Object.keys(groups).sort().forEach(groupName => {
      optionsHtml += `<optgroup label="${this.escapeHtml(groupName)}">`;
      groups[groupName]
        .sort((a, b) => String(a.unitNumber).localeCompare(String(b.unitNumber), undefined, { numeric: true }))
        .forEach(u => {
          optionsHtml += `<option value="${u.id}">Unit ${this.escapeHtml(u.unitNumber)}</option>`;
        });
      optionsHtml += '</optgroup>';
    });
    this.unitSelect.innerHTML = optionsHtml;
  }

  async loadUnitData() {
    const db = await getDB();
    const [allLeases, allPayments] = await Promise.all([
      db.getAll('leases'),
      db.getAll('payments')
    ]);

    this.leases = allLeases.filter(l => l.unitId === this.selectedUnitId);
    const leaseIds = new Set(this.leases.map(l => l.id));
    this.payments = allPayments
      .filter(p => leaseIds.has(p.leaseId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    this.editorEmpty.classList.add('hidden');
    this.editorBody.classList.remove('hidden');

    this.renderLeasesTable();
    this.renderPaymentsTable();
  }

  renderLeasesTable() {
    const tenantOptions = (selectedId) => this.tenants
      .map(t => `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${this.escapeHtml(t.name)}</option>`)
      .join('');

    if (!this.leases.length) {
      this.leasesWrapper.innerHTML = `<p class="text-sm text-gray-500">No leases found for this unit.</p>`;
      return;
    }

    const rows = this.leases.map(l => `
      <tr data-lease-id="${l.id}" class="border-b border-gray-100">
        <td class="py-2 px-3">
          <select class="lease-tenant text-sm">${tenantOptions(l.tenantId)}</select>
        </td>
        <td class="py-2 px-3">
          <input type="date" class="lease-start text-sm" value="${l.startDate || ''}" />
        </td>
        <td class="py-2 px-3">
          <input type="date" class="lease-end text-sm" value="${l.endDate || ''}" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="0" step="0.01" class="lease-rent text-sm" value="${l.rentAmount ?? ''}" />
        </td>
        <td class="py-2 px-3">
          <input type="number" min="0" step="0.01" class="lease-water text-sm" value="${l.waterCharge ?? ''}" />
        </td>
        <td class="py-2 px-3 text-right">
          <button class="btn btn-primary btn-save-lease text-xs" data-id="${l.id}">Save</button>
        </td>
      </tr>
    `).join('');

    this.leasesWrapper.innerHTML = `
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:150px">Tenant</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:150px">Start Date</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:150px">End Date</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:120px">Rent (₹)</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:120px">Water (₹)</th>
            <th class="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  renderPaymentsTable() {
    const leaseMap = {};
    this.leases.forEach(l => leaseMap[l.id] = l);
    const tenantMap = {};
    this.tenants.forEach(t => tenantMap[t.id] = t.name);

    const dir = this.paymentSortDir === 'asc' ? 1 : -1;
    this.payments.sort((a, b) => (new Date(a.date) - new Date(b.date)) * dir);

    const leaseOptions = (selectedLeaseId) => this.leases.map(l => {
      const tenantName = tenantMap[l.tenantId] || 'Unknown';
      const period = `${l.startDate || '?'} → ${l.endDate || '?'}`;
      return `<option value="${l.id}" ${l.id === selectedLeaseId ? 'selected' : ''}>${this.escapeHtml(tenantName)} (${this.escapeHtml(period)})</option>`;
    }).join('');

    const methodOptions = (selected) => PAYMENT_METHODS
      .map(m => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m}</option>`)
      .join('');

    if (!this.payments.length) {
      this.paymentsWrapper.innerHTML = `<p class="text-sm text-gray-500">No payments recorded for this unit.</p>`;
      this.paymentsTotal.textContent = '';
      this.saveAllBtn.classList.add('hidden');
      return;
    }
    this.saveAllBtn.classList.remove('hidden');

    let total = 0;
    let waterTotal = 0;
    const rows = this.payments.map(p => {
      total += Number(p.amount) || 0;
      waterTotal += Number(p.water) || 0;
      const periodMonth = p.paymentPeriod ? String(p.paymentPeriod).slice(0, 7) : '';
      const wm = this.waterFieldMeta(p, leaseMap[p.leaseId]);
      return `
      <tr data-payment-id="${p.id}" class="border-b border-gray-100">
        <td class="py-2 px-3"><input type="date" class="pay-date text-sm" value="${p.date || ''}" /></td>
        <td class="py-2 px-3"><input type="month" class="pay-period text-sm" value="${periodMonth}" /></td>
        <td class="py-2 px-3"><select class="pay-lease text-sm" style="min-width:180px">${leaseOptions(p.leaseId)}</select></td>
        <td class="py-2 px-3"><input type="number" min="0" step="0.01" class="pay-amount text-sm" value="${p.amount ?? ''}" /></td>
        <td class="py-2 px-3"><input type="number" min="0" step="0.01" class="pay-water text-sm${wm.autoload ? ' water-autoload' : ''}" value="${wm.value}" onfocus="this.select()" style="${wm.style}" title="${wm.title}" /></td>
        <td class="py-2 px-3"><select class="pay-method text-sm">${methodOptions(p.type)}</select></td>
        <td class="py-2 px-3"><input type="text" class="pay-notes text-sm" value="${this.escapeHtml(p.notes || '')}" /></td>
        <td class="py-2 px-3 text-right whitespace-nowrap">
          <button class="btn btn-primary btn-save-payment text-xs" data-id="${p.id}">Save</button>
          <button class="btn btn-delete-payment text-xs" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `;
    }).join('');

    this.paymentsTotal.textContent = `Total: ₹${this.formatCurrency(total)} · Water: ₹${this.formatCurrency(waterTotal)}`;

    this.paymentsWrapper.innerHTML = `
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:150px">Date</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:140px">Period</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:180px">Lease / Tenant</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:120px">Amount (₹)</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:120px">Water (₹)</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:140px">Method</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:180px">Notes</th>
            <th class="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  async handleAction(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('btn-save-lease')) {
      await this.saveLease(btn.closest('tr'), btn);
    } else if (btn.classList.contains('btn-save-payment')) {
      await this.savePayment(btn.closest('tr'), btn);
    } else if (btn.classList.contains('btn-delete-payment')) {
      await this.deletePayment(parseInt(btn.dataset.id));
    }
  }

  async saveLease(row, btn) {
    const id = parseInt(row.dataset.leaseId);
    const tenantId = parseInt(row.querySelector('.lease-tenant').value);
    const startDate = row.querySelector('.lease-start').value;
    const endDate = row.querySelector('.lease-end').value;
    const rentAmount = parseFloat(row.querySelector('.lease-rent').value);

    if (!startDate || !endDate) {
      alert('Start and End dates are required.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      alert('End Date must be after Start Date.');
      return;
    }

    const waterCharge = parseFloat(row.querySelector('.lease-water').value);

    const original = this.leases.find(l => l.id === id);
    const updated = {
      ...original,
      id,
      tenantId,
      startDate,
      endDate,
      rentAmount: isNaN(rentAmount) ? 0 : rentAmount,
      waterCharge: isNaN(waterCharge) ? 0 : waterCharge
    };

    try {
      btn.disabled = true;
      const db = await getDB();
      await db.put('leases', updated);
      Object.assign(original, updated);
      this.flashRow(row);
      // Refresh payment lease dropdowns so updated dates/tenant show
      this.renderPaymentsTable();
    } catch (err) {
      console.error(err);
      alert('Error saving lease');
    } finally {
      btn.disabled = false;
    }
  }

  async savePayment(row, btn) {
    const id = parseInt(row.dataset.paymentId);
    const date = row.querySelector('.pay-date').value;
    const periodMonth = row.querySelector('.pay-period').value;
    const leaseId = parseInt(row.querySelector('.pay-lease').value);
    const amount = parseFloat(row.querySelector('.pay-amount').value);
    const water = parseFloat(row.querySelector('.pay-water').value);
    const type = row.querySelector('.pay-method').value;
    const notes = row.querySelector('.pay-notes').value;

    if (!date) {
      alert('Date is required.');
      return;
    }

    const original = this.payments.find(p => p.id === id);
    const updated = {
      ...original,
      id,
      leaseId,
      date,
      paymentPeriod: periodMonth ? `${periodMonth}-01` : null,
      amount: isNaN(amount) ? 0 : amount,
      water: isNaN(water) ? 0 : water,
      type,
      notes
    };

    try {
      btn.disabled = true;
      const db = await getDB();
      await db.put('payments', updated);
      Object.assign(original, updated);
      this.recolorWaterField(row, updated);
      this.flashRow(row);
      this.updatePaymentsTotal();
    } catch (err) {
      console.error(err);
      alert('Error saving payment');
    } finally {
      btn.disabled = false;
    }
  }

  async saveAllPayments() {
    const rows = Array.from(this.paymentsWrapper.querySelectorAll('tr[data-payment-id]'));
    const db = await getDB();
    let saved = 0;
    let skipped = 0;

    this.saveAllBtn.disabled = true;
    try {
      for (const row of rows) {
        const id = parseInt(row.dataset.paymentId);
        const original = this.payments.find(p => p.id === id);
        if (!original) continue;

        const date = row.querySelector('.pay-date').value;
        if (!date) { skipped++; continue; }

        const periodMonth = row.querySelector('.pay-period').value;
        const amount = parseFloat(row.querySelector('.pay-amount').value);
        const water = parseFloat(row.querySelector('.pay-water').value);
        const updated = {
          ...original,
          id,
          leaseId: parseInt(row.querySelector('.pay-lease').value),
          date,
          paymentPeriod: periodMonth ? `${periodMonth}-01` : null,
          amount: isNaN(amount) ? 0 : amount,
          water: isNaN(water) ? 0 : water,
          type: row.querySelector('.pay-method').value,
          notes: row.querySelector('.pay-notes').value
        };

        // Only write rows that actually changed
        const changed = ['leaseId', 'date', 'paymentPeriod', 'amount', 'water', 'type', 'notes']
          .some(k => (original[k] ?? '') !== (updated[k] ?? ''));
        if (!changed) continue;

        await db.put('payments', updated);
        Object.assign(original, updated);
        this.recolorWaterField(row, updated);
        this.flashRow(row);
        saved++;
      }
      this.updatePaymentsTotal();
      alert(`Saved ${saved} payment(s).${skipped ? ` Skipped ${skipped} row(s) missing a date.` : ''}`);
    } catch (err) {
      console.error(err);
      alert('Error saving payments');
    } finally {
      this.saveAllBtn.disabled = false;
    }
  }

  async deletePayment(id) {
    if (!confirm('Delete this payment? This cannot be undone.')) return;
    try {
      const db = await getDB();
      await db.delete('payments', id);
      this.payments = this.payments.filter(p => p.id !== id);
      this.renderPaymentsTable();
    } catch (err) {
      console.error(err);
      alert('Error deleting payment');
    }
  }

  updatePaymentsTotal() {
    const total = this.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const waterTotal = this.payments.reduce((s, p) => s + (Number(p.water) || 0), 0);
    this.paymentsTotal.textContent = `Total: ₹${this.formatCurrency(total)} · Water: ₹${this.formatCurrency(waterTotal)}`;
  }

  // Reflect the new saved/auto-load state on a payment row's water input after a write
  recolorWaterField(row, payment) {
    const input = row.querySelector('.pay-water');
    if (!input) return;
    const lease = this.leases.find(l => l.id === payment.leaseId);
    const meta = this.waterFieldMeta(payment, lease);
    input.setAttribute('style', meta.style);
    input.title = meta.title;
    input.value = meta.value;
    input.classList.toggle('water-autoload', meta.autoload);
  }

  flashRow(row) {
    row.style.transition = 'background-color 0.3s';
    row.style.backgroundColor = '#dcfce7';
    setTimeout(() => { row.style.backgroundColor = ''; }, 700);
  }
}
