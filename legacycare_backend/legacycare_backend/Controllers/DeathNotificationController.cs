using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Service.MortuaryManagement;
using PolicyManagement.DTOs.Requests;
using System.Security.Claims;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DeathNotificationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IDeathNotificationService _service;
        private readonly IWebHostEnvironment _environment;

        public DeathNotificationController(
            AppDbContext context,
            IDeathNotificationService service,
            IWebHostEnvironment environment)
        {
            _context = context;
            _service = service;
            _environment = environment;
        }

        // =========================================================
        // CREATE DEATH NOTIFICATION
        // =========================================================

        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> Create(
            [FromForm] CreateDeathNotificationRequest request)
        {
            string? savedFilePath = null;

            try
            {
                // =====================================================
                // GET LOGGED-IN USER
                // =====================================================

                var userId =
                    User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ??
                    User.FindFirstValue("sub")
                    ??
                    User.FindFirstValue("userId");

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message = "Unable to determine the logged-in user."
                    });
                }

                // =====================================================
                // VALIDATE REQUEST
                // =====================================================

                if (request == null)
                {
                    return BadRequest(new
                    {
                        message = "Death notification information is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.PolicyId))
                {
                    return BadRequest(new
                    {
                        message = "Policy is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.BeneficiaryId))
                {
                    return BadRequest(new
                    {
                        message = "Beneficiary is required."
                    });
                }

                // =====================================================
                // GET CLIENT
                // =====================================================

                var client = await _context.Client
                    .Include(c => c.Branch)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (client == null)
                {
                    return Unauthorized(new
                    {
                        message = "Client account was not found."
                    });
                }

                if (string.IsNullOrWhiteSpace(client.BranchId))
                {
                    return BadRequest(new
                    {
                        message =
                            "Your client account has not been assigned to a LegacyCare branch."
                    });
                }

                if (client.Branch == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Your assigned LegacyCare branch could not be found."
                    });
                }

                // =====================================================
                // CHECK POLICY
                // =====================================================

                var policy = await _context.Policy
                    .FirstOrDefaultAsync(x =>
                        x.PolicyId == request.PolicyId &&
                        x.UserId == userId);

                if (policy == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected policy does not belong to your account."
                    });
                }

                // =====================================================
                // CHECK POLICY STATUS
                // =====================================================

                if (policy.Status != Enums.PolicyStatus.Active)
                {
                    return BadRequest(new
                    {
                        message =
                            "Only active policies can be used to report a death."
                    });
                }

                // =====================================================
                // GET BENEFICIARY
                // =====================================================

                var beneficiary = await _context.Beneficiary
                    .FirstOrDefaultAsync(x =>
                        x.BeneficiaryId == request.BeneficiaryId &&
                        x.PolicyId == request.PolicyId);

                if (beneficiary == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected beneficiary does not belong to this policy."
                    });
                }

                // =====================================================
                // BENEFICIARY MUST STILL BE ACTIVE
                //
                // IMPORTANT:
                // Reporting the death does NOT change the beneficiary
                // status.
                //
                // Status changes to Deceased only after approval.
                // =====================================================

                if (beneficiary.Status.ToString()
                    .Equals(
                        "Deceased",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message =
                            "This beneficiary has already been marked as deceased."
                    });
                }

                // =====================================================
                // CHECK PROOF OF DEATH
                // =====================================================

                if (
                    request.ProofOfDeathDocument == null ||
                    request.ProofOfDeathDocument.Length == 0)
                {
                    return BadRequest(new
                    {
                        message = "Proof of death is required."
                    });
                }

                // =====================================================
                // FILE SIZE
                // =====================================================

                const long maxFileSize = 10 * 1024 * 1024;

                if (request.ProofOfDeathDocument.Length > maxFileSize)
                {
                    return BadRequest(new
                    {
                        message =
                            "The proof of death document must be 10 MB or smaller."
                    });
                }

                // =====================================================
                // FILE TYPE
                // =====================================================

                var allowedExtensions = new[]
                {
                    ".pdf",
                    ".jpg",
                    ".jpeg",
                    ".png"
                };

                var extension =
                    Path.GetExtension(
                        request.ProofOfDeathDocument.FileName)
                    .ToLowerInvariant();

                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new
                    {
                        message =
                            "Only PDF, JPG, JPEG and PNG files are accepted."
                    });
                }

                // =====================================================
                // SAVE FILE
                // =====================================================

                var uploadsFolder = Path.Combine(
                    _environment.ContentRootPath,
                    "Uploads",
                    "DeathNotifications");

                Directory.CreateDirectory(uploadsFolder);

                var storedFileName =
                    $"{Guid.NewGuid():N}{extension}";

                savedFilePath = Path.Combine(
                    uploadsFolder,
                    storedFileName);

                await using (
                    var stream = new FileStream(
                        savedFilePath,
                        FileMode.CreateNew,
                        FileAccess.Write,
                        FileShare.None))
                {
                    await request.ProofOfDeathDocument
                        .CopyToAsync(stream);
                }

                // =====================================================
                // CREATE NOTIFICATION
                // =====================================================

                var notification = new DeathNotification
                {
                    PolicyId = request.PolicyId,

                    BeneficiaryId = request.BeneficiaryId,

                    ReportedByUserId = userId,

                    BranchId = client.BranchId,

                    DateOfDeath = request.DateOfDeath,

                    ProofOfDeathDocument = storedFileName,

                    DocumentFileName =
                        request.ProofOfDeathDocument.FileName,

                    RequestNumber =
                        await GenerateRequestNumber()
                };

                // IMPORTANT:
                // Do NOT change beneficiary status here.

                _service.CreateNotification(notification);

                // =====================================================
                // CREATE SERVICE REQUEST
                // =====================================================

                var serviceRequest = new ServiceRequest
                {
                    ClientId = client.ClientId!,

                    RequestType = "Death Notification",

                    Status = "Pending",

                    Priority = "Normal",

                    Description =
                        $"Death notification submitted for beneficiary {request.BeneficiaryId}.",

                    BranchId = client.BranchId,

                    CreatedDate = DateTime.UtcNow,

                    UpdatedDate = DateTime.UtcNow,

                    AdditionalFee = 0
                };

                _context.ServiceRequests.Add(serviceRequest);

                await _context.SaveChangesAsync();

                // =====================================================
                // DOCUMENT URL
                // =====================================================

                var documentUrl =
                    BuildDocumentUrl(
                        notification.DeathNotificationId);

                // =====================================================
                // RESPONSE
                // =====================================================

                return Ok(new
                {
                    message =
                        "Death notification submitted successfully.",

                    requestNumber =
                        notification.RequestNumber,

                    notificationId =
                        notification.DeathNotificationId,

                    serviceRequestId =
                        serviceRequest.ServiceRequestId,

                    branchId =
                        client.BranchId,

                    branchName =
                        client.Branch.BranchName,

                    status =
                        notification.Status.ToString(),

                    documentFileName =
                        notification.DocumentFileName,

                    proofOfDeathDocument =
                        notification.ProofOfDeathDocument,

                    documentUrl =
                        documentUrl
                });
            }
            catch (Exception ex)
            {
                // =====================================================
                // DELETE FILE IF DATABASE OPERATION FAILED
                // =====================================================

                if (
                    !string.IsNullOrWhiteSpace(savedFilePath) &&
                    System.IO.File.Exists(savedFilePath))
                {
                    try
                    {
                        System.IO.File.Delete(savedFilePath);
                    }
                    catch
                    {
                        // Ignore cleanup failure
                    }
                }

                Console.WriteLine(
                    "========================================");

                Console.WriteLine(
                    "[DeathNotification] CREATE ERROR");

                Console.WriteLine(ex);

                Console.WriteLine(
                    "========================================");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to submit death notification.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // GET CLIENT DEATH NOTIFICATIONS
        // =========================================================

        [HttpGet("client")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetClientNotifications()
        {
            try
            {
                var userId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                var notifications =
                    await _context.DeathNotifications
                        .AsNoTracking()
                        .Include(x => x.Beneficiary)
                        .Include(x => x.Policy)
                        .Include(x => x.Branch)
                        .Where(x =>
                            x.ReportedByUserId == userId)
                        .OrderByDescending(
                            x => x.DateReported)
                        .ToListAsync();

                var result =
                    notifications.Select(x => new
                    {
                        deathNotificationId =
                            x.DeathNotificationId,

                        requestNumber =
                            x.RequestNumber,

                        policyId =
                            x.PolicyId,

                        beneficiaryId =
                            x.BeneficiaryId,

                        dateOfDeath =
                            x.DateOfDeath,

                        dateReported =
                            x.DateReported,

                        status =
                            x.Status.ToString(),

                        branchId =
                            x.BranchId,

                        rejectionReason =
                            x.RejectionReason,

                        proofOfDeathDocument =
                            x.ProofOfDeathDocument,

                        documentFileName =
                            x.DocumentFileName,

                        documentUrl =
                            BuildDocumentUrl(
                                x.DeathNotificationId),

                        beneficiary =
                            x.Beneficiary == null
                                ? null
                                : new
                                {
                                    beneficiaryId =
                                        x.Beneficiary.BeneficiaryId,

                                    fullName =
                                        x.Beneficiary.FullName,

                                    idNumber =
                                        x.Beneficiary.IDNumber,

                                    dateOfBirth =
                                        x.Beneficiary.DateOfBirth,

                                    gender =
                                        x.Beneficiary.Gender,

                                    status =
                                        x.Beneficiary.Status.ToString()
                                },

                        branch =
                            x.Branch == null
                                ? null
                                : new
                                {
                                    branchId =
                                        x.Branch.BranchId,

                                    branchName =
                                        x.Branch.BranchName
                                }
                    });

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[DeathNotification] GET CLIENT ERROR");

                Console.WriteLine(ex);

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load death notifications.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // GET ALL DEATH NOTIFICATIONS
        //
        // ADMIN / CLERK
        // =========================================================

        [HttpGet]
        [Authorize(Roles = "Admin,Clerk")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var notifications =
                    await _context.DeathNotifications
                        .AsNoTracking()
                        .Include(x => x.Beneficiary)
                        .Include(x => x.Policy)
                        .Include(x => x.ReportedByUser)
                        .Include(x => x.Branch)
                        .Include(x => x.VerifiedBy)
                        .OrderByDescending(
                            x => x.DateReported)
                        .ToListAsync();

                // =====================================================
                // IMPORTANT:
                // Return document information explicitly.
                // =====================================================

                var result =
                    notifications.Select(x => new
                    {
                        deathNotificationId =
                            x.DeathNotificationId,

                        requestNumber =
                            x.RequestNumber,

                        policyId =
                            x.PolicyId,

                        beneficiaryId =
                            x.BeneficiaryId,

                        dateOfDeath =
                            x.DateOfDeath,

                        dateReported =
                            x.DateReported,

                        status =
                            x.Status.ToString(),

                        branchId =
                            x.BranchId,

                        rejectionReason =
                            x.RejectionReason,

                        // Uploaded file
                        proofOfDeathDocument =
                            x.ProofOfDeathDocument,

                        originalDocumentFileName =
                            x.DocumentFileName,

                        documentFileName =
                            x.DocumentFileName,

                        // Backend URL
                        documentUrl =
                            BuildDocumentUrl(
                                x.DeathNotificationId),

                        // Beneficiary
                        beneficiary =
                            x.Beneficiary == null
                                ? null
                                : new
                                {
                                    beneficiaryId =
                                        x.Beneficiary.BeneficiaryId,

                                    fullName =
                                        x.Beneficiary.FullName,

                                    idNumber =
                                        x.Beneficiary.IDNumber,

                                    dateOfBirth =
                                        x.Beneficiary.DateOfBirth,

                                    gender =
                                        x.Beneficiary.Gender,

                                    relationship =
                                        x.Beneficiary.Relationship,

                                    status =
                                        x.Beneficiary.Status.ToString()
                                },

                        // Policy
                        policy =
                            x.Policy == null
                                ? null
                                : new
                                {
                                    policyId =
                                        x.Policy.PolicyId,

                                    status =
                                        x.Policy.Status.ToString(),

                                    startDate =
                                        x.Policy.StartDate,

                                    endDate =
                                        x.Policy.EndDate
                                },

                        // Branch
                        branch =
                            x.Branch == null
                                ? null
                                : new
                                {
                                    branchId =
                                        x.Branch.BranchId,

                                    branchName =
                                        x.Branch.BranchName,

                                    address =
                                        x.Branch.Address,

                                    contactNo =
                                        x.Branch.ContactNo,

                                    email =
                                        x.Branch.Email
                                },

                        // Reporter
                        reportedByUser =
                            x.ReportedByUser == null
                                ? null
                                : new
                                {
                                    userId =
                                        x.ReportedByUser.UserId
                                },

                        // Verifier
                        verifiedByUser =
                            x.VerifiedBy == null
                                ? null
                                : new
                                {
                                    userId =
                                        x.VerifiedBy.UserId
                                }
                    });

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[DeathNotification] GET ALL ERROR");

                Console.WriteLine(ex);

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load death notifications.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // GET BY ID
        // =========================================================

        [HttpGet("{notificationId}")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public async Task<IActionResult> GetById(
            string notificationId)
        {
            try
            {
                var notification =
                    await _context.DeathNotifications
                        .AsNoTracking()
                        .Include(x => x.Beneficiary)
                        .Include(x => x.Policy)
                        .Include(x => x.ReportedByUser)
                        .Include(x => x.Branch)
                        .Include(x => x.VerifiedBy)
                        .FirstOrDefaultAsync(
                            x =>
                                x.DeathNotificationId ==
                                notificationId);

                if (notification == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Death notification not found."
                    });
                }

                // =====================================================
                // CLIENT SECURITY
                // =====================================================

                var role =
                    GetCurrentRole();

                if (
                    string.Equals(
                        role,
                        "Client",
                        StringComparison.OrdinalIgnoreCase))
                {
                    var userId =
                        GetCurrentUserId();

                    if (
                        string.IsNullOrWhiteSpace(userId) ||
                        !string.Equals(
                            notification.ReportedByUserId,
                            userId,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return Forbid();
                    }
                }

                // =====================================================
                // RETURN COMPLETE DETAILS
                // =====================================================

                return Ok(new
                {
                    deathNotificationId =
                        notification.DeathNotificationId,

                    requestNumber =
                        notification.RequestNumber,

                    policyId =
                        notification.PolicyId,

                    beneficiaryId =
                        notification.BeneficiaryId,

                    dateOfDeath =
                        notification.DateOfDeath,

                    dateReported =
                        notification.DateReported,

                    status =
                        notification.Status.ToString(),

                    branchId =
                        notification.BranchId,

                    rejectionReason =
                        notification.RejectionReason,

                    // =================================================
                    // DOCUMENT
                    // =================================================

                    proofOfDeathDocument =
                        notification.ProofOfDeathDocument,

                    documentFileName =
                        notification.DocumentFileName,

                    documentUrl =
                        BuildDocumentUrl(
                            notification.DeathNotificationId),

                    // =================================================
                    // BENEFICIARY
                    // =================================================

                    beneficiary =
                        notification.Beneficiary == null
                            ? null
                            : new
                            {
                                beneficiaryId =
                                    notification.Beneficiary.BeneficiaryId,

                                fullName =
                                    notification.Beneficiary.FullName,

                                idNumber =
                                    notification.Beneficiary.IDNumber,

                                dateOfBirth =
                                    notification.Beneficiary.DateOfBirth,

                                gender =
                                    notification.Beneficiary.Gender,

                                relationship =
                                    notification.Beneficiary.Relationship,

                                status =
                                    notification.Beneficiary.Status.ToString()
                            },

                    // =================================================
                    // POLICY
                    // =================================================

                    policy =
                        notification.Policy == null
                            ? null
                            : new
                            {
                                policyId =
                                    notification.Policy.PolicyId,

                                status =
                                    notification.Policy.Status.ToString(),

                                startDate =
                                    notification.Policy.StartDate,

                                endDate =
                                    notification.Policy.EndDate
                            },

                    // =================================================
                    // BRANCH
                    // =================================================

                    branch =
                        notification.Branch == null
                            ? null
                            : new
                            {
                                branchId =
                                    notification.Branch.BranchId,

                                branchName =
                                    notification.Branch.BranchName,

                                address =
                                    notification.Branch.Address,

                                contactNo =
                                    notification.Branch.ContactNo,

                                email =
                                    notification.Branch.Email
                            },

                    // =================================================
                    // REPORTER
                    // =================================================

                    reportedByUser =
                        notification.ReportedByUser == null
                            ? null
                            : new
                            {
                                userId =
                                    notification.ReportedByUser.UserId
                            },

                    // =================================================
                    // VERIFIER
                    // =================================================

                    verifiedByUser =
                        notification.VerifiedBy == null
                            ? null
                            : new
                            {
                                userId =
                                    notification.VerifiedBy.UserId
                            }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[DeathNotification] GET BY ID ERROR");

                Console.WriteLine(ex);

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load death notification.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // VIEW PROOF OF DEATH DOCUMENT
        // =========================================================

        [HttpGet("{notificationId}/document")]
        [Authorize(Roles = "Admin,Clerk,Client")]
        public async Task<IActionResult> ViewDocument(
            string notificationId)
        {
            try
            {
                // =====================================================
                // GET NOTIFICATION
                // =====================================================

                var notification =
                    await _context.DeathNotifications
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            x =>
                                x.DeathNotificationId ==
                                notificationId);

                if (notification == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Death notification not found."
                    });
                }

                // =====================================================
                // CLIENT SECURITY
                // =====================================================

                var role =
                    GetCurrentRole();

                var userId =
                    GetCurrentUserId();

                if (
                    string.Equals(
                        role,
                        "Client",
                        StringComparison.OrdinalIgnoreCase))
                {
                    if (string.IsNullOrWhiteSpace(userId))
                    {
                        return Unauthorized(new
                        {
                            message =
                                "Unable to determine the logged-in user."
                        });
                    }

                    if (
                        !string.Equals(
                            notification.ReportedByUserId,
                            userId,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return Forbid();
                    }
                }

                // =====================================================
                // CHECK DOCUMENT DATABASE VALUE
                // =====================================================

                if (
                    string.IsNullOrWhiteSpace(
                        notification.ProofOfDeathDocument))
                {
                    return NotFound(new
                    {
                        message =
                            "No proof of death document is attached to this notification."
                    });
                }

                // =====================================================
                // UPLOAD DIRECTORY
                // =====================================================

                var uploadsFolder =
                    Path.Combine(
                        _environment.ContentRootPath,
                        "Uploads",
                        "DeathNotifications");

                // =====================================================
                // SAFE FILE NAME
                // =====================================================

                var safeFileName =
                    Path.GetFileName(
                        notification.ProofOfDeathDocument);

                if (
                    string.IsNullOrWhiteSpace(
                        safeFileName))
                {
                    return NotFound(new
                    {
                        message =
                            "The proof of death document is invalid."
                    });
                }

                var filePath =
                    Path.Combine(
                        uploadsFolder,
                        safeFileName);

                // =====================================================
                // FILE EXISTS
                // =====================================================

                if (!System.IO.File.Exists(filePath))
                {
                    Console.WriteLine(
                        $"[DeathNotification] File not found: {filePath}");

                    return NotFound(new
                    {
                        message =
                            "The proof of death document could not be found on the server.",

                        fileName =
                            safeFileName,

                        expectedPath =
                            filePath
                    });
                }

                // =====================================================
                // CONTENT TYPE
                // =====================================================

                var extension =
                    Path.GetExtension(
                        safeFileName)
                        .ToLowerInvariant();

                var contentType =
                    extension switch
                    {
                        ".pdf" =>
                            "application/pdf",

                        ".jpg" =>
                            "image/jpeg",

                        ".jpeg" =>
                            "image/jpeg",

                        ".png" =>
                            "image/png",

                        _ =>
                            "application/octet-stream"
                    };

                // =====================================================
                // INLINE DISPLAY
                // =====================================================

                Response.Headers["Content-Disposition"] =
                    $"inline; filename=\"{safeFileName}\"";

                Response.Headers["Cache-Control"] =
                    "no-store, no-cache, must-revalidate";

                Response.Headers["Pragma"] =
                    "no-cache";

                // =====================================================
                // RETURN FILE
                // =====================================================

                return PhysicalFile(
                    filePath,
                    contentType,
                    enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "========================================");

                Console.WriteLine(
                    "[DeathNotification] DOCUMENT ERROR");

                Console.WriteLine(ex);

                Console.WriteLine(
                    "========================================");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to open the proof of death document.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // APPROVE DEATH NOTIFICATION
        // =========================================================

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult Approve(
            string id)
        {
            try
            {
                var verifiedByUserId =
                    GetCurrentUserId();

                if (
                    string.IsNullOrWhiteSpace(
                        verifiedByUserId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                _service.Approve(
                    id,
                    verifiedByUserId);

                return Ok(new
                {
                    message =
                        "Death notification approved successfully.",

                    notificationId =
                        id,

                    status =
                        "Approved",

                    beneficiaryStatus =
                        "Deceased"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message =
                        ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "========================================");

                Console.WriteLine(
                    "[DeathNotification] APPROVE ERROR");

                Console.WriteLine(ex);

                Console.WriteLine(
                    "========================================");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to approve death notification.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // REJECT DEATH NOTIFICATION
        // =========================================================

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult Reject(
            string id,
            [FromBody]
            RejectDeathNotificationRequest request)
        {
            try
            {
                // =====================================================
                // VALIDATE REQUEST
                // =====================================================

                if (
                    request == null ||
                    string.IsNullOrWhiteSpace(
                        request.Reason))
                {
                    return BadRequest(new
                    {
                        message =
                            "A rejection reason is required."
                    });
                }

                // =====================================================
                // USER
                // =====================================================

                var verifiedByUserId =
                    GetCurrentUserId();

                if (
                    string.IsNullOrWhiteSpace(
                        verifiedByUserId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                // =====================================================
                // REJECT
                // =====================================================

                _service.Reject(
                    id,
                    verifiedByUserId,
                    request.Reason);

                return Ok(new
                {
                    message =
                        "Death notification rejected successfully.",

                    notificationId =
                        id,

                    status =
                        "Rejected",

                    beneficiaryStatus =
                        "Unchanged"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message =
                        ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "========================================");

                Console.WriteLine(
                    "[DeathNotification] REJECT ERROR");

                Console.WriteLine(ex);

                Console.WriteLine(
                    "========================================");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to reject death notification.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // REQUEST NUMBER
        // =========================================================

        private async Task<string>
            GenerateRequestNumber()
        {
            var count =
                await _context.DeathNotifications
                    .CountAsync();

            var nextNumber =
                count + 1;

            return
                $"REQ-{nextNumber:00000}";
        }

        // =========================================================
        // CURRENT USER ID
        // =========================================================

        private string? GetCurrentUserId()
        {
            return
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier)
                ??
                User.FindFirstValue("sub")
                ??
                User.FindFirstValue("userId");
        }

        // =========================================================
        // CURRENT ROLE
        // =========================================================

        private string? GetCurrentRole()
        {
            return
                User.FindFirstValue(
                    ClaimTypes.Role)
                ??
                User.FindFirstValue("role");
        }

        // =========================================================
        // DOCUMENT URL
        // =========================================================

        private string BuildDocumentUrl(
            string notificationId)
        {
            return
                $"{Request.Scheme}://{Request.Host}" +
                $"/api/DeathNotification/{notificationId}/document";
        }
    }
}