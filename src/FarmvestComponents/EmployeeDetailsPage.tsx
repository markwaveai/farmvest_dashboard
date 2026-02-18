import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { farmvestService } from '../services/farmvest_api';
import { User, MapPin, Warehouse, ArrowLeft, Mail, Phone, Calendar, Hash } from 'lucide-react';

import TableSkeleton from '../components/common/TableSkeleton';
import EditEmployeeModal from './EditEmployeeModal';
import './Employees.css'; // Import CSS for animations
// Force re-compilation after manual file creation


const EmployeeDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    // Removed Redux selector for single employee fetch

    const stateEmployee = location.state?.employee;
    const [employee, setEmployee] = useState<any>(stateEmployee || null);
    const [loading, setLoading] = useState(!stateEmployee);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;

            // If we have state passed from list, we can use that primarily
            // But we ALWAYS fetch to get latest status and details like location
            if (stateEmployee && (String(stateEmployee.id) === String(id))) {
                // Don't show loading spinner if we have data, but let fetch proceed
                setLoading(false);
            } else {
                setLoading(true);
            }
            try {
                // First attempt: Direct API call
                const data = await farmvestService.getEmployeeDetailsById(id);

                let result = data.data || data;
                if (Array.isArray(result)) {
                    result = result[0];
                }

                if (result) {
                    // Normalize data structure
                    const normalized = {
                        ...result,
                        id: result.id || result.user_id || result.employee_id || result.emp_id || result.employee_code || result.investor_id || result.user?.id || result.data?.id,
                        farm_name: result.farm_name || result.farm?.farm_name || result.farm?.name || (result.farm_details ? result.farm_details.farm_name : '') || result.farm_id || result.farm?.id || '',
                        shed_name: result.shed_name || result.shed?.shed_name || result.shed?.name || (result.shed_details ? result.shed_details.shed_name : '') || result.shed_id || result.shed?.id || '',
                        location: result.location || result.farm?.location || result.farm_location || (result.farm_details ? result.farm_details.location : '') || '',
                    };
                    setEmployee(normalized);
                    setError(null);
                } else {
                    throw new Error('Empty response from details API');
                }
            } catch (err: any) {
                try {
                    // Fallback: Fetch all employees and search locally
                    const listResponse = await farmvestService.getEmployees({ size: 1000 });
                    const list = Array.isArray(listResponse) ? listResponse : (listResponse.data || []);

                    // Find in list
                    const found = list.find((e: any) =>
                        String(e.id) === String(id) ||
                        String(e.user_id) === String(id) ||
                        String(e.employee_id) === String(id) ||
                        String(e.investor_id) === String(id)
                    );

                    if (found) {
                        // Normalize fallback data too
                        const normalized = {
                            ...found,
                            id: found.id || found.user_id || found.employee_id || found.emp_id || found.employee_code || found.investor_id || found.user?.id || found.data?.id,
                            farm_name: found.farm_name || found.farm?.farm_name || found.farm?.name || (found.farm_details ? found.farm_details.farm_name : '') || found.farm_id || found.farm?.id || '',
                            shed_name: found.shed_name || found.shed?.shed_name || found.shed?.name || (found.shed_details ? found.shed_details.shed_name : '') || found.shed_id || found.shed?.id || '',
                            location: found.location || found.farm?.location || found.farm_location || (found.farm_details ? found.farm_details.location : '') || '',
                        };
                        setEmployee(normalized);
                        setError(null);
                    } else {
                        throw err; // Throw original error if not found in list either
                    }
                } catch (fallbackErr) {
                    const apiError = err.response?.data?.detail || err.message || 'Unknown error';
                    setError(typeof apiError === 'string' ? apiError : JSON.stringify(apiError));
                }
            } finally {
                setLoading(false);
            }
        };

        if (!stateEmployee || String(stateEmployee.id) !== String(id)) {
            fetchDetails();
        }
    }, [id, stateEmployee]);

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="p-6">
                <button
                    onClick={handleBack}
                    className="flex items-center text-gray-600 mb-6 2xl:mb-10 4xl:mb-20 5xl:mb-32 hover:text-gray-900 transition-colors text-base 2xl:text-2xl 4xl:text-[40px] 5xl:text-[60px] font-medium"
                >
                    <ArrowLeft className="mr-2 2xl:mr-4 4xl:mr-8 5xl:mr-12 w-5 h-5 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24" />
                    Back to Employees
                </button>
                <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-40 bg-gray-200 rounded"></div>
                        <div className="h-40 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="p-6 text-center">
                <button
                    onClick={handleBack}
                    className="flex items-center text-gray-600 mb-6 2xl:mb-10 4xl:mb-20 5xl:mb-32 hover:text-gray-900 transition-colors text-base 2xl:text-2xl 4xl:text-[40px] 5xl:text-[60px] font-medium"
                >
                    <ArrowLeft className="mr-2 2xl:mr-4 4xl:mr-8 5xl:mr-12 w-5 h-5 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24" />
                    Back to Employees
                </button>
                <div className="py-12 bg-white rounded-xl border border-red-100 p-8 shadow-sm">
                    <div className="text-red-500 mb-4 bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <User size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to load employee details</h2>
                    <p className="text-gray-500 mb-4">
                        {error || 'The requested employee could not be found or an error occurred.'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded inline-block">
                        ID: {id}
                    </p>
                </div>
            </div>
        );
    }

    // Role display logic
    const displayRole = Array.isArray(employee.roles) ? employee.roles[0] : (employee.role || 'Employee');
    const isActive = employee.active_status === 1 || employee.is_active === true || employee.active_status === true;

    return (
        <div className="p-4 w-full min-w-full max-w-full mx-auto">
            <button
                onClick={handleBack}
                className="flex items-center text-gray-600 mb-6 2xl:mb-10 4xl:mb-20 5xl:mb-32 hover:text-blue-600 transition-colors text-base 2xl:text-2xl 4xl:text-[40px] 5xl:text-[60px] font-medium"
            >
                <ArrowLeft className="mr-2 2xl:mr-4 4xl:mr-8 5xl:mr-12 w-5 h-5 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24" />
                Back to Employees
            </button>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-white px-8 py-4 2xl:px-12 2xl:py-8 4xl:px-20 4xl:py-16 5xl:px-32 5xl:py-24 border-b border-blue-100 animate-slide-up-fade-1">
                    <div className="flex flex-col gap-1.5 2xl:gap-3 4xl:gap-6 5xl:gap-10">
                        {/* Line 1: Icon and Name */}
                        <div className="flex items-center gap-4 2xl:gap-6 4xl:gap-10 5xl:gap-16">
                            <div className="bg-blue-600 p-2.5 2xl:p-4 4xl:p-8 5xl:p-12 rounded-xl 4xl:rounded-3xl shadow-md shadow-blue-200">
                                <User className="w-7 h-7 2xl:w-10 2xl:h-10 4xl:w-20 4xl:h-20 5xl:w-32 5xl:h-32 text-white" />
                            </div>
                            <h1 className="text-2xl md:text-3xl 2xl:text-5xl 4xl:text-[80px] 5xl:text-[120px] font-bold text-gray-900 leading-tight">
                                {employee.first_name || employee.name} {employee.last_name || ''}
                            </h1>
                        </div>

                        {/* Line 2: Role, Status and Employee ID */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-6 2xl:gap-10 4xl:gap-16 5xl:gap-24 ml-0 md:ml-[68px] 2xl:ml-[92px] 4xl:ml-[160px] 5xl:ml-[256px]">
                            <div className="flex flex-row items-center gap-2 2xl:gap-4 4xl:gap-8 5xl:gap-12 flex-shrink-0">
                                <span className="px-3 py-1 2xl:px-5 2xl:py-2 4xl:px-10 4xl:py-4 5xl:px-16 5xl:py-8 bg-blue-100 text-blue-800 rounded-full text-sm 2xl:text-lg 4xl:text-4xl 5xl:text-6xl font-semibold capitalize whitespace-nowrap inline-flex items-center justify-center min-w-fit">
                                    {String(displayRole).replace(/_/g, ' ').toLowerCase()}
                                </span>
                                <span className={`px-3 py-1 2xl:px-5 2xl:py-2 4xl:px-10 4xl:py-4 5xl:px-16 5xl:py-8 rounded-full text-sm 2xl:text-lg 4xl:text-4xl 5xl:text-6xl font-semibold whitespace-nowrap inline-flex items-center justify-center min-w-fit ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 2xl:gap-4 4xl:gap-8 5xl:gap-12">
                                <span className="text-sm 2xl:text-xl 4xl:text-4xl 5xl:text-6xl text-gray-500 font-medium whitespace-nowrap">Employee ID:</span>
                                <span className="text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl font-mono font-bold text-gray-800">#{employee.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-6 2xl:p-10 4xl:p-20 5xl:p-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 2xl:gap-12 4xl:gap-24 5xl:gap-40">
                        {/* Contact Information */}
                        <div className="bg-white border border-gray-200 rounded-xl 4xl:rounded-[40px] p-3 sm:p-4 lg:p-6 2xl:p-10 4xl:p-20 5xl:p-32 hover:shadow-md transition-shadow animate-slide-up-fade-2 h-full min-h-[220px] 2xl:min-h-[320px] 4xl:min-h-[600px] 5xl:min-h-[900px]">
                            <h3 className="text-base sm:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-8xl font-bold text-gray-800 mb-4 2xl:mb-6 4xl:mb-12 5xl:mb-20 flex items-center gap-2 4xl:gap-6 5xl:gap-10 border-b 4xl:border-b-4 pb-2 2xl:pb-4 4xl:pb-10 5xl:pb-16">
                                <Mail className="w-5 h-5 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24 text-gray-400" />
                                <span className="truncate">Contact Details</span>
                            </h3>
                            <div className="space-y-4 2xl:space-y-8 4xl:space-y-16 5xl:space-y-24">
                                <div className="group">
                                    <label className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl font-semibold text-gray-500 uppercase tracking-wider mb-1 4xl:mb-4 block group-hover:text-blue-600 transition-colors">Email Address</label>
                                    <div className="text-gray-900 font-medium text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl flex items-center gap-2 break-all">
                                        {employee.email || 'N/A'}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl font-semibold text-gray-500 uppercase tracking-wider mb-1 4xl:mb-4 block group-hover:text-blue-600 transition-colors">Mobile Number</label>
                                    <div className="text-gray-900 font-medium text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl flex items-center gap-2">
                                        <Phone className="w-4 h-4 2xl:w-6 2xl:h-6 4xl:w-14 4xl:h-14 5xl:w-20 5xl:h-20 text-gray-300" />
                                        {employee.mobile || employee.phone_number || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Metadata */}
                        <div className="bg-white border border-gray-200 rounded-xl 4xl:rounded-[40px] p-3 sm:p-4 lg:p-6 2xl:p-10 4xl:p-20 5xl:p-32 hover:shadow-md transition-shadow animate-slide-up-fade-4 h-full min-h-[220px] 2xl:min-h-[320px] 4xl:min-h-[600px] 5xl:min-h-[900px]">
                            <h3 className="text-base sm:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-8xl font-bold text-gray-800 mb-4 2xl:mb-6 4xl:mb-12 5xl:mb-20 flex items-center gap-1.5 sm:gap-2 4xl:gap-6 5xl:gap-10 border-b 4xl:border-b-4 pb-2 2xl:pb-4 4xl:pb-10 5xl:pb-16">
                                <Hash className="w-4 h-4 sm:w-5 sm:h-5 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24 text-gray-400" />
                                <span className="truncate">System Metadata</span>
                            </h3>
                            <div className="space-y-4 2xl:space-y-8 4xl:space-y-16 5xl:space-y-24">
                                <div className="group">
                                    <label className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl font-semibold text-gray-500 uppercase tracking-wider mb-1 4xl:mb-4 block group-hover:text-blue-600 transition-colors">Employee ID</label>
                                    <div className="text-gray-900 font-medium font-mono text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl">
                                        #{employee.id}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl font-semibold text-gray-500 uppercase tracking-wider mb-1 4xl:mb-4 block group-hover:text-blue-600 transition-colors">Joined Date</label>
                                    <div className="text-gray-900 font-medium text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl flex items-center gap-2">
                                        <Calendar className="w-4 h-4 2xl:w-6 2xl:h-6 4xl:w-14 4xl:h-14 5xl:w-20 5xl:h-20 text-gray-300" />
                                        <span className="truncate">
                                            {employee.created_at || employee.joining_date ? new Date(employee.created_at || employee.joining_date).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Farm Location Box */}
                        <div className="bg-white border border-gray-200 rounded-xl 4xl:rounded-[40px] p-3 sm:p-4 lg:p-6 2xl:p-10 4xl:p-20 5xl:p-32 hover:shadow-md transition-shadow animate-slide-up-fade-3 h-full min-h-[220px] 2xl:min-h-[320px] 4xl:min-h-[600px] 5xl:min-h-[900px]">
                            <h3 className="text-base sm:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-8xl font-bold text-gray-800 mb-4 2xl:mb-6 4xl:mb-12 5xl:mb-20 flex items-center gap-2 4xl:gap-6 5xl:gap-10 border-b 4xl:border-b-4 pb-2 2xl:pb-4 4xl:pb-10 5xl:pb-16">
                                <MapPin className="w-5 h-5 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24 text-gray-400" />
                                <span className="truncate">Farm Location</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-green-50/50 rounded-lg p-3 sm:p-4 2xl:p-6 4xl:p-16 5xl:p-24 border border-green-100 h-full">
                                    <div className="space-y-3 lg:space-y-4 2xl:space-y-8 4xl:space-y-16 5xl:space-y-24">
                                        <div>
                                            <span className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl text-gray-500 block uppercase font-semibold mb-0.5 4xl:mb-4">Farm Name</span>
                                            <span className="font-medium text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl text-gray-900 truncate block">{employee.farm_name || 'Not Assigned'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl text-gray-500 block uppercase font-semibold mb-0.5 4xl:mb-4">Location</span>
                                            <span className="font-medium text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl text-gray-900 truncate block">{employee.location || employee.farm_location || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shed Assignment Box */}
                        <div className="bg-white border border-gray-200 rounded-xl 4xl:rounded-[40px] p-3 sm:p-4 lg:p-6 2xl:p-10 4xl:p-20 5xl:p-32 hover:shadow-md transition-shadow animate-slide-up-fade-5 h-full min-h-[220px] 2xl:min-h-[320px] 4xl:min-h-[600px] 5xl:min-h-[900px]">
                            <h3 className="text-base sm:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-8xl font-bold text-gray-800 mb-4 2xl:mb-6 4xl:mb-12 5xl:mb-20 flex items-center gap-2 4xl:gap-6 5xl:gap-10 border-b 4xl:border-b-4 pb-2 2xl:pb-4 4xl:pb-10 5xl:pb-16">
                                <Warehouse className="w-5 h-5 2xl:w-8 2xl:h-8 4xl:w-16 4xl:h-16 5xl:w-24 5xl:h-24 text-gray-400" />
                                <span className="truncate">Shed Assignment</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-purple-50/50 rounded-lg p-3 sm:p-4 2xl:p-6 4xl:p-16 5xl:p-24 border border-purple-100 h-full">
                                    <div className="space-y-3 lg:space-y-4 2xl:space-y-8 4xl:space-y-16 5xl:space-y-24">
                                        <div>
                                            <span className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl text-gray-500 block uppercase font-semibold mb-0.5 4xl:mb-4">Shed Name</span>
                                            <span className="font-medium text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl text-gray-900 truncate block">{employee.shed_name || 'Not Assigned'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs 2xl:text-lg 4xl:text-4xl 5xl:text-6xl text-gray-500 block uppercase font-semibold mb-0.5 4xl:mb-4">Section Details</span>
                                            <span className="font-medium text-base lg:text-lg 2xl:text-2xl 4xl:text-5xl 5xl:text-7xl text-gray-900 truncate block">
                                                {employee.section || employee.shed_section ? `Section ${employee.section || employee.shed_section}` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EditEmployeeModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                employee={employee}
                onSuccess={() => {
                    // Re-fetch employee details after edit
                    if (id) {
                        farmvestService.getEmployeeDetailsById(id).then(data => {
                            let result = data.data || data;
                            if (Array.isArray(result)) result = result[0];
                            if (result) {
                                setEmployee({
                                    ...result,
                                    id: result.id || result.user_id,
                                    farm_name: result.farm_name || result.farm?.farm_name || '',
                                    shed_name: result.shed_name || result.shed?.shed_name || '',
                                });
                            }
                        }).catch(() => { });
                    }
                }}
            />
        </div>
    );
};

export default EmployeeDetailsPage;
