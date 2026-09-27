import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { CompareRequest, CompareResponse, DisasterPreset, ApiStatus } from '../models/disaster.models';

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
      }
    ];
  }
}
