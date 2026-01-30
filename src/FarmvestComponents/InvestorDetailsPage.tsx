import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { fetchInvestors } from '../store/slices/farmvest/investors';
import { fetchEmployees } from '../store/slices/farmvest/employees';
import { farmvestService } from '../services/farmvest_api';
import { User, ArrowLeft, Mail, Phone, Calendar, TrendingUp, Warehouse, Tractor, Stethoscope, Users, MapPin, Filter } from 'lucide-react';

const InvestorDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { investors, loading } = useAppSelector((state: RootState) => state.farmvestInvestors);
    // const { employees } = useAppSelector((state: RootState) => state.farmvestEmployees); // Don't use Redux state as it might be paginated
    const [allEmployees, setAllEmployees] = useState<any[]>([]); // Local state for full list
    const [investor, setInvestor] = useState<any>(null);
    const [investorAnimals, setInvestorAnimals] = useState<any[]>([]);
    const [farmsMap, setFarmsMap] = useState<Record<number, string>>({});
    const [shedsMap, setShedsMap] = useState<Record<number, string>>({}); // Cache shed names
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

    // Filter State
    const [filterType, setFilterType] = useState<'ALL' | 'BUFFALO' | 'CALF'>('ALL');

    useEffect(() => {
        if (investors.length === 0) {
            dispatch(fetchInvestors(undefined));
        }
    }, [dispatch, investors.length]);

    useEffect(() => {
        if (id && investors.length > 0) {
            const found = investors.find((inv: any) => String(inv.id) === id);
            setInvestor(found || null);
        }
    }, [id, investors]);

    // Fetch Animals and Employees on load
    useEffect(() => {
        const fetchDetails = async () => {
            if (!investor) return;

            setLoadingDetails(true);
            try {
                // 1. Fetch Investor's Animals (Buffaloes)
                const animalData = await farmvestService.getAnimalsByInvestor(Number(investor.id));
                // The API returns { status, count, data: [...] } or just [...]
                const buffaloes = Array.isArray(animalData) ? animalData : (animalData.data || []);

                // 2. Fetch Calves for each Buffalo and Attach
                const buffaloesWithCalves = await Promise.all(buffaloes.map(async (buffalo: any) => {
                    const rfid = buffalo.rfid_tag_number || buffalo.rfid_tag;
                    let linkedCalves: any[] = [];
                    if (rfid) {
                        const calves = await farmvestService.getCalves(rfid);
                        linkedCalves = Array.isArray(calves) ? calves : (calves.data || []);
                    }
                    return { ...buffalo, linkedCalves };
                }));

                setInvestorAnimals(buffaloesWithCalves);

                // 2. Fetch All Employees internally (to avoid pagination issues from Redux store)
                try {
                    const empResponse = await farmvestService.getEmployees({ size: 1000 });
                    let rawEmps: any[] = [];
                    if (Array.isArray(empResponse)) rawEmps = empResponse;
                    else if (empResponse && Array.isArray(empResponse.data)) rawEmps = empResponse.data;
                    else if (empResponse && (empResponse.users || empResponse.employees)) rawEmps = empResponse.users || empResponse.employees;

                    if (rawEmps.length > 0) {
                        // Normalize for lookup
                        const mappedEmps = rawEmps.map((e: any) => ({
                            ...e,
                            farm_id: e.farm_id || (e.farm && e.farm.id),
                            roles: e.roles || (e.role ? [e.role] : ['Investor'])
                        }));
                        setAllEmployees(mappedEmps);
                    }
                } catch (e) {
                    console.error("Failed to load employees for details", e);
                }

                // 3. Fetch Farms to map IDs to Names and Sheds
                const farmsData = await farmvestService.getAllFarms();
                const farmsList = Array.isArray(farmsData) ? farmsData : (farmsData.farms || farmsData.data || []);

                const fMap: Record<number, string> = {};
                farmsList.forEach((f: any) => {
                    const fId = f.farm_id || f.id;
                    fMap[fId] = f.farm_name || f.name;
                });
                setFarmsMap(fMap);

                // 4. Fetch Sheds specifically for farms involved (since getAllFarms might not have sheds)
                const uniqueFarmIds = Array.from(new Set(buffaloesWithCalves.map(a => a.farm_id).filter(id => id)));
                const sMap: Record<number, string> = {};

                await Promise.all(uniqueFarmIds.map(async (fId: any) => {
                    try {
                        const shedsData = await farmvestService.getShedList(fId);
                        const shedsList: any[] = Array.isArray(shedsData) ? shedsData : (shedsData.data || []); // Handle different responses
                        shedsList.forEach((s: any) => {
                            sMap[s.shed_id || s.id] = s.shed_name || s.name;
                        });
                    } catch (e) {
                        console.error(`Failed to load sheds for farm ${fId}`, e);
                    }
                }));
                setShedsMap(sMap);

            } catch (err) {
                console.error("Failed to load investment details", err);
            } finally {
                setLoadingDetails(false);
            }
        };

        if (investor) {
            fetchDetails();
        }
    }, [investor, dispatch]);

    const toggleRow = (idx: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    // Calculate Counts
    const buffaloCount = investorAnimals.filter(a => (a.animal_type || 'BUFFALO') !== 'CALF').length;
    const calfCount = investorAnimals.reduce((acc, curr) => {
        const children = curr.linkedCalves?.length || 0;
        const isSelfCalf = curr.animal_type === 'CALF';
        return acc + children + (isSelfCalf ? 1 : 0);
    }, 0);
    const totalAnimals = buffaloCount + calfCount;

    const getEmployeeByRoleAndFarm = (role: string, farmId: number) => {
        // Look up in local allEmployees list
        // console.log(`[Lookup] Role: ${role}, FarmId: ${farmId}, Total Employees: ${allEmployees.length}`);

        const found = allEmployees.find((e: any) => {
            const roles = e.roles || [];
            // Check exact or case-insensitive
            const hasRole = roles.includes(role) || roles.some((r: string) => r.toLowerCase() === role.toLowerCase());

            // Check where farm_id might be located (normalized during fetch)
            const empFarmId = e.farm_id;

            if (hasRole) {
                // console.log(`[Match Attempt] Role: ${role}, EmpFarm: ${empFarmId} vs Target: ${farmId} -> Match? ${Number(empFarmId) === Number(farmId)}`);
            }

            return hasRole && Number(empFarmId) === Number(farmId);
        });
        // DEBUG: Show Farm ID if not found
        return found ? `${found.first_name || ''} ${found.last_name || ''}`.trim() : `Not Assigned (F:${farmId})`;
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading && !investor) {
        return (
            <div className="p-6">
                <button onClick={handleBack} className="flex items-center text-gray-600 mb-6 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Investors
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

    if (!investor && !loading) {
        return (
            <div className="p-6 text-center">
                <button onClick={handleBack} className="flex items-center text-gray-600 mb-6 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Investors
                </button>
                <h2 className="text-xl font-semibold text-gray-700">Investor not found</h2>
            </div>
        );
    }

    // Filter Logic
    const getFilteredAnimals = () => {
        if (filterType === 'CALF') {
            // Flatten all calves into a single list
            return investorAnimals.flatMap(parent => {
                const parentFarmId = parent.farm_id;
                const parentShedId = parent.shed_id;
                const parentPosition = parent.shed_position || parent.position;

                return (parent.linkedCalves || []).map((calf: any) => ({
                    ...calf,
                    isCalf: true,
                    // Ensure calf has parent-inherited details if missing
                    farm_id: calf.farm_id || parentFarmId,
                    shed_id: calf.shed_id || parentShedId,
                    shed_position: calf.shed_position || calf.position || parentPosition,
                    animal_type: 'CALF',
                    // Preserve parent details for reference if needed
                    parent_rfid: parent.rfid_tag_number || parent.rfid_tag
                }));
            });
        } else if (filterType === 'BUFFALO') {
            // Show only Buffalo rows (parents). 
            // Strictly exclude any top-level items that are explicitly CALF
            return investorAnimals.filter((a: any) => (a.animal_type || 'BUFFALO') !== 'CALF');
        }
        // ALL: Show parents (which contain children)
        return investorAnimals;
    };

    const filteredList = getFilteredAnimals();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button
                onClick={handleBack}
                className="flex items-center text-gray-600 mb-6 hover:text-blue-600 transition-colors font-medium"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Investors
            </button>

            {investor && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-white px-8 py-8 border-b border-blue-100">
                        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {investor.first_name} {investor.last_name}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                            {investor.roles?.[0] || 'Investor'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${investor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {investor.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Investor ID</p>
                                <p className="text-xl font-mono font-bold text-gray-800">#{investor.id}</p>
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
                                            {investor.email || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Mobile Number</label>
                                        <div className="text-gray-900 font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-300" />
                                            {investor.mobile || investor.phone_number || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Details */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    System Metadata
                                </h3>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Joined Date</label>
                                        <div className="text-gray-900 font-medium flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-300" />
                                            {investor.created_at ? new Date(investor.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Role</label>
                                        <div className="text-gray-900 font-medium">
                                            {investor.roles?.join(', ') || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Investment Details Section */}
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 m-0">
                                    <Warehouse size={20} className="text-blue-600" />
                                    Investment Units
                                    <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        Total Animals: {totalAnimals}
                                        <span className="text-gray-400 mx-1">|</span>
                                        Buffalo: {buffaloCount}
                                        <span className="text-gray-400 mx-1">|</span>
                                        Calf: {calfCount}
                                    </span>
                                </h3>

                                {/* Filter Dropdown */}
                                <div className="relative flex items-center gap-2">
                                    <Filter size={18} className="text-gray-500" />
                                    <select
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[150px] outline-none transition-all hover:bg-white"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                    >
                                        <option value="ALL">All Animals</option>
                                        <option value="BUFFALO">Buffalo Only</option>
                                        <option value="CALF">Calf Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold w-10"></th>
                                                <th className="px-6 py-3 font-semibold">Animal ID / RFID</th>
                                                <th className="px-6 py-3 font-semibold">Shed</th>
                                                <th className="px-6 py-3 font-semibold">Farm</th>
                                                <th className="px-6 py-3 font-semibold">Position</th>
                                                <th className="px-6 py-3 font-semibold">Doctor</th>
                                                <th className="px-6 py-3 font-semibold">Manager</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingDetails ? (
                                                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading investment details...</td></tr>
                                            ) : filteredList.length === 0 ? (
                                                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No investment records found for this filter.</td></tr>
                                            ) : (
                                                filteredList.map((animal: any, idx) => {
                                                    const farmId = animal.farm_id;
                                                    const farmName = animal.farm_name || farmsMap[farmId] || `Farm #${farmId}`;
                                                    const shedId = animal.shed_id;
                                                    const shedName = animal.shed_name || shedsMap[shedId] || (shedId ? `Shed #${shedId}` : 'N/A');
                                                    const position = animal.shed_position || animal.position || 'N/A';
                                                    const isExpanded = expandedRows[idx];
                                                    const isCalfRow = animal.isCalf;
                                                    // Modification: If filter is ALL, allow expansion. If BUFFALO, disable expansion (effectively hiding calves).
                                                    const hasCalves = !isCalfRow && animal.linkedCalves && animal.linkedCalves.length > 0 && filterType === 'ALL';

                                                    return (
                                                        <React.Fragment key={idx}>
                                                            <tr
                                                                className={`bg-white border-b hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}
                                                                onClick={() => hasCalves && toggleRow(idx)}
                                                                style={{ cursor: hasCalves ? 'pointer' : 'default' }}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    {hasCalves ? (
                                                                        <div className={`p-1 rounded-full transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                                            <ArrowLeft size={16} className={`transform transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
                                                                        </div>
                                                                    ) : <div className="w-6"></div>}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-medium text-gray-900">{animal.rfid_tag_number || animal.rfid_tag || animal.animal_id || 'N/A'}</div>
                                                                    <div className="text-xs text-gray-400 mt-0.5">{animal.animal_type || (isCalfRow ? 'CALF' : 'BUFFALO')}</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Warehouse size={14} className="text-blue-500" />
                                                                        <span>{shedName}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Tractor size={14} className="text-green-600" />
                                                                        <span>{farmName}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-100">
                                                                        {position}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Stethoscope size={14} className="text-red-500" />
                                                                        <span className="text-gray-700">{getEmployeeByRoleAndFarm('DOCTOR', farmId)}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={14} className="text-orange-500" />
                                                                        <span className="text-gray-700">{getEmployeeByRoleAndFarm('FARM_MANAGER', farmId)}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {isExpanded && hasCalves && (
                                                                <tr className="bg-gray-50/50">
                                                                    <td colSpan={8} className="px-6 py-4 border-b border-gray-100">
                                                                        <div className="ml-10 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                                Linked Calves ({animal.linkedCalves.length})
                                                                            </h4>
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-sm text-left text-gray-500">
                                                                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                                                                                        <tr>
                                                                                            <th className="px-4 py-2 font-semibold">Calf RFID</th>
                                                                                            <th className="px-4 py-2 font-semibold">Shed</th>
                                                                                            <th className="px-4 py-2 font-semibold">Farm</th>
                                                                                            <th className="px-4 py-2 font-semibold">Position</th>
                                                                                            <th className="px-4 py-2 font-semibold">Doctor</th>
                                                                                            <th className="px-4 py-2 font-semibold">Manager</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {animal.linkedCalves.map((calf: any, cIdx: number) => {
                                                                                            // Map fields for calf, similar to parent
                                                                                            const cFarmId = calf.farm_id || farmId; // Fallback to parent farm if missing
                                                                                            const cFarmName = calf.farm_name || farmsMap[cFarmId] || farmName;
                                                                                            const cShedId = calf.shed_id || shedId;
                                                                                            const cShedName = calf.shed_name || shedsMap[cShedId] || shedName;
                                                                                            const cPosition = calf.shed_position || calf.position || position; // Fallback to parent position

                                                                                            return (
                                                                                                <tr key={cIdx} className="bg-white border-b hover:bg-gray-50">
                                                                                                    <td className="px-4 py-2">
                                                                                                        <div className="font-medium text-gray-900">{calf.rfid_tag_number || calf.rfid_tag || 'N/A'}</div>
                                                                                                        <div className="text-xs text-gray-400">CALF</div>
                                                                                                    </td>
                                                                                                    <td className="px-4 py-2">{cShedName}</td>
                                                                                                    <td className="px-4 py-2">{cFarmName}</td>
                                                                                                    <td className="px-4 py-2">
                                                                                                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                                                                                                            {cPosition}
                                                                                                        </span>
                                                                                                    </td>
                                                                                                    <td className="px-4 py-2">{getEmployeeByRoleAndFarm('DOCTOR', cFarmId)}</td>
                                                                                                    <td className="px-4 py-2">{getEmployeeByRoleAndFarm('FARM_MANAGER', cFarmId)}</td>
                                                                                                </tr>
                                                                                            );
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestorDetailsPage;
