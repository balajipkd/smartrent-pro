import { getDB } from '../db/database.js';

export class Dashboard {
    constructor(container) {
        this.container = container;
        this.mode = 'financial'; // 'calendar' or 'financial'
        // Default to current date's relevant year
        const now = new Date();
        this.currentDate = now;
        this.selectedYear = now.getFullYear();
        // If financial year and we are in Jan-Mar, the financial year started in prev year (e.g. Mar 2024 is FY 2023-2024)
        if (this.mode === 'financial' && now.getMonth() < 3) {
            this.selectedYear--;
        }

        this.render();
    }

    async render() {
        this.container.innerHTML = `
      <div class="card mb-4">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl">Financial Overview</h2>
            <div class="flex gap-2 bg-gray-700 p-1 rounded">
                <button id="toggle-calendar" class="btn ${this.mode === 'calendar' ? 'btn-primary' : ''}">Calendar Year</button>
                <button id="toggle-financial" class="btn ${this.mode === 'financial' ? 'btn-primary' : ''}">Financial Year (Apr-Mar)</button>
            </div>
        </div>
        
        <div class="flex justify-between items-center mb-4">
            <button id="prev-year" class="btn">&lt;</button>
            <span class="text-xl" id="year-display">${this.getYearDisplay()}</span>
            <button id="next-year" class="btn">&gt;</button>
        </div>

        <div class="grid-stats flex gap-4" style="display: grid; grid-template-columns: repeat(3, 1fr);">
            <div class="stat-box p-4 rounded bg-slate-800 border border-slate-600">
                <div class="text-sm text-gray-400">Gross Revenue</div>
                <div class="text-2xl text-green-400" id="gross-revenue">₹0.00</div>
            </div>
            <div class="stat-box p-4 rounded bg-slate-800 border border-slate-600">
                <div class="text-sm text-gray-400">Total Maintenance</div>
                <div class="text-2xl text-red-400" id="total-maintenance">₹0.00</div>
            </div>
            <div class="stat-box p-4 rounded bg-slate-800 border border-slate-600">
                <div class="text-sm text-gray-400">Net Profit</div>
                <div class="text-2xl text-blue-400" id="net-profit">₹0.00</div>
            </div>
        </div>
      </div>

      <div class="card mb-4 overflow-x-auto">
        <h2 class="text-xl mb-4" id="matrix-title">Rent Payment Matrix</h2>
        <div id="rent-matrix">Loading Matrix...</div>
      </div>

      <div class="card">
        <h2 class="text-xl mb-4">Unit Status (Current Month)</h2>
        <div id="unit-grid" class="flex flex-wrap gap-4">
            Loading...
        </div>
        <div class="flex gap-4 mt-4 text-sm text-gray-400">
            <span class="flex items-center gap-1"><span style="color:var(--success)">●</span> Paid</span>
            <span class="flex items-center gap-1"><span style="color:var(--warning)">●</span> Partial</span>
            <span class="flex items-center gap-1"><span style="color:var(--danger)">●</span> Overdue</span>
            <span class="flex items-center gap-1"><span style="color:var(--info)">●</span> Vacant</span>
        </div>
      </div>
    `;

        // Bind events
        this.container.querySelector('#toggle-calendar').addEventListener('click', () => this.setMode('calendar'));
        this.container.querySelector('#toggle-financial').addEventListener('click', () => this.setMode('financial'));
        this.container.querySelector('#prev-year').addEventListener('click', () => this.changeYear(-1));
        this.container.querySelector('#next-year').addEventListener('click', () => this.changeYear(1));

        await this.calculateStats();
        await this.renderRentMatrix();
        await this.renderUnitGrid();
    }

    setMode(mode) {
        this.mode = mode;
        this.render();
    }

    changeYear(delta) {
        this.selectedYear += delta;
        this.container.querySelector('#year-display').textContent = this.getYearDisplay();
        this.calculateStats();
        this.renderRentMatrix();
    }

    getYearDisplay() {
        return this.mode === 'calendar' ? `${this.selectedYear}` : `FY ${this.selectedYear}-${this.selectedYear + 1}`;
    }

