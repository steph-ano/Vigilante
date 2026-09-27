import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { CompareRequest, CompareResponse, DisasterPreset, ApiStatus } from '../models/disaster.models';

export interface LocationSearchResult {
  displayName: string;
  lat: number;
  lng: number;
  bbox?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DisasterService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getPresets(): Observable<DisasterPreset[]> {
    return this.http.get<DisasterPreset[]>(`${this.apiUrl}/disaster/presets`).pipe(
      catchError(err => {
        console.warn('Could not fetch presets from backend API, using local fallback presets:', err);
        return of(this.getLocalFallbackPresets());
      })
    );
  }

  getStatus(): Observable<ApiStatus | null> {
    return this.http.get<ApiStatus>(`${this.apiUrl}/disaster/status`).pipe(
      catchError(err => {
        console.warn('Backend API status check failed:', err);
        return of(null);
      })
    );
  }

  compare(request: CompareRequest): Observable<CompareResponse> {
    return this.http.post<CompareResponse>(`${this.apiUrl}/disaster/compare`, request);
  }

  searchLocations(query: string): Observable<LocationSearchResult[]> {
    if (!query || query.trim().length < 2) return of([]);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pe&limit=6&addressdetails=1`;
    return this.http.get<any[]>(url).pipe(
      map(results => {
        return results.map(item => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          bbox: item.boundingbox ? [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[3])
          ] : undefined
        }));
      }),
      catchError(err => {
        console.warn('Error searching location via geocoding:', err);
        return of([]);
      })
    );
  }

  private getLocalFallbackPresets(): DisasterPreset[] {
    return [
      {
        id: 'chosica-huaico-2023',
        title: 'Huaico en Chosica / Lurigancho',
        location: 'Chosica, Lima',
        department: 'Lima',
        eventType: 'huaico',
        description: 'Activación y arrastre masivo de lodo y detritos por las quebradas Carossio y Quirio hacia el valle del río Rímac.',
        dateBefore: '2023-03-01T00:00:00Z',
        dateAfter: '2023-03-21T00:00:00Z',
        bbox: { minX: -76.735, minY: -11.955, maxX: -76.675, maxY: -11.910 },
        centerLat: -11.935,
        centerLng: -76.705,
        defaultZoom: 14,
        defaultVisualization: 'false_color_swir',
        historicalImpact: 'Afectación directa a la Carretera Central y cientos de viviendas soterradas con sedimento aluvial.'
      },
      {
        id: 'secocha-aluvion-2023',
        title: 'Aluvión Secocha / Camaná',
        location: 'Mariano Nicolás Valcárcel',
        department: 'Arequipa',
        eventType: 'huaico',
        description: 'Flujo de detritos masivo arrasando campamentos mineros, viviendas y talleres en la quebrada San Martín y Secocha.',
        dateBefore: '2023-01-20T00:00:00Z',
        dateAfter: '2023-02-12T00:00:00Z',
        bbox: { minX: -73.180, minY: -16.020, maxX: -73.110, maxY: -15.960 },
        centerLat: -15.990,
        centerLng: -73.145,
        defaultZoom: 13,
        defaultVisualization: 'false_color_swir',
        historicalImpact: 'Uno de los huaicos más letales del sur peruano con más de 18 fallecidos y miles de damnificados.'
      },
      {
        id: 'piura-inundacion-2023',
        title: 'Inundación Río Piura - Ciclón Yaku',
        location: 'Bajo Piura, Catacaos',
        department: 'Piura',
        eventType: 'inundacion',
        description: 'Crecida extraordinaria del caudal del río Piura desbordando diques e inundando caseríos y miles de hectáreas agrícolas.',
        dateBefore: '2023-02-20T00:00:00Z',
        dateAfter: '2023-03-22T00:00:00Z',
        bbox: { minX: -80.680, minY: -5.230, maxX: -80.590, maxY: -5.160 },
        centerLat: -5.195,
        centerLng: -80.635,
        defaultZoom: 13,
        defaultVisualization: 'ndwi',
        historicalImpact: 'Más de 10,000 damnificados y colapso de infraestructura de defensa ribereña.'
      },
      {
        id: 'cusco-incendio-2024',
        title: 'Incendio Forestal en Cusco',
        location: 'Valle Sur / Canas',
        department: 'Cusco',
        eventType: 'incendio',
        description: 'Voraces incendios forestales consumiendo pastizales de puna, bosques de queñuales y fauna altoandina durante la temporada seca.',
        dateBefore: '2024-08-12T00:00:00Z',
        dateAfter: '2024-09-06T00:00:00Z',
        bbox: { minX: -72.060, minY: -13.500, maxX: -71.940, maxY: -13.410 },
        centerLat: -13.450,
        centerLng: -72.000,
        defaultZoom: 13,
        defaultVisualization: 'nbr',
        historicalImpact: 'Pérdida de cientos de hectáreas de cobertura vegetal protegida y severa degradación del suelo.'
      },
      {
        id: 'huascaran-incendio-2024',
        title: 'Incendio P.N. Huascarán',
        location: 'Cordillera Blanca / Carhuaz',
        department: 'Áncash',
        eventType: 'incendio',
        description: 'Incendio forestal afectando bosques nativos de queñual y pastizales en zonas de amortiguamiento del Parque Nacional Huascarán.',
        dateBefore: '2024-08-01T00:00:00Z',
        dateAfter: '2024-08-28T00:00:00Z',
        bbox: { minX: -77.650, minY: -9.350, maxX: -77.520, maxY: -9.220 },
        centerLat: -9.285,
        centerLng: -77.585,
        defaultZoom: 13,
        defaultVisualization: 'nbr',
        historicalImpact: 'Grave afectación de ecosistemas de alta montaña y pérdida de hábitat de biodiversidad andina protegida.'
      },
      {
        id: 'ventanilla-petroleo-2022',
        title: 'Derrame de Petróleo Ventanilla',
        location: 'Bahía de Ventanilla y Ancón',
        department: 'Lima',
        eventType: 'inundacion',
        description: 'Derrame masivo de más de 11,000 barriles de crudo en la refinería La Pampilla extendiéndose hacia el norte por la corriente marina.',
        dateBefore: '2022-01-10T00:00:00Z',
        dateAfter: '2022-01-25T00:00:00Z',
        bbox: { minX: -77.200, minY: -11.920, maxX: -77.110, maxY: -11.830 },
        centerLat: -11.875,
        centerLng: -77.155,
        defaultZoom: 13,
        defaultVisualization: 'false_color_swir',
        historicalImpact: 'Mayor catástrofe ambiental en la costa peruana contemporánea afectando 25 playas e islas guaneras.'
      },
      {
        id: 'punta-hermosa-2023',
        title: 'Huaico Quebrada Malanche',
        location: 'Punta Hermosa, Lima Sur',
        department: 'Lima',
        eventType: 'huaico',
        description: 'Inusual bajada de lodo y agua por la quebrada Malanche cruzando la Panamericana Sur y desembocando en Playa Norte.',
        dateBefore: '2023-03-05T00:00:00Z',
        dateAfter: '2023-03-16T00:00:00Z',
        bbox: { minX: -76.845, minY: -12.350, maxX: -76.800, maxY: -12.310 },
        centerLat: -12.330,
        centerLng: -76.822,
        defaultZoom: 14,
        defaultVisualization: 'false_color_swir',
        historicalImpact: 'Inundación del casco urbano balneario y vertimiento masivo de sedimento en la bahía.'
      },
      {
        id: 'iquitos-inundacion-2023',
        title: 'Crecida Río Amazonas / Belén',
        location: 'Iquitos, Maynas',
        department: 'Loreto',
        eventType: 'inundacion',
        description: 'Crecida estacional extraordinaria del río Amazonas y río Itaya anegando zonas bajas y comunidades ribereñas.',
        dateBefore: '2023-02-15T00:00:00Z',
        dateAfter: '2023-04-25T00:00:00Z',
        bbox: { minX: -73.280, minY: -3.780, maxX: -73.200, maxY: -3.710 },
        centerLat: -3.745,
        centerLng: -73.240,
        defaultZoom: 13,
        defaultVisualization: 'ndwi',
        historicalImpact: 'Afectación a miles de familias en la zona baja de Belén y comunidades nativas de la ribera del Amazonas.'
      }
    ];
  }
}
