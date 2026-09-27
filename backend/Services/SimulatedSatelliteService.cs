using System.IO.Compression;
using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public class SimulatedSatelliteService : ISimulatedSatelliteService
{
    public ImageResult GenerateSimulatedImage(
        BoundingBox bbox,
        DateTime date,
        string visualizationMode,
        string eventType,
        bool isAftermath,
        int width = 800,
        int height = 800)
    {
        width = Math.Clamp(width, 256, 1200);
        height = Math.Clamp(height, 256, 1200);

        byte[] rawPixels = new byte[width * height * 3]; // RGB24

        // Seeded pseudo-random generator based on bbox coordinates for consistent geographic features
        int seed = (int)((Math.Abs(bbox.MinX) * 1000 + Math.Abs(bbox.MinY) * 1000) % 100000);
        var rng = new Random(seed);

        var normMode = (visualizationMode ?? "true_color").ToLowerInvariant();
        var normType = (eventType ?? "huaico").ToLowerInvariant();

        // Render terrain
        for (int y = 0; y < height; y++)
        {
            double ny = (double)y / height;
            for (int x = 0; x < width; x++)
            {
                double nx = (double)x / width;
                int idx = (y * width + x) * 3;

                // Base topography: elevation gradients + terrain texture
                double elevation = Math.Sin(nx * 4.0 + ny * 2.0) * 0.3 + Math.Cos(ny * 5.0 - nx * 3.0) * 0.2 + 0.5;
                double noise = ((Math.Sin(x * 0.15) * Math.Cos(y * 0.15)) + 1.0) * 0.5 * 0.15;

                byte r, g, b;

                if (normType.Contains("incendio"))
                {
                    // Mountain / forest terrain
                    if (normMode == "nbr")
                    {
                        // Healthy vegetation is green in NBR
                        r = 40; g = 180; b = 60;
                    }
                    else if (normMode == "false_color_swir")
                    {
                        // Healthy forest is vibrant green / cyan in SWIR
                        r = 50; g = 190; b = 70;
                    }
                    else
                    {
                        // Natural forest green
                        r = (byte)Math.Clamp(55 + elevation * 30 + noise * 50, 0, 255);
                        g = (byte)Math.Clamp(125 + elevation * 50 + noise * 60, 0, 255);
                        b = (byte)Math.Clamp(45 + elevation * 20, 0, 255);
                    }

                    // Burn scar in aftermath
                    if (isAftermath)
                    {
                        double dx = nx - 0.52;
                        double dy = ny - 0.48;
                        double dist = Math.Sqrt(dx * dx * 1.5 + dy * dy);
                        // Irregular burn perimeter
                        double burnEdge = 0.22 + Math.Sin(nx * 20.0 + ny * 15.0) * 0.05;
                        if (dist < burnEdge)
                        {
                            double intensity = 1.0 - (dist / burnEdge);
                            if (normMode == "nbr")
                            {
                                // NBR Burn scar is severe red/crimson
                                r = (byte)Math.Clamp(230 + intensity * 25, 0, 255);
                                g = (byte)Math.Clamp(35 + (1 - intensity) * 40, 0, 255);
                                b = (byte)Math.Clamp(25, 0, 255);
                            }
                            else if (normMode == "false_color_swir")
                            {
                                // SWIR Burn scar is dark rust / burnt orange
                                r = (byte)Math.Clamp(210 + intensity * 40, 0, 255);
                                g = (byte)Math.Clamp(80 + intensity * 20, 0, 255);
                                b = (byte)Math.Clamp(40, 0, 255);
                            }
                            else
                            {
                                // Natural RGB: Charred black/dark brown ash
                                r = (byte)Math.Clamp(45 + (1 - intensity) * 30, 0, 255);
                                g = (byte)Math.Clamp(35 + (1 - intensity) * 25, 0, 255);
                                b = (byte)Math.Clamp(30 + (1 - intensity) * 20, 0, 255);
                            }
                        }
                    }
                }
                else if (normType.Contains("inundacion"))
                {
                    // Lowland valley with meandering river
                    double riverCenter = 0.5 + Math.Sin(ny * 6.0) * 0.15 + Math.Cos(ny * 12.0) * 0.04;
                    double riverDist = Math.Abs(nx - riverCenter);

                    // Surrounding agricultural floodplain
                    if (normMode == "ndwi")
                    {
                        // Dry land in NDWI is beige/brown
                        r = 160; g = 140; b = 120;
                    }
                    else if (normMode == "false_color_swir")
                    {
                        // Crops are orange/green, bare soil is cyan/tan
                        r = 120; g = 180; b = 110;
                    }
                    else
                    {
                        // Natural landscape
                        r = (byte)Math.Clamp(130 + elevation * 40, 0, 255);
                        g = (byte)Math.Clamp(160 + elevation * 30, 0, 255);
                        b = (byte)Math.Clamp(100 + elevation * 20, 0, 255);
                    }

                    // Water channel
                    double riverWidth = isAftermath ? 0.14 : 0.035; // Expands drastically after flood
                    if (riverDist < riverWidth)
                    {
                        double floodEdgeFactor = riverDist / riverWidth;
                        if (normMode == "ndwi")
                        {
                            // Water in NDWI is vibrant cyan/blue
                            r = (byte)(20 + floodEdgeFactor * 40);
                            g = (byte)(110 + floodEdgeFactor * 50);
                            b = (byte)(240 - floodEdgeFactor * 30);
                        }
                        else if (normMode == "false_color_swir")
                        {
                            // Water in SWIR is deep midnight blue/black
                            r = 15; g = 30; b = 85;
                        }
                        else
                        {
                            // Sedimentary brown river flood water
                            if (isAftermath)
                            {
                                r = (byte)Math.Clamp(150 + floodEdgeFactor * 30, 0, 255);
                                g = (byte)Math.Clamp(120 + floodEdgeFactor * 25, 0, 255);
                                b = (byte)Math.Clamp(85 + floodEdgeFactor * 20, 0, 255);
                            }
                            else
                            {
                                r = 40; g = 85; b = 130;
                            }
                        }
                    }
                }
                else // Huaico / Mudslide (Default - e.g. Chosica / Lurigancho)
                {
                    // Arid andean ravine with urban sprawl at base
                    bool isUrban = ny > 0.65 && (Math.Sin(nx * 80.0) * Math.Cos(ny * 80.0) > 0.1);

                    if (normMode == "false_color_swir")
                    {
                        // SWIR: Arid soil is pinkish/tan, dry rocky slopes are violet/grey
                        r = 185; g = 145; b = 125;
                        if (isUrban) { r = 160; g = 175; b = 195; } // Urban structures
                    }
                    else
                    {
                        // True Color: Dry Peruvian coastal/Andean hills (sand, rock, beige)
                        r = (byte)Math.Clamp(190 + elevation * 30 - noise * 30, 0, 255);
                        g = (byte)Math.Clamp(170 + elevation * 25 - noise * 30, 0, 255);
                        b = (byte)Math.Clamp(140 + elevation * 20 - noise * 30, 0, 255);

                        if (isUrban)
                        {
                            // Roofs and asphalt
                            r = (byte)Math.Clamp(160 + (nx * 100 % 30), 0, 255);
                            g = (byte)Math.Clamp(150 + (ny * 100 % 30), 0, 255);
                            b = (byte)Math.Clamp(145 + (nx * 50 % 20), 0, 255);
                        }
                    }

                    // Quebrada / Canyon path
                    double canyonX = 0.48 + Math.Sin(ny * 5.0) * 0.12 + Math.Sin(ny * 15.0) * 0.03;
                    double distToCanyon = Math.Abs(nx - canyonX);

                    // Alluvial fan spread towards the bottom
                    double fanExpansion = Math.Max(0.02, (ny - 0.3) * 0.16);

                    if (isAftermath && distToCanyon < fanExpansion)
                    {
                        double sedimentEdge = distToCanyon / fanExpansion;
                        if (normMode == "false_color_swir")
                        {
                            // Mud and wet debris in SWIR is striking dark cyan / saturated rust
                            r = (byte)Math.Clamp(110 + sedimentEdge * 60, 0, 255);
                            g = (byte)Math.Clamp(75 + sedimentEdge * 50, 0, 255);
                            b = (byte)Math.Clamp(60 + sedimentEdge * 40, 0, 255);
                        }
                        else
                        {
                            // Thick wet brown mud flow / sediment accumulation
                            r = (byte)Math.Clamp(115 - sedimentEdge * 20, 0, 255);
                            g = (byte)Math.Clamp(85 - sedimentEdge * 15, 0, 255);
                            b = (byte)Math.Clamp(60 - sedimentEdge * 10, 0, 255);
                        }
                    }
                    else if (!isAftermath && distToCanyon < 0.015)
                    {
                        // Dry narrow riverbed before huaico
                        r = (byte)Math.Clamp(r - 20, 0, 255);
                        g = (byte)Math.Clamp(g - 20, 0, 255);
                        b = (byte)Math.Clamp(b - 20, 0, 255);
                    }
                }

                rawPixels[idx] = r;
                rawPixels[idx + 1] = g;
                rawPixels[idx + 2] = b;
            }
        }

        byte[] pngBytes = EncodeToPng(rawPixels, width, height);
        string base64 = Convert.ToBase64String(pngBytes);

        return new ImageResult
        {
            ImageBase64 = $"data:image/png;base64,{base64}",
            MimeType = "image/png",
            AcquiredDate = date,
            CloudCoverPercentage = Math.Round(rng.NextDouble() * 3.5, 1),
            SceneId = $"S2A_MSIL2A_{date:yyyyMMdd}T150000_SIMULATED",
            VisualizationMode = visualizationMode ?? "true_color",
            Bbox = bbox,
            Title = isAftermath ? $"Después del evento ({date:yyyy-MM-dd})" : $"Antes del evento ({date:yyyy-MM-dd})"
        };
    }

    private static byte[] EncodeToPng(byte[] rgbPixels, int width, int height)
    {
        using var ms = new MemoryStream();

        // 1. PNG Signature
        ms.Write(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });

        // 2. IHDR Chunk (13 bytes payload)
        var ihdr = new byte[13];
        WriteBigEndianInt32(ihdr, 0, width);
        WriteBigEndianInt32(ihdr, 4, height);
        ihdr[8] = 8; // 8-bit depth
        ihdr[9] = 2; // Color type 2: RGB
        ihdr[10] = 0; // Compression (deflate)
        ihdr[11] = 0; // Filter (none)
        ihdr[12] = 0; // Interlace (none)
        WriteChunk(ms, "IHDR", ihdr);

        // 3. IDAT Chunk: Scanlines with filter byte 0 (None)
        byte[] rawScanlines = new byte[height * (1 + width * 3)];
        int srcIdx = 0;
        int dstIdx = 0;
        for (int y = 0; y < height; y++)
        {
            rawScanlines[dstIdx++] = 0; // Filter type 0
            for (int x = 0; x < width; x++)
            {
                rawScanlines[dstIdx++] = rgbPixels[srcIdx++];
                rawScanlines[dstIdx++] = rgbPixels[srcIdx++];
                rawScanlines[dstIdx++] = rgbPixels[srcIdx++];
            }
        }

        // Deflate compression
        using var compressedMs = new MemoryStream();
        // ZLib header: 0x78, 0x9C (default compression)
        compressedMs.WriteByte(0x78);
        compressedMs.WriteByte(0x9C);

        using (var deflate = new DeflateStream(compressedMs, CompressionLevel.Optimal, leaveOpen: true))
        {
            deflate.Write(rawScanlines, 0, rawScanlines.Length);
        }

        // Adler-32 checksum at the end of zlib stream
        uint adler = CalculateAdler32(rawScanlines);
        compressedMs.WriteByte((byte)((adler >> 24) & 0xFF));
        compressedMs.WriteByte((byte)((adler >> 16) & 0xFF));
        compressedMs.WriteByte((byte)((adler >> 8) & 0xFF));
        compressedMs.WriteByte((byte)(adler & 0xFF));

        WriteChunk(ms, "IDAT", compressedMs.ToArray());

        // 4. IEND Chunk
        WriteChunk(ms, "IEND", Array.Empty<byte>());

        return ms.ToArray();
    }

    private static void WriteChunk(Stream stream, string type, byte[] data)
    {
        byte[] typeBytes = System.Text.Encoding.ASCII.GetBytes(type);
        byte[] lengthBytes = new byte[4];
        WriteBigEndianInt32(lengthBytes, 0, data.Length);
        stream.Write(lengthBytes);
        stream.Write(typeBytes);
        if (data.Length > 0)
        {
            stream.Write(data);
        }

        // CRC32 of type + data
        uint crc = Crc32(typeBytes, data);
        byte[] crcBytes = new byte[4];
        WriteBigEndianInt32(crcBytes, 0, (int)crc);
        stream.Write(crcBytes);
    }

    private static void WriteBigEndianInt32(byte[] buffer, int offset, int value)
    {
        buffer[offset] = (byte)((value >> 24) & 0xFF);
        buffer[offset + 1] = (byte)((value >> 16) & 0xFF);
        buffer[offset + 2] = (byte)((value >> 8) & 0xFF);
        buffer[offset + 3] = (byte)(value & 0xFF);
    }

    private static uint CalculateAdler32(byte[] data)
    {
        uint a = 1, b = 0;
        const uint MOD_ADLER = 65521;
        for (int i = 0; i < data.Length; i++)
        {
            a = (a + data[i]) % MOD_ADLER;
            b = (b + a) % MOD_ADLER;
        }
        return (b << 16) | a;
    }

    private static uint Crc32(byte[] type, byte[] data)
    {
        uint[] table = GetCrcTable();
        uint crc = 0xFFFFFFFF;
        for (int i = 0; i < type.Length; i++)
            crc = table[(crc ^ type[i]) & 0xFF] ^ (crc >> 8);
        for (int i = 0; i < data.Length; i++)
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >> 8);
        return crc ^ 0xFFFFFFFF;
    }

    private static uint[]? _crcTable;
    private static uint[] GetCrcTable()
    {
        if (_crcTable != null) return _crcTable;
        var table = new uint[256];
        for (uint i = 0; i < 256; i++)
        {
            uint c = i;
            for (int k = 0; k < 8; k++)
            {
                if ((c & 1) != 0) c = 0xEDB88320 ^ (c >> 1);
                else c >>= 1;
            }
            table[i] = c;
        }
        _crcTable = table;
        return table;
    }
}
