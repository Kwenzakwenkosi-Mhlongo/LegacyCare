using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Service.ScheduleManagement;

namespace PolicyManagement.Controllers.ScheduleManagement
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingRestrictionController : ControllerBase
    {
        private readonly IBookingRestrictionService _bookingRestrictionService;

        public BookingRestrictionController(IBookingRestrictionService bookingRestrictionService)
        {
            _bookingRestrictionService = bookingRestrictionService;
        }

        [HttpGet]
        public IActionResult GetRestrictions()
        {
            return Ok(_bookingRestrictionService.GetRestrictions());
        }

        [HttpPut]
        public IActionResult UpdateRestrictions([FromBody] BookingRestriction restrictions)
        {
            return Ok(_bookingRestrictionService.UpdateRestrictions(restrictions));
        }
    }
}