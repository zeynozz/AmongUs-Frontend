import { useState, useEffect } from 'react';
import axios from 'axios';

export interface MapBounds {
    [key: string]: number[];
}

export const useMapBounds = (): MapBounds | null => {
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

    useEffect(() => {
        const fetchMapBounds = async () => {
            try {
                const response = await axios.get<MapBounds>('http://localhost:3000/api/mapBounds');
                setMapBounds(response.data);
            } catch (error) {
                console.error('Error fetching mapBounds:', error);
            }
        };

        fetchMapBounds();
    }, []);

    return mapBounds;
};
