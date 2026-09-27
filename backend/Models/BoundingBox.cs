namespace Vigilante.Api.Models;

public class BoundingBox
{
    public double MinX { get; set; } // West longitude
    public double MinY { get; set; } // South latitude
    public double MaxX { get; set; } // East longitude
    public double MaxY { get; set; } // North latitude

    public double[] ToArray() => new[] { MinX, MinY, MaxX, MaxY };

    public static BoundingBox FromArray(double[] coords)
    {
        if (coords == null || coords.Length < 4)
            throw new ArgumentException("BoundingBox array requires at least 4 coordinates [minX, minY, maxX, maxY]");
        return new BoundingBox
        {
            MinX = coords[0],
            MinY = coords[1],
            MaxX = coords[2],
            MaxY = coords[3]
        };
    }
}
