namespace Vigilante.Api.Models;

public class CompareRequest
{
    public BoundingBox Bbox { get; set; } = null!;
    public DateTime DateBefore { get; set; }
    public DateTime DateAfter { get; set; }
    public string EventType { get; set; } = "huaico"; // huaico, incendio, inundacion, custom
    public string VisualizationMode { get; set; } = "true_color"; // true_color, false_color_swir, ndwi, nbr
    public int MaxCloudCoverage { get; set; } = 30;
    public int Width { get; set; } = 800;
    public int Height { get; set; } = 800;
    public bool ForceLive { get; set; } = false;
}
