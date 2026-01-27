import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { userService } from '../services/api';
import { User } from '../types';
import AddUserModal from './modals/AddUserModal';
import { useTableSortAndSearch } from '../hooks/useTableSortAndSearch';
import './ReferralsTab.css';

const ReferralsTab: React.FC = () => {
  const [referrals, setReferrals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    filteredData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    requestSort,
  } = useTableSortAndSearch(referrals, { key: '', direction: 'asc' }, (item, query) => {
    const lowerQuery = query.toLowerCase();
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim().toLowerCase();
    return (
      fullName.includes(lowerQuery) ||
      (item.mobile || '').includes(lowerQuery)
    );
  });

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 inline-block ml-1" />
      : <ArrowDown className="w-4 h-4 inline-block ml-1" />;
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const referralsData = await userService.getReferrals();
      setReferrals(referralsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch referrals');
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (mobile: string) => {
    try {
      await userService.verifyUser(mobile);
      fetchReferrals(); // Refresh the list
    } catch (err) {
      console.error('Error verifying user:', err);
    }
  };

  const handleUserAdded = () => {
    fetchReferrals(); // Refresh the list when a new user is added
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading referrals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={fetchReferrals}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">New Referrals</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={fetchReferrals}
            className="refresh-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      {/* <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-gray-300 rounded-md w-full max-w-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div> */}

      {filteredData.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="mb-4">
            <Plus className="w-12 h-12 mx-auto text-gray-300" />
          </div>
          <div className="text-lg font-medium mb-2">
            {referrals.length === 0 ? "No referrals found" : "No matching referrals"}
          </div>
          {referrals.length === 0 && (
            <>
              <div className="text-sm mb-4">Start by adding your first referral user</div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                Add First User
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto flex justify-center">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => requestSort('first_name')}
                >
                  <div className="flex items-center justify-center">
                    Name
                    {getSortIcon('first_name')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => requestSort('mobile')}
                >
                  <div className="flex items-center justify-center">
                    Mobile
                    {getSortIcon('mobile')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  onClick={() => requestSort('verified')}
                >
                  <div className="flex items-center justify-center">
                    Status
                    {getSortIcon('verified')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {user.mobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {user.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {!user.verified && (
                      <button
                        onClick={() => handleVerifyUser(user.mobile)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUserAdded}
      />
    </div>
  );
};

export default ReferralsTab;
