using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models.TaskManagement;
using TaskStatus = PolicyManagement.Enums.TaskStatus;

namespace PolicyManagement.Service.TaskManagement
{
    public class TaskService : ITaskService
    {
        private readonly AppDbContext _context;

        public TaskService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<TaskItem> GetAllTasks()
        {
            return _context.Task
                .Include(t => t.AssignedTo)
                .Include(t => t.Policy)
                    .ThenInclude(p => p.Package)
                .Include(t => t.Deceased)
                .ToList();
        }

        public TaskItem GetTaskById(string taskId)
        {
            var task = _context.Task
                .Include(t => t.AssignedTo)
                .Include(t => t.Policy)
                    .ThenInclude(p => p.Package)
                .Include(t => t.Deceased)
                .FirstOrDefault(t => t.TaskId == taskId);

            if (task == null)
                throw new KeyNotFoundException("Task not found.");

            return task;
        }

        public IEnumerable<TaskItem> GetTasksByStaff(string staffId)
        {
            return _context.Task
                .Include(t => t.AssignedTo)
                .Include(t => t.Policy)
                    .ThenInclude(p => p.Package)
                .Include(t => t.Deceased)
                .Where(t => t.AssignedToId == staffId)
                .ToList();
        }

        public IEnumerable<TaskItem> SearchTasks(string keyword)
        {
            keyword = keyword.Trim().ToLower();

            return _context.Task
                .Include(t => t.AssignedTo)
                .Include(t => t.Policy)
                    .ThenInclude(p => p.Package)
                .Include(t => t.Deceased)
                .Where(t =>
                    t.Title.ToLower().Contains(keyword) ||
                    (t.Description != null && t.Description.ToLower().Contains(keyword)))
                .ToList();
        }

        public TaskItem CreateTask(TaskItem task)
        {
            bool assignedUserExists = _context.Users
                .Any(u => u.UserId == task.AssignedToId);

            if (!assignedUserExists)
                throw new KeyNotFoundException("Assigned staff member not found.");

            _context.Task.Add(task);
            _context.SaveChanges();

            return task;
        }

        public TaskItem UpdateTask(string taskId, TaskItem updatedTask)
        {
            var task = GetTaskById(taskId);

            task.UpdateDetails(
                updatedTask.Title,
                updatedTask.Description,
                updatedTask.StartDate,
                updatedTask.DueDate);

            _context.SaveChanges();

            return task;
        }

        public void AssignStaff(string taskId, string staffId)
        {
            var task = GetTaskById(taskId);

            bool exists = _context.Users
                .Any(u => u.UserId == staffId);

            if (!exists)
                throw new KeyNotFoundException("Staff member not found.");

            task.AssignStaff(staffId);
            _context.SaveChanges();
        }

        public void UpdateTaskStatus(string taskId, TaskStatus status)
        {
            var task = GetTaskById(taskId);

            switch (status)
            {
                case TaskStatus.NotStarted:
                    task.MarkNotStarted();
                    break;
                case TaskStatus.InProgress:
                    task.MarkInProgress();
                    break;
                case TaskStatus.Completed:
                    task.MarkCompleted();
                    break;
            }

            _context.SaveChanges();
        }

        public void UploadProofImage(string taskId, string imagePath)
        {
            var task = GetTaskById(taskId);
            task.AttachProofImage(imagePath);
            _context.SaveChanges();
        }

        public void DeleteTask(string taskId)
        {
            var task = GetTaskById(taskId);
            _context.Task.Remove(task);
            _context.SaveChanges();
        }
    }
}