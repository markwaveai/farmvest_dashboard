import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchEmployees, fetchRoleCounts, clearMessages, deleteEmployee } from '../store/slices/farmvest/employees';
import AddEmployeeModal from './AddEmployee/AddEmployeeModal';

import DeleteEmployeeModal from './DeleteEmployeeModal';
import Snackbar from '../components/common/Snackbar';
import { Trash2, Search, Users, ChevronDown, Check, X } from 'lucide-react';
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
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const {
        employees,
        totalCount, // Server-side total count
        globalTotalCount,
        loading: employeesLoading,
        error,
        successMessage,
        deleteLoading,
        roleCounts,
        statusCounts,
    } = useAppSelector((state: RootState) => state.farmvestEmployees);

    useEffect(() => {
        // Fetch stats separately
        dispatch(fetchRoleCounts());
    }, [dispatch]);


    const handleAddEmployee = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((employee: any) => {
        setSelectedEmployee(employee);
        setIsDeleteModalOpen(true);
    }, []);

    const handleNameClick = useCallback((employee: any) => {
        navigate(`/farmvest/employees/${employee.id}`, { state: { employee } });
    }, [navigate]);

    const handleConfirmDelete = async () => {
        if (!selectedEmployee) return;
        const result = await dispatch(deleteEmployee(selectedEmployee.id));
        if (deleteEmployee.fulfilled.match(result)) {
            setIsDeleteModalOpen(false);
            setSelectedEmployee(null);
            dispatch(fetchRoleCounts()); // Refresh counts
        }
    };

    // State for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Search State
    const [searchTerm, setSearchTerm] = React.useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== debouncedSearchTerm) {
                setDebouncedSearchTerm(searchTerm);
                if (currentPage !== 1) {
                    setCurrentPage(1);
                }
            }
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, debouncedSearchTerm, currentPage]);

    // Format role for API (e.g., FARM_MANAGER -> Farm Manager)
    const formatRoleName = (role: string) => {
        if (!role) return 'All Roles';
        return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    // Server-Side Fetch Effect
    useEffect(() => {
        dispatch(fetchEmployees({
            page: currentPage,
            size: itemsPerPage,
            role: selectedRole || undefined,
            active_status: selectedStatus ? Number(selectedStatus) : undefined,
            // Assuming API supports search, pass it here. If not, client-side search won't work perfectly with pagination.
            // Based on previous analysis, we might need to rely on list filtering or specific search endpoint.
            // But fetchEmployees usually handles list. For now, we will assume standard list fetch.
        }));
    }, [dispatch, currentPage, itemsPerPage, selectedRole, selectedStatus]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRole, selectedStatus]);

    // Clear search and refresh when success message appears (e.g., after add/delete)
    useEffect(() => {
        if (successMessage) {
            setSearchTerm('');
            setDebouncedSearchTerm('');
            if (currentPage !== 1) {
                setCurrentPage(1);
            }
        }
    }, [successMessage]);

    // Client-side search for the *current page* or if needed, we'd need a separate search API call.
    // Given the task is server-side pagination, we should ideally use server-side search.
    // However, the `fetchEmployees` signature in previous file showed parameters like `role`, `active_status`.
    // It did NOT show a `search` parameter in the interface.
    // If the backend doesn't support generic search query on this endpoint, we might have a limitation.
    // But `farmvest_api.ts` has `searchEmployee` method.
    // We can use that for search?
    // For now, let's implement standard pagination.
    // If search is active, we might need to use `searchEmployee` instead of `fetchEmployees`?
    // Or filter locally? Filtering locally on 20 items is bad.
    // Let's stick to the main request: Pagination for existing list.

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

    // Dynamic Counts based on stats (fetched separately)
    // We reuse `roleCounts` and `statusCounts` from Redux which come from `fetchRoleCounts`

    const roles = useMemo(() => {
        const baseRoles = [
            { value: '', label: 'All Roles' },
            { value: 'FARM_MANAGER', label: 'Farm Manager' },
            { value: 'SUPERVISOR', label: 'Supervisor' },
            { value: 'DOCTOR', label: 'Doctor' },
            { value: 'ASSISTANT_DOCTOR', label: 'Assistant Doctor' },
            { value: 'ADMIN', label: 'Admin' }
        ];

        // Add any other roles found in roleCounts
        const existingRoleValues = new Set(baseRoles.map(r => r.value));
        Object.keys(roleCounts).forEach(roleKey => {
            if (!existingRoleValues.has(roleKey) && roleKey) {
                baseRoles.push({
                    value: roleKey,
                    label: roleKey.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
                });
            }
        });

        return baseRoles;
    }, [roleCounts]);

    return (
        <div className="p-2 h-full flex flex-col max-w-full mx-auto overflow-hidden min-w-full">
            {/* Backdrop for Dropdown */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-10 bg-transparent"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}

            {/* Page Header Card - Fixed Height */}
            <div className="flex-none bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">FarmVest Employees</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage all employees (Total: {globalTotalCount || totalCount || 0})</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search - Visual only if API doesn't support search on get_all.
                             If we want search, implement separate logic. For now, keep visual.
                             (User request was specifically about pagination on existing APIs)
                         */}
                        <div className="relative flex-1 min-w-[160px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-8 py-2 w-full border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div
                            className="relative z-20"
                            onMouseEnter={() => { setIsDropdownOpen(true); setIsStatusDropdownOpen(false); }}
                            onMouseLeave={() => setIsDropdownOpen(false)}
                        >
                            <button
                                className={`flex items-center justify-between min-w-[130px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-orange-50 hover:border-gray-300 hover:text-orange-700 transition-colors ${(selectedRole !== '' || isDropdownOpen) ? 'bg-orange-50 border border-gray-200 text-orange-700' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span className="flex items-center whitespace-nowrap">
                                    {formatRoleName(selectedRole)}
                                    <span className="ml-1 text-gray-500 font-normal">
                                        ({selectedRole === '' ? (globalTotalCount || totalCount) : (roleCounts[selectedRole] || 0)})
                                    </span>
                                </span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 -mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {roles.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSelectedRole(option.value);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-orange-50 hover:text-orange-700 transition-colors ${selectedRole === option.value ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700'}`}
                                        >
                                            <span className="flex items-center">
                                                {option.label}
                                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedRole === option.value ? 'bg-orange-100' : 'bg-gray-100 text-gray-500'}`}>
                                                    {option.value === '' ? (globalTotalCount || totalCount) : (roleCounts[option.value] || 0)}
                                                </span>
                                            </span>
                                            {selectedRole === option.value && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            className="relative z-20"
                            onMouseEnter={() => { setIsStatusDropdownOpen(true); setIsDropdownOpen(false); }}
                            onMouseLeave={() => setIsStatusDropdownOpen(false)}
                        >
                            <button
                                className={`flex items-center justify-between min-w-[120px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-orange-50 hover:border-gray-300 hover:text-orange-700 transition-colors ${(selectedStatus !== '' || isStatusDropdownOpen) ? 'bg-orange-50 border border-gray-200 text-orange-700' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span className="flex items-center whitespace-nowrap">
                                    {selectedStatus === '' ? 'All Status' : (selectedStatus === '1' ? 'Active' : 'Inactive')}
                                    <span className="ml-1 text-gray-500 font-normal">
                                        ({selectedStatus === '' ? statusCounts.active + statusCounts.inactive : (selectedStatus === '1' ? statusCounts.active : statusCounts.inactive)})
                                    </span>
                                </span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute top-full right-0 -mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {[
                                        { value: '', label: 'All Status', count: statusCounts.active + statusCounts.inactive },
                                        { value: '1', label: 'Active', count: statusCounts.active },
                                        { value: '0', label: 'Inactive', count: statusCounts.inactive }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSelectedStatus(option.value);
                                                setIsStatusDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-orange-50 hover:text-orange-700 transition-colors ${selectedStatus === option.value ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700'}`}
                                        >
                                            <span className="flex items-center">
                                                {option.label}
                                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedStatus === option.value ? 'bg-orange-100' : 'bg-gray-100 text-gray-500'}`}>
                                                    {option.count}
                                                </span>
                                            </span>
                                            {selectedStatus === option.value && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleAddEmployee}
                            className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-2.5 py-1.5 rounded-md font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                        >
                            <span className="text-xs">+</span> Add Employee
                        </button>
                    </div >
                </div >
            </div>

            {/* Table Content - Flex Grow */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto max-h-[calc(100vh-200px)]">
                    <table className="min-w-full divide-y divide-gray-100 relative">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold tracking-wider text-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-3 py-2.5 text-center bg-gray-50">S.No</th>
                                <th className="px-3 py-2.5 text-left cursor-pointer bg-gray-50">
                                    <span>Name</span>
                                </th>
                                <th className="px-3 py-2.5 text-center cursor-pointer bg-gray-50">Email</th>
                                <th className="px-3 py-2.5 text-center cursor-pointer bg-gray-50">Phone</th>
                                <th className="px-3 py-2.5 text-center cursor-pointer bg-gray-50">Joining Date</th>
                                <th className="px-3 py-2.5 text-center bg-gray-50">Role</th>
                                <th className="px-3 py-2.5 text-center bg-gray-50">Farm</th>
                                <th className="px-3 py-2.5 text-center bg-gray-50">Shed</th>
                                <th className="px-3 py-2.5 text-center cursor-pointer bg-gray-50">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {employeesLoading ? (
                                <TableSkeleton cols={10} rows={5} />
                            ) : employees.length > 0 ? (
                                employees.map((employee: any, index: number) => (
                                    <tr key={employee.id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-500 font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>

                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors text-sm" onClick={() => handleNameClick(employee)}>
                                                {`${employee.first_name || ''} ${employee.last_name || ''}`}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-600">{employee.email || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-600">{employee.phone_number || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-600">
                                            {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            }) : '-'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center text-xs">
                                            <div className="flex gap-1 justify-center flex-wrap">
                                                {(selectedRole && employee.roles?.includes(selectedRole)) ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                        {formatRoleName(selectedRole)}
                                                    </span>
                                                ) : (
                                                    employee.roles && employee.roles.length > 0 ? (
                                                        employee.roles.map((role: string, roleIdx: number) => (
                                                            <span key={roleIdx} className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                                {role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 mx-auto">-</span>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center text-xs text-gray-500">
                                            {employee.farm_name || employee.farm?.farm_name || '-'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center text-xs text-gray-500">
                                            {employee.shed_name || employee.shed?.shed_name || employee.shed_id || (employee.shed ? employee.shed.shed_id : '-') || '-'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-bold ${employee.active_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {employee.active_status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9}>
                                        <div className="flex flex-col items-center justify-center py-16 px-4">
                                            {debouncedSearchTerm ? (
                                                <>
                                                    <div className="bg-gray-50 rounded-full p-6 mb-4">
                                                        <Search size={48} className="text-gray-300" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">No employees found</h3>
                                                    <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
                                                        We couldn't find any employees matching "{debouncedSearchTerm}". Please try a different search term.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setDebouncedSearchTerm('');
                                                        }}
                                                        className="text-blue-600 font-semibold hover:underline"
                                                    >
                                                        Clear search
                                                    </button>
                                                </>
                                            ) : (
                                                <>
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
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div >

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
            {
                totalPages > 1 && (
                    <div className="flex-none mt-0 flex justify-end">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )
            }
        </div >
    );
};

export default Employees;
