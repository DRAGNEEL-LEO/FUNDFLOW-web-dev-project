export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function isValidEmail(email: string): boolean;
export function isValidPassword(password: string, minLength?: number): boolean;
export function isValidPhone(phone?: string): boolean;
export function isValidNumber(val: any, options?: { positive?: boolean; nonNegative?: boolean }): boolean;
export function isValidDateStr(dateStr: string): boolean;

export function validateRegisterPayload(data?: any): ValidationResult;
export function validateRegisterOrgPayload(data?: any): ValidationResult;
export function validateLoginPayload(data?: any): ValidationResult;
export function validateTransactionPayload(data?: any): ValidationResult;
export function validateMemberPayload(data?: any, isUpdate?: boolean): ValidationResult;
export function validateAnnouncementPayload(data?: any): ValidationResult;
export function validateWelfareRequestPayload(data?: any, isUpdate?: boolean): ValidationResult;
