import React, { useEffect, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchEmployees, clearMessages, deleteEmployee } from '../store/slices/farmvest/employees';
import AddEmployeeModal from './AddEmployee/AddEmployeeModal';

import DeleteEmployeeModal from './DeleteEmployeeModal';
import Snackbar from '../components/common/Snackbar';
import { Trash2 } from 'lucide-react';



import { useTableSortAndSearch } from '../hooks/useTableSortAndSearch';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import './Employees.css';

const Employees: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null);
    const [selectedRole, setSelectedRole] = useState('');

    const {
        employees,
        loading: employeesLoading,
        error,
        successMessage,
        deleteLoading
    } = useAppSelector((state: RootState) => state.farmvestEmployees);

    const handleAddEmployee = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((employee: any) => {
        setSelectedEmployee(employee);
        setIsDeleteModalOpen(true);
    }, []);

    const handleNameClick = useCallback((employee: any) => {
        navigate(`/farmvest/employees/${employee.id}`);
    }, [navigate]);

    const handleConfirmDelete = async () => {
        if (!selectedEmployee) return;
        const result = await dispatch(deleteEmployee(selectedEmployee.id));
        if (deleteEmployee.fulfilled.match(result)) {
            setIsDeleteModalOpen(false);
            setSelectedEmployee(null);
        }
    };




    // URL Search Params for Pagination
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = 15;

    // Search State
    const [searchTerm, setSearchTerm] = React.useState('');

    useEffect(() => {
        dispatch(fetchEmployees(selectedRole));
    }, [dispatch, selectedRole]);

    const setCurrentPage = useCallback((page: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', String(page));
            return newParams;
        });
    }, [setSearchParams]);

    // Custom Search Function
    const searchFn = useCallback((item: any, query: string) => {
        const lowerQuery = query.toLowerCase();
        const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
        const email = (item.email || '').toLowerCase();
        const phone = item.phone_number || '';

        return (
            fullName.includes(lowerQuery) ||
            email.includes(lowerQuery) ||
            phone.includes(lowerQuery)
        );
    }, []);

    const {
        filteredData: filteredEmployees,
        requestSort,
        sortConfig,
        searchQuery: activeSearchQuery,
        setSearchQuery
    } = useTableSortAndSearch(employees, { key: '', direction: 'asc' }, searchFn);

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== activeSearchQuery) {
                setSearchQuery(searchTerm);
                if (currentPage !== 1) {
                    setCurrentPage(1);
                }
            }
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, activeSearchQuery, setSearchQuery, currentPage, setCurrentPage]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="employees-container">
            <div className="employees-header p-4 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">FarmVest Investors</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage all investors ({employees.length} total)</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={handleAddEmployee}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md whitespace-nowrap"
                    >
                        <span className="text-xl leading-none">+</span>
                        Add Employee
                    </button>
                    {/* Role Filter */}
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        style={{ height: '42px' }}
                    >
                        <option value="">All Roles</option>
                        <option value="FARM_MANAGER">Farm Manager</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="DOCTOR">Doctor</option>
                        <option value="ASSISTANT_DOCTOR">Assistant Doctor</option>
                        <option value="ADMIN">Admin</option>
                    </select>

                    {/* Search Input */}
                    <div className="w-full md:w-auto relative">
                        <input
                            type="text"
                            placeholder="Search by Name, Email, Phone..."
                            className="w-full md:w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="employees-content p-4">

                <div className="table-container relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="employees-table w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-center">S.No</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('first_name')}>Name {getSortIcon('first_name')}</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('email')}>Email {getSortIcon('email')}</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('phone_number')}>Phone {getSortIcon('phone_number')}</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('total_investment')}>Investment {getSortIcon('total_investment')}</th>
                                <th className="px-4 py-3 text-center cursor-pointer" onClick={() => requestSort('active_status')}>Status {getSortIcon('active_status')}</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {employeesLoading ? (
                                <TableSkeleton cols={6} rows={10} />
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No investors found</td>
                                </tr>
                            ) : (
                                currentItems.map((employee: any, index: number) => (
                                    <tr key={employee.id || index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td
                                            className="px-4 py-3 font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                            onClick={() => handleNameClick(employee)}
                                        >
                                            {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {employee.email || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {employee.phone_number || '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-green-600">
                                            {/* Format as currency if needed, assuming simple number for now or INR */}
                                            {employee.total_investment ? `₹${employee.total_investment.toLocaleString()}` : '₹0'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${employee.active_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {employee.active_status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(employee);
                                                }}
                                                title="Delete Investor"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>

                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
            {/* Specialized Add Employee Modal */}
            <AddEmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />



            {/* Delete Employee Modal */}
            <DeleteEmployeeModal
                isOpen={isDeleteModalOpen}
                loading={deleteLoading}
                employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
                employeeRole={selectedEmployee?.roles?.[0] || 'Employee'}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />


            {/* Notifications */}
            <Snackbar
                message={successMessage || error}
                type={successMessage ? 'success' : error ? 'error' : null}
                onClose={() => dispatch(clearMessages())}
            />
        </div>
    );
};


export default Employees;
