using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.TaskManagement;
using PolicyManagement.Service.TaskManagement;
using TaskStatus = PolicyManagement.Enums.TaskStatus;

namespace PolicyManagement.Controllers.TaskManagement
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TaskController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [Authorize(Roles = "Admin,Clerk,Staff")]
        [HttpGet]
        public IActionResult GetAllTasks()
        {
            try
            {
                var tasks = _taskService.GetAllTasks();

                var response = tasks.Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    t.StartDate,
                    t.DueDate,
                    Status = t.Status.ToString(),
                    t.AssignedToId,
                    AssignedTo = t.AssignedTo == null ? null : new
                    {
                        t.AssignedTo.UserId,
                        t.AssignedTo.FullName,
                        t.AssignedTo.Email,
                        Role = t.AssignedTo.Role.ToString()
                    },
                    Deceased = t.Deceased == null ? null : new
                    {
                        t.Deceased.DeceasedId,
                        t.Deceased.FullName
                    },
                    t.CreatedDate,
                    t.ProofImagePath
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Clerk,Staff")]
        [HttpGet("{taskId}")]
        public IActionResult GetTaskById(string taskId)
        {
            try
            {
                var task = _taskService.GetTaskById(taskId);

                var response = new
                {
                    task.TaskId,
                    task.Title,
                    task.Description,
                    task.StartDate,
                    task.DueDate,
                    Status = task.Status.ToString(),
                    task.AssignedToId,
                    AssignedTo = task.AssignedTo == null ? null : new
                    {
                        task.AssignedTo.UserId,
                        task.AssignedTo.FullName,
                        task.AssignedTo.Email,
                        Role = task.AssignedTo.Role.ToString()
                    },
                    Deceased = task.Deceased == null ? null : new
                    {
                        task.Deceased.DeceasedId,
                        task.Deceased.FullName
                    },
                    task.CreatedDate,
                    task.ProofImagePath
                };

                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Clerk,Staff")]
        [HttpGet("staff/{staffId}")]
        public IActionResult GetTasksByStaff(string staffId)
        {
            try
            {
                var tasks = _taskService.GetTasksByStaff(staffId);

                var response = tasks.Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    t.StartDate,
                    t.DueDate,
                    Status = t.Status.ToString(),
                    t.AssignedToId,
                    AssignedTo = t.AssignedTo == null ? null : new
                    {
                        t.AssignedTo.UserId,
                        t.AssignedTo.FullName,
                        t.AssignedTo.Email,
                        Role = t.AssignedTo.Role.ToString()
                    },
                    Deceased = t.Deceased == null ? null : new
                    {
                        t.Deceased.DeceasedId,
                        t.Deceased.FullName
                    },
                    t.CreatedDate,
                    t.ProofImagePath
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Clerk,Staff")]
        [HttpGet("search/{keyword}")]
        public IActionResult SearchTasks(string keyword)
        {
            try
            {
                var tasks = _taskService.SearchTasks(keyword);

                var response = tasks.Select(t => new
                {
                    t.TaskId,
                    t.Title,
                    t.Description,
                    t.StartDate,
                    t.DueDate,
                    Status = t.Status.ToString(),
                    t.AssignedToId,
                    AssignedTo = t.AssignedTo == null ? null : new
                    {
                        t.AssignedTo.UserId,
                        t.AssignedTo.FullName,
                        t.AssignedTo.Email,
                        Role = t.AssignedTo.Role.ToString()
                    },
                    Deceased = t.Deceased == null ? null : new
                    {
                        t.Deceased.DeceasedId,
                        t.Deceased.FullName
                    },
                    t.CreatedDate,
                    t.ProofImagePath
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult CreateTask([FromBody] CreateTaskRequest request)
        {
            try
            {
                var task = new TaskItem
                {
                    Title = request.Title,
                    Description = request.Description,
                    StartDate = DateTime.Now,
                    DueDate = request.DueDate,
                    AssignedToId = request.AssignedToId,
                    DeceasedId = request.DeceasedId,
                    Status = TaskStatus.NotStarted
                };

                var created = _taskService.CreateTask(task);

                return CreatedAtAction(
                    nameof(GetTaskById),
                    new { taskId = created.TaskId },
                    created);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{taskId}")]
        public IActionResult UpdateTask(string taskId, [FromBody] UpdateTaskRequest request)
        {
            try
            {
                var task = _taskService.GetTaskById(taskId);

                task.UpdateDetails(
                    request.Title,
                    request.Description,
                    task.StartDate,
                    request.DueDate);

                if (!string.IsNullOrEmpty(request.AssignedToId))
                {
                    task.AssignStaff(request.AssignedToId);
                }

                if (!string.IsNullOrEmpty(request.DeceasedId))
                {
                    task.AssignDeceased(request.DeceasedId);
                }

                _taskService.UpdateTask(taskId, task);

                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{taskId}/assign/{staffId}")]
        public IActionResult AssignStaff(string taskId, string staffId)
        {
            try
            {
                _taskService.AssignStaff(taskId, staffId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Clerk,Staff")]
        [HttpPut("{taskId}/status")]
        public IActionResult UpdateTaskStatus(string taskId, [FromQuery] TaskStatus status)
        {
            try
            {
                _taskService.UpdateTaskStatus(taskId, status);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Staff")]
        [HttpPut("{taskId}/proof")]
        public IActionResult UploadProofImage(string taskId, [FromQuery] string imagePath)
        {
            try
            {
                _taskService.UploadProofImage(taskId, imagePath);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{taskId}")]
        public IActionResult DeleteTask(string taskId)
        {
            try
            {
                _taskService.DeleteTask(taskId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}