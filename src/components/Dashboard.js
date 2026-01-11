import { getDB } from '../db/database.js';

export class Dashboard {
    constructor(container) {
        this.container = container;
        this.mode = 'calendar'; // 'calendar' or 'financial'
        // Default to current date's relevant year
        const now = new Date();
        this.currentDate = now;
        this.selectedYear = now.getFullYear();
        // If financial year and we are in Jan-Mar, the financial year started in prev year (e.g. Mar 2024 is FY 2023-2024)
        if (this.mode === 'financial' && now.getMonth() < 3) {
            this.selectedYear--;
        }
        this.selectedBuildingId = 'all';

        this.render();
    }

    async render() {
        this.container.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div class="flex items-center gap-3">
          <label for="building-filter" class="text-sm font-medium text-gray-700">Filter Building:</label>
          <select id="building-filter" class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[200px]">
            <option value="all">All Buildings</option>
          </select>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4" id="unit-status-header">Unit Status (Previous Month)</h2>
        <div id="unit-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
            Loading...
        </div>
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Paid</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-yellow-500"></span> Partial</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500"></span> Overdue</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-gray-300"></span> Vacant</span>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Financial Overview</h2>
            <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button id="toggle-calendar" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${this.mode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}">Calendar Year</button>
                <button id="toggle-financial" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${this.mode === 'financial' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}">Financial Year (Apr-Mar)</button>
            </div>
        </div>
        
        <div class="flex justify-between items-center mb-6">
            <button id="prev-year" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>
            <span class="text-xl font-semibold text-gray-900" id="year-display">${this.getYearDisplay()}</span>
            <button id="next-year" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div class="text-sm font-medium text-blue-600 mb-1">Gross Revenue</div>
                <div class="text-2xl font-bold text-blue-900" id="gross-revenue">₹0.00</div>
            </div>
            <div class="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <div class="text-sm font-medium text-orange-600 mb-1">Total Maintenance</div>
                <div class="text-2xl font-bold text-orange-900" id="total-maintenance">₹0.00</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 border border-green-100">
                <div class="text-sm font-medium text-green-600 mb-1">Net Profit</div>
                <div class="text-2xl font-bold text-green-900" id="net-profit">₹0.00</div>
            </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 overflow-x-auto">
        <h2 class="text-lg font-semibold text-gray-900 mb-4" id="matrix-title">Rent Payment Matrix</h2>
        <div id="rent-matrix">Loading Matrix...</div>
      </div>
    `;

        // Bind events
        this.container.querySelector('#toggle-calendar').addEventListener('click', () => this.setMode('calendar'));
        this.container.querySelector('#toggle-financial').addEventListener('click', () => this.setMode('financial'));
        this.container.querySelector('#prev-year').addEventListener('click', () => this.changeYear(-1));
        this.container.querySelector('#next-year').addEventListener('click', () => this.changeYear(1));

        const buildingFilter = this.container.querySelector('#building-filter');
        buildingFilter.value = this.selectedBuildingId;
        buildingFilter.addEventListener('change', (e) => {
            this.selectedBuildingId = e.target.value;
            this.updateDashboard();
        });

        await this.loadBuildings();

        await this.calculateStats();
        await this.renderRentMatrix();
        await this.renderUnitGrid();
    }

    async updateDashboard() {
        await this.calculateStats();
        await this.renderRentMatrix();
        await this.renderUnitGrid();
    }

    async loadBuildings() {
        const db = await getDB();
        const buildings = await db.getAll('buildings');
        const filter = this.container.querySelector('#building-filter');

        buildings.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.name;
            filter.appendChild(opt);
        });
        filter.value = this.selectedBuildingId;
    }

    setMode(mode) {
        this.mode = mode;
        this.render();
    }

    changeYear(delta) {
        this.selectedYear += delta;
        this.container.querySelector('#year-display').textContent = this.getYearDisplay();
        this.updateDashboard();
    }

    getYearDisplay() {
        return this.mode === 'calendar' ? `${this.selectedYear}` : `FY ${this.selectedYear}-${this.selectedYear + 1}`;
    }

    async calculateStats() {
        const db = await getDB();
        const payments = await db.getAll('payments');
        const expenses = await db.getAll('expenses');
        const leases = await db.getAll('leases');
        const units = await db.getAll('units');

        const unitMap = {}; units.forEach(u => unitMap[u.id] = u);
        const leaseMap = {}; leases.forEach(l => leaseMap[l.id] = l);

        let startDate, endDate;

        if (this.mode === 'calendar') {
            startDate = new Date(this.selectedYear, 0, 1);
            endDate = new Date(this.selectedYear, 11, 31, 23, 59, 59);
        } else {
            // Financial Year: April 1st of selectedYear to March 31st of selectedYear+1
            startDate = new Date(this.selectedYear, 3, 1);
            endDate = new Date(this.selectedYear + 1, 2, 31, 23, 59, 59);
        }

        let gross = 0;
        let maint = 0;

        payments.forEach(p => {
            const d = new Date(p.date);
            if (d >= startDate && d <= endDate) {
                if (this.selectedBuildingId === 'all') {
                    gross += parseFloat(p.amount || 0);
                } else {
                    const lease = leaseMap[p.leaseId];
                    const unit = lease ? unitMap[lease.unitId] : null;
                    if (unit && unit.buildingId === parseInt(this.selectedBuildingId)) {
                        gross += parseFloat(p.amount || 0);
                    }
                }
            }
        });

        expenses.forEach(e => {
            const d = new Date(e.date);
            if (d >= startDate && d <= endDate) {
                if (this.selectedBuildingId === 'all') {
                    maint += parseFloat(e.amount || 0);
                } else {
                    let expenseBuildingId = e.buildingId;
                    if (!expenseBuildingId && e.unitId) {
                        const unit = unitMap[e.unitId];
                        if (unit) expenseBuildingId = unit.buildingId;
                    }

                    if (expenseBuildingId === parseInt(this.selectedBuildingId)) {
                        maint += parseFloat(e.amount || 0);
                    }
                }
            }
        });

        const net = gross - maint;

        this.container.querySelector('#gross-revenue').textContent = this.formatCurrency(gross);
        this.container.querySelector('#total-maintenance').textContent = this.formatCurrency(maint);
        this.container.querySelector('#net-profit').textContent = this.formatCurrency(net);
    }

    async renderRentMatrix() {
        // Update Title
        const titleEl = this.container.querySelector('#matrix-title');
        if (titleEl) titleEl.textContent = `Rent Payment Matrix (${this.getYearDisplay()})`;

        const db = await getDB();
        let units = await db.getAll('units');
        const leases = await db.getAll('leases');
        const payments = await db.getAll('payments');
        const tenants = await db.getAll('tenants');

        if (this.selectedBuildingId !== 'all') {
            units = units.filter(u => u.buildingId === parseInt(this.selectedBuildingId));
        }

        const tenantMap = {}; tenants.forEach(t => tenantMap[t.id] = t);
        const leaseMap = {}; leases.forEach(l => leaseMap[l.id] = l);

        // Map units to their leases and payments
        const unitLeases = {};
        leases.forEach(l => {
            if (!unitLeases[l.unitId]) unitLeases[l.unitId] = [];
            unitLeases[l.unitId].push(l);
        });

        // Sort units numerically
        units.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));

        // Generate Months Headers
        const months = [];
        if (this.mode === 'calendar') {
            for (let i = 0; i < 12; i++) {
                months.push(new Date(this.selectedYear, i, 1));
            }
        } else {
            // April to March
            for (let i = 4; i <= 15; i++) {
                // Month index > 11 rolls over to next year automatically in JS Date if we set year correctly
                // year, monthIndex (0-11).
                // Actually easier logic:
                // April (3) to Dec (11) of selectedYear
                // Jan (0) to Mar (2) of selectedYear + 1
                const monthIndex = (i - 1) % 12;
                const yearOffset = i > 12 ? 1 : 0;
                months.push(new Date(this.selectedYear + yearOffset, monthIndex, 1));
            }
        }

        const matrixDiv = this.container.querySelector('#rent-matrix');
        // console.log(months);
        let html = `
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <th class="p-3 font-semibold sticky left-0 bg-gray-50 z-10 w-32 border-r border-gray-200">Unit / Tenant</th>
                        ${months.map(m => `<th class="p-3 font-semibold text-center min-w-[80px] border-r border-gray-200">${m.toLocaleString('default', { month: 'short' })}</th>`).join('')}
                        <th class="p-3 font-semibold text-center min-w-[100px] bg-gray-100 sticky right-0 z-10 border-l border-gray-300">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const unit of units) {
            html += `<tr class="border-b border-gray-100 hover:bg-gray-50">`;
            html += `<td class="p-3 font-medium sticky left-0 bg-white z-10 border-r border-gray-200">
                <div class="text-gray-900 font-semibold">Unit ${unit.unitNumber}</div>
            </td>`;

            let rowTotal = 0;

            for (const monthDate of months) {
                const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                const monthPeriod = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;

                // Find active lease for this month to determine expected rent and coloring
                const activeLease = (unitLeases[unit.id] || []).find(l => {
                    return new Date(l.startDate) <= monthEnd &&
                        new Date(l.endDate) >= monthStart;
                });

                // Find all payments for this unit in this month, across ALL its leases
                const unitLeaseIds = (unitLeases[unit.id] || []).map(l => l.id);
                const monthPayments = payments.filter(p => {
                    if (!unitLeaseIds.includes(p.leaseId)) return false;

                    if (p.paymentPeriod) {
                        return p.paymentPeriod === monthPeriod;
                    } else {
                        const pDate = new Date(p.date);
                        return pDate >= monthStart && pDate <= monthEnd;
                    }
                });

                let cellTotal = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                let cellColor = '';
                let cellText = '-';

                if (cellTotal > 0) {
                    cellText = this.formatCurrency(cellTotal);
                    if (activeLease) {
                        if (cellTotal >= activeLease.rentAmount) {
                            cellColor = 'style="background-color: #d1fae5; color: #065f46;"'; // green-100
                        } else {
                            cellColor = 'style="background-color: #fef3c7; color: #92400e;"'; // yellow-100
                        }
                    } else {
                        // Payment exist but no lease defined for this period
                        cellColor = 'style="background-color: #e0f2fe; color: #075985;"'; // blue-100
                    }
                } else if (activeLease) {
                    const now = new Date();
                    if (monthEnd < now) {
                        cellColor = 'style="background-color: #fee2e2; color: #991b1b;"'; // red-100
                        cellText = '₹0';
                    }
                }

                rowTotal += cellTotal;
                html += `<td class="p-3 text-center border-r border-gray-100" ${cellColor}>${cellText}</td>`;
            }

            // Row Total Column
            html += `<td class="p-3 text-center font-bold bg-gray-50 sticky right-0 z-10 text-gray-900 border-l border-gray-300">
                ${rowTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </td>`;

            html += `</tr>`;
        }

