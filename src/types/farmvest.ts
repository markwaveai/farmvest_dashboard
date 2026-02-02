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
}
