namespace PolicyManagement.DTOs.Requests
{
    public class CreateClientRequest
{
    public string FullName { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CellNo { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}
}
