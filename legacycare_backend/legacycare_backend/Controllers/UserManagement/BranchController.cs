using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Data;

namespace PolicyManagement.Controllers
{
[Authorize(Roles = "Admin, Clerk")]
[ApiController]
[Route("api/[controller]")]
public class BranchController : ControllerBase
{
    private readonly AppDbContext _context;

    public BranchController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetBranches()
    {
        var branches = _context.Branch
        .OrderBy(b => b.BranchName)
        .Select(b => new
        {
            b.BranchId,
            b.BranchName
        })
        .ToList();
        return Ok(branches);
    }

    [HttpGet("{branchId}")]
        public IActionResult GetBranchById(string branchId)
        {
            var branch = _context.Branch
                .FirstOrDefault(b => b.BranchId == branchId);

            if (branch == null)
                return NotFound();

            return Ok(branch);
        }
}


}