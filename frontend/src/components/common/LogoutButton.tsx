import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/authApi";

export default function LogoutButton() {
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <button
            onClick={handleLogout}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 18,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                transition: "0.2s"
            }}
        >
            <LogOut size={18} />
            <span>Logout</span>
        </button>
    );
}