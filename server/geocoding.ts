/**
 * Geocoding service - Simple Google Geocoding API integration
 * 
 * RULES:
 * - Only called explicitly from admin
 * - No automatic geocoding on save
 * - No loops or batch processing
 * - Simple error handling
 */

import { ENV } from './_core/env';

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    formattedAddress: string;
}

/**
 * Build address string from components
 */
export function buildAddressString(components: {
    address_street?: string;
    address_number?: string;
    neighborhood?: string;
    city: string;
    state_region?: string;
    country: string;
}): string {
    const parts = [
        components.address_street,
        components.address_number,
        components.neighborhood,
        components.city,
        components.state_region,
        components.country,
    ].filter(Boolean);

    return parts.join(', ');
}

/**
 * Geocode an address using Google Geocoding API
 * 
 * @param address - Full address string
 * @returns Latitude, longitude, and formatted address
 * @throws Error if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
    const apiKey = ENV.googleMapsApiKey;

    if (!apiKey) {
        throw new Error('Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY in .env');
    }

    if (!address || address.trim().length === 0) {
        throw new Error('Address is required for geocoding');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Google Geocoding API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== 'OK') {
            if (data.status === 'ZERO_RESULTS') {
                throw new Error('Endereço não encontrado. Verifique os dados e tente novamente.');
            }
            throw new Error(`Geocoding failed: ${data.status}${data.error_message ? ' - ' + data.error_message : ''}`);
        }

        if (!data.results || data.results.length === 0) {
            throw new Error('Nenhum resultado encontrado para este endereço');
        }

        const result = data.results[0];
        const location = result.geometry?.location;

        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            throw new Error('Resposta inválida da API de geocoding');
        }

        return {
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress: result.formatted_address || address,
        };
    } catch (error: any) {
        if (error.message.includes('Geocoding failed') || error.message.includes('não encontrado')) {
            throw error;
        }
        throw new Error(`Erro ao geocodificar endereço: ${error.message}`);
    }
}
