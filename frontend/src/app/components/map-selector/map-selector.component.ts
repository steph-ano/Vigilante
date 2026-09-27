import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { BoundingBox, DisasterPreset } from '../../models/disaster.models';

@Component({
  selector: 'app-map-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-card glass-panel">
      <div class="map-header">
        <div class="map-title-group">
          <div class="radar-dot"></div>
          <div>
            <h3 class="map-title">Geolocalización & Área de Interés (ROI)</h3>
            <p class="map-subtitle">Haz clic o arrastra para reubicar el Bounding Box de Sentinel-2</p>
          </div>
        </div>
        <div class="coords-chips" *ngIf="currentBbox">
          <span class="coord-chip">
            <span class="coord-label">W</span> {{ currentBbox.minX | number:'1.3-3' }}°
          </span>
          <span class="coord-chip">
            <span class="coord-label">S</span> {{ currentBbox.minY | number:'1.3-3' }}°
          </span>
          <span class="coord-chip">
            <span class="coord-label">E</span> {{ currentBbox.maxX | number:'1.3-3' }}°
          </span>
          <span class="coord-chip">
            <span class="coord-label">N</span> {{ currentBbox.maxY | number:'1.3-3' }}°
          </span>
          <span class="area-chip">
            ~{{ calculateApproxAreaKm2() | number:'1.1-1' }} km²
          </span>
        </div>
      </div>

      <div class="map-container-wrapper">
        <div #mapContainer class="leaflet-map-element"></div>
        
        <!-- Map overlay tools -->
        <div class="map-controls-floating">
          <button class="map-btn" (click)="resetView()" title="Centrar en el área actual">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Centrar
          </button>
          <button class="map-btn" (click)="toggleLayer()" title="Cambiar mapa base">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            {{ isSatelliteBase ? 'Satelital' : 'Topográfico' }}
          </button>
        </div>

        <div class="map-guide-banner">
          <span class="guide-icon">ℹ️</span>
          <span>Resolución Sentinel-2 L2A: <strong>10 m/pixel</strong>. Bbox adaptado para 800x800 px.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .map-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.4);
      border-bottom: 1px solid var(--border-subtle);
    }
    .map-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .radar-dot {
      width: 12px;
      height: 12px;
      background: var(--accent-cyan);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--accent-cyan);
      position: relative;
    }
    .radar-dot::after {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 1px solid var(--accent-cyan);
      border-radius: 50%;
      animation: pulse-glow 2s infinite ease-out;
    }
    .map-title {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.01em;
    }
    .map-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .coords-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .coord-chip, .area-chip {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 3px 8px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: #e2e8f0;
    }
    .coord-label {
      color: var(--accent-cyan);
      font-weight: 600;
    }
    .area-chip {
      background: rgba(14, 165, 233, 0.15);
      border-color: rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      font-weight: 600;
    }
    .map-container-wrapper {
      position: relative;
      height: 340px;
      width: 100%;
    }
    .leaflet-map-element {
      height: 100%;
      width: 100%;
      z-index: 1;
    }
    .map-controls-floating {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 500;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .map-btn {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
    }
    .map-btn:hover {
      background: rgba(30, 41, 59, 0.95);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }
    .map-guide-banner {
      position: absolute;
      bottom: 12px;
      left: 14px;
      z-index: 500;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      font-size: 0.72rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    .guide-icon {
      font-size: 0.85rem;
    }
  `]
})
export class MapSelectorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  @Input() currentBbox: BoundingBox = {
    minX: -76.735,
    minY: -11.955,
    maxX: -76.675,
    maxY: -11.910
  };

  @Input() centerLat = -11.935;
  @Input() centerLng = -76.705;
  @Input() zoom = 14;

  @Output() bboxChange = new EventEmitter<BoundingBox>();

  private map: L.Map | null = null;
  private bboxRectangle: L.Rectangle | null = null;
  private satelliteLayer: L.TileLayer | null = null;
  private darkLayer: L.TileLayer | null = null;
  private labelLayer: L.TileLayer | null = null;
  isSatelliteBase = true;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (!this.mapContainer) return;

    // Create Map instance
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.centerLat, this.centerLng],
      zoom: this.zoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // ESRI World Imagery
    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri World Imagery',
        maxZoom: 19
      }
    );

    // CartoDB Dark Matter
    this.darkLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; CARTO',
        maxZoom: 19
      }
    );

    // CartoDB Labels overlay for satellite
    this.labelLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      {
        pane: 'overlayPane',
        maxZoom: 19
      }
    );

    this.satelliteLayer.addTo(this.map);
    this.labelLayer.addTo(this.map);

    // Draw initial ROI rectangle
    this.updateBboxRectangle();

    // Allow user to click anywhere on map to re-center the ROI box
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.centerBboxOnCoord(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size once rendered
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  public updateFromPreset(preset: DisasterPreset): void {
    this.currentBbox = { ...preset.bbox };
    this.centerLat = preset.centerLat;
    this.centerLng = preset.centerLng;
    this.zoom = preset.defaultZoom;

    if (this.map) {
      this.map.setView([this.centerLat, this.centerLng], this.zoom);
      this.updateBboxRectangle();
      this.bboxChange.emit(this.currentBbox);
    }
  }

  private updateBboxRectangle(): void {
    if (!this.map) return;

    if (this.bboxRectangle) {
      this.map.removeLayer(this.bboxRectangle);
    }

    const bounds: L.LatLngBoundsExpression = [
      [this.currentBbox.minY, this.currentBbox.minX],
      [this.currentBbox.maxY, this.currentBbox.maxX]
    ];

    this.bboxRectangle = L.rectangle(bounds, {
      color: '#00d2ff',
      weight: 2,
      fillColor: '#00d2ff',
      fillOpacity: 0.12,
      dashArray: '5, 5'
    }).addTo(this.map);

    this.bboxRectangle.bindPopup(
      `<strong>Área Sentinel-2 de Consulta</strong><br>Bbox: [${this.currentBbox.minX.toFixed(3)}, ${this.currentBbox.minY.toFixed(3)}, ${this.currentBbox.maxX.toFixed(3)}, ${this.currentBbox.maxY.toFixed(3)}]`
    );
  }

  private centerBboxOnCoord(lat: number, lng: number): void {
    // Preserve current span width and height
    const spanX = Math.abs(this.currentBbox.maxX - this.currentBbox.minX) || 0.055;
    const spanY = Math.abs(this.currentBbox.maxY - this.currentBbox.minY) || 0.045;

    this.currentBbox = {
      minX: +(lng - spanX / 2).toFixed(5),
      maxX: +(lng + spanX / 2).toFixed(5),
      minY: +(lat - spanY / 2).toFixed(5),
      maxY: +(lat + spanY / 2).toFixed(5)
    };

    this.updateBboxRectangle();
    this.bboxChange.emit(this.currentBbox);
  }

  resetView(): void {
    if (!this.map) return;
    this.map.setView([this.centerLat, this.centerLng], this.zoom);
    this.updateBboxRectangle();
  }

  toggleLayer(): void {
    if (!this.map || !this.satelliteLayer || !this.darkLayer || !this.labelLayer) return;

    if (this.isSatelliteBase) {
      this.map.removeLayer(this.satelliteLayer);
      this.map.removeLayer(this.labelLayer);
      this.map.addLayer(this.darkLayer);
      this.isSatelliteBase = false;
    } else {
      this.map.removeLayer(this.darkLayer);
      this.map.addLayer(this.satelliteLayer);
      this.map.addLayer(this.labelLayer);
      this.isSatelliteBase = true;
    }
  }

  calculateApproxAreaKm2(): number {
    const latSpan = Math.abs(this.currentBbox.maxY - this.currentBbox.minY);
    const lngSpan = Math.abs(this.currentBbox.maxX - this.currentBbox.minX);
    // 1 deg lat ≈ 111 km, 1 deg lng at 12°S ≈ 108.6 km
    const kmY = latSpan * 111.0;
    const kmX = lngSpan * 108.6;
    return kmX * kmY;
  }
}
