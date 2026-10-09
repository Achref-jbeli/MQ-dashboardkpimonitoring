import React from "react";

export default function SettingsLayout({
    children
}: {
    children: React.ReactNode;
}) {

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 20
            }}
        >
            {children}
        </div>
    );
}