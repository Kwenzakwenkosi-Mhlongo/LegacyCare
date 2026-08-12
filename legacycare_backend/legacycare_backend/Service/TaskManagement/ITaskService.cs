using PolicyManagement.Models.TaskManagement;
using TaskStatus = PolicyManagement.Enums.TaskStatus;

namespace PolicyManagement.Service.TaskManagement
{
    public interface ITaskService
    {
        IEnumerable<TaskItem> GetAllTasks();

        TaskItem GetTaskById(string taskId);

        IEnumerable<TaskItem> GetTasksByStaff(string staffId);

        IEnumerable<TaskItem> SearchTasks(string keyword);

        TaskItem CreateTask(TaskItem task);

        TaskItem UpdateTask(string taskId, TaskItem updatedTask);

        void AssignStaff(string taskId, string staffId);

        void UpdateTaskStatus(string taskId, TaskStatus status);

        void UploadProofImage(string taskId, string imagePath);

        void DeleteTask(string taskId);
    }
}