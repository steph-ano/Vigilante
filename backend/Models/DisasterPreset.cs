namespace Vigilante.Api.Models;

public class DisasterPreset
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty; // huaico, incendio, inundacion
    public string Description { get; set; } = string.Empty;
    public DateTime DateBefore { get; set; }
    public DateTime DateAfter { get; set; }
    public BoundingBox Bbox { get; set; } = null!;
    public double CenterLat { get; set; }
    public double CenterLng { get; set; }
    public int DefaultZoom { get; set; } = 13;
    public string DefaultVisualization { get; set; } = "false_color_swir";
    public string HistoricalImpact { get; set; } = string.Empty;
}