    async calculateStats() {
        const db = await getDB();
        const payments = await db.getAll('payments'); // Revenue
        const expenses = await db.getAll('expenses'); // Maintenance

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
            if (d >= startDate && d <= endDate) gross += parseFloat(p.amount || 0);
        });

        expenses.forEach(e => {
            const d = new Date(e.date);
            if (d >= startDate && d <= endDate) maint += parseFloat(e.amount || 0);
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
        const units = await db.getAll('units');
        const leases = await db.getAll('leases');
        const payments = await db.getAll('payments');
        const tenants = await db.getAll('tenants');

        const tenantMap = {}; tenants.forEach(t => tenantMap[t.id] = t);

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

        // Build Table
        let html = `
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-slate-800 text-gray-300">
                        <th class="p-2 border border-slate-600 sticky left-0 bg-slate-800 z-10 w-32">Unit / Tenant</th>
                        ${months.map(m => `<th class="p-2 border border-slate-600 text-center min-w-[80px]">${m.toLocaleString('default', { month: 'short' })}</th>`).join('')}
                        <th class="p-2 border border-slate-600 text-center font-bold min-w-[100px] bg-slate-900 sticky right-0 z-10">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const unit of units) {
            html += `<tr>`;

            // Row Header
            html += `<td class="p-2 border border-slate-700 font-semibold sticky left-0 bg-slate-900 z-10">
                <div class="text-white">Unit ${unit.unitNumber}</div>
            </td>`;

            let rowTotal = 0;

            for (const monthDate of months) {
                // Define range for this month
                const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

                // Find Lease active in this month
                const activeLease = leases.find(l => {
                    if (l.unitId !== unit.id) return false;
                    const lStart = new Date(l.startDate);
                    const lEnd = new Date(l.endDate);
                    return lStart <= endOfMonth && lEnd >= startOfMonth;
                });

                // Calculate Payments
                let cellTotal = 0;
                let cellColor = 'style="background-color: rgba(30, 41, 59, 0.4);"';
                let cellText = '-';

                if (activeLease) {
                    const monthPayments = payments.filter(p => {
                        if (p.leaseId !== activeLease.id) return false;
                        const pDate = new Date(p.date);
                        return pDate >= startOfMonth && pDate <= endOfMonth;
                    });

                    cellTotal = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                    rowTotal += cellTotal;

                    if (cellTotal > 0) {
                        cellText = Math.round(cellTotal).toLocaleString('en-IN');
                        if (Math.abs(cellTotal - activeLease.rentAmount) < 1) {
                            // Green
                            cellColor = 'style="background-color: rgba(20, 83, 45, 0.8); color: #4ade80; border: 1px solid #166534;"';
                        } else {
                            // Yellow
                            cellColor = 'style="background-color: rgba(133, 77, 14, 0.8); color: #facc15; border: 1px solid #a16207;"';
                        }
                    } else {
                        // Due logic
                        const today = new Date();
                        if (endOfMonth < today) {
                            // Red
                            cellColor = 'style="background-color: rgba(127, 29, 29, 0.6); color: #f87171; border: 1px solid #7f1d1d;"';
                            cellText = '0';
                        }
                    }
                }

                html += `<td class="p-2 border border-slate-700 text-center" ${cellColor}>${cellText}</td>`;
            }

            // Row Total Column
            html += `<td class="p-2 border border-slate-700 text-center font-bold bg-slate-900 sticky right-0 z-10 text-white">
                ${rowTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </td>`;

            html += `</tr>`;
        }

        html += `</tbody></table>`;
        matrixDiv.innerHTML = html;
    }

    async renderUnitGrid() {
        const db = await getDB();
        const units = await db.getAll('units');
        const leases = await db.getAll('leases');
        const payments = await db.getAll('payments');

        const grid = this.container.querySelector('#unit-grid');
        grid.innerHTML = '';

        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        for (const unit of units) {
            let status = 'Vacant'; // Blue
            let color = 'var(--info)';

            // Find active lease
            // Simple check: start <= now <= end
            // For MVP we just iterate.
            const activeLease = leases.find(l => {
                return l.unitId === unit.id &&
                    new Date(l.startDate) <= today &&
                    new Date(l.endDate) >= today;
            });

            if (activeLease) {
                // Check payments for this month
                // Filter payments for this lease within current month
                const leasePayments = payments.filter(p => {
                    const pDate = new Date(p.date);
                    return p.leaseId === activeLease.id && pDate >= currentMonthStart && pDate <= currentMonthEnd;
                });

                const totalPaid = leasePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

                if (totalPaid >= activeLease.rentAmount) {
                    status = 'Paid';
                    color = 'var(--success)';
                } else if (totalPaid > 0) {
                    status = 'Partial';
                    color = 'var(--warning)';
                } else {
                    status = 'Overdue';
                    color = 'var(--danger)';
                }
            } else {
                // Check if specifically marked Occupied but no lease (data inconsistency or manual status)
                if (unit.status === 'Occupied' && !activeLease) {
                    // Fallback
                }
            }

            const unitEl = document.createElement('div');
            unitEl.className = 'flex flex-col items-center justify-center w-24 h-24 rounded shadow cursor-pointer transition transform hover:scale-105';
            unitEl.style.backgroundColor = color;
            unitEl.style.color = '#fff';
            unitEl.innerHTML = `
            <span class="text-lg font-bold">#${unit.unitNumber}</span>
            <span class="text-xs">${status}</span>
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
