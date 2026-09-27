import { Component, Input, ViewChild, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompareResponse, ImageResult } from '../../models/disaster.models';

@Component({
  selector: 'app-comparison-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="viewer-card glass-panel" #viewerRoot>
      <!-- Top Control Bar -->
      <div class="viewer-toolbar">
        <div class="toolbar-left">
          <div class="mode-toggles">
            <button 
              class="toggle-btn" 
              [class.active]="viewMode === 'slider'" 
              (click)="setViewMode('slider')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="2" x2="12" y2="22"/>
                <rect x="2" y="4" width="20" height="16" rx="2"/>
              </svg>
              Cortinilla Slider
            </button>
            <button 
              class="toggle-btn" 
              [class.active]="viewMode === 'dual'" 
              (click)="setViewMode('dual')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="8" height="18" rx="1"/>
                <rect x="13" y="3" width="8" height="18" rx="1"/>
              </svg>
              Lado a Lado
            </button>
            <button 
              class="toggle-btn" 
              [class.active]="viewMode === 'fader'" 
              (click)="setViewMode('fader')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>
              </svg>
              Fader de Opacidad
            </button>
          </div>
        </div>

        <div class="toolbar-right">
          <!-- Zoom Controls -->
          <div class="zoom-controls">
            <button class="icon-btn" (click)="adjustZoom(-0.25)" [disabled]="zoomLevel <= 1" title="Reducir zoom">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span class="zoom-text">{{ (zoomLevel * 100) | number:'1.0-0' }}%</span>
            <button class="icon-btn" (click)="adjustZoom(0.25)" [disabled]="zoomLevel >= 3" title="Aumentar zoom">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          <!-- Download Action -->
          <button class="icon-btn" (click)="downloadComposite()" title="Descargar imagen">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Visual Stage -->
      <div class="stage-container" [class.is-loading]="isLoading">
        
        <!-- Loading State: Satellite Scanner -->
        <div class="loading-overlay" *ngIf="isLoading">
          <div class="radar-container">
            <div class="radar-grid"></div>
            <div class="radar-sweep"></div>
            <div class="radar-blip b1"></div>
            <div class="radar-blip b2"></div>
            <div class="radar-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"/>
                <path d="m4.93 4.93 4.24 4.24"/>
                <path d="m14.83 9.17 4.24-4.24"/>
                <path d="m14.83 14.83 4.24 4.24"/>
                <path d="m9.17 14.83-4.24 4.24"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
          </div>
          <h4 class="loading-title">Procesando Sentinel-2 L2A</h4>
          <p class="loading-step">{{ loadingStepText }}</p>
          <div class="loading-bar">
            <div class="loading-progress"></div>
          </div>
        </div>

        <!-- 1. SLIDER VIEW MODE -->
        <div 
          *ngIf="!isLoading && viewMode === 'slider' && response" 
          class="slider-viewport"
          #sliderViewport
          (mousedown)="onDragStart($event)"
          (touchstart)="onDragStart($event)">
          
          <!-- Image Layer: AFTER (Background full) -->
          <div 
            class="image-layer after-layer" 
            [style.transform]="'scale(' + zoomLevel + ')'">
            <img [src]="response.after.imageBase64" alt="Después del evento" class="satellite-img" />
            <div class="layer-badge badge-after">
              <span class="badge-dot dot-red"></span>
              <span>DESPUÉS: {{ response.after.acquiredDate | date:'dd MMM yyyy' }}</span>
              <span class="cloud-stat" *ngIf="response.after.cloudCoverPercentage !== undefined">
                ☁️ {{ response.after.cloudCoverPercentage }}%
              </span>
            </div>
          </div>

          <!-- Image Layer: BEFORE (Clipped by slider percentage) -->
          <div 
            class="image-layer before-layer"
            [style.width.%]="sliderPosition"
            [style.transform]="'scale(' + zoomLevel + ')'">
            <div class="before-inner-img-wrapper" [style.width.px]="viewportWidth">
              <img [src]="response.before.imageBase64" alt="Antes del evento" class="satellite-img" />
            </div>
            <div class="layer-badge badge-before">
              <span class="badge-dot dot-green"></span>
              <span>ANTES: {{ response.before.acquiredDate | date:'dd MMM yyyy' }}</span>
              <span class="cloud-stat" *ngIf="response.before.cloudCoverPercentage !== undefined">
                ☁️ {{ response.before.cloudCoverPercentage }}%
              </span>
            </div>
          </div>

          <!-- Divider Handle Line -->
          <div 
            class="slider-handle-line" 
            [style.left.%]="sliderPosition">
            <div class="slider-handle-knob">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="15 18 9 12 15 6"/>
                <polyline points="9 18 3 12 9 6"/>
                <polyline points="21 18 15 12 21 6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 2. DUAL SIDE-BY-SIDE VIEW MODE -->
        <div *ngIf="!isLoading && viewMode === 'dual' && response" class="dual-viewport">
          <div class="dual-pane">
            <div class="dual-header">
              <span class="badge badge-emerald">Antes del Evento</span>
              <span class="meta-date">{{ response.before.acquiredDate | date:'dd MMM yyyy' }}</span>
            </div>
            <div class="dual-img-container" [style.transform]="'scale(' + zoomLevel + ')'">
              <img [src]="response.before.imageBase64" alt="Antes" class="satellite-img" />
            </div>
            <div class="dual-footer">
              <span>Sensor: Sentinel-2A MSI</span>
              <span>Nubosidad: {{ response.before.cloudCoverPercentage ?? 0 }}%</span>
            </div>
          </div>

          <div class="dual-pane">
            <div class="dual-header">
              <span class="badge badge-rose">Después del Evento</span>
              <span class="meta-date">{{ response.after.acquiredDate | date:'dd MMM yyyy' }}</span>
            </div>
            <div class="dual-img-container" [style.transform]="'scale(' + zoomLevel + ')'">
              <img [src]="response.after.imageBase64" alt="Después" class="satellite-img" />
            </div>
            <div class="dual-footer">
              <span>Sensor: Sentinel-2B MSI</span>
              <span>Nubosidad: {{ response.after.cloudCoverPercentage ?? 0 }}%</span>
            </div>
          </div>
        </div>

        <!-- 3. FADER BLEND VIEW MODE -->
        <div *ngIf="!isLoading && viewMode === 'fader' && response" class="fader-viewport">
          <div class="fader-img-container" [style.transform]="'scale(' + zoomLevel + ')'">
            <img [src]="response.before.imageBase64" alt="Antes" class="satellite-img base-layer" />
            <img 
              [src]="response.after.imageBase64" 
              alt="Después" 
              class="satellite-img blend-layer"
              [style.opacity]="faderOpacity / 100" />
          </div>

          <div class="fader-control-bar">
            <span class="fader-label">Antes (0%)</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              [(ngModel)]="faderOpacity" 
              class="fader-slider" />
            <span class="fader-label">Después (100%)</span>
            <span class="fader-val">{{ faderOpacity }}%</span>
          </div>
        </div>

      </div>

      <!-- Bottom Analytics & Difference Index Card -->
      <div class="analytics-bar" *ngIf="response?.differenceMetric">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">MÉTRICA MULTIESPECTRAL</span>
            <span 
              class="severity-badge"
              [ngClass]="{
                'sev-extreme': response?.differenceMetric?.severityLevel === 'Extrema',
                'sev-severe': response?.differenceMetric?.severityLevel === 'Severa',
                'sev-moderate': response?.differenceMetric?.severityLevel === 'Moderada'
              }">
              Alerta {{ response?.differenceMetric?.severityLevel }}
            </span>
          </div>
          <div class="metric-body">
            <div class="metric-stat">
              <span class="stat-number">{{ response?.differenceMetric?.estimatedImpactPercentage }}%</span>
              <span class="stat-unit">Área Anómala</span>
            </div>
            <div class="metric-details">
              <h5 class="metric-name">{{ response?.differenceMetric?.metricName }}</h5>
              <p class="metric-desc">{{ response?.differenceMetric?.interpretation }}</p>
            </div>
          </div>
        </div>

        <!-- Simulation / Live CDSE indicator tag -->
        <div class="pipeline-badge-box">
          <div class="source-tag" [class.is-simulated]="response?.isSimulated">
            <span class="source-dot"></span>
            <span>{{ response?.isSimulated ? 'Simulación Calibrada (CDSE Demo)' : 'Copernicus CDSE Live Feed' }}</span>
          </div>
          <p class="source-meta">Latencia: {{ response?.processingTimeMs }} ms &bull; Bbox 800x800 px</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .viewer-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .viewer-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 18px;
      background: rgba(15, 23, 42, 0.6);
      border-bottom: 1px solid var(--border-subtle);
    }
    .mode-toggles {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 0, 0, 0.4);
      padding: 4px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }
    .toggle-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .toggle-btn:hover {
      color: var(--text-main);
    }
    .toggle-btn.active {
      background: rgba(14, 165, 233, 0.2);
      color: var(--accent-cyan);
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }
    .zoom-text {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      min-width: 42px;
      text-align: center;
      color: var(--text-muted);
    }
    .icon-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .icon-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-main);
    }
    .icon-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    /* Stage */
    .stage-container {
      position: relative;
      min-height: 480px;
      height: 520px;
      background: #020408;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Slider Mode */
    .slider-viewport {
      position: relative;
      width: 100%;
      height: 100%;
      user-select: none;
      cursor: col-resize;
      overflow: hidden;
    }
    .image-layer {
      position: absolute;
      top: 0;
      bottom: 0;
      height: 100%;
      transform-origin: center center;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .after-layer {
      left: 0;
      right: 0;
      width: 100%;
    }
    .before-layer {
      left: 0;
      overflow: hidden;
      border-right: 1px solid rgba(255, 255, 255, 0.4);
      z-index: 10;
    }
    .before-inner-img-wrapper {
      height: 100%;
      position: relative;
    }
    .satellite-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      pointer-events: none;
    }

    .layer-badge {
      position: absolute;
      bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(8px);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      border: 1px solid var(--border-subtle);
      pointer-events: none;
      z-index: 20;
    }
    .badge-before {
      left: 16px;
      color: #34d399;
    }
    .badge-after {
      right: 16px;
      color: #fb7185;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-green { background: #10b981; box-shadow: 0 0 8px #10b981; }
    .dot-red { background: #f43f5e; box-shadow: 0 0 8px #f43f5e; }
    .cloud-stat {
      color: var(--text-dim);
      font-family: var(--font-mono);
      font-size: 0.68rem;
    }

    /* Slider Handle */
    .slider-handle-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #00d2ff;
      box-shadow: 0 0 12px #00d2ff;
      z-index: 25;
      transform: translateX(-50%);
      pointer-events: none;
    }
    .slider-handle-knob {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #090d16;
      border: 2px solid #00d2ff;
      box-shadow: 0 0 15px rgba(0, 210, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00d2ff;
      pointer-events: auto;
    }

    /* Dual Mode */
    .dual-viewport {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
      height: 100%;
      gap: 4px;
      background: #090d16;
    }
    .dual-pane {
      display: flex;
      flex-direction: column;
      background: #000;
      overflow: hidden;
      position: relative;
    }
    .dual-header {
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.8);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      z-index: 5;
    }
    .meta-date {
      font-size: 0.72rem;
      font-family: var(--font-mono);
      color: var(--text-muted);
    }
    .dual-img-container {
      flex: 1;
      overflow: hidden;
      transform-origin: center;
      transition: transform 0.2s ease;
    }
    .dual-footer {
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.6);
      font-size: 0.68rem;
      color: var(--text-dim);
      display: flex;
      justify-content: space-between;
    }

    /* Fader Mode */
    .fader-viewport {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .fader-img-container {
      position: relative;
      flex: 1;
      width: 100%;
      overflow: hidden;
    }
    .base-layer {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
    }
    .blend-layer {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      transition: opacity 0.05s ease;
    }
    .fader-control-bar {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(9, 13, 22, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-glow);
      padding: 8px 18px;
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 30;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    .fader-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .fader-slider {
      width: 200px;
      accent-color: var(--accent-cyan);
      cursor: pointer;
    }
    .fader-val {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent-cyan);
      min-width: 32px;
    }

    /* Loading Satellite Scanner Animation */
    .loading-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(5, 7, 12, 0.92);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      gap: 14px;
    }
    .radar-container {
      position: relative;
      width: 140px;
      height: 140px;
      border: 1px solid rgba(0, 210, 255, 0.3);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 210, 255, 0.05) 0%, transparent 70%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .radar-grid {
      position: absolute;
      width: 70%;
      height: 70%;
      border: 1px dashed rgba(0, 210, 255, 0.2);
      border-radius: 50%;
    }
    .radar-sweep {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent 75%, rgba(0, 210, 255, 0.4) 100%);
      animation: radar-sweep 2s linear infinite;
    }
    .radar-icon {
      position: relative;
      z-index: 2;
    }
    .radar-blip {
      position: absolute;
      width: 6px;
      height: 6px;
      background: #38bdf8;
      border-radius: 50%;
      box-shadow: 0 0 8px #38bdf8;
    }
    .b1 { top: 30%; left: 65%; animation: pulse-glow 1.5s infinite; }
    .b2 { top: 70%; left: 35%; animation: pulse-glow 2s infinite 0.5s; }

    .loading-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 6px;
    }
    .loading-step {
      font-size: 0.8rem;
      color: var(--accent-cyan);
      font-family: var(--font-mono);
    }
    .loading-bar {
      width: 220px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    .loading-progress {
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, #0ea5e9, #00d2ff);
      animation: scan-line 2s infinite ease-in-out;
    }

    /* Analytics Bottom Bar */
    .analytics-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.6);
      border-top: 1px solid var(--border-subtle);
    }
    .metric-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 280px;
    }
    .metric-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .metric-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }
    .severity-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .sev-extreme {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .sev-severe {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .sev-moderate {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
    }
    .metric-body {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .metric-stat {
      display: flex;
      flex-direction: column;
    }
    .stat-number {
      font-family: var(--font-display);
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1;
    }
    .stat-unit {
      font-size: 0.68rem;
      color: var(--text-muted);
    }
    .metric-details {
      flex: 1;
    }
    .metric-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent-cyan);
    }
    .metric-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.35;
      margin-top: 2px;
    }

    .pipeline-badge-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .source-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .source-tag.is-simulated {
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }
    .source-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .source-meta {
      font-size: 0.68rem;
      font-family: var(--font-mono);
      color: var(--text-dim);
    }

    @media (max-width: 768px) {
      .stage-container {
        height: 380px;
      }
      .dual-viewport {
        grid-template-columns: 1fr;
      }
      .pipeline-badge-box {
        align-items: flex-start;
      }
    }
  `]
})
export class ComparisonViewerComponent {
  @Input() response: CompareResponse | null = null;
  @Input() isLoading = false;
  @Input() loadingStepText = 'Consultando Copernicus CDSE Catalog API...';

  @ViewChild('sliderViewport') sliderViewport?: ElementRef<HTMLDivElement>;

  viewMode: 'slider' | 'dual' | 'fader' = 'slider';
  sliderPosition = 50; // percentage
  faderOpacity = 65; // percentage
  zoomLevel = 1.0;
  viewportWidth = 800;

  private isDragging = false;

  setViewMode(mode: 'slider' | 'dual' | 'fader'): void {
    this.viewMode = mode;
    this.zoomLevel = 1.0;
    setTimeout(() => this.updateDimensions(), 100);
  }

  adjustZoom(delta: number): void {
    this.zoomLevel = Math.max(1, Math.min(3, +(this.zoomLevel + delta).toFixed(2)));
  }

  onDragStart(event: MouseEvent | TouchEvent): void {
    if (this.viewMode !== 'slider') return;
    this.isDragging = true;
    this.updatePositionFromEvent(event);
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    this.updatePositionFromEvent(event);
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onDragEnd(): void {
    this.isDragging = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateDimensions();
  }

  private updateDimensions(): void {
    if (this.sliderViewport) {
      this.viewportWidth = this.sliderViewport.nativeElement.clientWidth;
    }
  }

  private updatePositionFromEvent(event: MouseEvent | TouchEvent): void {
    if (!this.sliderViewport) return;
    const rect = this.sliderViewport.nativeElement.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const relativeX = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    this.sliderPosition = pct;
    this.viewportWidth = rect.width;
  }

  downloadComposite(): void {
    if (!this.response?.after?.imageBase64) return;
    const link = document.createElement('a');
    link.href = this.response.after.imageBase64;
    link.download = `vigilante_${this.response.eventType}_${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }
}
