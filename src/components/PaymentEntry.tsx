import { Search, Edit, Trash2 } from 'lucide-react';

export function PaymentEntry() {
  const paymentHistory = [
    { date: '1/1/2026', tenant: 'Tenant1', unit: 'Unit 101', amount: '₹5500', method: 'scheduled', notes: 'Auto-generated monthly payment', created: '3 Jan 2026, 6:02 pm' },
    { date: '1/1/2026', tenant: 'Tenant 2', unit: 'Unit 102', amount: '₹5700', method: 'scheduled', notes: 'Auto-generated monthly payment', created: '3 Jan 2026, 6:02 pm' },
    { date: '1/1/2026', tenant: 'Tenant 3', unit: 'Unit 103', amount: '₹7500', method: 'scheduled', notes: 'Auto-generated monthly payment', created: '3 Jan 2026, 6:02 pm' },
    { date: '1/1/2026', tenant: 'Tenant Four', unit: 'Unit 104', amount: '₹7500', method: 'scheduled', notes: 'Auto-generated monthly payment', created: '3 Jan 2026, 6:02 pm' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg mb-6">Record Rent Payment</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Date Received *</label>
            <input 
              type="date" 
              defaultValue="2026-01-04"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-2">Tenant *</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
              <option>Select Tenant...</option>
              <option>Tenant 1</option>
              <option>Tenant 2</option>
              <option>Tenant 3</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Lease Details</div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-gray-700">Unit --</span>
            <span className="text-base md:text-lg">₹0.00 / month</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 mt-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Amount (₹) *</label>
            <input 
              type="number" 
              placeholder="0.00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-2">Payment Method</label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Cheque</option>
              <option>UPI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Notes</label>
            <textarea 
              placeholder="Reference number, comments..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Record Payment
          </button>
          <button className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel Edit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h2 className="text-lg mb-4">Payment History</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <select className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Show 50</option>
            <option>Show 100</option>
            <option>Show 250</option>
          </select>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Type a keyword..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Date</th>
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Tenant</th>
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Unit</th>
                    <th className="text-right py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Amount</th>
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Method</th>
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 hidden lg:table-cell">Notes</th>
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 hidden xl:table-cell">Created</th>
                    <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm whitespace-nowrap">{payment.date}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-blue-600 text-sm whitespace-nowrap">{payment.tenant}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm whitespace-nowrap">{payment.unit}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-right text-sm whitespace-nowrap">{payment.amount}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm whitespace-nowrap">{payment.method}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 text-xs md:text-sm hidden lg:table-cell">{payment.notes}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 hidden xl:table-cell whitespace-nowrap">{payment.created}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <button className="px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs md:text-sm">
                            Edit
                          </button>
                          <button className="px-2 md:px-3 py-1 md:py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors text-xs md:text-sm">
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}