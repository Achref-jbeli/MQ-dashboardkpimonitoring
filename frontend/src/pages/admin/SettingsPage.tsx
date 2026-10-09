import { useState } from "react";
import { User, Lock, ShieldCheck, Users, Building2 } from "lucide-react";

import SettingsLayout from "../../components/layout/SettingsLayout";
import ProfileSettings from "../../components/settings/ProfileSettings";
import SecuritySettings from "../../components/settings/SecuritySettings";
import AccountRequestsSection from "../../components/settings/AccountRequestsSection";
import DepartmentManagementSection from "../../components/settings/DepartmentManagementSection";
import BusinessUnitManagementSection from "../../components/settings/BusinessUnitManagementSection";
import { ThemeSelector } from "../../components/common/ThemeSelector";
import { ThemeScheduleControl } from "../../components/common/ThemeScheduleControl";

import { M } from "../../theme/tokens";


export default function SettingsPage() {

    const [modal, setModal] = useState<
        "profile" | "password" | "2fa" | "requests" | "departments" | "businessUnits" | null
    >(null);

    const currentRole = localStorage.getItem("role") ?? "";
    const canManageDepartments = currentRole === "SuperAdmin";
    const canManageBusinessUnits = currentRole === "SuperAdmin" || currentRole === "Administrator";


    const cards = [
        {
            id: "profile",
            title: "Edit Profile",
            description: "Update your personal information",
            icon: <User size={32}/>
        },
        {
            id: "password",
            title: "Change Password",
            description: "Update your account password securely",
            icon: <Lock size={32}/>
        },
        {
            id: "2fa",
            title: "Two Factor Authentication",
            description: "Configure your security verification",
            icon: <ShieldCheck size={32}/>
        }
    ];


    return (

        <SettingsLayout>

            <div
                style={{
                    padding:30,
                    maxWidth:1100,
                    margin:"auto"
                }}
            >

                <h1
                    style={{
                        fontSize:30,
                        fontWeight:800,
                        color:M.textPrimary,
                        marginBottom:8
                    }}
                >
                    Settings
                </h1>


                <p
                    style={{
                        color: "var(--muted-foreground, #6B7C87)",
                        marginBottom: 20
                    }}
                >
                    Manage your account, appearance, and security preferences.
                </p>

                {/* Appearance Theme Selector Card */}
                <div
                    style={{
                        marginBottom: 16,
                        padding: 20,
                        borderRadius: 20,
                        background: "var(--card, #ffffff)",
                        border: "1px solid var(--border, #DCE5EA)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 16,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                >
                    <div>
                        <h3 style={{ margin: "0 0 4px 0", color: "var(--foreground, #1F2937)", fontSize: "1.1rem" }}>
                            Appearance / Theme
                        </h3>
                        <p style={{ margin: 0, color: "var(--muted-foreground, #6B7280)", fontSize: "0.875rem" }}>
                            Choose your preferred visual theme across the platform.
                        </p>
                    </div>
                    <ThemeSelector />
                </div>

                {/* Auto Theme Schedule / Day-Night Timer Card */}
                <div style={{ marginBottom: 30 }}>
                    <ThemeScheduleControl />
                </div>

                <div
                    style={{
                        display:"grid",
                        gridTemplateColumns:
                        "repeat(auto-fit,minmax(250px,1fr))",
                        gap:20
                    }}
                >

                    {cards.map(card=>(

                        <button
                            key={card.id}
                            onClick={() => setModal(card.id as any)}
                            style={{
                                textAlign:"left",
                                cursor:"pointer",
                                padding:25,
                                borderRadius:24,
                                border:`1px solid ${M.border}`,
                                background:M.white,
                                boxShadow:
                                "0 10px 30px rgba(0,0,0,.08)",
                                transition:"all .2s",
                            }}
                        >

                            <div
                                style={{
                                    color:M.teal,
                                    marginBottom:15
                                }}
                            >
                                {card.icon}
                            </div>


                            <h3
                                style={{
                                    margin:0,
                                    color:M.textPrimary
                                }}
                            >
                                {card.title}
                            </h3>


                            <p
                                style={{
                                    color:M.textSec,
                                    fontSize:14
                                }}
                            >
                                {card.description}
                            </p>


                        </button>

                    ))}



                    <button
                        onClick={()=>setModal("requests")}
                        style={{
                            padding:25,
                            borderRadius:24,
                            cursor:"pointer",
                            background:M.bgTeal,
                            border:`1px solid ${M.teal}`,
                        }}
                    >

                        <Users size={32}
                            color={M.teal}
                        />

                        <h3>
                            Account Requests
                        </h3>

                        <p>
                            Review employee account requests
                        </p>

                    </button>

                    {canManageDepartments && (
                        <button
                            onClick={() => setModal("departments")}
                            style={{
                                padding:25,
                                borderRadius:24,
                                cursor:"pointer",
                                background:M.white,
                                border:`1px solid ${M.border}`,
                                boxShadow:"0 10px 30px rgba(0,0,0,.08)",
                            }}
                        >
                            <Building2 size={32} color={M.teal} />
                            <h3>Departments</h3>
                            <p>Add and manage departments across the organization</p>
                        </button>
                    )}

                    {canManageBusinessUnits && (
                        <button
                            onClick={() => setModal("businessUnits")}
                            style={{
                                padding:25,
                                borderRadius:24,
                                cursor:"pointer",
                                background:M.white,
                                border:`1px solid ${M.border}`,
                                boxShadow:"0 10px 30px rgba(0,0,0,.08)",
                            }}
                        >
                            <Building2 size={32} color={M.teal} />
                            <h3>Business Units</h3>
                            <p>Manage standard Business Units (HMI, HIS, Performance)</p>
                        </button>
                    )}


                </div>

            </div>



            {modal && (

                <div
                    style={{
                        position:"fixed",
                        inset:0,
                        background:"rgba(0,0,0,.45)",
                        backdropFilter:"blur(8px)",
                        display:"flex",
                        justifyContent:"center",
                        alignItems:"center",
                        zIndex:1000
                    }}
                    onClick={()=>setModal(null)}
                >


                    <div
                        onClick={(e)=>e.stopPropagation()}
                        style={{
                            width:"90%",
                            maxWidth:700,
                            maxHeight:"85vh",
                            overflow:"auto",
                            background:M.white,
                            borderRadius:28,
                            padding:30,
                            boxShadow:
                            "0 20px 60px rgba(0,0,0,.25)"
                        }}
                    >

                        <button
                            onClick={()=>setModal(null)}
                            style={{
                                float:"right",
                                border:"none",
                                background:"transparent",
                                fontSize:22,
                                cursor:"pointer"
                            }}
                        >
                            ×
                        </button>



                        {modal==="profile" &&
                            <ProfileSettings/>
                        }


                        {modal==="password" &&
                            <SecuritySettings mode="password"/>
                        }


                        {modal==="2fa" &&
                            <SecuritySettings mode="2fa"/>
                        }


                        {modal==="requests" &&
                            <AccountRequestsSection/>
                        }

                        {modal==="departments" &&
                            <DepartmentManagementSection/>
                        }

                        {modal==="businessUnits" &&
                            <BusinessUnitManagementSection/>
                        }


                    </div>

                </div>

            )}


        </SettingsLayout>
    );
}