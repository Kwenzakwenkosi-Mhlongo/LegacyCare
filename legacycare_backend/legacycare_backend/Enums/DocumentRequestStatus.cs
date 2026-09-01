// ============================================================
// File: Enums/DocumentRequestStatus.cs
// ============================================================

namespace PolicyManagement.Enums
{
    public enum DocumentRequestStatus
    {
        Submitted = 0,
        Processing = 1,
        Ready = 2,
        Delivered = 3,
        Rejected = 4,
        Cancelled = 5
    }
}
