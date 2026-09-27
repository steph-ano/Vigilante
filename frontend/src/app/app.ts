import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisasterService } from './services/disaster.service';
import { BoundingBox, DisasterPreset, CompareResponse, ApiStatus } from './models/disaster.models';
import { MapSelectorComponent } from './components/map-selector/map-selector.component';
import { ComparisonViewerComponent } from './components/comparison-viewer/comparison-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MapSelectorComponent, ComparisonViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  @ViewChild('mapSelector') mapSelector?: MapSelectorComponent;

  presets: DisasterPreset[] = [];
  selectedPreset: DisasterPreset | null = null;
  apiStatus: ApiStatus | null = null;

  // Active Query Parameters
  currentBbox: BoundingBox = {
    minX: -76.735,
    minY: -11.955,
    maxX: -76.675,
    maxY: -11.910
  };

  dateBefore = '2023-03-01';
  dateAfter = '2023-03-18';
  eventType = 'huaico';
  visualizationMode = 'false_color_swir';
  maxCloudCoverage = 30;

  // Execution states
  isLoading = false;
  loadingStepText = 'Consultando Copernicus CDSE Catalog API...';
  compareResponse: CompareResponse | null = null;
  errorMessage = '';

  // UI Modals
  showCredsModal = false;

  constructor(private disasterService: DisasterService) {}

  ngOnInit(): void {
    this.loadStatus();
    this.loadPresets();
  }

  loadStatus(): void {
    this.disasterService.getStatus().subscribe(status => {
      this.apiStatus = status;
    });
  }

  loadPresets(): void {
    this.disasterService.getPresets().subscribe(presets => {
      this.presets = presets;
      if (this.presets.length > 0) {
        this.selectPreset(this.presets[0], false);
      }
      // Trigger initial comparison for instantaneous visual gratification
      this.runAnalysis();
    });
  }

  selectPreset(preset: DisasterPreset, triggerRun: boolean = true): void {
    this.selectedPreset = preset;
    this.currentBbox = { ...preset.bbox };
    this.eventType = preset.eventType;
    this.visualizationMode = preset.defaultVisualization;
    
    // Normalize date strings to YYYY-MM-DD
    this.dateBefore = preset.dateBefore.slice(0, 10);
    this.dateAfter = preset.dateAfter.slice(0, 10);

    if (this.mapSelector) {
      this.mapSelector.updateFromPreset(preset);
    }

    if (triggerRun) {
      this.runAnalysis();
    }
  }

  onBboxChange(bbox: BoundingBox): void {
    this.currentBbox = bbox;
  }

  onEventTypeChange(type: string): void {
    this.eventType = type;
    // Suggest optimal visualization mode based on disaster type
    if (type === 'huaico') {
      this.visualizationMode = 'false_color_swir';
    } else if (type === 'incendio') {
      this.visualizationMode = 'nbr';
    } else if (type === 'inundacion') {
      this.visualizationMode = 'ndwi';
    }
  }

  runAnalysis(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadingStepText = 'Consultando Copernicus CDSE Catalog API...';

    const stepTimer1 = setTimeout(() => {
      if (this.isLoading) this.loadingStepText = 'Buscando escenas Sentinel-2 L2A con baja nubosidad...';
    }, 800);

    const stepTimer2 = setTimeout(() => {
      if (this.isLoading) this.loadingStepText = 'Ejecutando Evalscript en Sentinel Hub Process API...';
    }, 1600);

    const stepTimer3 = setTimeout(() => {
      if (this.isLoading) this.loadingStepText = 'Sintetizando composites multiespectrales y métricas...';
    }, 2400);

    const request = {
      bbox: this.currentBbox,
      dateBefore: new Date(this.dateBefore).toISOString(),
      dateAfter: new Date(this.dateAfter).toISOString(),
      eventType: this.eventType,
      visualizationMode: this.visualizationMode,
      maxCloudCoverage: this.maxCloudCoverage,
      width: 800,
      height: 800
    };

    this.disasterService.compare(request).subscribe({
      next: (res) => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);
        this.compareResponse = res;
        this.isLoading = false;
      },
      error: (err) => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);
        console.error('Error fetching satellite comparison:', err);
        this.errorMessage = 'No se pudo conectar con el backend de Vigilante. Verifica que el servidor C# esté ejecutándose en http://localhost:5000.';
        this.isLoading = false;
      }
    });
  }

  toggleCredsModal(): void {
    this.showCredsModal = !this.showCredsModal;
  }
}
