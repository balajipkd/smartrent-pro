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

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div class="text-sm font-medium text-blue-600 mb-1">Gross Revenue</div>
                <div class="text-2xl font-bold text-blue-900" id="gross-revenue">₹0.00</div>
            </div>
            <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div class="text-sm font-medium text-indigo-600 mb-1">Bank Transfer</div>
                <div class="text-2xl font-bold text-indigo-900" id="bank-transfer-total">₹0.00</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div class="text-sm font-medium text-purple-600 mb-1">Other Methods</div>
                <div class="text-2xl font-bold text-purple-900" id="other-methods-total">₹0.00</div>
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

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6" id="timeline-title">Tenant Occupancy Timeline</h2>
        <div id="tenant-timeline" class="overflow-x-auto">
            Loading Timeline...
        </div>
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
        await this.renderTenantTimeline();
    }

    async updateDashboard() {
        await this.calculateStats();
        await this.renderRentMatrix();
        await this.renderUnitGrid();
        await this.renderTenantTimeline();
    }

    async loadBuildings() {
        const db = await getDB();
        const buildings = await db.getAll('buildings');
        const filter = this.container.querySelector('#building-filter');

        let defaultBuildingId = null;

        buildings.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.name;
            filter.appendChild(opt);

            if (b.showWhenDashboardIsLoaded) {
                defaultBuildingId = b.id;
            }
        });

        // Only auto-select if we are in the initial 'all' state and a default exists
        if (this.selectedBuildingId === 'all' && defaultBuildingId) {
            this.selectedBuildingId = defaultBuildingId;
        }

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
        let bankTotal = 0;
        let otherTotal = 0;
        let maint = 0;

        payments.forEach(p => {
            // Priority: paymentPeriod (e.g. 2024-01-01), fallback: date
            const effectiveDate = p.paymentPeriod ? new Date(p.paymentPeriod) : new Date(p.date);

            if (effectiveDate >= startDate && effectiveDate <= endDate) {
                const amount = parseFloat(p.amount || 0);
                let matchesBuilding = false;

                if (this.selectedBuildingId === 'all') {
                    matchesBuilding = true;
                } else {
                    const lease = leaseMap[p.leaseId];
                    const unit = lease ? unitMap[lease.unitId] : null;
                    if (unit && unit.buildingId === parseInt(this.selectedBuildingId)) {
                        matchesBuilding = true;
                    }
                }

                if (matchesBuilding) {
                    gross += amount;
                    if (p.type === 'Bank Transfer') {
                        bankTotal += amount;
                    } else {
                        otherTotal += amount;
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
        this.container.querySelector('#bank-transfer-total').textContent = this.formatCurrency(bankTotal);
        this.container.querySelector('#other-methods-total').textContent = this.formatCurrency(otherTotal);
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
                    // Find tenant name for display from payments
                    let rawTenantName = 'Unknown';
                    if (monthPayments.length > 0) {
                        const lease = leaseMap[monthPayments[monthPayments.length - 1].leaseId];
                        if (lease && tenantMap[lease.tenantId]) {
                            rawTenantName = tenantMap[lease.tenantId].name;
                        }
                    }

                    // Aggressively shorten if it starts with unit info
                    let displayName = rawTenantName;
                    const unitPrefixes = [unit.unitNumber, `Unit ${unit.unitNumber}`];
                    for (const prefix of unitPrefixes) {
                        if (displayName.startsWith(prefix)) {
                            displayName = displayName.substring(prefix.length)
                                .replace(/^[\s-]+/, '') // Remove leading spaces and -
                                .split(' ')[0]; // Keep only first word
                            break;
                        }
                    }

                    // Append payment method suffix
                    if (monthPayments.length > 0) {
                        const type = monthPayments[monthPayments.length - 1].type || '';
                        if (type.startsWith('Bank')) {
                            // displayName += '';
                        } else {
                            displayName += ` <span class="text-red-600 font-medium">-Cash</span>`;
                        }
                    }

                    cellText = `
                        <div class="font-bold">${this.formatCurrency(cellTotal)}</div>
                        <div class="text-[9px] leading-tight truncate px-0.5 opacity-80" title="${rawTenantName}">${displayName}</div>
                    `;

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
        const tenants = await db.getAll('tenants');

        if (this.selectedBuildingId !== 'all') {
            units = units.filter(u => u.buildingId === parseInt(this.selectedBuildingId));
        }

        const tenantMap = {}; tenants.forEach(t => tenantMap[t.id] = t);
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
            let occupantInfo = '';

            const activeLease = leases.find(l => {
                return l.unitId === unit.id &&
                    new Date(l.startDate) <= currentMonthEnd &&
                    new Date(l.endDate) >= currentMonthStart;
            });

            if (activeLease) {
                const tenant = tenantMap[activeLease.tenantId];
                const startDateStr = new Date(activeLease.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                occupantInfo = `
                    <div class="text-[12px] truncate w-full px-1 mt-1  font-medium" title="${tenant ? tenant.name : 'Unknown'}">${tenant ? tenant.name : 'Unknown'}</div>
                    <div class="text-[9px] opacity-75">Since ${startDateStr}</div>
                `;

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

                    // Get latest payment info for display
                    const lastPayment = [...leasePayments].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                    if (lastPayment) {
                        const pDate = new Date(lastPayment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        const pAmount = this.formatCurrency(totalPaid);
                        occupantInfo += `
                            <div class="text-[10px] font-bold mt-1 shadow-sm px-1 rounded bg-black/10 inline-block">${pAmount}</div>
                            <div class="text-[9px] opacity-90 italic">Paid on ${pDate}</div>
                        `;
                    }
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
            unitEl.className = 'flex flex-col items-center justify-center rounded-lg shadow-sm cursor-pointer transition transform hover:scale-105 aspect-square p-1 text-center';
            unitEl.style.backgroundColor = bgColor;
            unitEl.style.color = textColor;
            unitEl.innerHTML = `
                
                ${occupantInfo}
                <span class="text-xs font-semibold">#${status}</span>

            `;
            grid.appendChild(unitEl);
        }
    }

    async renderTenantTimeline() {
        const titleEl = this.container.querySelector('#timeline-title');
        if (titleEl) titleEl.textContent = `Tenant Occupancy Timeline (${this.getYearDisplay()})`;

        const db = await getDB();
        let units = await db.getAll('units');
        const leases = await db.getAll('leases');
        const tenants = await db.getAll('tenants');

        if (this.selectedBuildingId !== 'all') {
            units = units.filter(u => u.buildingId === parseInt(this.selectedBuildingId));
        }

        const tenantMap = {}; tenants.forEach(t => tenantMap[t.id] = t);
        units.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));

        let startDate, endDate;
        const months = [];
        if (this.mode === 'calendar') {
            startDate = new Date(this.selectedYear, 0, 1);
            endDate = new Date(this.selectedYear, 11, 31, 23, 59, 59);
            for (let i = 0; i < 12; i++) months.push(new Date(this.selectedYear, i, 1));
        } else {
            startDate = new Date(this.selectedYear, 3, 1);
            endDate = new Date(this.selectedYear + 1, 2, 31, 23, 59, 59);
            for (let i = 4; i <= 15; i++) {
                const monthIndex = (i - 1) % 12;
                const yearOffset = i > 12 ? 1 : 0;
                months.push(new Date(this.selectedYear + yearOffset, monthIndex, 1));
            }
        }

        const timelineContainer = this.container.querySelector('#tenant-timeline');
        const totalDuration = endDate - startDate;

        let html = `
            <div class="min-w-[800px]">
                <!-- Header: Months -->
                <div class="flex border-b border-gray-200">
                    <div class="w-32 flex-shrink-0 p-3 font-semibold text-gray-600 text-sm">Unit</div>
                    <div class="flex-grow flex relative h-10">
                        ${months.map(m => `
                            <div class="flex-1 border-l border-gray-100 text-[10px] text-gray-400 p-1 flex items-end justify-center">
                                ${m.toLocaleString('default', { month: 'short' })}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Rows: Units -->
                <div class="flex flex-col">
                    ${units.map(unit => {
            const unitLeases = leases.filter(l => l.unitId === unit.id &&
                new Date(l.startDate) <= endDate && new Date(l.endDate) >= startDate);

            return `
                            <div class="flex items-center border-b border-gray-50 group hover:bg-gray-50/50">
                                <div class="w-32 flex-shrink-0 p-3 text-sm font-medium text-gray-700">Unit ${unit.unitNumber}</div>
                                <div class="flex-grow relative h-12 py-2">
                                    <!-- Month grid lines -->
                                    <div class="absolute inset-0 flex pointer-events-none">
                                        ${months.map(() => `<div class="flex-1 border-l border-gray-50"></div>`).join('')}
                                    </div>
                                    
                                    <!-- Lease Bars -->
                                    ${unitLeases.map((l, idx) => {
                const lStart = Math.max(new Date(l.startDate), startDate);
                const lEnd = Math.min(new Date(l.endDate), endDate);
                const left = ((lStart - startDate) / totalDuration) * 100;
                const width = ((lEnd - lStart) / totalDuration) * 100;
                const tenant = tenantMap[l.tenantId];
                const colors = [
                    'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500',
                    'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'
                ];
                const colorClass = colors[idx % colors.length];

                return `
                                            <div class="absolute h-8 rounded-md ${colorClass} text-white text-[10px] flex items-center px-2 cursor-help shadow-sm transition-transform hover:scale-[1.02]"
                                                 style="left: ${left}%; width: ${width}%; top: 8px; min-width: 40px;"
                                                 title="${tenant ? tenant.name : 'Unknown'} (${l.startDate} to ${l.endDate})">
                                                <span class="truncate">${tenant ? tenant.name : 'Unknown'}</span>
                                            </div>
                                        `;
            }).join('')}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        timelineContainer.innerHTML = html;
    }

    formatCurrency(val) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    }
}
