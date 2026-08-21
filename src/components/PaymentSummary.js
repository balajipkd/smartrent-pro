import { getDB } from '../db/database.js';

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Check', 'Credit Card', 'Other'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export class PaymentSummary {
  constructor(container) {
    this.container = container;
    this.rows = [];
    this.buildings = [];
    this.methodFilter = 'all';
    this.buildingFilter = 'all';
    this.sortDir = 'desc';
    this.render();
  }

  formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Returns { key: 'YYYY-MM', label: 'Apr 2025' } from a payment's period or date
  monthMeta(payment) {
    const raw = payment.paymentPeriod || payment.date || '';
    const d = new Date(raw);
    if (isNaN(d)) return { key: '0000-00', label: '—' };
    const year = d.getFullYear();
    const month = d.getMonth();
    return {
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${MONTH_NAMES[month]} ${year}`
    };
  }

  async render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Payment Summary</h2>
            <p class="text-sm text-gray-500 mt-1">Amount received by tenant, unit and month — filter by payment method.</p>
          </div>
          <div class="flex flex-wrap gap-4">
            <div class="w-full sm:w-56">
              <label for="method-filter" class="text-sm font-medium text-gray-700 mb-1.5 block">Payment Method</label>
              <select id="method-filter">
                <option value="all">All Methods</option>
                ${PAYMENT_METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
              </select>
            </div>
            <div class="w-full sm:w-56">
              <label for="building-filter" class="text-sm font-medium text-gray-700 mb-1.5 block">Building</label>
              <select id="building-filter">
                <option value="all">All Buildings</option>
              </select>
            </div>
            <div class="w-full sm:w-44">
              <label for="sort-filter" class="text-sm font-medium text-gray-700 mb-1.5 block">Sort by Month</label>
              <select id="sort-filter">
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>

        <div id="summary-cards" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"></div>
        <div id="summary-table" class="overflow-x-auto"></div>
      </div>
    `;

    this.methodSelect = this.container.querySelector('#method-filter');
    this.buildingSelect = this.container.querySelector('#building-filter');
    this.sortSelect = this.container.querySelector('#sort-filter');
    this.cardsWrapper = this.container.querySelector('#summary-cards');
    this.tableWrapper = this.container.querySelector('#summary-table');

    this.methodSelect.addEventListener('change', (e) => {
      this.methodFilter = e.target.value;
      this.renderTable();
    });
    this.buildingSelect.addEventListener('change', (e) => {
      this.buildingFilter = e.target.value;
      this.renderTable();
    });
    this.sortSelect.addEventListener('change', (e) => {
      this.sortDir = e.target.value;
      this.renderTable();
    });

    await this.loadData();
  }

  async loadData() {
    this.tableWrapper.innerHTML = `<p class="text-sm text-gray-500 py-6 text-center">Loading...</p>`;
    const db = await getDB();
    const [payments, leases, units, tenants, buildings] = await Promise.all([
      db.getAll('payments'),
      db.getAll('leases'),
      db.getAll('units'),
      db.getAll('tenants'),
      db.getAll('buildings')
    ]);

    this.buildings = buildings;
    const leaseMap = {};
    leases.forEach(l => leaseMap[l.id] = l);
    const unitMap = {};
    units.forEach(u => unitMap[u.id] = u);
    const tenantMap = {};
    tenants.forEach(t => tenantMap[t.id] = t.name);

    this.rows = payments.map(p => {
      const lease = leaseMap[p.leaseId] || {};
      const unit = unitMap[lease.unitId] || {};
      const month = this.monthMeta(p);
      return {
        tenant: tenantMap[lease.tenantId] || 'Unknown',
        unit: unit.unitNumber != null ? `Unit ${unit.unitNumber}` : '—',
        buildingId: unit.buildingId ?? null,
        monthKey: month.key,
        monthLabel: month.label,
        amount: Number(p.amount) || 0,
        water: Number(p.water) || 0,
        method: p.type || 'Other'
      };
    });

    // Populate building filter
    this.buildingSelect.innerHTML = '<option value="all">All Buildings</option>' +
      buildings
        .slice()
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map(b => `<option value="${b.id}">${this.escapeHtml(b.name)}</option>`)
        .join('');

    this.renderTable();
  }

  getFilteredRows() {
    return this.rows.filter(r => {
      const methodOk = this.methodFilter === 'all' || r.method === this.methodFilter;
      const buildingOk = this.buildingFilter === 'all' || String(r.buildingId) === String(this.buildingFilter);
      return methodOk && buildingOk;
    });
  }

  renderTable() {
    const rows = this.getFilteredRows();
    const dir = this.sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (a.monthKey !== b.monthKey) return a.monthKey.localeCompare(b.monthKey) * dir;
      return String(a.tenant).localeCompare(String(b.tenant));
    });

    const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
    const totalWater = rows.reduce((s, r) => s + r.water, 0);

    this.renderCards(rows.length, totalAmount, totalWater);

    if (!rows.length) {
      this.tableWrapper.innerHTML = `<p class="text-sm text-gray-500 py-10 text-center">No payments match the selected filters.</p>`;
      return;
    }

    const body = rows.map(r => `
      <tr class="border-b border-gray-100">
        <td class="py-2 px-3 text-gray-900">${this.escapeHtml(r.tenant)}</td>
        <td class="py-2 px-3 text-gray-700">${this.escapeHtml(r.unit)}</td>
        <td class="py-2 px-3 text-gray-700">${this.escapeHtml(r.monthLabel)}</td>
        <td class="py-2 px-3 text-gray-700">${this.escapeHtml(r.method)}</td>
        <td class="py-2 px-3 text-right text-gray-900">₹${this.formatCurrency(r.amount)}</td>
        <td class="py-2 px-3 text-right text-gray-900">₹${this.formatCurrency(r.water)}</td>
      </tr>
    `).join('');

    this.tableWrapper.innerHTML = `
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:150px">Tenant</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:100px">Unit</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:110px">Month</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-600" style="min-width:130px">Payment Method</th>
            <th class="text-right py-2 px-3 font-semibold text-gray-600" style="min-width:120px">Amount (₹)</th>
            <th class="text-right py-2 px-3 font-semibold text-gray-600" style="min-width:120px">Water (₹)</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
        <tfoot class="bg-gray-50 border-t-2 border-gray-300 font-semibold">
          <tr>
            <td class="py-2 px-3 text-gray-900" colspan="4">Total (${rows.length} payment${rows.length === 1 ? '' : 's'})</td>
            <td class="py-2 px-3 text-right text-gray-900">₹${this.formatCurrency(totalAmount)}</td>
            <td class="py-2 px-3 text-right text-gray-900">₹${this.formatCurrency(totalWater)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  renderCards(count, totalAmount, totalWater) {
    this.cardsWrapper.innerHTML = `
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div class="text-sm font-medium text-blue-600 mb-1">Total Received</div>
        <div class="text-2xl font-bold text-blue-900">₹${this.formatCurrency(totalAmount)}</div>
      </div>
      <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
        <div class="text-sm font-medium text-emerald-600 mb-1">Total Water</div>
        <div class="text-2xl font-bold text-emerald-900">₹${this.formatCurrency(totalWater)}</div>
      </div>
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div class="text-sm font-medium text-gray-600 mb-1">Payments</div>
        <div class="text-2xl font-bold text-gray-900">${count}</div>
      </div>
    `;
  }
}
