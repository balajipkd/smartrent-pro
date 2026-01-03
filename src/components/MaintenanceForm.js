import { getDB } from '../db/database.js';

export class MaintenanceForm {
  constructor(container) {
    this.container = container;
    this.render();
  }

  async render() {
    this.container.innerHTML = `
      <div class="card">
        <h2 class="text-xl mb-4">New Maintenance Entry</h2>
        <form id="maintenance-form" class="flex flex-col gap-4">
          
          <div class="flex flex-col">
            <label for="date">Date *</label>
            <input type="date" id="date" name="date" required />
          </div>

          <div class="flex flex-col">
            <label for="category">Category *</label>
            <select id="category" name="category" required>
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
            <select id="linkTarget" name="linkTarget" required>
              <option value="">Loading...</option>
            </select>
          </div>

          <div class="flex flex-col">
            <label for="amount">Amount (₹) *</label>
            <input type="number" id="amount" name="amount" min="0" step="0.01" required placeholder="0.00" />
          </div>

          <div class="flex flex-col">
            <label for="vendor">Vendor Info</label>
            <input type="text" id="vendor" name="vendor" placeholder="Name / Contact" />
          </div>

          <div class="flex flex-col">
            <label for="status">Status</label>
            <select id="status" name="status">
              <option value="Pending Quote">Pending Quote</option>
              <option value="Work in Progress">Work in Progress</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div class="flex flex-col">
            <label for="receipt">Receipt Upload</label>
            <input type="file" id="receipt" name="receipt" accept="image/*,.pdf" />
          </div>

          <div class="flex flex-col">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" rows="3" placeholder="Description of work done..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary mt-4">Save Expense</button>
        </form>
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

    await this.loadTargets();
  }

  async loadTargets() {
    const type = this.form.querySelector('input[name="linkType"]:checked').value;
    const db = await getDB();

    this.linkTargetSelect.innerHTML = '<option value="">Select...</option>';

    if (type === 'unit') {
      const units = await db.getAll('units');
      // In a real app we would join with buildings to get names, but for MVP just show Unit Number
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

  async handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.form);
    const db = await getDB();

    const receiptFile = formData.get('receipt');
    let receiptData = null;

    if (receiptFile && receiptFile.size > 0) {
      // Convert to Base64 for storing in IndexedDB (simple approach for MVP)
      receiptData = await this.fileToBase64(receiptFile);
    }

    const expense = {
      date: formData.get('date'),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      vendor: formData.get('vendor'),
      status: formData.get('status'),
      receiptImage: receiptData,
      notes: formData.get('notes'),
      // Linking logic
      linkType: formData.get('linkType'),
      linkTargetId: formData.get('linkTarget') // Can be unitId or buildingId
    };

    // If linked to unit, verify it exists. If building, we might store buildingId differently or just link generic.
    // For MVP, we'll store linkTargetId and handle filtering later.
    // Schema said `unitId`, let's generalize or map.
    if (expense.linkType === 'unit') {
      expense.unitId = parseInt(expense.linkTargetId);
    } else {
      expense.buildingId = parseInt(expense.linkTargetId);
    }

    try {
      await db.add('expenses', expense);
      alert('Expense Saved Successfully!');
      this.form.reset();
      this.dateInput.valueAsDate = new Date(); // Reset date
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
