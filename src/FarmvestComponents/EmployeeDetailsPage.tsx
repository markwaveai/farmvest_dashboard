import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { farmvestService } from '../services/farmvest_api';
import { User, MapPin, Warehouse, ArrowLeft, Mail, Phone, Calendar, Hash } from 'lucide-react';

import TableSkeleton from '../components/common/TableSkeleton';
import './Employees.css'; // Import CSS for animations

const EmployeeDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    // Removed Redux selector for single employee fetch

    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setLoading(true);
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

        fetchDetails();
    }, [id]);

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="p-6">
                <button onClick={handleBack} className="flex items-center text-gray-600 mb-6 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
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
                <button onClick={handleBack} className="flex items-center text-gray-600 mb-6 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
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
        <div className="p-6 max-w-full mx-auto">
            <button
                onClick={handleBack}
                className="flex items-center text-gray-600 mb-6 hover:text-blue-600 transition-colors font-medium"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Employees
            </button>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-white px-8 py-8 border-b border-blue-100 animate-slide-up-fade-1">
                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {employee.first_name || employee.name} {employee.last_name || ''}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold capitalize">
                                        {String(displayRole).replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                            <p className="text-xl font-mono font-bold text-gray-800">#{employee.id}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Contact Information */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow animate-slide-up-fade-2">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                <Mail className="w-5 h-5 text-gray-400" />
                                Contact Details
                            </h3>
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Email Address</label>
                                    <div className="text-gray-900 font-medium flex items-center gap-2 break-all">
                                        {employee.email || 'N/A'}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Mobile Number</label>
                                    <div className="text-gray-900 font-medium flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-300" />
                                        {employee.mobile || employee.phone_number || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assignment Details */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow lg:col-span-2 animate-slide-up-fade-3">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                Assignment Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-green-100 p-1.5 rounded-md">
                                            <MapPin className="w-4 h-4 text-green-700" />
                                        </div>
                                        <h4 className="font-semibold text-gray-800">Farm Location</h4>
                                    </div>
                                    <div className="space-y-3 pl-2">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Farm Name</span>
                                            <span className="font-medium text-gray-900">{employee.farm_name || 'Not Assigned'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Location</span>
                                            <span className="font-medium text-gray-900">{employee.location || employee.farm_location || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-purple-100 p-1.5 rounded-md">
                                            <Warehouse className="w-4 h-4 text-purple-700" />
                                        </div>
                                        <h4 className="font-semibold text-gray-800">Shed Assignment</h4>
                                    </div>
                                    <div className="space-y-3 pl-2">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Shed Name</span>
                                            <span className="font-medium text-gray-900">{employee.shed_name || 'Not Assigned'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Section Details</span>
                                            <span className="font-medium text-gray-900">
                                                {/* API check: might return section or shed_section */}
                                                {employee.section || employee.shed_section ? `Section ${employee.section || employee.shed_section}` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Details */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow animate-slide-up-fade-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                <Hash className="w-5 h-5 text-gray-400" />
                                System Metadata
                            </h3>
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Employee ID</label>
                                    <div className="text-gray-900 font-medium font-mono">
                                        #{employee.id}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Joined Date</label>
                                    <div className="text-gray-900 font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-300" />
                                        {employee.created_at || employee.joining_date ? new Date(employee.created_at || employee.joining_date).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsPage;
