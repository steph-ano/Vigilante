import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { BoundingBox, DisasterPreset } from '../../models/disaster.models';
import { DisasterService, LocationSearchResult } from '../../services/disaster.service';

@Component({
  selector: 'app-map-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-card glass-panel">
      <!-- Search & Geolocation Bar -->
      <div class="map-search-bar">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearchInput()"
            (keydown.enter)="onSearchEnter()"
            placeholder="Buscar ciudad, distrito o quebrada (ej. Secocha, Trujillo, Huaraz, Iquitos)..." 
            class="search-input" />
          <div *ngIf="isSearching" class="search-spinner"></div>
          <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">&times;</button>
        </div>

        <!-- Search Results Dropdown -->
        <div class="search-results-dropdown" *ngIf="searchResults.length > 0">
          <button 
            *ngFor="let res of searchResults" 
            class="search-result-item"
            (click)="selectSearchResult(res)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span class="result-text">{{ res.displayName }}</span>
          </button>
        </div>
      </div>

      <!-- Map Sub-header with Coordinates & Mode Toggles -->
      <div class="map-header">
        <div class="map-title-group">
          <div class="radar-dot"></div>
          <div>
            <h3 class="map-title">Geolocalización & Área de Interés (ROI)</h3>
            <p class="map-subtitle">Haz clic para mover o activa "Trazar Área" para dibujar con el mouse</p>
          </div>
        </div>

        <div class="map-action-toggles">
          <button 
            class="tool-btn" 
            [class.active]="isDrawMode" 
            (click)="toggleDrawMode()" 
            title="Dibuja un rectángulo personalizado arrastrando con el mouse">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/>
            </svg>
            {{ isDrawMode ? 'Dibujando área...' : 'Trazar Área' }}
          </button>

          <button class="tool-btn" (click)="toggleLayer()" title="Alternar capa base">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            {{ isSatelliteBase ? 'Satelital' : 'Topográfico' }}
          </button>
        </div>
      </div>

      <!-- Leaflet Map Container -->
      <div class="map-container-wrapper" [class.draw-crosshair]="isDrawMode">
        <div #mapContainer class="leaflet-map-element"></div>
        
        <!-- Live Coords & Area Tag -->
        <div class="coords-floating-tag" *ngIf="currentBbox">
          <div class="coords-row">
            <span class="coord-badge"><strong class="text-cyan">W:</strong> {{ currentBbox.minX | number:'1.3-3' }}°</span>
            <span class="coord-badge"><strong class="text-cyan">S:</strong> {{ currentBbox.minY | number:'1.3-3' }}°</span>
            <span class="coord-badge"><strong class="text-cyan">E:</strong> {{ currentBbox.maxX | number:'1.3-3' }}°</span>
            <span class="coord-badge"><strong class="text-cyan">N:</strong> {{ currentBbox.maxY | number:'1.3-3' }}°</span>
          </div>
          <span class="area-badge">
            Área: <strong>{{ calculateApproxAreaKm2() | number:'1.1-1' }} km²</strong> (Sentinel-2 10m/px)
          </span>
        </div>

        <!-- Draw Mode Banner helper -->
        <div class="draw-helper-banner" *ngIf="isDrawMode">
          <span>📐 Mantén presionado y arrastra sobre el mapa para trazar tu rectángulo personalizado.</span>
        </div>
      </div>

      <!-- Quick Regional Jumpers -->
      <div class="region-jumpers">
        <span class="jumpers-label">Explorar Región:</span>
        <button class="jumper-btn" (click)="flyToRegion(-12.046, -77.042, 11)">Costa Central (Lima)</button>
        <button class="jumper-btn" (click)="flyToRegion(-5.195, -80.635, 12)">Norte (Piura)</button>
        <button class="jumper-btn" (click)="flyToRegion(-15.990, -73.145, 12)">Arequipa (Secocha)</button>
        <button class="jumper-btn" (click)="flyToRegion(-13.516, -71.978, 12)">Sierra Sur (Cusco)</button>
        <button class="jumper-btn" (click)="flyToRegion(-9.526, -77.528, 12)">Áncash (Huascarán)</button>
        <button class="jumper-btn" (click)="flyToRegion(-3.745, -73.240, 11)">Selva (Iquitos)</button>
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

    /* SEARCH BAR */
    .map-search-bar {
      position: relative;
      padding: 12px 16px;
      background: rgba(9, 13, 22, 0.7);
      border-bottom: 1px solid var(--border-subtle);
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--accent-cyan);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      padding: 9px 38px 9px 36px;
      font-size: 0.8rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 12px rgba(0, 210, 255, 0.25);
      background: rgba(15, 23, 42, 0.95);
    }
    .clear-btn {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
    }
    .search-spinner {
      position: absolute;
      right: 32px;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: var(--accent-cyan);
      border-radius: 50%;
      animation: radar-sweep 0.8s linear infinite;
    }

    /* DROPDOWN */
    .search-results-dropdown {
      position: absolute;
      top: 100%;
      left: 16px;
      right: 16px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-glow);
      border-radius: var(--radius-sm);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
      z-index: 1000;
      max-height: 240px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .search-result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      font-size: 0.78rem;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s;
    }
    .search-result-item:hover {
      background: rgba(14, 165, 233, 0.15);
      color: var(--accent-cyan);
    }
    .result-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* HEADER */
    .map-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 18px;
      background: rgba(15, 23, 42, 0.4);
      border-bottom: 1px solid var(--border-subtle);
    }
    .map-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .radar-dot {
      width: 10px;
      height: 10px;
      background: var(--accent-cyan);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-cyan);
    }
    .map-title {
      font-family: var(--font-display);
      font-size: 0.92rem;
      font-weight: 700;
    }
    .map-subtitle {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .map-action-toggles {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tool-btn {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tool-btn:hover {
      background: rgba(30, 41, 59, 0.95);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }
    .tool-btn.active {
      background: rgba(14, 165, 233, 0.25);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
    }

    /* MAP CONTAINER */
    .map-container-wrapper {
      position: relative;
      height: 350px;
      width: 100%;
    }
    .draw-crosshair {
      cursor: crosshair !important;
    }
    .leaflet-map-element {
      height: 100%;
      width: 100%;
      z-index: 1;
    }

    /* COORDS FLOATING TAG */
    .coords-floating-tag {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      z-index: 500;
      background: rgba(9, 13, 22, 0.88);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      pointer-events: none;
    }
    .coords-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .coord-badge {
      background: rgba(0, 0, 0, 0.4);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: #cbd5e1;
    }
    .text-cyan { color: var(--accent-cyan); }
    .area-badge {
      font-size: 0.72rem;
      color: #38bdf8;
      font-family: var(--font-sans);
    }

    .draw-helper-banner {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 500;
      background: rgba(245, 158, 11, 0.92);
      color: #000;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 6px 16px;
      border-radius: 9999px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      pointer-events: none;
    }

    /* REGION JUMPERS */
    .region-jumpers {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: rgba(9, 13, 22, 0.6);
      border-top: 1px solid var(--border-subtle);
    }
    .jumpers-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      margin-right: 4px;
    }
    .jumper-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .jumper-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--accent-cyan);
      border-color: rgba(56, 189, 248, 0.3);
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

  // Search state
  searchQuery = '';
  searchResults: LocationSearchResult[] = [];
  isSearching = false;
  private searchTimeout: any;

  // Drawing state
  isDrawMode = false;
  private drawStartLatLng: L.LatLng | null = null;
  private drawTempRectangle: L.Rectangle | null = null;

  private map: L.Map | null = null;
  private bboxRectangle: L.Rectangle | null = null;
  private satelliteLayer: L.TileLayer | null = null;
  private darkLayer: L.TileLayer | null = null;
  private labelLayer: L.TileLayer | null = null;
  isSatelliteBase = true;

  constructor(private disasterService: DisasterService) {}

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

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.centerLat, this.centerLng],
      zoom: this.zoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri', maxZoom: 19 }
    );

    this.darkLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; CARTO', maxZoom: 19 }
    );

    this.labelLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { pane: 'overlayPane', maxZoom: 19 }
    );

    this.satelliteLayer.addTo(this.map);
    this.labelLayer.addTo(this.map);

    this.updateBboxRectangle();

    // Map Click & Drag listeners
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.isDrawMode) {
        this.centerBboxOnCoord(e.latlng.lat, e.latlng.lng);
      }
    });

    this.map.on('mousedown', (e: L.LeafletMouseEvent) => {
      if (this.isDrawMode) {
        this.map?.dragging.disable();
        this.drawStartLatLng = e.latlng;
      }
    });

    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (this.isDrawMode && this.drawStartLatLng) {
        const bounds = L.latLngBounds(this.drawStartLatLng, e.latlng);
        if (this.drawTempRectangle) {
          this.drawTempRectangle.setBounds(bounds);
        } else if (this.map) {
          this.drawTempRectangle = L.rectangle(bounds, {
            color: '#f59e0b',
            weight: 2,
            dashArray: '4, 4',
            fillColor: '#f59e0b',
            fillOpacity: 0.2
          }).addTo(this.map);
        }
      }
    });

    this.map.on('mouseup', (e: L.LeafletMouseEvent) => {
      if (this.isDrawMode && this.drawStartLatLng) {
        const bounds = L.latLngBounds(this.drawStartLatLng, e.latlng);
        const south = bounds.getSouth();
        const north = bounds.getNorth();
        const west = bounds.getWest();
        const east = bounds.getEast();

        // Ensure minimum span so bbox is not a point
        if (Math.abs(north - south) > 0.005 && Math.abs(east - west) > 0.005) {
          this.currentBbox = {
            minX: +west.toFixed(5),
            minY: +south.toFixed(5),
            maxX: +east.toFixed(5),
            maxY: +north.toFixed(5)
          };
          this.updateBboxRectangle();
          this.bboxChange.emit(this.currentBbox);
        }

        // Clean up draw mode
        if (this.drawTempRectangle && this.map) {
          this.map.removeLayer(this.drawTempRectangle);
          this.drawTempRectangle = null;
        }
        this.drawStartLatLng = null;
        this.isDrawMode = false;
        this.map?.dragging.enable();
      }
    });

    setTimeout(() => this.map?.invalidateSize(), 250);
  }

  toggleDrawMode(): void {
    this.isDrawMode = !this.isDrawMode;
    if (!this.isDrawMode) {
      this.map?.dragging.enable();
      if (this.drawTempRectangle && this.map) {
        this.map.removeLayer(this.drawTempRectangle);
        this.drawTempRectangle = null;
      }
    }
  }

  // SEARCH IMPLEMENTATION
  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    if (!this.searchQuery || this.searchQuery.trim().length < 2) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    this.searchTimeout = setTimeout(() => {
      this.disasterService.searchLocations(this.searchQuery).subscribe(results => {
        this.searchResults = results;
        this.isSearching = false;
      });
    }, 350);
  }

  onSearchEnter(): void {
    if (this.searchResults.length > 0) {
      this.selectSearchResult(this.searchResults[0]);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
  }

  selectSearchResult(result: LocationSearchResult): void {
    this.searchQuery = result.displayName.split(',')[0];
    this.searchResults = [];

    this.centerLat = result.lat;
    this.centerLng = result.lng;
    this.zoom = 13;

    if (this.map) {
      this.map.flyTo([this.centerLat, this.centerLng], this.zoom, { duration: 1.2 });
      this.centerBboxOnCoord(this.centerLat, this.centerLng);
    }
  }

  flyToRegion(lat: number, lng: number, zoom: number = 12): void {
    this.centerLat = lat;
    this.centerLng = lng;
    this.zoom = zoom;
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, { duration: 1.0 });
      this.centerBboxOnCoord(lat, lng);
    }
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
  }

  private centerBboxOnCoord(lat: number, lng: number): void {
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
    const kmY = latSpan * 111.0;
    const kmX = lngSpan * 108.6;
    return kmX * kmY;
  }
}
