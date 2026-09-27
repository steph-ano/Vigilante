# 🛰️ Vigilante — Monitor Satelital Antes/Después de Desastres Naturales

**Vigilante** es una aplicación web full-stack diseñada para el monitoreo, evaluación y respuesta visual rápida ante desastres naturales en el Perú (huaicos, desbordes/inundaciones, incendios forestales) utilizando imágenes de satélite **Sentinel-2 L2A** a través de las APIs de **Copernicus Data Space Ecosystem (CDSE)** / **Sentinel Hub**.

---

## 🏛️ Arquitectura del Sistema

```
                      ┌────────────────────────────────────────┐
                      │          Frontend: Angular             │
                      │  - Leaflet Map (BoundingBox ROI)       │
                      │  - Split-Screen Slider (Before/After)  │
                      │  - Presets Históricos del Perú         │
                      │  - Visualizador Multiespectral         │
                      └──────────────────┬─────────────────────┘
                                         │ POST /api/compare
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    Backend: C# / ASP.NET Core Web API  │
                      │  - Proxy autenticado OAuth2            │
                      │  - Caché de token y de imágenes        │
                      │  - Motor de simulación calibrado       │
                      └──────────────┬──────────────────┬──────┘
                                     │                  │
                Bearer Token         │                  │ Evalscript & BBox
                                     ▼                  ▼
              ┌───────────────────────────┐      ┌───────────────────────────┐
              │  Copernicus Identity      │      │  Sentinel Hub Process     │
              │  OpenID Token Endpoint    │      │  & Catalog STAC API       │
              └───────────────────────────┘      └───────────────────────────┘
```

---

## 🚀 Puesta en Marcha

### Prerrequisitos
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js (v18+)](https://nodejs.org/) y npm

### 1. Iniciar el Backend (.NET 8 Web API)
```bash
cd backend
dotnet run --urls "http://localhost:5000"
```
* Swagger UI disponible en: `http://localhost:5000/swagger`
* Endpoint de estado: `http://localhost:5000/api/disaster/status`
* Endpoint de comparación: `POST http://localhost:5000/api/compare`

### 2. Iniciar el Frontend (Angular)
```bash
cd frontend
npm start
```
* Acceder desde el navegador en: **`http://localhost:4200`**

---

## 🔑 Configuración de Autenticación CDSE (Copernicus)

Para conectar tu propia cuenta oficial de Copernicus Data Space Ecosystem:
1. Regístrate gratis en [dataspace.copernicus.eu](https://dataspace.copernicus.eu/).
2. Entra al dashboard de **Sentinel Hub Services** y genera un cliente OAuth (tipo *Client Credentials*).
3. Añade tu `ClientId` y `ClientSecret` en [backend/appsettings.json](file:///x:/projects/Vigilante/backend/appsettings.json):

```json
{
  "Copernicus": {
    "ClientId": "TU_CLIENT_ID",
    "ClientSecret": "TU_CLIENT_SECRET",
    "TokenEndpoint": "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    "ApiBaseUrl": "https://sh.dataspace.copernicus.eu"
  }
}
```

> 💡 **Modo Simulación Calibrada**: Si no cuentas con credenciales al momento de probar la app, Vigilante activa automáticamente un generador multiespectral calibrado en C# con firmas radiométricas idénticas a las de Sentinel-2 L2A para que toda la interfaz funcione de inmediato.

---

## 🎨 Modos Multiespectrales y Evalscripts

1. **RGB Natural (`B04, B03, B02`)**:
   - Refleja la luz en el espectro visible tal como la percibe el ojo humano.
2. **Falso Color SWIR/NIR (`B12, B8A, B04`)**:
   - Óptimo para **huaicos** y **deslizamientos**. Resalta con alto contraste los depósitos de lodo húmedo, suelos removidos y rocas fracturadas frente a la vegetación.
3. **Índice NDWI (`B03, B08`)**:
   - Normaliza la reflectancia de cuerpos de agua frente al infrarrojo cercano. Crucial para delinear la lámina de desborde e **inundaciones**.
4. **Índice NBR (`B08, B12`)**:
   - Mide la severidad del daño por **incendios forestales** y delimita con precisión la cicatriz de quema (burn scar).

---

## 🇵🇪 Casos de Estudio Preconfigurados
- **Huaico en Chosica / Lurigancho (Lima, 2023)**: Activación de quebradas Carossio y Quirio.
- **Inundación Bajo Piura - Ciclón Yaku (Piura, 2023)**: Desborde masivo del río Piura.
- **Incendio Forestal en Cusco (Valle Sur / Canas, 2024)**: Pérdida de pastizales y queñuales altoandinos.
- **Huaico Quebrada Malanche (Punta Hermosa, 2023)**: Llegada intempestiva de detritos al mar.
