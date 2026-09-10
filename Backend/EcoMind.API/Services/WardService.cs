using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class WardService : IWardService
    {
        private readonly IWardRepository _wardRepository;

        public WardService(IWardRepository wardRepository)
        {
            _wardRepository = wardRepository;
        }

        public async Task CreateWardAsync(CreateWardDto dto)
        {
            var boundary = dto.Boundary;
            if (boundary == null || boundary.Count == 0)
            {
                boundary = await GetOfficialBoundaryAsync(dto.PanchayatName, dto.WardId, dto.WardName);
            }

            var ward = new Ward
            {
                WardId = dto.WardId,
                WardName = dto.WardName,
                PanchayatName = dto.PanchayatName,
                Status = dto.Status,
                Boundary = boundary ?? new List<List<double>>()
            };

            await _wardRepository.CreateWardAsync(ward);
        }

        public async Task<List<List<double>>?> GetOfficialBoundaryAsync(string panchayatName, string wardIdentifier, string? wardName = null)
        {
            try
            {
                var filePath = Path.Combine(AppContext.BaseDirectory, "Data", "kerala_delimitation_boundaries.json");
                if (!File.Exists(filePath))
                {
                    // Fallback to source directory during development
                    var sourcePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "kerala_delimitation_boundaries.json");
                    if (File.Exists(sourcePath)) filePath = sourcePath;
                }

                if (!File.Exists(filePath)) return null;

                var json = await File.ReadAllTextAsync(filePath);
                using var doc = System.Text.Json.JsonDocument.Parse(json);

                int? targetNum = null;
                var match = System.Text.RegularExpressions.Regex.Match(wardIdentifier ?? "", @"\d+");
                if (match.Success && int.TryParse(match.Value, out int n))
                {
                    targetNum = n;
                }

                string normPanchayat = (panchayatName ?? "").Trim().ToLower();
                string normWardName = (wardName ?? "").Trim().ToLower();

                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    string elPanchayat = element.GetProperty("panchayatName").GetString()?.Trim().ToLower() ?? "";
                    int elWardNum = element.GetProperty("wardNumber").GetInt32();
                    string elWardName = element.GetProperty("wardName").GetString()?.Trim().ToLower() ?? "";

                    bool panchayatMatches = string.IsNullOrEmpty(normPanchayat) || 
                                           normPanchayat.Contains(elPanchayat) || 
                                           elPanchayat.Contains(normPanchayat);

                    if (panchayatMatches)
                    {
                        if (targetNum.HasValue && targetNum.Value == elWardNum)
                        {
                            return ParseBoundaryFromJson(element.GetProperty("boundary"));
                        }

                        if (!string.IsNullOrEmpty(normWardName) && (elWardName.Contains(normWardName) || normWardName.Contains(elWardName)))
                        {
                            return ParseBoundaryFromJson(element.GetProperty("boundary"));
                        }
                    }
                }
            }
            catch
            {
                // Fallback gracefully if file not found or corrupted
            }

            return null;
        }

        private List<List<double>> ParseBoundaryFromJson(System.Text.Json.JsonElement boundaryElement)
        {
            var result = new List<List<double>>();
            foreach (var point in boundaryElement.EnumerateArray())
            {
                var coords = new List<double>();
                foreach (var coord in point.EnumerateArray())
                {
                    coords.Add(coord.GetDouble());
                }
                result.Add(coords);
            }
            return result;
        }

        public async Task<List<Ward>> GetAllWardsAsync()
        {
            return await _wardRepository.GetAllWardsAsync();
        }

        public async Task UpdateWardBoundaryAsync(string wardId, List<List<double>> boundary)
        {
            await _wardRepository.UpdateWardBoundaryAsync(wardId, boundary);
        }

        public async Task<string?> IdentifyWardByLocationAsync(double latitude, double longitude)
        {
            var wards = await _wardRepository.GetAllWardsAsync();

            foreach (var ward in wards)
            {
                if (ward.Boundary != null && ward.Boundary.Count >= 3)
                {
                    if (IsPointInPolygon(latitude, longitude, ward.Boundary))
                    {
                        return ward.WardId;
                    }
                }
            }

            return null;
        }

        private bool IsPointInPolygon(double lat, double lng, List<List<double>> polygon)
        {
            bool isInside = false;
            int j = polygon.Count - 1;

            for (int i = 0; i < polygon.Count; i++)
            {
                // polygon[i][0] is lat, polygon[i][1] is lng
                if (((polygon[i][0] > lat) != (polygon[j][0] > lat)) &&
                    (lng < (polygon[j][1] - polygon[i][1]) * (lat - polygon[i][0]) / (polygon[j][0] - polygon[i][0]) + polygon[i][1]))
                {
                    isInside = !isInside;
                }
                j = i;
            }

            return isInside;
        }
    }
}