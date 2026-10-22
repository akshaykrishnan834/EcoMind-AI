using EcoMind.API.Models;

namespace EcoMind.API.Helpers
{
    public static class EcoPointsCalculator
    {
        /// <summary>
        /// Progressive Scaling by Completed Pickup Count (+ Waste Volume Bonus):
        /// - 1st to 2nd pickup: 2 points
        /// - 3rd to 4th pickup: 3 points
        /// - 5th+ pickup: 4 points
        /// Volume bonus:
        /// - "Small": +0
        /// - "Medium": +1
        /// - "Large": +2
        /// </summary>
        public static int CalculatePointsForPickup(int completedPickupNumber, string? volume)
        {
            if (completedPickupNumber < 1) completedPickupNumber = 1;

            int basePoints = completedPickupNumber <= 2 ? 2 : (completedPickupNumber <= 4 ? 3 : 4);

            int volumeBonus = 0;
            if (string.Equals(volume, "Medium", StringComparison.OrdinalIgnoreCase))
            {
                volumeBonus = 1;
            }
            else if (string.Equals(volume, "Large", StringComparison.OrdinalIgnoreCase))
            {
                volumeBonus = 2;
            }

            return basePoints + volumeBonus;
        }

        /// <summary>
        /// Calculate total points earned across an ordered list of completed pickup requests
        /// </summary>
        public static int CalculateTotalPointsFromPickups(IEnumerable<PickupRequest> completedRequests)
        {
            if (completedRequests == null) return 0;

            int total = 0;
            int pickupNumber = 1;

            foreach (var req in completedRequests)
            {
                total += CalculatePointsForPickup(pickupNumber, req.EstimatedVolume);
                pickupNumber++;
            }

            return total;
        }

        public static string GetPointsDescription(int completedPickupNumber, string? volume, int points)
        {
            var vol = string.IsNullOrWhiteSpace(volume) ? "Medium" : volume.Trim();
            return $"Doorstep collection (Pickup #{completedPickupNumber}, {vol} volume: +{points} Pts)";
        }
    }
}
