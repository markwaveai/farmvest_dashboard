import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Milk, Activity, Tag, Info } from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import TableSkeleton from '../components/common/TableSkeleton';

const InvestorDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [investor, setInvestor] = useState<any>(null);
    const [animals, setAnimals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [animalsLoading, setAnimalsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch all investors to find the current one (since there isn't a getSingleInvestor endpoint explicitly visible yet)
                // Optimization: In a real app we'd have getInvestorById. For now, we rely on the list or passed state.
                // However, getting animals is accurate.
                // Let's try to fetch recent list or default to passed state if we had it, but here we'll just fetch animals first.
                // Actually, let's fetch the specific investor from the list if possible or just show skeleton if not found
                // For this implementation, I will fetch the full list effectively or rely on a "getInvestor" if it existed.
                // Since I saw getAllInvestors, I will use that for now to find the user.

                const response = await farmvestService.getAllInvestors({ page: 1, size: 1000 }); // Temporary hack to find user
                let foundInvestor = null;
                const list = Array.isArray(response) ? response : (response.data || response.users || []);

                foundInvestor = list.find((inv: any) =>
                    String(inv.id) === id || String(inv.investor_id) === id
                );

                if (foundInvestor) {
                    setInvestor(foundInvestor);
                }

                // Fetch Animals
                setAnimalsLoading(true);
                const animalsResponse = await farmvestService.getAnimalsByInvestor(Number(id));
                setAnimals(Array.isArray(animalsResponse) ? animalsResponse : (animalsResponse.data || []));

            } catch (error) {
                console.error("Error loading investor details:", error);
            } finally {
                setLoading(false);
                setAnimalsLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (loading && !investor) {
        return (
            <div className="p-6 max-w-[1600px] mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!investor && !loading) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold text-gray-700">Investor not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Investors
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{investor.first_name} {investor.last_name}</h1>
                        <p className="text-gray-500 flex items-center mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${investor.active_status || investor.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {investor.active_status || investor.is_active ? 'Active Investor' : 'Inactive Investor'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <User size={20} className="mr-2 text-blue-500" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                        <Mail className="text-gray-400 mt-1 mr-3" size={18} />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email Address</p>
                            <p className="text-gray-900 font-medium">{investor.email || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                        <Phone className="text-gray-400 mt-1 mr-3" size={18} />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Phone Number</p>
                            <p className="text-gray-900 font-medium">{investor.mobile || investor.phone_number || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                        <Calendar className="text-gray-400 mt-1 mr-3" size={18} />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Joined Date</p>
                            <p className="text-gray-900 font-medium">{investor.created_at ? new Date(investor.created_at).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Investments / Animals Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Milk size={20} className="mr-2 text-orange-500" /> Buffalo Portfolio
                    </h3>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold flex items-center shadow-sm border border-blue-100">
                            <span className="text-lg mr-2">🐮</span> {animals ? animals.length : 0} Animals
                        </div>
                        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold flex items-center shadow-sm border border-green-100">
                            <span className="text-lg mr-2">🏡</span> {animals ? new Set(animals.map(a => a.farm_name || a.farm_id).filter(Boolean)).size : 0} Farms
                        </div>
                        <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold flex items-center shadow-sm border border-purple-100">
                            <span className="text-lg mr-2">🛖</span> {animals ? new Set(animals.map(a => a.shed_name || a.shed_id).filter(Boolean)).size : 0} Sheds
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tag ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Farm</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Shed</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Breed</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Age (Months)</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Lactation</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Milk Prod. (L)</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {animalsLoading ? (
                                <tr><td colSpan={10} className="p-4"><TableSkeleton cols={10} rows={3} /></td></tr>
                            ) : animals.length > 0 ? (
                                animals.map((animal: any, index: number) => (
                                    <tr key={animal.id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="p-1.5 bg-blue-100 text-blue-600 rounded mr-2">
                                                    <Tag size={14} />
                                                </span>
                                                <span className="font-bold text-gray-900">{animal.rfid_tag_number || animal.tag_id || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {animal.farm_name || animal.farm?.farm_name || '-'}{animal.farm_location || animal.location ? ` - ${animal.farm_location || animal.location}` : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {animal.shed_name || animal.shed_id || (animal.shed ? animal.shed.shed_id : '-') || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                            {animal.position || (animal.row_number && animal.parking_id ? `${animal.row_number}-${animal.parking_id}` : (animal.parking_id || '-'))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{animal.breed || 'Murrah'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{animal.gender || 'Female'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                            {animal.age_in_months || (animal.dob || animal.date_of_birth ? Math.floor((new Date().getTime() - new Date(animal.dob || animal.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : '-')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {animal.lactation_status || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-bold">
                                            {animal.milk_production_capacity ? `${animal.milk_production_capacity} L` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${animal.health_status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {animal.health_status || 'Good'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-gray-400 text-sm">
                                        No buffaloes assigned to this investor yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvestorDetailsPage;
