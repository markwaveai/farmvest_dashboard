import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchEmployees, fetchRoleCounts, clearMessages, deleteEmployee, updateEmployeeStatus } from '../store/slices/farmvest/employees';
import AddEmployeeModal from './AddEmployee/AddEmployeeModal';

import DeleteEmployeeModal from './DeleteEmployeeModal';
import Snackbar from '../components/common/Snackbar';
import { Trash2, Search, Users, ChevronDown, Check } from 'lucide-react';
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
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const {
        employees,
        allEmployees,
        totalCount,
        globalTotalCount,
        loading: employeesLoading,
        error,
        successMessage,
        deleteLoading,
        roleCounts,
        statusCounts,
        updateStatusLoading
    } = useAppSelector((state: RootState) => state.farmvestEmployees);

    useEffect(() => {
        dispatch(fetchRoleCounts());
    }, [dispatch]);

    // ... (rest of the component)

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
            dispatch(fetchRoleCounts()); // Refresh counts
        }
    };

    // Local State for Pagination (Removed URL params to fix navigation issues)
    const [currentPage, setCurrentPage] = useState(1);

    // const [searchParams, setSearchParams] = useSearchParams();
    // const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = 20;

    // Search State
    const [searchTerm, setSearchTerm] = React.useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');

    // const setCurrentPage = useCallback((page: number) => {
    //     setSearchParams(prev => {
    //         const newParams = new URLSearchParams(prev);
    //         newParams.set('page', String(page));
    //         return newParams;
    //     });
    // }, [setSearchParams]);

    // Custom Search Function
    const searchFn = useCallback((item: any, query: string) => {
        const lowerQuery = query.toLowerCase();
        const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
        const email = (item.email || '').toLowerCase();
        const phone = (item.phone_number || '').toString();
        const mobile = (item.mobile || '').toString();

        return (
            fullName.includes(lowerQuery) ||
            email.includes(lowerQuery) ||
            phone.includes(lowerQuery) ||
            mobile.includes(lowerQuery)
        );
    }, []);

    // Unified Client-Side Filtering
    // We use allEmployees (limit 1000) as the source of truth for robust filtering.
    const roleStatusFilteredData = useMemo(() => {
        // Debug logs for filtering issues
        if (allEmployees.length > 0) {
        }

        return allEmployees.filter((emp: any) => {
            // Filter by Status
            if (selectedStatus) {
                // Normalize employee status to string '1' (active) or '0' (inactive)
                const isActive = emp.active_status === 1 || emp.active_status === true || emp.active_status === '1';
                const empStatusStr = isActive ? '1' : '0';

                if (empStatusStr !== selectedStatus) return false;
            }

            // Filter by Role
            if (selectedRole) {
                // Handle various role structures (array or string)
                let empRole = '';
                if (Array.isArray(emp.roles) && emp.roles.length > 0) {
                    empRole = emp.roles[0];
                } else if (typeof emp.role === 'string') {
                    empRole = emp.role;
                } else {
                    empRole = 'INVESTOR';
                }

                const normalizedEmpRole = String(empRole).trim().toUpperCase().replace(/\s+/g, '_');
                if (normalizedEmpRole !== selectedRole) return false;
            }

            return true;
        });
    }, [allEmployees, selectedRole, selectedStatus]);

    const {
        filteredData: filteredEmployees,
        requestSort,
        sortConfig,
        searchQuery: activeSearchQuery,
        setSearchQuery
    } = useTableSortAndSearch(roleStatusFilteredData, { key: '', direction: 'asc' }, searchFn);

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== debouncedSearchTerm) {
                setDebouncedSearchTerm(searchTerm);
                setSearchQuery(searchTerm);
                if (currentPage !== 1) {
                    setCurrentPage(1);
                }
            }
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, debouncedSearchTerm, currentPage, setCurrentPage, setSearchQuery]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRole, selectedStatus, setCurrentPage]);

    // Clear search and refresh when success message appears (e.g., after add/delete)
    useEffect(() => {
        if (successMessage) {
            setSearchTerm('');
            setSearchQuery('');
            setDebouncedSearchTerm('');
            if (currentPage !== 1) {
                setCurrentPage(1);
            }
        }
    }, [successMessage, setCurrentPage, setSearchQuery, currentPage]);

    // Format role for API (e.g., FARM_MANAGER -> Farm Manager)
    const formatRoleName = (role: string) => {
        if (!role) return 'All Roles';
        return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    // Simplify server fetch - we rely on initial fetchRoleCounts for data
    // accessing fetchEmployees here is only to keep generic state updated if needed, 
    // but for UI we use allEmployees.
    useEffect(() => {
        // Optional: We can periodically refresh or just rely on mount
        // dispatch(fetchEmployees({ page: 1, size: 1 })); 
    }, [dispatch]);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(start, start + itemsPerPage);
    }, [filteredEmployees, currentPage, itemsPerPage]);

    // Calculate total pages
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Dynamic Counts based on filters
    const dynamicRoleCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allEmployees.forEach(emp => {
            const matchesStatus = !selectedStatus || String(emp.active_status) === selectedStatus;
            if (matchesStatus) {
                const role = emp.roles?.[0] || 'INVESTOR';
                const normRole = String(role).trim().toUpperCase().replace(/\s+/g, '_');
                counts[normRole] = (counts[normRole] || 0) + 1;
            }
        });
        return counts;
    }, [allEmployees, selectedStatus]);

    // Total count independent of role selection (but respecting status)
    const totalMatchingStatus = useMemo(() => {
        if (!selectedStatus) return allEmployees.length;
        return allEmployees.filter(emp => String(emp.active_status) === selectedStatus).length;
    }, [allEmployees, selectedStatus]);

    const dynamicStatusCounts = useMemo(() => {
        const counts = { active: 0, inactive: 0, total: 0 };
        allEmployees.forEach(emp => {
            const matchesRole = !selectedRole || (emp.roles?.[0] || 'INVESTOR').trim().toUpperCase().replace(/\s+/g, '_') === selectedRole;
            if (matchesRole) {
                counts.total++;
                if (emp.active_status) counts.active++;
                else counts.inactive++;
            }
        });
        return counts;
    }, [allEmployees, selectedRole]);

    const roles = useMemo(() => {
        const baseRoles = [
            { value: '', label: 'All Roles' },
            { value: 'FARM_MANAGER', label: 'Farm Manager' },
            { value: 'SUPERVISOR', label: 'Supervisor' },
            { value: 'DOCTOR', label: 'Doctor' },
            { value: 'ASSISTANT_DOCTOR', label: 'Assistant Doctor' },
            { value: 'ADMIN', label: 'Admin' }
        ];

        // Add any other roles found in allEmployees
        const existingRoleValues = new Set(baseRoles.map(r => r.value));
        Object.keys(dynamicRoleCounts).forEach(roleKey => {
            if (!existingRoleValues.has(roleKey) && roleKey) {
                baseRoles.push({
                    value: roleKey,
                    label: roleKey.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
                });
            }
        });

        return baseRoles;
    }, [dynamicRoleCounts]);

    // Helper to get initials
    const getInitials = (first: string, last: string) => {
        const f = first ? first.charAt(0).toUpperCase() : '';
        const l = last ? last.charAt(0).toUpperCase() : '';
        return `${f}${l}` || '#';
    };

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
                        <p className="text-sm text-gray-500 mt-0.5">Manage all employees (Total: {globalTotalCount || 0})</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[160px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div
                            className="relative z-20"
                            onMouseEnter={() => { setIsDropdownOpen(true); setIsStatusDropdownOpen(false); }}
                            onMouseLeave={() => setIsDropdownOpen(false)}
                        >
                            <button
                                className={`flex items-center justify-between min-w-[120px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-orange-50 hover:border-gray-300 hover:text-orange-700 transition-colors max-w-[100px] ${(selectedRole !== '' || isDropdownOpen) ? 'bg-orange-50 border border-gray-200 text-orange-700' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span className="truncate">
                                    {formatRoleName(selectedRole)}
                                    <span className="ml-1 text-gray-500 font-normal">
                                        ({selectedRole === '' ? totalMatchingStatus : (dynamicRoleCounts[selectedRole] || 0)})
                                    </span>
                                </span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                                                    {option.value === '' ? totalMatchingStatus : (dynamicRoleCounts[option.value] || 0)}
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
                                className={`flex items-center justify-between min-w-[100px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-orange-50 hover:border-gray-300 hover:text-orange-700 transition-colors ${(selectedStatus !== '' || isStatusDropdownOpen) ? 'bg-orange-50 border border-gray-200 text-orange-700' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span className="truncate">
                                    {selectedStatus === '' ? 'All Status' : (selectedStatus === '1' ? 'Active' : 'Inactive')}
                                    <span className="ml-1 text-gray-500 font-normal">
                                        ({selectedStatus === '' ? dynamicStatusCounts.total : (selectedStatus === '1' ? dynamicStatusCounts.active : dynamicStatusCounts.inactive)})
                                    </span>
                                </span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute top-full right-0 -mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {[
                                        { value: '', label: 'All Status', count: dynamicStatusCounts.total },
                                        { value: '1', label: 'Active', count: dynamicStatusCounts.active },
                                        { value: '0', label: 'Inactive', count: dynamicStatusCounts.inactive }
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
                                <th className="px-3 py-2.5 text-left bg-gray-50">S.No</th>

                                <th onClick={() => requestSort('first_name')} className="px-3 py-2.5 text-left cursor-pointer bg-gray-50">
                                    <span>Name {getSortIcon('first_name')}</span>
                                </th>
                                <th onClick={() => requestSort('email')} className="px-3 py-2.5 text-left cursor-pointer bg-gray-50">Email {getSortIcon('email')}</th>
                                <th onClick={() => requestSort('phone_number')} className="px-3 py-2.5 text-left cursor-pointer bg-gray-50">Phone {getSortIcon('phone_number')}</th>
                                <th onClick={() => requestSort('joining_date')} className="px-3 py-2.5 text-left cursor-pointer bg-gray-50">Joining Date {getSortIcon('joining_date')}</th>
                                <th className="px-3 py-2.5 text-left bg-gray-50">Role</th>
                                <th className="px-3 py-2.5 text-left bg-gray-50">Farm</th>
                                <th className="px-3 py-2.5 text-left bg-gray-50">Shed</th>
                                <th onClick={() => requestSort('active_status')} className="px-3 py-2.5 text-center cursor-pointer bg-gray-50">Status {getSortIcon('active_status')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {employeesLoading ? (
                                <TableSkeleton cols={10} rows={5} />
                            ) : currentItems.length > 0 ? (
                                currentItems.map((employee: any, index: number) => (
                                    <tr key={employee.id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>

                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors text-sm" onClick={() => handleNameClick(employee)}>
                                                {`${employee.first_name || ''} ${employee.last_name || ''}`}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{employee.email || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{employee.phone_number || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                            {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            }) : '-'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-left">
                                            <div className="flex gap-1 justify-start flex-wrap">
                                                {(selectedRole && employee.roles?.includes(selectedRole)) ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                        {selectedRole.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                    </span>
                                                ) : (
                                                    employee.roles && employee.roles.length > 0 ? (
                                                        employee.roles.map((role: string, roleIdx: number) => (
                                                            <span key={roleIdx} className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                                {role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-left text-xs text-gray-500">
                                            {employee.farm_name || employee.farm?.farm_name || '-'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-left text-xs text-gray-500">
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
                                            {activeSearchQuery ? (
                                                <>
                                                    <div className="bg-gray-50 rounded-full p-6 mb-4">
                                                        <Search size={48} className="text-gray-300" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">No employees found</h3>
                                                    <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
                                                        We couldn't find any employees matching "{activeSearchQuery}". Please try a different search term.
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setSearchQuery('');
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
                    <div className="flex-none mt-4">
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