        html += `</tbody></table>`;
        matrixDiv.innerHTML = html;
    }

    async renderUnitGrid() {
        const db = await getDB();
        let units = await db.getAll('units');
        const leases = await db.getAll('leases');
        const payments = await db.getAll('payments');

        if (this.selectedBuildingId !== 'all') {
            units = units.filter(u => u.buildingId === parseInt(this.selectedBuildingId));
        }

        const grid = this.container.querySelector('#unit-grid');
        grid.innerHTML = '';

        const statusDate = new Date();
        statusDate.setMonth(statusDate.getMonth() - 1);

        const monthName = statusDate.toLocaleString('default', { month: 'long' });
        const header = this.container.querySelector('#unit-status-header');
        if (header) header.textContent = `Unit Status (${monthName} ${statusDate.getFullYear()})`;

        const currentMonthStart = new Date(statusDate.getFullYear(), statusDate.getMonth(), 1);
        const currentMonthEnd = new Date(statusDate.getFullYear(), statusDate.getMonth() + 1, 0);

        for (const unit of units) {
            let status = 'Vacant';
            let bgColor = '#e5e7eb'; // gray-200
            let textColor = '#374151'; // gray-700

            const activeLease = leases.find(l => {
                return l.unitId === unit.id &&
                    new Date(l.startDate) <= currentMonthEnd &&
                    new Date(l.endDate) >= currentMonthStart;
            });

            if (activeLease) {
                // Use payment period to determine if rent for the specific status month is paid
                const currentPeriod = `${statusDate.getFullYear()}-${String(statusDate.getMonth() + 1).padStart(2, '0')}-01`;

                const leasePayments = payments.filter(p => {
                    // Check if payment is for current month using paymentPeriod
                    // Fall back to date-based filtering for old records without paymentPeriod
                    if (p.paymentPeriod) {
                        return p.leaseId === activeLease.id && p.paymentPeriod === currentPeriod;
                    } else {
                        const pDate = new Date(p.date);
                        return p.leaseId === activeLease.id && pDate >= currentMonthStart && pDate <= currentMonthEnd;
                    }
                });

                const totalPaid = leasePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

                if (totalPaid >= activeLease.rentAmount) {
                    status = 'Paid';
                    bgColor = '#10b981'; // emerald-500
                    textColor = '#ffffff';
                } else if (totalPaid > 0) {
                    status = 'Partial';
                    bgColor = '#eab308'; // yellow-500
                    textColor = '#ffffff';
                } else {
                    status = 'Overdue';
                    bgColor = '#ef4444'; // red-500
                    textColor = '#ffffff';
                }
            }

            const unitEl = document.createElement('div');
            unitEl.className = 'flex flex-col items-center justify-center rounded-lg shadow-sm cursor-pointer transition transform hover:scale-105 aspect-square';
            unitEl.style.backgroundColor = bgColor;
            unitEl.style.color = textColor;
            unitEl.innerHTML = `
            <span class="text-sm font-bold">${status}</span>
            <span class="text-xs font-semibold">#${unit.unitNumber}</span>
        `;
            grid.appendChild(unitEl);
        }
    }

    formatCurrency(val) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(val);
    }
}
