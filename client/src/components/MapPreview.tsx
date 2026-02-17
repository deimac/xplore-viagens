/**
 * MapPreview - Simple map preview for admin
 * Uses Google Maps with importLibrary (new API)
 * Suporta endereço completo ou apenas cidade
 */

import { useEffect, useRef, useState } from 'react';

interface MapPreviewProps {
    address: string;
    label?: string;
    height?: string;
}

export function MapPreview({ address, label, height = '300px' }: MapPreviewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setError(null);
        setIsLoading(true);

        if (!address) {
            setError('Endereço não disponível');
            setIsLoading(false);
            return;
        }

        // Aguardar modal abrir (300ms para admin)
        const initMap = async () => {
            try {
                if (!mapRef.current) {
                    setError('Container não encontrado');
                    setIsLoading(false);
                    return;
                }

                // Carregar bibliotecas
                const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
                const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
                const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

                const geocoder = new Geocoder();

                geocoder.geocode({ address }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const location = results[0].geometry.location;

                        // Criar mapa
                        const map = new Map(mapRef.current!, {
                            center: location,
                            zoom: 15,
                            mapId: 'DEMO_MAP_ID'
                        });

                        // Criar marker
                        new Marker({
                            position: location,
                            map: map,
                            title: label || 'Localização'
                        });

                        setIsLoading(false);
                    } else {
                        setError(`Não foi possível localizar: ${status}`);
                        setIsLoading(false);
                    }
                });
            } catch (error) {
                console.error('[MapPreview] Erro:', error);
                setError('Erro ao carregar o mapa');
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            if (typeof google !== 'undefined' && google.maps) {
                initMap();
            } else {
                setError('Google Maps não disponível');
                setIsLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [address, label]);

    // Se não tiver endereço, não renderizar
    if (!address) {
        return null;
    }

    // Sempre renderizar container
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
