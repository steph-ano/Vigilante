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
            DateAfter = new DateTime(2023, 3, 21, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -76.735, MinY = -11.955, MaxX = -76.675, MaxY = -11.910 },
            CenterLat = -11.935,
            CenterLng = -76.705,
            DefaultZoom = 14,
            DefaultVisualization = "false_color_swir",
            HistoricalImpact = "Afectación directa a la Carretera Central y cientos de viviendas soterradas con sedimento aluvial."
        },
        new DisasterPreset
        {
            Id = "secocha-aluvion-2023",
            Title = "Aluvión Secocha / Camaná",
            Location = "Mariano Nicolás Valcárcel",
            Department = "Arequipa",
            EventType = "huaico",
            Description = "Flujo de detritos masivo arrasando campamentos mineros, viviendas y talleres en la quebrada San Martín y Secocha.",
            DateBefore = new DateTime(2023, 1, 20, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2023, 2, 12, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -73.180, MinY = -16.020, MaxX = -73.110, MaxY = -15.960 },
            CenterLat = -15.990,
            CenterLng = -73.145,
            DefaultZoom = 13,
            DefaultVisualization = "false_color_swir",
            HistoricalImpact = "Uno de los huaicos más letales del sur peruano con más de 18 fallecidos y miles de damnificados."
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
            Id = "huascaran-incendio-2024",
            Title = "Incendio P.N. Huascarán",
            Location = "Cordillera Blanca / Carhuaz",
            Department = "Áncash",
            EventType = "incendio",
            Description = "Incendio forestal afectando bosques nativos de queñual y pastizales en zonas de amortiguamiento del Parque Nacional Huascarán.",
            DateBefore = new DateTime(2024, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2024, 8, 28, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -77.650, MinY = -9.350, MaxX = -77.520, MaxY = -9.220 },
            CenterLat = -9.285,
            CenterLng = -77.585,
            DefaultZoom = 13,
            DefaultVisualization = "nbr",
            HistoricalImpact = "Grave afectación de ecosistemas de alta montaña y pérdida de hábitat de biodiversidad andina protegida."
        },
        new DisasterPreset
        {
            Id = "ventanilla-petroleo-2022",
            Title = "Derrame de Petróleo Ventanilla",
            Location = "Bahía de Ventanilla y Ancón",
            Department = "Lima",
            EventType = "inundacion",
            Description = "Derrame masivo de más de 11,000 barriles de crudo en la refinería La Pampilla extendiéndose hacia el norte por la corriente marina.",
            DateBefore = new DateTime(2022, 1, 10, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2022, 1, 25, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -77.200, MinY = -11.920, MaxX = -77.110, MaxY = -11.830 },
            CenterLat = -11.875,
            CenterLng = -77.155,
            DefaultZoom = 13,
            DefaultVisualization = "false_color_swir",
            HistoricalImpact = "Mayor catástrofe ambiental en la costa peruana contemporánea afectando 25 playas e islas guaneras."
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
        },
        new DisasterPreset
        {
            Id = "iquitos-inundacion-2023",
            Title = "Crecida Río Amazonas / Belén",
            Location = "Iquitos, Maynas",
            Department = "Loreto",
            EventType = "inundacion",
            Description = "Crecida estacional extraordinaria del río Amazonas y río Itaya anegando zonas bajas y comunidades ribereñas.",
            DateBefore = new DateTime(2023, 2, 15, 0, 0, 0, DateTimeKind.Utc),
            DateAfter = new DateTime(2023, 4, 25, 0, 0, 0, DateTimeKind.Utc),
            Bbox = new BoundingBox { MinX = -73.280, MinY = -3.780, MaxX = -73.200, MaxY = -3.710 },
            CenterLat = -3.745,
            CenterLng = -73.240,
            DefaultZoom = 13,
            DefaultVisualization = "ndwi",
            HistoricalImpact = "Afectación a miles de familias en la zona baja de Belén y comunidades nativas de la ribera del Amazonas."
        }
    };

    public IReadOnlyList<DisasterPreset> GetAllPresets() => _presets;

    public DisasterPreset? GetPresetById(string id) =>
        _presets.FirstOrDefault(p => string.Equals(p.Id, id, StringComparison.OrdinalIgnoreCase));
}
