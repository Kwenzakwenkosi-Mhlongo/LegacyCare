using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BranchController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BranchController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Branch
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetBranches()
        {
            try
            {
                var branches = await _context.Branch
                    .OrderBy(x => x.BranchName)
                    .Select(x => new
                    {
                        branchId = x.BranchId,
                        branchName = x.BranchName
                    })
                    .ToListAsync();

                return Ok(branches);
            }
            catch (Exception ex)
            {
                Console.WriteLine("========================================");
                Console.WriteLine("[Branch] GET BRANCHES ERROR");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Inner: {ex.InnerException?.Message}");
                Console.WriteLine("========================================");

                return StatusCode(500, new
                {
                    message = "Unable to load branches."
                });
            }
        }

        // GET: api/Branch/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBranch(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(new
                    {
                        message = "Branch ID is required."
                    });
                }

                var branch = await _context.Branch
                    .Where(x => x.BranchId == id)
                    .Select(x => new
                    {
                        branchId = x.BranchId,
                        branchName = x.BranchName
                    })
                    .FirstOrDefaultAsync();

                if (branch == null)
                {
                    return NotFound(new
                    {
                        message = "Branch not found."
                    });
                }

                return Ok(branch);
            }
            catch (Exception ex)
            {
                Console.WriteLine("========================================");
                Console.WriteLine("[Branch] GET BRANCH ERROR");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Inner: {ex.InnerException?.Message}");
                Console.WriteLine("========================================");

                return StatusCode(500, new
                {
                    message = "Unable to load branch."
                });
            }
        }
    }
}