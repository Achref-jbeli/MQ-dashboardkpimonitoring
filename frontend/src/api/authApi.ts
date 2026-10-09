import api from "./client";
export type UserRole =
    | "SuperAdmin"
    | "Administrator"
    | "Manager"
    | "TeamLeader"
    | "Employee";
export interface LoginResponse {
    token: string;
    employeeId: number;
    fullName: string;
    role: UserRole;
    department?: string | null;
    departmentId?: number | null;
    requiresTwoFactor?: boolean;
    requiresTwoFactorSetup?: boolean;
    twoFactorSetupProvider?: "email" | "google";
    googleAuthenticatorSecret?: string | null;
    googleOtpAuthUri?: string | null;
    challengeId?: number | null;
    message?: string;
}

export type AccountRequestScope = "admin" | "manager";

function getScopeRoute(scope: AccountRequestScope): string {
    return scope === "manager" ? "/managers" : "/admins";
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
    });

    return response.data;
}

export interface RegisterRequestPayload {
    email: string;
    password: string;
    accountType: "SuperAdmin" | "Administrator" | "Manager" | "TeamLeader";
    departmentId: number;
    twoFactorProvider?: "email" | "google";
}

export interface RegisterRequestResponse {
    requestId: number;
    message: string;
    googleAuthenticatorSecret?: string | null;
    googleOtpAuthUri?: string | null;
}

export async function registerAccountRequest(payload: RegisterRequestPayload): Promise<RegisterRequestResponse> {
    const response = await api.post<RegisterRequestResponse>("/auth/register-request", payload);
    return response.data;
}

export async function verifyTwoFactor(employeeId: number, code: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/verify-2fa", {
        employeeId,
        code,
    });
    return response.data;
}

export interface AccountRequestItem {
    id: number;
    employeeId: number;
    email: string;
    requestedRole: string;
    twoFactorProvider: string;
    status: string;
    requestedAtUtc: string;
    reviewedAtUtc?: string | null;
    reviewedByAdminId?: number | null;
    rejectionReason?: string | null;
}

export async function getAccountRequests(scope: AccountRequestScope = "admin"): Promise<AccountRequestItem[]> {
    const baseRoute = getScopeRoute(scope);
    const endpoint = scope === "manager"
        ? `${baseRoute}/account-requests/pending`
        : `${baseRoute}/account-requests`;

    const response = await api.get<AccountRequestItem[]>(endpoint);
    return response.data;
}

export async function getPendingAccountRequests(scope: AccountRequestScope = "admin"): Promise<AccountRequestItem[]> {
    const baseRoute = getScopeRoute(scope);
    const response = await api.get<AccountRequestItem[]>(`${baseRoute}/account-requests/pending`);
    return response.data;
}

export async function approveAccountRequest(
    requestId: number,
    reviewerId?: number,
    scope: AccountRequestScope = "admin"
): Promise<void> {
    const baseRoute = getScopeRoute(scope);
    const query = scope === "admin" && reviewerId ? `?adminId=${reviewerId}` : "";
    await api.post(`${baseRoute}/account-requests/${requestId}/approve${query}`);
}

export async function rejectAccountRequest(
    requestId: number,
    reason?: string,
    reviewerId?: number,
    scope: AccountRequestScope = "admin"
): Promise<void> {
    const baseRoute = getScopeRoute(scope);
    const query = scope === "admin" && reviewerId ? `?adminId=${reviewerId}` : "";
    await api.post(`${baseRoute}/account-requests/${requestId}/reject${query}`, { reason });
}

export interface ForgotPasswordResponse {
    requiresTwoFactor: boolean;
    provider: "email" | "google";
    employeeId: number;
    message: string;
}

export interface VerifyResetCodeResponse {
    valid: boolean;
    employeeId: number;
    resetToken: string;
    message: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message: string;
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
    return response.data;
}

export async function verifyResetCode(employeeId: number, code: string): Promise<VerifyResetCodeResponse> {
    const response = await api.post<VerifyResetCodeResponse>("/auth/verify-reset-code", { employeeId, code });
    return response.data;
}

export async function resetPassword(
    employeeId: number,
    resetToken: string,
    newPassword: string
): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>("/auth/reset-password", {
        employeeId,
        resetToken,
        newPassword,
    });
    return response.data;
}

export function logout() {
    localStorage.clear();
}