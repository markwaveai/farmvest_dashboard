import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { fetchEmployees } from '../store/slices/farmvest/employees';
import { User, MapPin, Warehouse, ArrowLeft, Mail, Phone, Calendar, Hash } from 'lucide-react';
import TableSkeleton from '../components/common/TableSkeleton'; // Or create a specific Skeleton

const EmployeeDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { employees, loading } = useAppSelector((state: RootState) => state.farmvestEmployees);
    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        if (employees.length === 0) {
            dispatch(fetchEmployees(undefined));
        }
    }, [dispatch, employees.length]);

    useEffect(() => {
        if (id && employees.length > 0) {
            const found = employees.find((e: any) => String(e.id) === id);
            setEmployee(found || null);
        }
    }, [id, employees]);

    const handleBack = () => {
        navigate(-1);
    };

    if (loading && !employee) {
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

    if (!employee && !loading) {
        return (
            <div className="p-6 text-center">
                <button onClick={handleBack} className="flex items-center text-gray-600 mb-6 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Employees
                </button>
                <h2 className="text-xl font-semibold text-gray-700">Employee not found</h2>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button
                onClick={handleBack}
                className="flex items-center text-gray-600 mb-6 hover:text-blue-600 transition-colors font-medium"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Employees
            </button>

            {employee && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-white px-8 py-8 border-b border-blue-100">
                        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {employee.first_name} {employee.last_name}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                            {employee.roles?.[0] || 'Employee'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {employee.is_active ? 'Active' : 'Inactive'}
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
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    Contact Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Email Address</label>
                                        <div className="text-gray-900 font-medium flex items-center gap-2">
                                            {employee.email || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Mobile Number</label>
                                        <div className="text-gray-900 font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-300" />
                                            {employee.mobile || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignment Details */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow lg:col-span-2">
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
                                                <span className="font-medium text-gray-900">{employee.farm_location || 'N/A'}</span>
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
                                                    {employee.shed_section ? `Section ${employee.shed_section}` : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Details */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                    <Hash className="w-5 h-5 text-gray-400" />
                                    System Metadata
                                </h3>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Joined Date</label>
                                        <div className="text-gray-900 font-medium flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-300" />
                                            {employee.created_at ? new Date(employee.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Role</label>
                                        <div className="text-gray-900 font-medium">
                                            {employee.roles?.join(', ') || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDetailsPage;
