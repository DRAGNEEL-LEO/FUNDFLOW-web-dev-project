/**
 * Reusable validation helper functions for Smart Fund Management System.
 * Serves both backend API routes and frontend client forms.
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password, minLength = 6) {
  if (!password || typeof password !== "string") return false;
  return password.length >= minLength;
}

export function isValidPhone(phone) {
  if (!phone) return true; // Phone is optional in some cases
  if (typeof phone !== "string") return false;
  return PHONE_REGEX.test(phone.trim());
}

export function isValidNumber(val, options = { positive: false, nonNegative: false }) {
  const num = Number(val);
  if (val === null || val === undefined || isNaN(num) || !isFinite(num)) {
    return false;
  }
  if (options.positive && num <= 0) return false;
  if (options.nonNegative && num < 0) return false;
  return true;
}

export function isValidDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validate User Registration payload
 */
export function validateRegisterPayload(data = {}) {
  /** @type {Record<string, string>} */
  const errors = {};
  const { email, password, name, role, phone } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.name = "Full name is required.";
  } else if (name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long.";
  }

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address (e.g. user@example.com).";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (!isValidPassword(password, 6)) {
    errors.password = "Password must be at least 6 characters long.";
  }

  if (!role) {
    errors.role = "User role is required.";
  } else if (!["admin", "member"].includes(role)) {
    errors.role = "Role must be either 'admin' or 'member'.";
  }

  if (phone && !isValidPhone(phone)) {
    errors.phone = "Invalid phone number format.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Login payload
 */
export function validateLoginPayload(data = {}) {
  /** @type {Record<string, string>} */
  const errors = {};
  const { email, password } = data;

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Transaction payload
 */
export function validateTransactionPayload(data = {}) {
  /** @type {Record<string, string>} */
  const errors = {};
  const { type, category, amount, description, date, status } = data;

  if (!type || !["income", "expense"].includes(type)) {
    errors.type = "Transaction type must be 'income' or 'expense'.";
  }

  if (!category || typeof category !== "string" || !category.trim()) {
    errors.category = "Category is required.";
  }

  if (!isValidNumber(amount, { positive: true })) {
    errors.amount = "Amount must be a positive number greater than 0.";
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    errors.description = "Description is required.";
  }

  if (date && !isValidDateStr(date)) {
    errors.date = "Invalid date format.";
  }

  if (status && !["completed", "pending"].includes(status)) {
    errors.status = "Status must be 'completed' or 'pending'.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Member payload
 */
export function validateMemberPayload(data = {}, isUpdate = false) {
  /** @type {Record<string, string>} */
  const errors = {};
  const { name, email, phone, contributions, outstanding, status } = data;

  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "Member name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long.";
    }
  }

  if (!isUpdate || email !== undefined) {
    if (!email) {
      errors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }
  }

  if (phone !== undefined && phone !== "" && !isValidPhone(phone)) {
    errors.phone = "Invalid phone number format.";
  }

  if (contributions !== undefined && !isValidNumber(contributions, { nonNegative: true })) {
    errors.contributions = "Contributions must be a non-negative number.";
  }

  if (outstanding !== undefined && !isValidNumber(outstanding, { nonNegative: true })) {
    errors.outstanding = "Outstanding amount must be a non-negative number.";
  }

  if (status !== undefined && !["active", "inactive"].includes(status)) {
    errors.status = "Status must be 'active' or 'inactive'.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Announcement payload
 */
export function validateAnnouncementPayload(data = {}) {
  /** @type {Record<string, string>} */
  const errors = {};
  const { title, body, priority } = data;

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.title = "Announcement title is required.";
  } else if (title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters long.";
  }

  if (!body || typeof body !== "string" || !body.trim()) {
    errors.body = "Announcement content body is required.";
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    errors.priority = "Priority must be 'low', 'medium', or 'high'.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Organization & Primary Admin Registration payload
 */
export function validateRegisterOrgPayload(data = {}) {
  /** @type {Record<string, string>} */
  const errors = {};
  const { orgName, adminName, email, password, phone } = data;

  if (!orgName || typeof orgName !== "string" || !orgName.trim()) {
    errors.orgName = "Organization name is required.";
  } else if (orgName.trim().length < 3) {
    errors.orgName = "Organization name must be at least 3 characters.";
  }

  if (!adminName || typeof adminName !== "string" || !adminName.trim()) {
    errors.adminName = "Administrator full name is required.";
  } else if (adminName.trim().length < 2) {
    errors.adminName = "Administrator name must be at least 2 characters.";
  }

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (!isValidPassword(password, 6)) {
    errors.password = "Password must be at least 6 characters long.";
  }

  if (phone && !isValidPhone(phone)) {
    errors.phone = "Please enter a valid phone number (e.g. +880 1700 000000).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Welfare Aid / Grant Request payload
 */
export function validateWelfareRequestPayload(data = {}, isUpdate = false) {
  /** @type {Record<string, string>} */
  const errors = {};
  const { category, amountRequested, urgency, reason, bankOrWalletDetails, status } = data;

  if (!isUpdate || category !== undefined) {
    if (!category || typeof category !== "string" || !category.trim()) {
      errors.category = "Assistance category is required.";
    }
  }

  if (!isUpdate || amountRequested !== undefined) {
    if (!isValidNumber(amountRequested, { positive: true })) {
      errors.amountRequested = "Requested amount must be greater than 0.";
    }
  }

  if (!isUpdate || urgency !== undefined) {
    if (!urgency || !["urgent", "high", "medium", "low"].includes(urgency)) {
      errors.urgency = "Urgency must be 'urgent', 'high', 'medium', or 'low'.";
    }
  }

  if (!isUpdate || reason !== undefined) {
    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      errors.reason = "Please provide a reason / justification (minimum 5 characters).";
    }
  }

  if (!isUpdate || bankOrWalletDetails !== undefined) {
    if (!bankOrWalletDetails || typeof bankOrWalletDetails !== "string" || !bankOrWalletDetails.trim()) {
      errors.bankOrWalletDetails = "Payout receiving wallet/bank details are required.";
    }
  }

  if (status && !["pending", "under_review", "approved", "disbursed", "rejected"].includes(status)) {
    errors.status = "Invalid status value.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

