import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Milk, Activity, Tag, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import TableSkeleton from '../components/common/TableSkeleton';

const InvestorDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [investor, setInvestor] = useState<any>(null);
    const [animals, setAnimals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [animalsLoading, setAnimalsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<number | string | null>(null);

    const toggleRow = (id: number | string) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

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

                const response = await farmvestService.getAllInvestors({ page: 1, size: 5000 }); // Wider search
                let foundInvestor = null;

                let list: any[] = [];
                if (Array.isArray(response)) {
                    list = response;
                } else if (response && Array.isArray(response.data)) {
                    list = response.data;
                } else if (response && response.data) {
                    list = response.data.investors || response.data.users || response.data.data || (Array.isArray(response.data) ? response.data : []);
                } else if (response && (response.users || response.investors)) {
                    list = response.users || response.investors;
                }

                foundInvestor = list.find((inv: any) =>
                    String(inv.id) === id || String(inv.investor_id) === id || String(inv.user_id) === id
                );

                if (foundInvestor) {
                    // Map to normalized structure if needed
                    const mapped = {
                        ...foundInvestor,
                        first_name: foundInvestor.first_name || foundInvestor.name?.split(' ')[0] || '',
                        last_name: foundInvestor.last_name || foundInvestor.name?.split(' ').slice(1).join(' ') || '',
                        mobile: foundInvestor.mobile || foundInvestor.phone_number || '',
                        active_status: foundInvestor.active_status !== undefined ? foundInvestor.active_status : (foundInvestor.is_active !== undefined ? foundInvestor.is_active : true)
                    };
                    setInvestor(mapped);
                }

                // Fetch Animals
                setAnimalsLoading(true);
                const animalsResponse = await farmvestService.getAnimalsByInvestor(Number(id));
                let allAnimals = Array.isArray(animalsResponse) ? animalsResponse : (animalsResponse.data || []);

                // Client-side processing: Separating Buffaloes and Calves
                if (allAnimals.length > 0) {
                    // Filter for Buffaloes
                    const buffaloes = allAnimals.filter((a: any) => {
                        const type = (a.animal_type || a.type || '').toUpperCase();
                        const isCalf = a.is_calf === true || a.is_calf === 1 || String(a.is_calf).toLowerCase() === 'true';
                        return (type === 'BUFFALO' || type === 'ADULT') && !isCalf;
                    });

                    // Fetch calves for each buffalo
                    const enrichedBuffaloes = await Promise.all(buffaloes.map(async (buffalo: any) => {
                        // For display: prioritize readable tags (rfid_tag) over generic ids which might be UUIDs
                        const buffaloDisplayTag = buffalo.rfid_tag || buffalo.tag_id || buffalo.rfid_tag_number;

                        // For fetching: prioritize stable IDs (animal_id, id)
                        const buffaloFetchId = String(buffalo.animal_id || buffalo.id || buffalo.rfid_tag_number);

                        let myCalves = [];
                        if (buffaloFetchId) {
                            try {
                                const calvesResponse = await farmvestService.getCalves(buffaloFetchId);

                                if (Array.isArray(calvesResponse)) {
                                    myCalves = calvesResponse;
                                } else if (calvesResponse && Array.isArray(calvesResponse.data)) {
                                    myCalves = calvesResponse.data;
                                } else if (calvesResponse && Array.isArray(calvesResponse.calves)) {
                                    myCalves = calvesResponse.calves;
                                }
                            } catch (e) {
                            }
                        }

                        return {
                            ...buffalo,
                            rfid_tag_number: buffaloDisplayTag || '-',
                            breed: buffalo.breed || buffalo.breed_name || 'Murrah',
                            age_months: buffalo.age_months || buffalo.age || (buffalo.age_in_months ? buffalo.age_in_months : 0),
                            animal_type: 'BUFFALO',
                            farm_name: (buffalo.farm && buffalo.farm.farm_name) || (buffalo.farm_details && buffalo.farm_details.farm_name) || (buffalo.Farm && buffalo.Farm.farm_name) || buffalo.farm_name || '-',
                            farm_location: (buffalo.farm && buffalo.farm.location) || (buffalo.farm_details && buffalo.farm_details.location) || (buffalo.Farm && buffalo.Farm.location) || buffalo.farm_location || buffalo.location || '',
                            associated_calves: myCalves.map((c: any) => ({
                                ...c,
                                rfid_tag_number: c.rfid || c.rfid_tag_number || c.rfidTag || c.rfid_tag || c.TagId || c.tag_id || '-',
                                age_months: c.age || c.age_months || 0,
                                animal_type: 'CALF',
                                gender: c.gender || 'Female',
                                farm_location: (c.farm && c.farm.location) || c.location || (buffalo.farm && buffalo.farm.location) || (buffalo.farm_details && buffalo.farm_details.location) || (buffalo.Farm && buffalo.Farm.location) || buffalo.farm_location || buffalo.location || ''
                            }))
                        };
                    }));

                    setAnimals(enrichedBuffaloes);
                } else {
                    setAnimals([]);
                }

            } catch (error) {
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
        <div className="p-4 max-w-full mx-auto min-h-screen">
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
                        <h1 className="text-xl font-bold text-gray-900">{investor.first_name} {investor.last_name}</h1>
                        <p className="text-gray-500 flex items-center mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${investor.active_status || investor.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {investor.active_status || investor.is_active ? 'Active Investor' : 'Inactive Investor'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
                    <User size={18} className="mr-2 text-blue-500" /> Personal Information
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h3 className="text-base font-bold text-gray-800 flex items-center">
                        <Milk size={18} className="mr-2 text-orange-500" /> Livestock Portfolio
                    </h3>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center shadow-sm border border-blue-100">
                            <span className="text-base mr-1.5">🐃</span> {animals ? animals.filter((a: any) => String(a.animal_type || a.type || '').toUpperCase() === 'BUFFALO').length : 0} Buffaloes
                        </div>
                        <div className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold flex items-center shadow-sm border border-orange-100">
                            <span className="text-base mr-1.5">🐄</span> {animals ? animals.reduce((acc, curr) => acc + (curr.associated_calves?.length || 0), 0) : 0} Calf
                        </div>
                        <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold flex items-center shadow-sm border border-green-100">
                            <span className="text-base mr-1.5">🏡</span> {animals ? new Set(animals.map((a: any) => a.farm_name || a.farm_id).filter(Boolean)).size : 0} Farms
                        </div>
                        <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold flex items-center shadow-sm border border-purple-100">
                            <span className="text-base mr-1.5">🛖</span> {animals ? new Set(animals.map(a => a.shed_name || a.shed_id).filter(Boolean)).size : 0} Sheds
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100">
                            <tr>
                                <th className="px-3 py-3 text-left w-10"></th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Tag ID</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Farm</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Shed</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Position</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Breed</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Gender</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Age (M)</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {animalsLoading ? (
                                <TableSkeleton cols={9} rows={3} />
                            ) : animals.length > 0 ? (
                                animals.map((animal: any, index: number) => (
                                    <React.Fragment key={animal.id || index}>
                                        <tr className="hover:bg-amber-50/10 transition-colors cursor-pointer border-b border-gray-50" onClick={() => toggleRow(animal.id || index)}>
                                            <td className="px-3 py-3 text-gray-400">
                                                {animal.associated_calves?.length > 0 ? (
                                                    expandedRow === (animal.id || index) ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} />
                                                ) : <div className="w-5" />}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="p-1 bg-blue-100 text-blue-600 rounded mr-2">
                                                        <Tag size={12} />
                                                    </span>
                                                    <span className="font-black text-gray-900 text-xs">{animal.rfid_tag_number}</span>
                                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-600 uppercase tracking-tighter">Buffalo</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-600 font-bold">
                                                {animal.farm_name || animal.farm?.farm_name || '-'}{animal.farm_location || animal.location ? ` - ${animal.farm_location || animal.location}` : ''}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-[11px] text-gray-500 font-bold">
                                                {animal.shed_name || animal.shed_id || (animal.shed ? animal.shed.shed_id : '-') || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-[10px] text-gray-400 font-black font-mono">
                                                {animal.position || (animal.row_number && animal.parking_id ? `${animal.row_number}-${animal.parking_id}` : (animal.parking_id || '-'))}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[11px] font-bold text-gray-600">{animal.breed}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[11px] font-bold text-gray-600">{animal.gender || 'Female'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-[11px] font-black text-gray-700">{animal.age_months}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-[11px] font-bold text-gray-500">
                                                {animal.farm_location || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-green-50 text-green-700 uppercase`}>
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                        {expandedRow === (animal.id || index) && animal.associated_calves?.length > 0 && (
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <td colSpan={10} className="p-4 pl-14">
                                                    <div className="rounded-lg border border-[#113025] bg-white overflow-hidden">
                                                        <div className="px-4 py-2 bg-[#113025] border-b border-[#113025] flex items-center">
                                                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                                                                <Milk size={14} className="mr-2 text-white" /> Associated Calf ({animal.associated_calves.length})
                                                            </span>
                                                        </div>
                                                        <table className="min-w-full divide-y divide-[#113025]/10">
                                                            <thead className="bg-[#113025]">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Tag ID</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Farm</th>
                                                                    <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Shed</th>
                                                                    <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Position</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Breed</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Gender</th>
                                                                    <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Age (Months)</th>
                                                                    <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Location</th>
                                                                    <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[#113025]/10 bg-white">
                                                                {animal.associated_calves.map((calf: any, cIndex: number) => (
                                                                    <tr key={cIndex}>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="flex items-center">
                                                                                <span className="p-1.5 bg-[#113025]/10 text-[#113025] rounded mr-2">
                                                                                    <Tag size={12} />
                                                                                </span>
                                                                                <span className="font-bold text-gray-800 text-sm">{calf.rfid_tag_number}</span>
                                                                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#113025]/10 text-[#113025] uppercase">Calf</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                                            {calf.farm_name || animal.farm_name || '-'}{calf.farm_location || animal.farm_location ? ` - ${calf.farm_location || animal.farm_location}` : ''}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                                            {calf.shed_name || calf.shed_id || animal.shed_name || animal.shed_id || '-'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-center">
                                                                            {calf.position || '-'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                            {calf.breed || animal.breed || 'Murrah'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                            {calf.gender || 'Female'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                                            {calf.age_months}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                                            {calf.farm_location || '-'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                Active
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
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
