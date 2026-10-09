import api from "./client";

export interface TwoFactorStatus {
    isEnabled: boolean;
    provider: string;
}

export async function getTwoFactorStatus(employeeId: number): Promise<TwoFactorStatus> {
    const response = await api.get<TwoFactorStatus>(`/twofactor/status/${employeeId}`);
    return response.data;
}

export async function enableEmailTwoFactor(employeeId: number): Promise<void> {
    await api.post("/twofactor/enable-email", { employeeId });
}

export interface GoogleTwoFactorSetupResponse {
    secretKey: string;
    qrCodeUri: string;
}

export async function enableGoogleTwoFactor(employeeId: number): Promise<GoogleTwoFactorSetupResponse> {
    const response = await api.post<GoogleTwoFactorSetupResponse>("/twofactor/enable-google", { employeeId });
    return response.data;
}

export async function verifyTwoFactorSetup(employeeId: number, code: string): Promise<TwoFactorStatus> {
    const response = await api.post<TwoFactorStatus>("/twofactor/verify", { employeeId, code });
    return response.data;
}

export async function disableTwoFactor(employeeId: number): Promise<void> {
    await api.post("/twofactor/disable", { employeeId });
}



