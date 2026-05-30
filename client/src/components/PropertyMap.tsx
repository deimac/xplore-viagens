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
        latitude?: number;
        longitude?: number;
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

        const hasCoordinates =
            typeof property.latitude === 'number' &&
            typeof property.longitude === 'number';

        if (!hasCoordinates) {
            setError('Localização indisponível para este imóvel');
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


                // Carregar bibliotecas necessárias para renderizar mapa por coordenada
                const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
                const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

                const location = {
                    lat: property.latitude!,
                    lng: property.longitude!,
                };

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
    }, [property.city, property.latitude, property.longitude]);

    // Se não tiver cidade e coordenadas, não renderizar nada
    if (!property.city && (typeof property.latitude !== 'number' || typeof property.longitude !== 'number')) {
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

