import * as db from "./db";

interface PropertyData {
    name: string;
    slug?: string;
    description_short?: string;
    description_full?: string;
    city: string;
    state_region?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    max_guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    active?: boolean;
}

interface PropertyImageData {
    property_id: number;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
}

interface PropertyAmenityData {
    name: string;
    icon?: string;
}

// Função para gerar slug único
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, "-") // Substitui espaços por hífens
        .replace(/-+/g, "-"); // Remove hífens múltiplos
}

// Função para garantir slug único
async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    const existingProperty = await db.getPropertyBySlug(baseSlug);

    if (!existingProperty || (excludeId && existingProperty.id === excludeId)) {
        return baseSlug;
    }

    let counter = 1;
    let newSlug = `${baseSlug}-${counter}`;

    while (true) {
        const existing = await db.getPropertyBySlug(newSlug);
        if (!existing || (excludeId && existing.id === excludeId)) {
            return newSlug;
        }
        counter++;
        newSlug = `${baseSlug}-${counter}`;
    }
}

// Funções principais
export async function createProperty(data: PropertyData) {
    const baseSlug = generateSlug(data.name);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const propertyData = {
        ...data,
        slug: uniqueSlug,
        active: data.active ?? true,
    };

    return await db.createProperty(propertyData);
}

export async function updateProperty(id: number, data: Partial<PropertyData>) {
    if (data.name) {
        const baseSlug = generateSlug(data.name);
        data.slug = await ensureUniqueSlug(baseSlug, id);
    }

    return await db.updateProperty(id, data);
}

export async function getActivePropertiesGroupedByCity() {
    const properties = await db.getActiveProperties();

    // Agrupar por cidade e país
    const grouped = properties.reduce((acc: any, property: any) => {
        const key = `${property.city}, ${property.country}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(property);
        return acc;
    }, {});

    return grouped;
}

export async function getPropertyWithDetails(slug: string) {
    const property = await db.getPropertyBySlug(slug);
    if (!property) {
        return null;
    }

    const [images, amenities] = await Promise.all([
        db.getPropertyImages(property.id),
        db.getPropertyAmenities(property.id),
    ]);

    return {
        ...property,
        images,
        amenities,
    };
}

export async function savePropertyImages(propertyId: number, images: PropertyImageData[]) {
    return await db.savePropertyImages(propertyId, images);
}

export async function createAmenity(data: PropertyAmenityData) {
    return await db.createAmenity(data);
}

export async function associatePropertyAmenities(propertyId: number, amenityIds: number[]) {
    return await db.associatePropertyAmenities(propertyId, amenityIds);
}