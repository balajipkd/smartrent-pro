import { getDB } from '../db/database.js';
import { Grid, html } from 'gridjs';
import "gridjs/dist/theme/mermaid.css";

export class MaintenanceForm {
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
            <h2 class="text-xl mb-4" id="form-title">New Maintenance Entry</h2>
            <form id="maintenance-form" class="flex flex-col gap-4">
            
            <div class="flex flex-col">
                <label for="date">Date *</label>
                <input type="date" id="date" name="date" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
            </div>

            <div class="flex flex-col">
                <label for="category">Category *</label>
                <select id="category" name="category" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white">
                <option value="">Select Category</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Painting">Painting</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Taxes">Taxes</option>
                <option value="Staff Salary">Staff Salary</option>
                <option value="General">General Repairs</option>
                </select>
            </div>

            <div class="flex flex-col">
                <label>Link To *</label>
                <div class="flex gap-4 mb-2">
                <label class="flex items-center gap-2">
                    <input type="radio" name="linkType" value="unit" checked /> Specific Unit
                </label>
                <label class="flex items-center gap-2">
                    <input type="radio" name="linkType" value="building" /> General Building
                </label>
                </div>
                <select id="linkTarget" name="linkTarget" required class="bg-slate-900 border border-slate-600 p-2 rounded text-white">
                <option value="">Loading...</option>
                </select>
            </div>

            <div class="flex flex-col">
                <label for="amount">Amount (₹) *</label>
                <input type="number" id="amount" name="amount" min="0" step="0.01" required placeholder="0.00" class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
            </div>

            <div class="flex flex-col">
                <label for="vendor">Vendor Info</label>
                <input type="text" id="vendor" name="vendor" placeholder="Name / Contact" class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
            </div>

            <div class="flex flex-col">
                <label for="status">Status</label>
                <select id="status" name="status" class="bg-slate-900 border border-slate-600 p-2 rounded text-white">
                <option value="Pending Quote">Pending Quote</option>
                <option value="Work in Progress">Work in Progress</option>
                <option value="Paid">Paid</option>
                </select>
            </div>

            <div class="flex flex-col">
                <label for="receipt">Receipt Upload</label>
                <input type="file" id="receipt" name="receipt" accept="image/*,.pdf" class="bg-slate-900 border border-slate-600 p-2 rounded text-white" />
                <div id="receipt-preview" class="mt-2 hidden">
                    <span class="text-xs text-gray-400">Current Receipt: <span id="receipt-name">View</span></span>
                </div>
            </div>

            <div class="flex flex-col">
                <label for="notes">Notes</label>
                <textarea id="notes" name="notes" rows="3" placeholder="Description of work done..." class="bg-slate-900 border border-slate-600 p-2 rounded text-white"></textarea>
            </div>

            <div class="flex gap-2 mt-4">
                <button type="submit" class="btn btn-primary flex-1" id="btn-submit">Save Expense</button>
                <button type="button" class="btn btn-cancel hidden" id="btn-cancel">Cancel Edit</button>
            </div>
            </form>
        </div>

