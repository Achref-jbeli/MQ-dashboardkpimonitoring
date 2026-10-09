import { useEffect, useState } from "react";

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export default function ProfileSettings() {

    const [user, setUser] = useState<UserProfile | null>(null);


    useEffect(() => {

        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

    }, []);


    if (!user) {
        return (
            <div>
                Loading profile...
            </div>
        );
    }


    return (
        <div>
            <h2>
                {user.firstName} {user.lastName}
            </h2>

            <p>
                {user.email}
            </p>

            <p>
                Role: {user.role}
            </p>
        </div>
    );
}