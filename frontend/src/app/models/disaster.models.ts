export interface BoundingBox {
  minX: number; // West Longitude
  minY: number; // South Latitude
  maxX: number; // East Longitude
  maxY: number; // North Latitude
}

export interface DisasterPreset {
  id: string;
  title: string;
  location: string;
  department: string;
  eventType: 'huaico' | 'incendio' | 'inundacion' | 'custom';
  description: string;
  dateBefore: string;
  dateAfter: string;
  bbox: BoundingBox;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  defaultVisualization: 'true_color' | 'false_color_swir' | 'ndwi' | 'nbr';
  historicalImpact: string;
}

export interface CompareRequest {
  bbox: BoundingBox;
  dateBefore: string;
  dateAfter: string;
  eventType: string;
  visualizationMode: string;
  maxCloudCoverage: number;
  width: number;
  height: number;
  forceLive?: boolean;
}

export interface ImageResult {
  imageBase64: string;
  mimeType: string;
  acquiredDate?: string;
  cloudCoverPercentage?: number;
  sceneId?: string;
  visualizationMode: string;
  bbox?: BoundingBox;
  title?: string;
}

export interface DifferenceMetric {
  metricName: string;
  estimatedImpactPercentage: number;
  severityLevel: string;
  interpretation: string;
}

export interface CompareResponse {
  before: ImageResult;
  after: ImageResult;
  differenceMetric?: DifferenceMetric;
  isSimulated: boolean;
  message: string;
  eventType: string;
  visualizationMode: string;
  processingTimeMs: number;
}

export interface ApiStatus {
  service: string;
  status: string;
  cdseConfigured: boolean;
  copernicusEndpoint: string;
  tokenEndpoint: string;
  supportedModes: {
    id: string;
    name: string;
    bands: string;
    description: string;
  }[];
}
