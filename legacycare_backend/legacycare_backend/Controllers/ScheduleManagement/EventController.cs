using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Enums;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Services.ScheduleManagement;
using System.Security.Claims;

namespace PolicyManagement.Controllers.ScheduleManagement
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventController(IEventService eventService)
        {
            _eventService = eventService;
        }

        private string GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("User not authenticated.");
            return userId;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetAllEvents()
        {
            var events = _eventService.GetAllEvents();
            return Ok(events);
        }

        [HttpGet("my-events")]
        [Authorize(Roles = "Client")]
        public IActionResult GetMyEvents()
        {
            var userId = GetUserId();
            var events = _eventService.GetEventsByClient(userId);
            return Ok(events);
        }

        [Authorize(Roles = "Staff")]
        [HttpGet("staff/{userId}")]
        public IActionResult GetEventsByStaff(string userId)
        {
            var currentUserId = GetUserId();
            if (userId != currentUserId)
                return Forbid("You can only view your own assigned events.");
            var events = _eventService.GetEventsByStaff(userId);
            return Ok(events);
        }

        [HttpGet("{eventId}")]
        public IActionResult GetEventById(string eventId)
        {
            try
            {
                var eventItem = _eventService.GetEventById(eventId);
                return Ok(eventItem);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("client/{clientId}")]
        public IActionResult GetEventsByClient(string clientId)
        {
            var events = _eventService.GetEventsByClient(clientId);
            return Ok(events);
        }

        [HttpGet("date/{date}")]
        public IActionResult GetEventsByDate(DateTime date)
        {
            var events = _eventService.GetEventsByDate(date);
            return Ok(events);
        }

        [HttpGet("search/{keyword}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult SearchEvents(string keyword)
        {
            var events = _eventService.SearchEvents(keyword);
            return Ok(events);
        }

        [HttpGet("lookup")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetEventLookup()
        {
            try
            {
                var events = _eventService.GetAllEvents();

                var lookupData = events
                    .Where(e => e.Status != EventStatus.Cancelled)
                    .Select(e => new
                    {
                        eventId = e.EventId,
                        eventName = e.Title,
                        eventDate = e.EventDate
                    })
                    .OrderBy(e => e.eventDate)
                    .ToList();

                return Ok(lookupData);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Client")]
        public IActionResult CreateEvent([FromBody] Event newEvent)
        {
            try
            {
                var userId = GetUserId();
                newEvent.ClientId = userId;
                var created = _eventService.CreateEvent(newEvent);
                return CreatedAtAction(
                    nameof(GetEventById),
                    new { eventId = created.EventId },
                    created);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{eventId}")]
        [Authorize(Roles = "Client")]
        public IActionResult UpdateEvent(string eventId, [FromBody] Event updatedEvent)
        {
            try
            {
                var userId = GetUserId();
                var existingEvent = _eventService.GetEventById(eventId);
                if (existingEvent.ClientId != userId)
                    return Forbid("You can only update your own events.");
                var result = _eventService.UpdateEvent(eventId, updatedEvent);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{eventId}/staff/{userId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult AddStaff(string eventId, string userId)
        {
            try
            {
                _eventService.AddStaff(eventId, userId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{eventId}/staff/{userId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult RemoveStaff(string eventId, string userId)
        {
            try
            {
                _eventService.RemoveStaff(eventId, userId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{eventId}/deceased/{deceasedId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult AssignDeceased(string eventId, string deceasedId)
        {
            try
            {
                _eventService.AssignDeceased(eventId, deceasedId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{eventId}/complete")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public IActionResult CompleteEvent(string eventId)
        {
            try
            {
                var userId = GetUserId();
                var existingEvent = _eventService.GetEventById(eventId);
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                if (role == "Client" && existingEvent.ClientId != userId)
                    return Forbid("You can only complete your own events.");
                _eventService.CompleteEvent(eventId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{eventId}/cancel")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public IActionResult CancelEvent(string eventId)
        {
            try
            {
                var userId = GetUserId();
                var existingEvent = _eventService.GetEventById(eventId);
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                if (role == "Client" && existingEvent.ClientId != userId)
                    return Forbid("You can only cancel your own events.");
                _eventService.CancelEvent(eventId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{eventId}/postpone")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public IActionResult PostponeEvent(string eventId)
        {
            try
            {
                var userId = GetUserId();
                var existingEvent = _eventService.GetEventById(eventId);
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                if (role == "Client" && existingEvent.ClientId != userId)
                    return Forbid("You can only postpone your own events.");
                _eventService.PostponeEvent(eventId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{eventId}")]
        [Authorize(Roles = "Client")]
        public IActionResult DeleteEvent(string eventId)
        {
            try
            {
                var userId = GetUserId();
                var existingEvent = _eventService.GetEventById(eventId);
                if (existingEvent.ClientId != userId)
                    return Forbid("You can only delete your own events.");
                _eventService.DeleteEvent(eventId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}