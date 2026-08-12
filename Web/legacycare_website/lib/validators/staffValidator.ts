export interface StaffValidationErrors {
    fullName?: string,
    idNumber?: string,
    cellphone?: string,
    email?: string,
    street?: string,
    role?: string,
    branchId?: string,
}

export function validateStaff(form: {
    fullName: string,
    idNumber: string,
    cellphone: string,
    email: string,
    street: string,
    role: string,
    branchId: string,
}): StaffValidationErrors {
    const errors: StaffValidationErrors = {};
    
        //REGEX for Certain Inputs
        const nameRegex = /^[A-Za-z\s'-]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^0\d{9}$/;
        const idRegex = /^\d{13}$/;

        //Required Fields and Format Checks
    if (!form.fullName.trim())
        errors.fullName = "Full Name is required.";
    else if(!nameRegex.test(form.fullName))
        errors.fullName = "Full Name may only contain letters";

    if (!form.idNumber.trim())
        errors.idNumber = "ID Number is required.";
    else if(!idRegex.test(form.idNumber))
        errors.idNumber = "ID Number must contain exactly 13 digits";

    if (!form.cellphone.trim())
        errors.cellphone = "Cellphone Number is required.";
    else if(!phoneRegex.test(form.cellphone))
        errors.cellphone = "Cellphone Number must be 10 digits and start with 0.";


    if (!form.email.trim())
        errors.email = "Email is required.";
    else if (!emailRegex.test(form.email))
        errors.email = "Invalid email format";

    if (!form.street.trim())
        errors.street = "Address is required.";

    if (!form.branchId.trim())
        errors.branchId = "Branch is required.";

    if (!form.role)
        errors.role = "Role is required.";

    return errors;
}