// ============================================================================
// FILE: Controllers/DeathNotificationController.cs
// ============================================================================

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Service.MortuaryManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DeathNotificationController : ControllerBase
    {
        private const long MaxDocumentSize =
            10 * 1024 * 1024;

        private static readonly HashSet<string>
            AllowedDocumentExtensions =
                new(
                    StringComparer.OrdinalIgnoreCase)
                {
                    ".pdf",
                    ".jpg",
                    ".jpeg",
                    ".png"
                };

        private readonly AppDbContext _context;
        private readonly IDeathNotificationService _service;
        private readonly IRequestNumberService _requestNumberService;
        private readonly IWebHostEnvironment _environment;

        public DeathNotificationController(
            AppDbContext context,
            IDeathNotificationService service,
            IRequestNumberService requestNumberService,
            IWebHostEnvironment environment)
        {
            _context = context;
            _service = service;
            _requestNumberService = requestNumberService;
            _environment = environment;
        }

        [HttpPost]
[Consumes("multipart/form-data")]
[Authorize(Roles = "Client")]
public async Task<IActionResult> Create(
    [FromForm] CreateDeathNotificationRequest request,
    CancellationToken cancellationToken)
{
    string? savedFilePath = null;

    try
    {
        var userId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new
            {
                message = "Unable to determine the logged-in user."
            });
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        // ============================================================
        // REQUIRED REQUEST VALUES
        // ============================================================

        var policyId =
            request.PolicyId?.Trim();

        var beneficiaryId =
            request.BeneficiaryId?.Trim();

        var relationshipToDeceased =
            request.RelationshipToDeceased?.Trim();

        var contactPerson =
            request.ContactPerson?.Trim();

        var contactNumber =
            request.ContactNumber?.Trim();

        var bodyLocationType =
            request.BodyLocationType?.Trim();

        if (string.IsNullOrWhiteSpace(policyId))
        {
            return BadRequest(new
            {
                message = "Policy is required."
            });
        }

        if (string.IsNullOrWhiteSpace(beneficiaryId))
        {
            return BadRequest(new
            {
                message = "Beneficiary is required."
            });
        }

        if (request.DateOfDeath == default)
        {
            return BadRequest(new
            {
                message = "Date of death is required."
            });
        }

        if (request.DateOfDeath.Date > DateTime.UtcNow.Date)
        {
            return BadRequest(new
            {
                message = "Date of death cannot be in the future."
            });
        }

        if (string.IsNullOrWhiteSpace(
            relationshipToDeceased))
        {
            return BadRequest(new
            {
                message =
                    "Relationship to deceased is required."
            });
        }

        if (string.IsNullOrWhiteSpace(
            contactPerson))
        {
            return BadRequest(new
            {
                message =
                    "Contact person is required."
            });
        }

        if (string.IsNullOrWhiteSpace(
            contactNumber))
        {
            return BadRequest(new
            {
                message =
                    "Contact number is required."
            });
        }

        if (string.IsNullOrWhiteSpace(
            bodyLocationType))
        {
            return BadRequest(new
            {
                message =
                    "Body location type is required."
            });
        }

        // ============================================================
        // DEBUG: PROVE WHAT THE BACKEND RECEIVED
        // ============================================================

        Console.WriteLine(
            "================================================");

        Console.WriteLine(
            "[DeathNotification CREATE] RECEIVED FORM VALUES");

        Console.WriteLine(
            $"PolicyId: {policyId}");

        Console.WriteLine(
            $"BeneficiaryId: {beneficiaryId}");

        Console.WriteLine(
            $"RelationshipToDeceased: {relationshipToDeceased}");

        Console.WriteLine(
            $"ContactPerson: {contactPerson}");

        Console.WriteLine(
            $"ContactNumber: {contactNumber}");

        Console.WriteLine(
            $"BodyLocationType: {bodyLocationType}");

        Console.WriteLine(
            "================================================");

        // ============================================================
        // CLIENT
        // ============================================================

        var client =
            await _context.Client
                .Include(x => x.Branch)
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

        if (client == null)
        {
            return Unauthorized(new
            {
                message =
                    "Client account was not found."
            });
        }

        if (string.IsNullOrWhiteSpace(
                client.BranchId) ||
            client.Branch == null)
        {
            return BadRequest(new
            {
                message =
                    "Your client account is not assigned to a valid LegacyCare branch."
            });
        }

        // ============================================================
        // POLICY
        // ============================================================

        var policy =
            await _context.Policy
                .FirstOrDefaultAsync(
                    x =>
                        x.PolicyId == policyId &&
                        x.UserId == userId,
                    cancellationToken);

        if (policy == null)
        {
            return BadRequest(new
            {
                message =
                    "The selected policy does not belong to your account."
            });
        }

        if (policy.Status != PolicyStatus.Active)
        {
            return BadRequest(new
            {
                message =
                    "Only active policies can be used to report a death."
            });
        }

        // ============================================================
        // BENEFICIARY
        // ============================================================

        var beneficiary =
            await _context.Beneficiary
                .FirstOrDefaultAsync(
                    x =>
                        x.BeneficiaryId ==
                            beneficiaryId &&
                        x.PolicyId ==
                            policyId,
                    cancellationToken);

        if (beneficiary == null)
        {
            return BadRequest(new
            {
                message =
                    "The selected beneficiary does not belong to the selected policy."
            });
        }

        if (beneficiary.Status ==
            BeneficiaryStatus.Deceased)
        {
            return BadRequest(new
            {
                message =
                    "This beneficiary has already been marked as deceased."
            });
        }

        if (beneficiary.Status ==
            BeneficiaryStatus.Removed)
        {
            return BadRequest(new
            {
                message =
                    "A removed beneficiary cannot be used for a death notification."
            });
        }

        // ============================================================
        // DUPLICATE PENDING NOTIFICATION
        // ============================================================

        var pendingNotificationExists =
            await _context.DeathNotifications
                .AnyAsync(
                    x =>
                        x.BeneficiaryId ==
                            beneficiaryId &&
                        x.Status ==
                            DeathNotificationStatus.Pending,
                    cancellationToken);

        if (pendingNotificationExists)
        {
            return Conflict(new
            {
                message =
                    "A pending death notification already exists for this beneficiary."
            });
        }

        // ============================================================
        // DOCUMENT
        // ============================================================

        ValidateDocument(
            request.ProofOfDeathDocument);

        var extension =
            Path.GetExtension(
                    request
                        .ProofOfDeathDocument!
                        .FileName)
                .ToLowerInvariant();

        var uploadsFolder =
            Path.Combine(
                _environment.ContentRootPath,
                "Uploads",
                "DeathNotifications");

        Directory.CreateDirectory(
            uploadsFolder);

        var storedFileName =
            $"{Guid.NewGuid():N}{extension}";

        savedFilePath =
            Path.Combine(
                uploadsFolder,
                storedFileName);

        await using (
            var stream =
                new FileStream(
                    savedFilePath,
                    FileMode.CreateNew,
                    FileAccess.Write,
                    FileShare.None,
                    81920,
                    useAsync: true))
        {
            await request
                .ProofOfDeathDocument
                .CopyToAsync(
                    stream,
                    cancellationToken);
        }

        // ============================================================
        // NORMALIZE BODY LOCATION
        // ============================================================

        var normalizedLocation =
            BodyLocationTypes.Normalize(
                bodyLocationType);

        // ============================================================
        // CREATE DATABASE RECORD
        // ============================================================

        DeathNotification?
            createdNotification = null;

        ServiceRequest?
            createdServiceRequest = null;

        var strategy =
            _context.Database
                .CreateExecutionStrategy();

        await strategy.ExecuteAsync(
            async () =>
            {
                await using var transaction =
                    await _context.Database
                        .BeginTransactionAsync(
                            cancellationToken);

                try
                {
                    var requestNumber =
                        await _requestNumberService
                            .GenerateDeathNotificationRequestNumberAsync(
                                cancellationToken);

                    var notification =
                        new DeathNotification
                        {
                            PolicyId =
                                policyId,

                            BeneficiaryId =
                                beneficiaryId,

                            RequestNumber =
                                requestNumber,

                            ReportedByUserId =
                                userId,

                            BranchId =
                                client.BranchId,

                            DateOfDeath =
                                request.DateOfDeath,

                            DateReported =
                                DateTime.UtcNow,

                            RelationshipToDeceased =
                                relationshipToDeceased,

                            ContactPerson =
                                contactPerson,

                            ContactNumber =
                                contactNumber,

                            ProofOfDeathDocument =
                                storedFileName,

                            DocumentFileName =
                                Path.GetFileName(
                                    request
                                        .ProofOfDeathDocument
                                        .FileName)
                        };

                    notification.SetBodyLocation(
                        normalizedLocation,
                        request.BodyLocationAddress,
                        request.MortuaryName,
                        request.CollectionDate,
                        request.CollectionNotes);

                   var serviceRequest =
    new ServiceRequest
    {
        ClientId =
            client.ClientId!,

        RequestType =
            "Death Notification",

        Status =
            "Pending",

        Priority =
            "Normal",

        Description =
            $"Death notification submitted for beneficiary {beneficiary.FullName}.",

        BranchId =
            client.BranchId,

        DeathNotificationId =
            notification.DeathNotificationId,

        CreatedDate =
            DateTime.UtcNow,

        UpdatedDate =
            DateTime.UtcNow,

        AdditionalFee =
            0
    };

_context.DeathNotifications.Add(
    notification
);

_context.ServiceRequests.Add(
    serviceRequest
);

await _context.SaveChangesAsync(
    cancellationToken
);


                    // ====================================================
                    // VERIFY TRACKED VALUES BEFORE COMMIT
                    // ====================================================

                    if (string.IsNullOrWhiteSpace(
                            notification
                                .RelationshipToDeceased) ||
                        string.IsNullOrWhiteSpace(
                            notification
                                .ContactPerson) ||
                        string.IsNullOrWhiteSpace(
                            notification
                                .ContactNumber))
                    {
                        throw new InvalidOperationException(
                            "Contact information was lost before the database transaction committed.");
                    }

                    await transaction
                        .CommitAsync(
                            cancellationToken);

                    createdNotification =
                        notification;

                    createdServiceRequest =
                        serviceRequest;
                }
                catch
                {
                    await transaction
                        .RollbackAsync(
                            cancellationToken);

                    throw;
                }
            });

        if (createdNotification == null ||
            createdServiceRequest == null)
        {
            throw new InvalidOperationException(
                "Death notification was not created.");
        }

        // ============================================================
        // RE-READ FROM SQL
        // THIS IS THE IMPORTANT PART
        // ============================================================

        var savedNotification =
            await _context
                .DeathNotifications
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.DeathNotificationId ==
                        createdNotification
                            .DeathNotificationId,
                    cancellationToken);

        if (savedNotification == null)
        {
            throw new InvalidOperationException(
                "The newly created death notification could not be reloaded from the database.");
        }

        // ============================================================
        // FAIL IF SQL ACTUALLY SAVED NULL
        // ============================================================

        if (string.IsNullOrWhiteSpace(
                savedNotification
                    .RelationshipToDeceased) ||
            string.IsNullOrWhiteSpace(
                savedNotification
                    .ContactPerson) ||
            string.IsNullOrWhiteSpace(
                savedNotification
                    .ContactNumber))
        {
            throw new InvalidOperationException(
                "The database saved empty death-notification contact information. Check database triggers, deployed API version and entity mapping.");
        }

        // ============================================================
        // SUCCESS RESPONSE
        // ============================================================

        return Ok(new
        {
            message =
                "Death notification submitted successfully.",

            requestNumber =
                savedNotification.RequestNumber,

            notificationId =
                savedNotification
                    .DeathNotificationId,

            serviceRequestId =
                createdServiceRequest
                    .ServiceRequestId,

            branchId =
                client.BranchId,

            branchName =
                client.Branch.BranchName,

            status =
                savedNotification
                    .Status
                    .ToString(),

            beneficiaryStatus =
                beneficiary
                    .Status
                    .ToString(),

            // ========================================================
            // RETURN CONTACT VALUES SO WE CAN VERIFY THE RUNNING API
            // ========================================================

            relationshipToDeceased =
                savedNotification
                    .RelationshipToDeceased,

            contactPerson =
                savedNotification
                    .ContactPerson,

            contactNumber =
                savedNotification
                    .ContactNumber,

            bodyLocationType =
                savedNotification
                    .BodyLocationType,

            bodyLocationAddress =
                savedNotification
                    .BodyLocationAddress,

            mortuaryName =
                savedNotification
                    .MortuaryName,

            storageId =
                savedNotification
                    .StorageId,

            storageUnitNumber =
                savedNotification
                    .StorageUnitNumber,

            collectionDate =
                savedNotification
                    .CollectionDate,

            collectionNotes =
                savedNotification
                    .CollectionNotes,

            documentFileName =
                savedNotification
                    .DocumentFileName,

            documentUrl =
                BuildDocumentUrl(
                    savedNotification
                        .DeathNotificationId)
        });
    }
    catch (ArgumentException ex)
    {
        if (!string.IsNullOrWhiteSpace(
                savedFilePath) &&
            System.IO.File.Exists(
                savedFilePath))
        {
            try
            {
                System.IO.File.Delete(
                    savedFilePath);
            }
            catch
            {
            }
        }

        return BadRequest(new
        {
            message = ex.Message
        });
    }
    catch (Exception ex)
    {
        if (!string.IsNullOrWhiteSpace(
                savedFilePath) &&
            System.IO.File.Exists(
                savedFilePath))
        {
            try
            {
                System.IO.File.Delete(
                    savedFilePath);
            }
            catch
            {
            }
        }

        Console.WriteLine(
            "================================================");

        Console.WriteLine(
            "[DeathNotification CREATE] ERROR");

        Console.WriteLine(ex);

        Console.WriteLine(
            "================================================");

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
        [HttpGet("client")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetClientNotifications(
            CancellationToken cancellationToken)
        {
            var userId =
                GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var notifications =
                await _context.DeathNotifications
                    .AsNoTracking()
                    .Include(x => x.Beneficiary)
                    .Include(x => x.Branch)
                    .Where(
                        x =>
                            x.ReportedByUserId ==
                            userId)
                    .OrderByDescending(
                        x => x.DateReported)
                    .ToListAsync(
                        cancellationToken);

            return Ok(
                notifications.Select(
                    x => new
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

                        rejectionReason =
                            x.RejectionReason,

                        branchId =
                            x.BranchId,

                        bodyLocationType =
                            x.BodyLocationType,

                        bodyLocationAddress =
                            x.BodyLocationAddress,

                        mortuaryName =
                            x.MortuaryName,

                        storageId =
                            x.StorageId,

                        storageUnitNumber =
                            x.StorageUnitNumber,

                        collectionDate =
                            x.CollectionDate,

                        collectionNotes =
                            x.CollectionNotes,

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
                    }));
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Clerk")]
        public async Task<IActionResult> GetAll(
            CancellationToken cancellationToken)
        {
            var notifications =
                await _service.GetAllAsync(
                    cancellationToken);

            return Ok(
                notifications.Select(
                    x => new
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

                        rejectionReason =
                            x.RejectionReason,

                        branchId =
                            x.BranchId,

                        bodyLocationType =
                            x.BodyLocationType,

                        bodyLocationAddress =
                            x.BodyLocationAddress,

                        mortuaryName =
                            x.MortuaryName,

                        storageId =
                            x.StorageId,

                        storageUnitNumber =
                            x.StorageUnitNumber,

                        collectionDate =
                            x.CollectionDate,

                        collectionNotes =
                            x.CollectionNotes,

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

                                    relationship =
                                        x.Beneficiary.Relationship,

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
                                        x.Branch.BranchName,

                                    address =
                                        x.Branch.Address,

                                    contactNo =
                                        x.Branch.ContactNo,

                                    email =
                                        x.Branch.Email
                                }
                    }));
        }

        [HttpGet("{notificationId}")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public async Task<IActionResult> GetById(
            string notificationId,
            CancellationToken cancellationToken)
        {
            var notification =
                await _service.GetByIdAsync(
                    notificationId,
                    cancellationToken);

            if (notification == null)
            {
                return NotFound(new
                {
                    message =
                        "Death notification not found."
                });
            }

            if (string.Equals(
                    GetCurrentRole(),
                    "Client",
                    StringComparison.OrdinalIgnoreCase))
            {
                var userId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId) ||
                    !string.Equals(
                        notification.ReportedByUserId,
                        userId,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
            }

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

                rejectionReason =
                    notification.RejectionReason,

                relationshipToDeceased =
                    notification.RelationshipToDeceased,

                contactPerson =
                    notification.ContactPerson,

                contactNumber =
                    notification.ContactNumber,

                bodyLocationType =
                    notification.BodyLocationType,

                bodyLocationAddress =
                    notification.BodyLocationAddress,

                mortuaryName =
                    notification.MortuaryName,

                storageId =
                    notification.StorageId,

                storageUnitNumber =
                    notification.StorageUnitNumber,

                collectionDate =
                    notification.CollectionDate,

                collectionNotes =
                    notification.CollectionNotes,

                documentFileName =
                    notification.DocumentFileName,

                documentUrl =
                    BuildDocumentUrl(
                        notification.DeathNotificationId),

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

                reportedByUser =
                    notification.ReportedByUser == null
                        ? null
                        : new
                        {
                            userId =
                                notification.ReportedByUser.UserId,

                            fullName =
                                notification.ReportedByUser.FullName,

                            email =
                                notification.ReportedByUser.Email
                        },

                verifiedByUser =
                    notification.VerifiedBy == null
                        ? null
                        : new
                        {
                            userId =
                                notification.VerifiedBy.UserId,

                            fullName =
                                notification.VerifiedBy.FullName,

                            email =
                                notification.VerifiedBy.Email
                        }
            });
        }

        [HttpGet("{notificationId}/document")]
        [Authorize(Roles = "Admin,Clerk,Client")]
        public async Task<IActionResult> ViewDocument(
            string notificationId,
            CancellationToken cancellationToken)
        {
            var notification =
                await _context.DeathNotifications
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        x =>
                            x.DeathNotificationId ==
                            notificationId,
                        cancellationToken);

            if (notification == null)
            {
                return NotFound(new
                {
                    message =
                        "Death notification not found."
                });
            }

            if (string.Equals(
                    GetCurrentRole(),
                    "Client",
                    StringComparison.OrdinalIgnoreCase))
            {
                var userId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized();
                }

                if (!string.Equals(
                        notification.ReportedByUserId,
                        userId,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
            }

            if (string.IsNullOrWhiteSpace(
                    notification.ProofOfDeathDocument))
            {
                return NotFound(new
                {
                    message =
                        "No proof of death document is attached."
                });
            }

            var uploadsFolder =
                Path.Combine(
                    _environment.ContentRootPath,
                    "Uploads",
                    "DeathNotifications");

            var safeFileName =
                Path.GetFileName(
                    notification.ProofOfDeathDocument);

            var filePath =
                Path.Combine(
                    uploadsFolder,
                    safeFileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new
                {
                    message =
                        "The proof of death document could not be found on the server."
                });
            }

            var extension =
                Path.GetExtension(safeFileName)
                    .ToLowerInvariant();

            var contentType =
                extension switch
                {
                    ".pdf" =>
                        "application/pdf",

                    ".jpg" or ".jpeg" =>
                        "image/jpeg",

                    ".png" =>
                        "image/png",

                    _ =>
                        "application/octet-stream"
                };

            Response.Headers["Content-Disposition"] =
                $"inline; filename=\"{safeFileName}\"";

            Response.Headers["Cache-Control"] =
                "no-store, no-cache, must-revalidate";

            Response.Headers["Pragma"] =
                "no-cache";

            return PhysicalFile(
                filePath,
                contentType,
                enableRangeProcessing: true);
        }

        [HttpGet("{notificationId}/available-storage-units")]
        [Authorize(Roles = "Admin,Clerk,Staff")]
        public async Task<IActionResult> GetAvailableStorageUnits(
            string notificationId,
            CancellationToken cancellationToken)
        {
            try
            {
                var notification =
                    await _service.GetByIdAsync(
                        notificationId,
                        cancellationToken);

                if (notification == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Death notification not found."
                    });
                }

                var units =
                    await _service
                        .GetAvailableStorageUnitsAsync(
                            notificationId,
                            cancellationToken);

                return Ok(
                    units.Select(
                        x => new
                        {
                            storageId =
                                x.StorageId,

                            unitNumber =
                                x.UnitNumber,

                            branchId =
                                x.BranchId,

                            isAvailable =
                                x.IsAvailable,

                            isCurrentSelection =
                                x.StorageId ==
                                notification.StorageId
                        }));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPut("{id}/body-location")]
        [Authorize(Roles = "Admin,Clerk,Staff")]
        public async Task<IActionResult> UpdateBodyLocation(
            string id,
            [FromBody] UpdateBodyLocationRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return ValidationProblem(ModelState);
                }

                await _service.UpdateBodyLocationAsync(
                    id,
                    request,
                    cancellationToken);

                var notification =
                    await _service.GetByIdAsync(
                        id,
                        cancellationToken);

                return Ok(new
                {
                    message =
                        "Body location updated successfully.",

                    notificationId =
                        id,

                    bodyLocationType =
                        notification!.BodyLocationType,

                    bodyLocationAddress =
                        notification.BodyLocationAddress,

                    mortuaryName =
                        notification.MortuaryName,

                    storageId =
                        notification.StorageId,

                    storageUnitNumber =
                        notification.StorageUnitNumber,

                    collectionDate =
                        notification.CollectionDate,

                    collectionNotes =
                        notification.CollectionNotes
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,Clerk")]
        public async Task<IActionResult> Approve(
            string id,
            CancellationToken cancellationToken)
        {
            try
            {
                var verifiedByUserId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(
                        verifiedByUserId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                await _service.ApproveAsync(
                    id,
                    verifiedByUserId,
                    cancellationToken);

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
                    message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,Clerk")]
        public async Task<IActionResult> Reject(
            string id,
            [FromBody] RejectDeathNotificationRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return ValidationProblem(ModelState);
                }

                var verifiedByUserId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(
                        verifiedByUserId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                await _service.RejectAsync(
                    id,
                    verifiedByUserId,
                    request.Reason,
                    cancellationToken);

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
                    message = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        private static void ValidateDocument(
            IFormFile? document)
        {
            if (document == null ||
                document.Length == 0)
            {
                throw new ArgumentException(
                    "Proof of death is required.");
            }

            if (document.Length >
                MaxDocumentSize)
            {
                throw new ArgumentException(
                    "The proof of death document must be 10 MB or smaller.");
            }

            var extension =
                Path.GetExtension(document.FileName);

            if (!AllowedDocumentExtensions.Contains(
                    extension))
            {
                throw new ArgumentException(
                    "Only PDF, JPG, JPEG and PNG files are accepted.");
            }
        }

        private static void DeleteUploadedFile(
            string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath) ||
                !System.IO.File.Exists(filePath))
            {
                return;
            }

            try
            {
                System.IO.File.Delete(filePath);
            }
            catch (IOException)
            {
            }
            catch (UnauthorizedAccessException)
            {
            }
        }

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

        private string? GetCurrentRole()
        {
            return
                User.FindFirstValue(
                    ClaimTypes.Role)
                ??
                User.FindFirstValue("role");
        }

        private string BuildDocumentUrl(
            string notificationId)
        {
            return
                $"{Request.Scheme}://{Request.Host}" +
                $"/api/DeathNotification/" +
                $"{notificationId}/document";
        }
    }
}
