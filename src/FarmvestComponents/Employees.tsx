import React, { useEffect, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchEmployees, clearMessages, deleteEmployee } from '../store/slices/farmvest/employees';
import AddEmployeeModal from './AddEmployee/AddEmployeeModal';

import DeleteEmployeeModal from './DeleteEmployeeModal';
import Snackbar from '../components/common/Snackbar';
import { Trash2, Search, Users } from 'lucide-react';

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
        totalCount,
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
    const itemsPerPage = 20;

    // Search State
    const [searchTerm, setSearchTerm] = React.useState('');

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

    useEffect(() => {
        dispatch(fetchEmployees({
            role: selectedRole || undefined,
            page: currentPage,
            size: itemsPerPage,
            sort_by: 1
        }));
    }, [dispatch, selectedRole, currentPage]);

    const currentItems = filteredEmployees;
    const totalPages = Math.ceil((totalCount || filteredEmployees.length) / itemsPerPage) || 1;

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            {/* Page Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">FarmVest Employees</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage all employees ({employees.length} visible)</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleAddEmployee}
                            className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                        >
                            <span className="text-lg">+</span> Add Employee
                        </button>

                        <div className="relative">
                            <select
                                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent cursor-pointer min-w-[140px]"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="">All Roles</option>
                                <option value="FARM_MANAGER">Farm Manager</option>
                                <option value="SUPERVISOR">Supervisor</option>
                                <option value="DOCTOR">Doctor</option>
                                <option value="ASSISTANT_DOCTOR">Assistant Doctor</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        <div className="relative flex-1 min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Name, Email, Phone..."
                                className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="mt-8 overflow-hidden rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#f8f9fa]">
                            <tr>
                                <th onClick={() => requestSort('id')} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer">S.No {getSortIcon('id')}</th>
                                <th onClick={() => requestSort('first_name')} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer">Name {getSortIcon('first_name')}</th>
                                <th onClick={() => requestSort('email')} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer">Email {getSortIcon('email')}</th>
                                <th onClick={() => requestSort('phone_number')} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer">Phone {getSortIcon('phone_number')}</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Shed</th>
                                <th onClick={() => requestSort('active_status')} className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer">Status {getSortIcon('active_status')}</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {employeesLoading ? (
                                <tr><td colSpan={8} className="p-4"><TableSkeleton cols={8} rows={5} /></td></tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((employee: any, index: number) => (
                                    <tr key={employee.id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => handleNameClick(employee)}>
                                                {`${employee.first_name || ''} ${employee.last_name || ''}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.email || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.phone_number || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                {employee.roles?.[0]?.replace(/_/g, ' ') || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                            {employee.shed_id || (employee.shed ? employee.shed.shed_id : '-') || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${employee.active_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {employee.active_status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(employee); }}
                                                className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="flex flex-col items-center justify-center py-16 px-4">
                                            <div className="bg-gray-50 rounded-full p-6 mb-4">
                                                <Users size={48} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">No employees added yet</h3>
                                            <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
                                                Start by adding your first employee to manage farms efficiently.
                                            </p>
                                            <button
                                                onClick={handleAddEmployee}
                                                className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 transition-all flex items-center gap-2"
                                            >
                                                <span className="text-lg">+</span> Add Employee
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddEmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <DeleteEmployeeModal
                isOpen={isDeleteModalOpen}
                loading={deleteLoading}
                employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
                employeeRole={selectedEmployee?.roles?.[0] || 'Employee'}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />

            <Snackbar
                message={successMessage || error}
                type={successMessage ? 'success' : error ? 'error' : null}
                onClose={() => dispatch(clearMessages())}
            />
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
    );
};

export default Employees;
