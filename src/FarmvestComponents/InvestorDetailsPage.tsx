import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Milk, Activity, Tag, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import TableSkeleton from '../components/common/TableSkeleton';
import Pagination from '../components/common/Pagination';

const InvestorDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [investor, setInvestor] = useState<any>(null);
    const [animals, setAnimals] = useState<any[]>([]);
    const [totalBuffaloCount, setTotalBuffaloCount] = useState(0);
    const [totalCalfCount, setTotalCalfCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [animalsLoading, setAnimalsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<number | string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 15;

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
            // Only set basic info loading on first mount or ID change
            if (!investor) setLoading(true);
            setAnimalsLoading(true);

            try {
                let currentInvestor = investor;

                // Fetch basic investor info if missing
                if (!currentInvestor) {
                    const response = await farmvestService.getAllInvestors({ page: 1, size: 5000 });
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

                    const foundInvestor = list.find((inv: any) =>
                        String(inv.id) === id || String(inv.investor_id) === id || String(inv.user_id) === id
                    );

                    if (foundInvestor) {
                        currentInvestor = {
                            ...foundInvestor,
                            first_name: foundInvestor.first_name || foundInvestor.name?.split(' ')[0] || '',
                            last_name: foundInvestor.last_name || foundInvestor.name?.split(' ').slice(1).join(' ') || '',
                            mobile: foundInvestor.mobile || foundInvestor.phone_number || '',
                            active_status: foundInvestor.active_status !== undefined ? foundInvestor.active_status : (foundInvestor.is_active !== undefined ? foundInvestor.is_active : true)
                        };
                        setInvestor(currentInvestor);
                    }
                }

                // Fetch ALL animals for this investor to get accurate total counts (independent of pagination)
                const targetId = currentInvestor ? (currentInvestor.investor_id || currentInvestor.user_id || currentInvestor.id || id) : id;

                if (targetId) {
                    try {
                        // Fetch a large page size once to get true totals
                        const summaryResponse = await farmvestService.getAnimalsByInvestor(targetId, { page: 1, size: 5000 });
                        const summaryData = Array.isArray(summaryResponse) ? summaryResponse : (summaryResponse?.data || []);

                        if (Array.isArray(summaryData)) {
                            const bCount = summaryData.filter((a: any) => {
                                const type = (a.animal_type || a.type || '').toUpperCase();
                                // Robust isCalf check matching Investors.tsx
                                const isCalf = a.is_calf === true || a.is_calf === 1 || String(a.is_calf).toLowerCase() === 'true' || type.includes('CALF');
                                return (type === 'BUFFALO' || type === 'ADULT') && !isCalf;
                            }).length;

                            const cCount = summaryData.filter((a: any) => {
                                const type = (a.animal_type || a.type || '').toUpperCase();
                                const isCalf = a.is_calf === true || a.is_calf === 1 || String(a.is_calf).toLowerCase() === 'true' || type.includes('CALF');
                                return isCalf;
                            }).length;

                            // Also count calves nested inside buffaloes if any (handling all potential keys)
                            const nestedCalvesCount = summaryData.reduce((acc: number, curr: any) => {
                                const calves = curr.associated_calves || curr.calves || curr.calf_list;
                                return acc + (Array.isArray(calves) ? Number(calves.length) : 0);
                            }, 0);

                            setTotalBuffaloCount(bCount);
                            setTotalCalfCount(cCount + nestedCalvesCount);
                        }
                    } catch (e) {
                        console.warn('Failed to fetch summary counts:', e);
                    }

                    // Fetch paginated animals for the table
                    const params = { page: currentPage, size: itemsPerPage };
                    const animalsResponse = await farmvestService.getAnimalsByInvestor(targetId, params);

                    let allAnimals = Array.isArray(animalsResponse) ? animalsResponse : (animalsResponse?.data || []);

                    if (animalsResponse && !Array.isArray(animalsResponse)) {
                        const pagination = animalsResponse.pagination || animalsResponse.data?.pagination;
                        const total = pagination?.total_items ||
                            pagination?.total_count ||
                            animalsResponse.total_items ||
                            animalsResponse.total_count ||
                            animalsResponse.total ||
                            animalsResponse.count ||
                            (Array.isArray(animalsResponse.data) ? animalsResponse.data.length : 0);

                        setTotalPages(Math.ceil(total / itemsPerPage));
                    }

                    if (!Array.isArray(allAnimals)) allAnimals = [];

                    if (allAnimals.length > 0) {
                        // 1. Extract all animals that are definitely buffaloes
                        const buffaloes = allAnimals.filter((a: any) => {
                            const type = (a.animal_type || a.type || '').toUpperCase();
                            const isCalf = a.is_calf === true || a.is_calf === 1 || String(a.is_calf).toLowerCase() === 'true' || type.includes('CALF');
                            return (type === 'BUFFALO' || type === 'ADULT') && !isCalf;
                        });

                        // 2. Extract all animals that are definitely calves (from flat list)
                        const flatCalves = allAnimals.filter((a: any) => {
                            const type = (a.animal_type || a.type || '').toUpperCase();
                            const isCalf = a.is_calf === true || a.is_calf === 1 || String(a.is_calf).toLowerCase() === 'true' || type.includes('CALF');
                            return isCalf;
                        });

                        // 3. Map calves to mothers
                        const calvesByMother: Record<string, any[]> = {};

                        // Process flat calves
                        flatCalves.forEach((calf: any) => {
                            const motherId = String(calf.mother_id || calf.parent_id || calf.buffalo_id || calf.buffalo_tag || '');
                            if (motherId) {
                                if (!calvesByMother[motherId]) calvesByMother[motherId] = [];
                                calvesByMother[motherId].push(calf);
                            }
                        });

                        const enrichedBuffaloes = buffaloes.map((buffalo: any) => {
                            const buffaloId = String(buffalo.id || '');
                            const buffaloTag = String(buffalo.rfid_tag || buffalo.tag_id || buffalo.rfid_tag_number || '');

                            // Get calves from different sources: flat list match or pre-nested
                            const matchedFromFlat = (calvesByMother[buffaloId] || []).concat(buffaloTag ? (calvesByMother[buffaloTag] || []) : []);
                            const preNested = buffalo.associated_calves || buffalo.calves || buffalo.calf_list || [];

                            // Combine and remove duplicates (by tag if available)
                            const combined = [...preNested, ...matchedFromFlat];
                            const uniqueCalves = Array.from(new Map(combined.map(c => [c.rfid_tag || c.tag_id || c.rfid || c.id, c])).values());

                            return {
                                ...buffalo,
                                rfid_tag_number: buffalo.rfid_tag || buffalo.tag_id || buffalo.rfid_tag_number || '-',
                                breed: buffalo.breed || buffalo.breed_name || 'Murrah',
                                age_months: buffalo.age_months || buffalo.age || 0,
                                animal_type: 'BUFFALO',
                                farm_name: buffalo.farm?.farm_name || buffalo.farm_details?.farm_name || buffalo.farm_name || '-',
                                associated_calves: uniqueCalves.map((c: any) => ({
                                    ...c,
                                    rfid_tag_number: c.rfid || c.rfid_tag || c.tag_id || '-',
                                    age_months: c.age || c.age_months || 0,
                                    animal_type: 'CALF'
                                }))
                            };
                        });
                        setAnimals(enrichedBuffaloes);
                    } else {
                        setAnimals([]);
                    }
                }

            } catch (error) {
                console.warn('Failed to fetch details:', error);
            } finally {
                setLoading(false);
                setAnimalsLoading(false);
            }
        };

        fetchDetails();
    }, [id, currentPage]);

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
        <div className="h-screen bg-gray-50 p-2 md:p-3 flex flex-col overflow-hidden gap-2">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-2">
                {/* Header */}
                <div className="flex-none">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-400 hover:text-gray-600 transition-colors mb-2 text-[11px] font-medium"
                    >
                        <ArrowLeft size={14} className="mr-1.5" /> Back to Investors
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{investor.first_name} {investor.last_name}</h1>
                        <p className="text-gray-500 flex items-center text-[10px] font-bold uppercase tracking-wider">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${investor.active_status || investor.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {investor.active_status || investor.is_active ? 'Active Investor' : 'Inactive Investor'}
                        </p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="flex-none bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                    <h3 className="text-[10px] font-black text-slate-700 mb-3 flex items-center uppercase tracking-widest">
                        <User size={12} className="mr-1.5 text-blue-600" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start">
                            <Mail className="text-slate-400 mt-0.5 mr-2" size={14} />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Email Address</p>
                                <p className="text-xs text-slate-900 font-bold">{investor.email || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <Phone className="text-slate-400 mt-0.5 mr-2" size={14} />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Phone Number</p>
                                <p className="text-xs text-slate-900 font-bold">{investor.mobile || investor.phone_number || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <Calendar className="text-slate-400 mt-0.5 mr-2" size={14} />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Joined Date</p>
                                <p className="text-xs text-slate-900 font-bold">{investor.created_at ? new Date(investor.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Investments / Animals Section */}
                <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col overflow-hidden">
                    <div className="flex-none flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
                        <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest">
                            <Milk size={16} className="mr-1.5 text-orange-600" /> Livestock Portfolio
                        </h3>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center">
                                <span className="mr-1.5">🐃</span> <span className="text-blue-900 font-black">{totalBuffaloCount}</span> <span className="ml-1">Buffaloes</span>
                            </div>
                            <div className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold flex items-center">
                                <span className="mr-1.5">🐄</span> <span className="text-orange-900 font-black">{totalCalfCount}</span> <span className="ml-1">Calves</span>
                            </div>
                            <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold flex items-center">
                                <span className="text-[10px] uppercase mr-1.5 text-green-600 font-black tracking-wider">Total Animals:</span>
                                <span className="text-green-900 font-black">{totalBuffaloCount + totalCalfCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 rounded-xl border border-gray-50 overflow-hidden bg-white flex flex-col">
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                            <table className="min-w-full divide-y divide-gray-100 table-fixed">
                                <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-1.5 text-left w-10 bg-slate-50"></th>
                                        <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Tag ID</th>
                                        <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Farm</th>
                                        <th className="px-4 py-1.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Shed</th>
                                        <th className="px-4 py-1.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Pos.</th>
                                        <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Breed</th>
                                        <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Gender</th>
                                        <th className="px-4 py-1.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Age (M)</th>
                                        <th className="px-4 py-1.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Location</th>
                                        <th className="px-4 py-1.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {animalsLoading ? (
                                        <TableSkeleton cols={10} rows={15} />
                                    ) : animals.length > 0 ? (
                                        animals.map((animal: any, index: number) => (
                                            <React.Fragment key={animal.id || index}>
                                                <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-gray-50 group" onClick={() => toggleRow(animal.id || index)}>
                                                    <td className="px-3 py-1.5 text-gray-400 group-hover:text-amber-600 transition-colors">
                                                        {animal.associated_calves?.length > 0 ? (
                                                            expandedRow === (animal.id || index) ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} />
                                                        ) : <div className="w-5" />}
                                                    </td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="p-1 bg-blue-100/50 text-blue-600 rounded mr-2">
                                                                <Tag size={12} />
                                                            </span>
                                                            <span className="font-bold text-slate-900 text-xs">{animal.rfid_tag_number}</span>
                                                            <span className="ml-2 px-1 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 uppercase">Buffalo</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-xs text-slate-600 font-bold">
                                                        {animal.farm_name || animal.farm?.farm_name || '-'}{animal.farm_location || animal.location ? ` - ${animal.farm_location || animal.location}` : ''}
                                                    </td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-center text-xs text-slate-500 font-bold">
                                                        {animal.shed_name || animal.shed_id || (animal.shed ? animal.shed.shed_id : '-') || '-'}
                                                    </td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-center text-xs text-slate-400 font-bold font-mono">
                                                        {animal.position || (animal.row_number && animal.parking_id ? `${animal.row_number}-${animal.parking_id}` : (animal.parking_id || '-'))}
                                                    </td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-xs font-bold text-slate-600">{animal.breed}</td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-xs font-bold text-slate-600">{animal.gender || 'Female'}</td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-center text-xs font-bold text-slate-700">{animal.age_months}</td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-center text-xs font-bold text-slate-500">
                                                        {animal.farm_location || '-'}
                                                    </td>
                                                    <td className="px-4 py-1.5 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                                                            Active
                                                        </span>
                                                    </td>
                                                </tr>
                                                {expandedRow === (animal.id || index) && animal.associated_calves?.length > 0 && (
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={10} className="p-2 pl-10 pr-4">
                                                            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-2">
                                                                <div className="px-3 py-1.5 bg-slate-50/80 border-b border-gray-50 flex items-center justify-between">
                                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center">
                                                                        <Milk size={14} className="mr-2 text-orange-500" /> Associated Calf ({animal.associated_calves.length})
                                                                    </span>
                                                                </div>
                                                                <table className="min-w-full divide-y divide-slate-100">
                                                                    <thead className="bg-slate-50/30">
                                                                        <tr>
                                                                            <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tag ID</th>
                                                                            <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Farm</th>
                                                                            <th className="px-4 py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shed</th>
                                                                            <th className="px-4 py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pos.</th>
                                                                            <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Breed</th>
                                                                            <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</th>
                                                                            <th className="px-4 py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age</th>
                                                                            <th className="px-4 py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loc.</th>
                                                                            <th className="px-4 py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50 bg-white">
                                                                        {animal.associated_calves.map((calf: any, cIndex: number) => (
                                                                            <tr key={cIndex} className="hover:bg-amber-50/5 transition-colors">
                                                                                <td className="px-4 py-2 whitespace-nowrap">
                                                                                    <div className="flex items-center">
                                                                                        <span className="p-1 bg-slate-100/50 text-slate-400 rounded mr-2">
                                                                                            <Tag size={10} />
                                                                                        </span>
                                                                                        <span className="font-bold text-slate-800 text-xs">{calf.rfid_tag_number}</span>
                                                                                        <span className="ml-2 px-1 py-0.5 rounded text-[8px] font-black bg-orange-50 text-orange-600 uppercase">Calf</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500 font-bold">
                                                                                    {calf.farm_name || animal.farm_name || '-'}{calf.farm_location || animal.farm_location ? ` - ${calf.farm_location || animal.farm_location}` : ''}
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500 text-center font-bold">
                                                                                    {calf.shed_name || calf.shed_id || animal.shed_name || animal.shed_id || '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400 font-mono text-center font-bold font-mono">
                                                                                    {calf.position || '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500 font-bold">
                                                                                    {calf.breed || animal.breed || 'Murrah'}
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500 font-bold">
                                                                                    {calf.gender || 'Female'}
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-slate-600 font-bold font-mono">
                                                                                    {calf.age_months}
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-slate-400 font-bold">
                                                                                    {calf.farm_location || '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-50 text-emerald-600 uppercase">
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
                                            <td colSpan={10} className="py-12 text-center text-gray-400 text-sm">
                                                No active livestock portfolio found for this investor.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination Container - Separate from Card */}
            {totalPages > 1 && (
                <div className="flex-none flex justify-end items-center py-1 px-4">
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

export default InvestorDetailsPage;