        <div class="card">
            <h2 class="text-xl mb-4">Expense History</h2>
            <div id="expense-grid"></div>
        </div>
      </div>
    `;

    // Initialize logic
    this.form = this.container.querySelector('#maintenance-form');
    this.linkTypeRadios = this.form.querySelectorAll('input[name="linkType"]');
    this.linkTargetSelect = this.form.querySelector('#linkTarget');
    this.dateInput = this.form.querySelector('#date');

    // Set default date to today
    this.dateInput.valueAsDate = new Date();

    // Event Listeners
    this.linkTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => this.loadTargets());
    });

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    this.container.querySelector('#btn-cancel').addEventListener('click', () => {
      this.resetForm();
    });

    // Global listener for Grid actions
    this.container.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('btn-delete')) {
        if (confirm('Are you sure you want to delete this expense record?')) {
          const db = await getDB();
          await db.delete('expenses', parseInt(btn.dataset.id));
          this.renderExpenses();
        }
      }

      if (btn.classList.contains('btn-edit')) {
        this.handleEdit(parseInt(btn.dataset.id));
      }
    });

    await this.loadTargets();
    await this.renderExpenses();
  }

  async loadTargets() {
    const type = this.form.querySelector('input[name="linkType"]:checked').value;
    const db = await getDB();

    this.linkTargetSelect.innerHTML = '<option value="">Select...</option>';

    if (type === 'unit') {
      const units = await db.getAll('units');
      units.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
      units.forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = `Unit ${u.unitNumber}`;
        this.linkTargetSelect.appendChild(option);
      });
    } else {
      const buildings = await db.getAll('buildings');
      buildings.forEach(b => {
        const option = document.createElement('option');
        option.value = b.id;
        option.textContent = b.name;
        this.linkTargetSelect.appendChild(option);
      });
    }
  }

  async renderExpenses() {
    const db = await getDB();
    const expenses = await db.getAll('expenses');

    // Sort newest first
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Resolve Names
    const buildings = await db.getAll('buildings');
    const units = await db.getAll('units');
    const buildingMap = {}; buildings.forEach(b => buildingMap[b.id] = b.name);
    const unitMap = {}; units.forEach(u => unitMap[u.id] = `Unit ${u.unitNumber}`);

    const enrichedData = expenses.map(e => {
      let targetName = 'Unknown';
      if (e.linkType === 'unit') targetName = unitMap[e.unitId || e.linkTargetId] || 'Unknown Unit';
      else targetName = buildingMap[e.buildingId || e.linkTargetId] || 'Unknown Building';

      return [
        new Date(e.date).toLocaleDateString('en-IN'),
        e.category,
        targetName,
        e.amount,
        html(`
                <span class="px-2 py-0.5 rounded text-xs border ${e.status === 'Paid' ? 'border-green-800 bg-green-900/30 text-green-400' :
            e.status === 'Work in Progress' ? 'border-blue-800 bg-blue-900/30 text-blue-400' :
              'border-yellow-800 bg-yellow-900/30 text-yellow-400'
          }">${e.status || 'Pending'}</span>
              `),
        html(`
                <div class="flex gap-2 justify-end">
                    <button class="p-1 px-2 text-xs font-medium rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 btn-edit" data-id="${e.id}">Edit</button>
                    <button class="p-1 px-2 text-xs font-medium rounded border border-red-500/30 text-red-400 hover:bg-red-500/20 btn-delete" data-id="${e.id}">Del</button>
                </div>
              `)
      ];
    });

    if (this.gridInstance) {
      this.gridInstance.updateConfig({ data: enrichedData }).forceRender();
    } else {
      // Inject Selector if not exists
      const container = document.getElementById('expense-grid').parentElement;
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
        container.insertBefore(controls, document.getElementById('expense-grid'));
      }

      this.gridInstance = new Grid({
        columns: [
          { name: 'Date', width: '100px' },
          { name: 'Category', width: '100px' },
          { name: 'Target', width: '120px' },
          { name: 'Amount', width: '90px', formatter: (cell) => `₹${cell}` },
          { name: 'Status', width: '110px', sort: false },
          { name: 'Actions', width: '100px', sort: false }
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
      }).render(document.getElementById('expense-grid'));
    }
  }

  async handleEdit(id) {
    const db = await getDB();
    const expense = await db.get('expenses', id);
    this.editingId = id;

    this.container.querySelector('#form-title').textContent = 'Edit Maintenance Entry';
    this.container.querySelector('#btn-submit').textContent = 'Update Expense';
    this.container.querySelector('#btn-cancel').classList.remove('hidden');

    // Populate Form
    this.form.querySelector('#date').value = expense.date;
    this.form.querySelector('#category').value = expense.category;
    this.form.querySelector('#amount').value = expense.amount;
    this.form.querySelector('#vendor').value = expense.vendor || '';
    this.form.querySelector('#status').value = expense.status || 'Pending Quote';
    this.form.querySelector('#notes').value = expense.notes || '';

    // Radio handling
    const radio = this.form.querySelector(`input[name="linkType"][value="${expense.linkType}"]`);
    if (radio) {
      radio.checked = true;
      // Trigger loadTargets but wait for it
      await this.loadTargets();
      // Then set value
      this.linkTargetSelect.value = expense.linkTargetId || expense.unitId || expense.buildingId;
    }

    const preview = this.container.querySelector('#receipt-preview');
    if (expense.receiptImage) {
      preview.classList.remove('hidden');
      preview.querySelector('#receipt-name').textContent = 'Existing Image Loaded';
    } else {
      preview.classList.add('hidden');
    }
  }

  resetForm() {
    this.editingId = null;
    this.form.reset();
    this.dateInput.valueAsDate = new Date();
    this.container.querySelector('#form-title').textContent = 'New Maintenance Entry';
    this.container.querySelector('#btn-submit').textContent = 'Save Expense';
    this.container.querySelector('#btn-cancel').classList.add('hidden');
    this.container.querySelector('#receipt-preview').classList.add('hidden');
    this.loadTargets(); // Reset targets to default 'unit'
  }

  async handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.form);
    const db = await getDB();

    const receiptFile = formData.get('receipt');
    let receiptData = null;

    if (receiptFile && receiptFile.size > 0) {
      receiptData = await this.fileToBase64(receiptFile);
    } else if (this.editingId) {
      // Keep existing image if not replaced
      const original = await db.get('expenses', this.editingId);
      receiptData = original.receiptImage;
    }

    const expense = {
      date: formData.get('date'),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      vendor: formData.get('vendor'),
      status: formData.get('status'),
      receiptImage: receiptData,
      notes: formData.get('notes'),
      linkType: formData.get('linkType'),
      linkTargetId: formData.get('linkTarget')
    };

    if (expense.linkType === 'unit') {
      expense.unitId = parseInt(expense.linkTargetId);
    } else {
      expense.buildingId = parseInt(expense.linkTargetId);
    }

    try {
      if (this.editingId) {
        expense.id = this.editingId;
        await db.put('expenses', expense);
        alert('Expense Updated Successfully!');
        this.resetForm();
      } else {
        await db.add('expenses', expense);
        alert('Expense Saved Successfully!');
        this.form.reset();
        this.dateInput.valueAsDate = new Date();
      }
      this.renderExpenses();
    } catch (err) {
      console.error(err);
      alert('Error saving expense');
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
}
