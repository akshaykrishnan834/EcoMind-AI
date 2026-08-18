namespace EcoMind.API.DTOs
{
    public class VerifyCitizenDto
    {
        public bool IsVerified { get; set; } = true;

        public string Status { get; set; } = "Verified";

        public string VerifiedBy { get; set; } = "Admin";
    }
}
