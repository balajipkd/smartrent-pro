import { Search, Edit, Trash2 } from 'lucide-react';

export function ManageData() {
  const tenants = [
    { name: 'Tenant1', contact: '111111', created: '3 Jan 2026, 5:31 pm' },
    { name: 'Tenant 2', contact: '22222', created: '3 Jan 2026, 5:31 pm' },
    { name: 'Tenant 3', contact: '33333', created: '3 Jan 2026, 5:31 pm' },
    { name: 'Tenant Four', contact: 'tenant4@example.com', created: '3 Jan 2026, 5:37 pm' },
    { name: 'Tenant Five', contact: 'tenant5@example.com', created: '3 Jan 2026, 5:37 pm' },
    { name: 'Tenant Six', contact: 'tenant6@example.com', created: '3 Jan 2026, 5:37 pm' },
    { name: 'Tenant Seven', contact: 'tenant7@example.com', created: '3 Jan 2026, 5:37 pm' },
    { name: 'Tenant Eight', contact: 'tenant8@example.com', created: '3 Jan 2026, 5:37 pm' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <h2 className="text-lg mb-4">Manage Property Data</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button className="px-3 md:px-4 py-2 bg-white text-gray-900 border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Buildings
          </button>
          <button className="px-3 md:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Units
          </button>
          <button className="px-3 md:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Tenants
          </button>
          <button className="px-3 md:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Leases
          </button>
        </div>

        <h3 className="mb-4">Add New Tenant</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Full Name"
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input 
            type="text" 
            placeholder="Phone / Email"
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Add
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
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
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Name</th>
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Contact</th>
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell whitespace-nowrap">Created</th>
                    <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm whitespace-nowrap">{tenant.name}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-blue-600 text-sm whitespace-nowrap">{tenant.contact}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell whitespace-nowrap">{tenant.created}</td>
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 text-sm text-gray-600">
          <div>Showing 1 to 8 of 8 results</div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs md:text-sm">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs md:text-sm">
              1
            </button>
            <button className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs md:text-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}