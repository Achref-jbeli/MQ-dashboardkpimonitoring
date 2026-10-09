import { useState } from "react";
import api from "../../api/client";
import { Eye, EyeOff, Lock } from "lucide-react";


export default function ChangePasswordForm() {

    const [oldPassword,setOldPassword] = useState("");
    const [newPassword,setNewPassword] = useState("");
    const [confirm,setConfirm] = useState("");

    const [showOld,setShowOld] = useState(false);
    const [showNew,setShowNew] = useState(false);
    const [showConfirm,setShowConfirm] = useState(false);

    const [loading,setLoading] = useState(false);

    const [error,setError] = useState("");
    const [message,setMessage] = useState("");



    async function handleSubmit(e:React.FormEvent){

        e.preventDefault();

        setError("");
        setMessage("");


        if(newPassword !== confirm){
            setError("Passwords do not match");
            return;
        }


        if(newPassword.length < 8){
            setError("Password must contain at least 8 characters");
            return;
        }


        try{

            setLoading(true);


            await api.post(
                "/profile/change-password",
                {
                    oldPassword,
                    newPassword
                }
            );


            setMessage("Password updated successfully");


            setOldPassword("");
            setNewPassword("");
            setConfirm("");


        }
        catch(err:any){

            setError(
                err.response?.data?.message ??
                "Failed to update password"
            );

        }
        finally{

            setLoading(false);

        }

    }



    function PasswordInput({
        value,
        setValue,
        placeholder,
        show,
        setShow
    }:any){


        return (

            <div
                style={{
                    display:"flex",
                    alignItems:"center",
                    gap:10,
                    border:"1px solid #dbe4ea",
                    background:"#f8fafc",
                    borderRadius:14,
                    padding:"0 14px",
                    height:48
                }}
            >

                <Lock size={18} color="#64748b"/>


                <input
                    type={show ? "text":"password"}
                    value={value}
                    placeholder={placeholder}
                    onChange={
                        e=>setValue(e.target.value)
                    }
                    style={{
                        flex:1,
                        border:"none",
                        outline:"none",
                        background:"transparent",
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

        <div
            style={{
                background:"#fff",
                borderRadius:22,
                padding:28,
                width:"100%",
                maxWidth:460,
                boxShadow:"0 12px 35px rgba(12,46,70,0.10)",
                border:"1px solid #e5e7eb"
            }}
        >


            <form
                onSubmit={handleSubmit}
                style={{
                    display:"flex",
                    flexDirection:"column",
                    gap:18
                }}
            >


                <div>

                    <h3
                        style={{
                            margin:0,
                            fontSize:20,
                            color:"#0c2e46"
                        }}
                    >
                        Change Password
                    </h3>


                    <p
                        style={{
                            color:"#64748b",
                            fontSize:13
                        }}
                    >
                        Update your password regularly to keep your account secure.
                    </p>

                </div>



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
                    value={confirm}
                    setValue={setConfirm}
                    placeholder="Confirm password"
                    show={showConfirm}
                    setShow={setShowConfirm}
                />



                {
                    error &&
                    <div
                        style={{
                            background:"#fee2e2",
                            color:"#b91c1c",
                            padding:10,
                            borderRadius:12,
                            fontSize:13
                        }}
                    >
                        {error}
                    </div>
                }



                {
                    message &&
                    <div
                        style={{
                            background:"#dcfce7",
                            color:"#15803d",
                            padding:10,
                            borderRadius:12,
                            fontSize:13
                        }}
                    >
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
                        cursor:loading ? "not-allowed":"pointer",
                        background:
                        "linear-gradient(135deg,#0099a8,#006b78)",
                        color:"#fff",
                        fontWeight:700
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


        </div>

    );
}