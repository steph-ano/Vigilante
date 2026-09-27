using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public class DisasterPresetService : IDisasterPresetService
{
    private static readonly List<DisasterPreset> _presets = new()
    {
        new DisasterPreset
        {
            Id = "chosica-huaico-2023",
            Title = "Huaico en Chosica / Lurigancho",
            Location = "Chosica, Lima",
            Department = "Lima",
            EventType = "huaico",
            Description = "Activación y arrastre masivo de lodo y detritos por las quebradas Carossio y Quirio hacia el valle del río Rímac.",
            DateBefore = new DateTime(2023, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2023, 3, 18, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -76.735, MinY = -11.955, MaxX = -76.675, MaxY = -11.910 },
            CenterLat = -11.935,
            CenterLng = -76.705,
            DefaultZoom = 14,
            DefaultVisualization = "false_color_swir",
            HistoricalImpact = "Afectación directa a la Carretera Central y cientos de viviendas soterradas con sedimento aluvial."
        },
        new DisasterPreset
        {
            Id = "piura-inundacion-2023",
            Title = "Inundación Río Piura - Ciclón Yaku",
            Location = "Bajo Piura, Catacaos",
            Department = "Piura",
            EventType = "inundacion",
            Description = "Crecida extraordinaria del caudal del río Piura desbordando diques e inundando caseríos y miles de hectáreas agrícolas.",
            DateBefore = new DateTime(2023, 2, 20, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2023, 3, 22, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -80.680, MinY = -5.230, MaxX = -80.590, MaxY = -5.160 },
            CenterLat = -5.195,
            CenterLng = -80.635,
            DefaultZoom = 13,
            DefaultVisualization = "ndwi",
            HistoricalImpact = "Más de 10,000 damnificados y colapso de infraestructura de defensa ribereña."
        },
        new DisasterPreset
        {
            Id = "cusco-incendio-2024",
            Title = "Incendio Forestal en Cusco",
            Location = "Valle Sur / Canas",
            Department = "Cusco",
            EventType = "incendio",
            Description = "Voraces incendios forestales consumiendo pastizales de puna, bosques de queñuales y fauna altoandina durante la temporada seca.",
            DateBefore = new DateTime(2024, 8, 12, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2024, 9, 06, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -72.060, MinY = -13.500, MaxX = -71.940, MaxY = -13.410 },
            CenterLat = -13.450,
            CenterLng = -72.000,
            DefaultZoom = 13,
            DefaultVisualization = "nbr",
            HistoricalImpact = "Pérdida de cientos de hectáreas de cobertura vegetal protegida y severa degradación del suelo."
        },
        new DisasterPreset
        {
            Id = "punta-hermosa-2023",
            Title = "Huaico Quebrada Malanche",
            Location = "Punta Hermosa, Lima Sur",
            Department = "Lima",
            EventType = "huaico",
            Description = "Inusual bajada de lodo y agua por la quebrada Malanche cruzando la Panamericana Sur y desembocando en Playa Norte.",
            DateBefore = new DateTime(2023, 3, 5, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2023, 3, 16, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -76.845, MinY = -12.350, MaxX = -76.800, MaxY = -12.310 },
            CenterLat = -12.330,
            CenterLng = -76.822,
            DefaultZoom = 14,
            DefaultVisualization = "false_color_swir",
            HistoricalImpact = "Inundación del casco urbano balneario y vertimiento masivo de sedimento en la bahía."
        }
    };

    public IReadOnlyList<DisasterPreset> GetAllPresets() => _presets;

    public DisasterPreset? GetPresetById(string id) =>
        _presets.FirstOrDefault(p => string.Equals(p.Id, id, StringComparison.OrdinalIgnoreCase));
}
