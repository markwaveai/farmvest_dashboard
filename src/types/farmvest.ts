export interface FarmvestEmployee {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    mobile?: string;
    roles?: string[];
    role?: string;
    total_investment?: number;
    address?: string | null;
    active_status: number | boolean;
    is_active?: number | boolean;
    shed_id?: number | string;
    shed_name?: string;
    farm_name?: string;
    shed?: {
        id: number;
        shed_id: string;
        shed_name?: string;
    };
    farm?: {
        farm_name: string;
    };
    joining_date?: string;
}

export interface FarmvestPagination {
    current_page: number;
    items_per_page: number;
    total_pages: number;
    total_items: number;
}

export interface FarmvestApiResponse<T> {
    message: string;
    status: number;
    data: T;
    pagination?: FarmvestPagination;
}

export interface FarmvestFarm {
    id: number;
    farm_name: string;
    location: string;
    total_buffaloes_count: number;
    farm_manager_name?: string;
    mobile_number?: string;
    sheds_count?: number;
}

// ============ TICKET TYPES ============

export type TicketType = 'HEALTH' | 'TRANSFER' | 'VACCINATION';
export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'RESOLVED' | 'REJECTED';
export type TicketPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
export type TransferDirection = 'IN' | 'OUT';

export type BuffaloDiseaseEnum =
    | 'ANESTRUS' | 'REPEAT_BREEDING_SYNDROME' | 'METRITIS' | 'ENDOMETRITIS' | 'RETAINED_PLACENTA' | 'OVARIAN_CYSTS' | 'ABORTION'
    | 'MASTITIS' | 'CLINICAL_MASTITIS' | 'SUBCLINICAL_MASTITIS' | 'TEAT_INJURY' | 'UDDER_EDEMA'
    | 'MILK_FEVER' | 'KETOSIS' | 'ACIDOSIS' | 'MINERAL_DEFICIENCY' | 'ANEMIA'
    | 'FOOT_AND_MOUTH_DISEASE' | 'HEMORRHAGIC_SEPTICEMIA' | 'BLACK_QUARTER' | 'BRUCELLOSIS' | 'TUBERCULOSIS' | 'JOHNES_DISEASE'
    | 'INTERNAL_PARASITES' | 'EXTERNAL_PARASITES' | 'TRYPANOSOMIASIS'
    | 'BLOAT' | 'INDIGESTION' | 'DIARRHEA' | 'RUMEN_IMPACTION'
    | 'FOOT_ROT' | 'LAMINITIS' | 'OVERGROWN_HOOVES' | 'LAMENESS'
    | 'FEVER' | 'RESPIRATORY_INFECTION' | 'HEAT_STRESS';

export interface FarmvestTicket {
    id: number;
    case_id: string;
    animal_id: number;
    animal_display_id: string;
    animal_tag: string;
    parking_id: number;
    ticket_type: TicketType;
    description: string;
    disease: string[];
    status: TicketStatus;
    priority: TicketPriority;
    transfer_direction?: TransferDirection;
    source_shed_id?: number;
    destination_shed_id?: number;
    row_number?: string;
    created_by: number;
    assigned_staff_name?: string;
    doctor_id?: number;
    assistant_doctor_id?: number;
    approved_by?: number;
    approved_at?: string;
    images: string[];
    created_at: string;
    modified_at: string;
}

export interface TicketStats {
    health_tickets: { total: number; pending: number; in_progress: number; completed: number };
    vaccination_tickets: { total: number; pending: number; in_progress: number; completed: number };
}

export interface TicketCreatePayload {
    animal_id: string;
    description: string;
    disease?: BuffaloDiseaseEnum[];
    transfer_direction?: TransferDirection;
    source_shed_id?: number;
    destination_shed_id?: number;
    row_number?: string;
    images?: string[];
    image_url?: string;
    priority?: TicketPriority;
}

// ============ MILK TYPES ============

export type MilkTiming = 'MORNING' | 'EVENING';

export interface MilkEntry {
    id: number;
    farm_id: number;
    shed_id: number;
    animal_id?: number;
    timing: MilkTiming;
    quantity: number;
    entry_date: string;
    created_by: number;
    start_date: string;
    end_date: string;
}

export interface MilkEntryCreatePayload {
    start_date: string;
    end_date: string;
    timing: MilkTiming;
    animal_id?: number;
    quantity: number;
}

// ============ LEAVE TYPES ============

export type LeaveType = 'CASUAL' | 'SICK' | 'ANNUAL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
    id: number;
    user_id?: number;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason: string;
    status: LeaveStatus;
    approved_by?: number;
    approved_at?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at?: string;
}

export interface LeaveRequestCreatePayload {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason: string;
}

// ============ EMPLOYEE UPDATE TYPES ============

export interface EmployeeUpdatePayload {
    user_id: number;
    role: string;
    farm_id: number;
    shed_id?: number;
}

export interface UserDetailsUpdatePayload {
    name?: string;
    email?: string;
    address?: string;
    profile?: string;
}

// ============ FARM DETAIL TYPES ============

export interface FarmDetail {
    id: number;
    farm_name: string;
    location: string;
    total_sheds_count: number;
    total_buffaloes_count: number;
    unallocated_buffaloes_count: number;
    farm_manager?: {
        user_id: number;
        name: string;
        mobile: string;
        email: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        employment_status?: string;
    };
    sheds?: Array<{
        id: number;
        shed_name: string;
        capacity: number;
        buffaloes_count: number;
    }>;
}

export interface FarmStaffMember {
    id: number;
    name: string;
    mobile: string;
    email: string;
    status: string;
    farm_name: string;
    shed_name?: string;
    location: string;
}
