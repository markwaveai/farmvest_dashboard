import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Search, Filter, ChevronRight, Clock, MapPin } from 'lucide-react';

const AlertsManagement: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

    const alerts = [
        {
            id: 1,
            title: 'Critical: Feed Level Low',
            description: 'Shed 04 feed level is below 15%. Refill required within 4 hours.',
            type: 'critical',
            time: '12 mins ago',
            location: 'Farm Alpha - Shed 04',
            status: 'unresolved'
        },
        {
            id: 2,
            title: 'Warning: Temperature Variance',
            description: 'Shed 02 temperature is 2°C above optimal range.',
            type: 'warning',
            time: '45 mins ago',
            location: 'Farm Beta - Shed 02',
            status: 'unresolved'
        },
        {
            id: 3,
            title: 'Info: Routine Vaccination Scheduled',
            description: 'Routine FMD vaccination for Shed 01 scheduled for tomorrow 9:00 AM.',
            type: 'info',
            time: '2 hours ago',
            location: 'Farm Alpha - Shed 01',
            status: 'resolved'
        },
        {
            id: 4,
            title: 'Critical: Water Pump Failure',
            description: 'Main water pump in Farm Gamma is not responding. Immediate attention required.',
            type: 'critical',
            time: '4 hours ago',
            location: 'Farm Gamma - Main Hub',
            status: 'unresolved'
        }
    ];

    const filteredAlerts = activeFilter === 'all'
        ? alerts
        : alerts.filter(a => a.type === activeFilter);

    return (
        <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh', color: '#111827' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>Alerts Management</h2>
                    <p style={{ color: '#6B7280', margin: 0, fontSize: '0.875rem' }}>Monitor and respond to critical farm events in real-time.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search alerts..."
                            style={{ padding: '10px 12px 10px 40px', borderRadius: '10px', border: '1px solid #E5E7EB', outline: 'none', width: '250px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} label="All Alerts" count={alerts.length} />
                <FilterButton active={activeFilter === 'critical'} onClick={() => setActiveFilter('critical')} label="Critical" count={alerts.filter(a => a.type === 'critical').length} color="#EF4444" />
                <FilterButton active={activeFilter === 'warning'} onClick={() => setActiveFilter('warning')} label="Warnings" count={alerts.filter(a => a.type === 'warning').length} color="#F59E0B" />
                <FilterButton active={activeFilter === 'info'} onClick={() => setActiveFilter('info')} label="Information" count={alerts.filter(a => a.type === 'info').length} color="#3B82F6" />
            </div>

            {/* Alerts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredAlerts.map(alert => (
                    <div key={alert.id} style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid #F3F4F6',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                        }}>
                        <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: alert.type === 'critical' ? '#FEF2F2' : alert.type === 'warning' ? '#FFFBEB' : '#EFF6FF',
                            color: alert.type === 'critical' ? '#EF4444' : alert.type === 'warning' ? '#F59E0B' : '#3B82F6'
                        }}>
                            {alert.type === 'critical' ? <AlertTriangle size={24} /> : alert.type === 'warning' ? <Bell size={24} /> : <Info size={24} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'semiblod' }}>{alert.title}</h4>
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> {alert.time}
                                </span>
                            </div>
                            <p style={{ margin: '0 0 12px 0', color: '#4B5563', fontSize: '0.925rem', lineHeight: '1.5' }}>{alert.description}</p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={14} /> {alert.location}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: alert.status === 'resolved' ? '#dcfce7' : '#f3f4f6',
                                    color: alert.status === 'resolved' ? '#166534' : '#6b7280',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                }}>
                                    {alert.status}
                                </span>
                            </div>
                        </div>
                        <button style={{ backgroundColor: 'transparent', border: 'none', color: '#D1D5DB', padding: '4px', cursor: 'pointer' }}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FilterButton: React.FC<{ active: boolean, onClick: () => void, label: string, count: number, color?: string }> = ({ active, onClick, label, count, color = '#111827' }) => {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px 16px',
                borderRadius: '10px',
                backgroundColor: active ? (color === '#111827' ? '#111827' : color) : 'white',
                color: active ? 'white' : '#4B5563',
                border: active ? 'none' : '1px solid #E5E7EB',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
            }}>
            {label}
            <span style={{
                backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.75rem'
            }}>{count}</span>
        </button>
    );
};

export default AlertsManagement;
