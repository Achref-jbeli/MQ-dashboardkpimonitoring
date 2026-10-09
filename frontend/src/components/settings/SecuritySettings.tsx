import ChangePasswordForm from "./ChangePasswordForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import TwoFactorSettings from "./TwoFactorSettings";


interface SecuritySettingsProps {
    mode?: "password" | "forgot" | "2fa";
}


export default function SecuritySettings({
    mode = "password"
}: SecuritySettingsProps) {


    return (
        <div
            style={{
                display:"flex",
                flexDirection:"column",
                gap:20
            }}
        >

            {mode === "password" && (
                <>
                    <h3>
                        Change Password
                    </h3>

                    <ChangePasswordForm />
                </>
            )}



            {mode === "forgot" && (
                <>
                    <h3>
                        Forgot Password
                    </h3>

                    <ForgotPasswordForm />
                </>
            )}



            {mode === "2fa" && (
                <>
                    <h3>
                        Configure Two Factor Authentication
                    </h3>

                    <TwoFactorSettings />
                </>
            )}

        </div>
    );
}