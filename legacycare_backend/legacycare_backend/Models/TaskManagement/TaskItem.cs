using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.TaskManagement
{
    public class TaskItem
    {
        [Key]
        public required string TaskId { get; set; }

        [StringLength(100)]
        public required string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; } = string.Empty;

        public required DateTime StartDate { get; set; }

        public required DateTime DueDate { get; set; }

        public required Enums.TaskStatus Status { get; set; }

        public string? ProofImagePath { get; private set; }

        public required string AssignedToId { get; set; } = string.Empty;

        public string? PolicyId { get; set; }

        public string? DeceasedId { get; set; }

        public required DateTime CreatedDate { get; set; }

        [ForeignKey(nameof(AssignedToId))]
        public virtual User? AssignedTo { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        [ForeignKey(nameof(DeceasedId))]
        public virtual Deceased? Deceased { get; set; }

        [SetsRequiredMembers]
        public TaskItem()
        {
            TaskId = Guid.NewGuid().ToString();
            CreatedDate = DateTime.UtcNow;
            Status = Enums.TaskStatus.NotStarted;
        }

        [SetsRequiredMembers]
        public TaskItem(
            string title,
            string description,
            DateTime startDate,
            DateTime dueDate,
            string assignedToId,
            string? deceasedId)
        {
            TaskId = Guid.NewGuid().ToString();
            Title = title;
            Description = description;
            StartDate = startDate;
            DueDate = dueDate;
            DeceasedId = deceasedId;
            AssignedToId = assignedToId;
            CreatedDate = DateTime.UtcNow;
            Status = Enums.TaskStatus.NotStarted;
        }

        public void AssignStaff(string staffId)
        {
            if (string.IsNullOrWhiteSpace(staffId))
                throw new ArgumentException("Staff ID cannot be empty.");

            AssignedToId = staffId;
        }

        public void AssignPolicy(string policyId)
        {
            PolicyId = policyId;
        }

        public void AssignDeceased(string deceasedId)
        {
            DeceasedId = deceasedId;
        }

        public void UpdateDetails(
            string title,
            string description,
            DateTime startDate,
            DateTime dueDate)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Task title cannot be empty.");

            if (dueDate < startDate)
                throw new ArgumentException("Due date cannot be before the start date.");

            Title = title;
            Description = description;
            StartDate = startDate;
            DueDate = dueDate;
        }

        public void MarkNotStarted()
        {
            Status = Enums.TaskStatus.NotStarted;
        }

        public void MarkInProgress()
        {
            Status = Enums.TaskStatus.InProgress;
        }

        public void MarkCompleted()
        {
            Status = Enums.TaskStatus.Completed;
        }

        public void AttachProofImage(string imagePath)
        {
            if (string.IsNullOrWhiteSpace(imagePath))
                throw new ArgumentException("Image path cannot be empty.");

            ProofImagePath = imagePath;
        }
    }
}