/**
 * PropertyMap - Map component for public property pages
 * VERSÃO SIMPLIFICADA COM ENDEREÇO FIXO PARA TESTE
 */

import { useEffect, useRef, useState } from 'react';

interface PropertyMapProps {
    property: {
        address_street?: string;
        address_number?: string;
        city?: string;
        state_region?: string;
        country?: string;
    };
    height?: string;
}

export function PropertyMap({ property, height = '400px' }: PropertyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        // Montar endereço completo ou usar apenas cidade
        let addressToGeocode = '';

        // Tentar endereço completo primeiro
        const addressParts = [
            property.address_street,
            property.address_number,
            property.city,
            property.state_region,
            property.country
        ].filter(Boolean);

        if (addressParts.length >= 3) {
            // Endereço completo: tem pelo menos rua/número, cidade e país
            addressToGeocode = addressParts.join(', ');
        } else if (property.city) {
            // Apenas cidade + estado/país se disponível
            const cityParts = [
                property.city,
                property.state_region,
                property.country
            ].filter(Boolean);
            addressToGeocode = cityParts.join(', ');
        }

        // Se não tiver endereço nenhum, não renderizar
        if (!addressToGeocode) {
            setIsLoading(false);
            return;
        }


        // Aguardar e inicializar Google Maps com nova API
        const initMap = async () => {
            try {
                if (!mapRef.current) {
                    setError('Container não encontrado');
                    setIsLoading(false);
                    return;
                }


                // Carregar as bibliotecas necessárias
                const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
                const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
                const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;


                const geocoder = new Geocoder();

                geocoder.geocode({ address: addressToGeocode }, (results, status) => {

                    if (status === 'OK' && results && results[0]) {
                        const location = results[0].geometry.location;

                        // Criar mapa
                        const map = new Map(mapRef.current!, {
                            center: location,
                            zoom: 12,
                            mapId: 'DEMO_MAP_ID',
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true,
                            zoomControl: true
                        });

                        // Criar marker
                        new Marker({
                            position: location,
                            map: map,
                            title: property.city || 'Localização'
                        });

                        setIsLoading(false);
                    } else {
                        setError(`Erro ao geocodificar: ${status}`);
                        setIsLoading(false);
                    }
                });

            } catch (error) {
                setError('Erro ao carregar o mapa');
                setIsLoading(false);
            }
        };

        // Aguardar um pouco antes de tentar inicializar
        const timer = setTimeout(() => {
            if (typeof google !== 'undefined' && google.maps) {
                initMap();
            } else {
                setError('Google Maps não disponível');
                setIsLoading(false);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [property.address_street, property.address_number, property.city, property.state_region, property.country]);

    // Se não tiver cidade, não renderizar nada
    if (!property.city) {
        return null;
    }

    // Sempre renderizar o container, independente do estado
    return (
        <div className="rounded-lg overflow-hidden border" style={{ height, width: '100%', position: 'relative' }}>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

            {error && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    className="bg-muted text-muted-foreground"
                >
                    {error}
                </div>
            )}

            {isLoading && !error && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    className="bg-muted text-muted-foreground animate-pulse"
                >
                    Carregando mapa...
                </div>
            )}
        </div>
    );
}

