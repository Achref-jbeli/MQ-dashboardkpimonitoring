import { useState } from "react";
import api from "../../api/client";
import { Eye, EyeOff, Lock } from "lucide-react";


export default function ChangePasswordForm() {

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setMessage("");
        setError("");


        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }


        if (newPassword.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }


        try {

            setLoading(true);


            await api.post("/profile/change-password", {
                oldPassword,
                newPassword
            });


            setMessage("Password changed successfully.");

            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");


        } catch (err: any) {

            setError(
                err.response?.data?.message ??
                "Failed to change password."
            );

        } finally {

            setLoading(false);

        }

    }



    function PasswordInput({
        value,
        setValue,
        placeholder,
        show,
        setShow
    }: any) {

        return (

            <div style={{
                display:"flex",
                alignItems:"center",
                gap:10,
                border:"1px solid #ddd",
                borderRadius:14,
                padding:"0 14px",
                height:48
            }}>

                <Lock size={18}/>


                <input
                    type={show ? "text":"password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={
                        e=>setValue(e.target.value)
                    }
                    style={{
                        flex:1,
                        border:"none",
                        outline:"none",
                        fontSize:14
                    }}
                />


                <button
                    type="button"
                    onClick={()=>setShow(!show)}
                    style={{
                        border:"none",
                        background:"transparent",
                        cursor:"pointer"
                    }}
                >

                    {
                        show
                        ?
                        <EyeOff size={18}/>
                        :
                        <Eye size={18}/>
                    }

                </button>


            </div>

        );

    }



return (

<form
onSubmit={handleSubmit}
style={{
    maxWidth:420,
    display:"flex",
    flexDirection:"column",
    gap:16
}}
>


<PasswordInput
    value={oldPassword}
    setValue={setOldPassword}
    placeholder="Current password"
    show={showOld}
    setShow={setShowOld}
/>


<PasswordInput
    value={newPassword}
    setValue={setNewPassword}
    placeholder="New password"
    show={showNew}
    setShow={setShowNew}
/>


<PasswordInput
    value={confirmPassword}
    setValue={setConfirmPassword}
    placeholder="Confirm new password"
    show={showConfirm}
    setShow={setShowConfirm}
/>



{
error &&
<div style={{
    color:"red",
    fontSize:14
}}>
    {error}
</div>
}



{
message &&
<div style={{
    color:"green",
    fontSize:14
}}>
    {message}
</div>
}



<button
type="submit"
disabled={loading}
style={{
    height:48,
    borderRadius:14,
    border:"none",
    cursor:"pointer",
    background:"#1677ff",
    color:"white",
    fontWeight:600
}}
>

{
loading
?
"Changing..."
:
"Change Password"
}

</button>


</form>

);

}