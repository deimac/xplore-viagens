export interface Property {
    id: number;
    name: string;
    slug: string;
    description_short?: string;
    description_full?: string;
    property_type_id?: number;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    neighborhood?: string;
    city: string;
    state_region?: string;
    country: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    max_guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    area_m2?: number | string;
    active: boolean;
    is_featured?: boolean;
    created_at: string;
    updated_at: string;
    primary_image?: string;
    image_count?: number;
    rooms_count?: number;
}

export interface PropertyImage {
    id: number;
    property_id: number;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
}

export interface PropertyAmenity {
    id: number;
    name: string;
    icon?: string;
    created_at: string;
}

export interface PropertyType {
    id: number;
    name: string;
    slug: string;
    created_at: string;
}

export interface PropertyWithDetails extends Property {
    images: PropertyImage[];
    amenities: PropertyAmenity[];
}

export interface PropertyGrouped {
    [cityCountry: string]: Property[];
}

// Formulários
export interface PropertyFormData {
    name: string;
    description_short?: string;
    description_full?: string;
    property_type_id?: number;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    neighborhood?: string;
    city: string;
    state_region?: string;
    country: string;
    postal_code?: string;
    max_guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    area_m2?: number | string;
    is_featured?: boolean;
}

export interface PropertyImageUpload {
    image_url: string;
    is_primary: boolean;
    sort_order: number;
}