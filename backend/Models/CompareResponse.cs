namespace Vigilante.Api.Models;

public class ImageResult
{
    public string ImageBase64 { get; set; } = string.Empty;
    public string MimeType { get; set; } = "image/png";
    public DateTime? AcquiredDate { get; set; }
    public double? CloudCoverPercentage { get; set; }
    public string? SceneId { get; set; }
    public string VisualizationMode { get; set; } = string.Empty;
    public BoundingBox? Bbox { get; set; }
    public string? Title { get; set; }
}

public class DifferenceMetric
{
    public string MetricName { get; set; } = string.Empty; // e.g., "dNDWI", "dNBR", "Luminance Delta"
    public double EstimatedImpactPercentage { get; set; }
    public string SeverityLevel { get; set; } = "Moderate"; // Low, Moderate, Severe, Extreme
    public string Interpretation { get; set; } = string.Empty;
}

public class CompareResponse
{
    public ImageResult Before { get; set; } = null!;
    public ImageResult After { get; set; } = null!;
    public DifferenceMetric? DifferenceMetric { get; set; }
    public bool IsSimulated { get; set; }
    public string Message { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string VisualizationMode { get; set; } = string.Empty;
    public long ProcessingTimeMs { get; set; }
}
