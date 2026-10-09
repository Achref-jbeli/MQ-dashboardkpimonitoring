import { M } from "../../theme/tokens";
import {
  InternationalBusinessForm,
  type InternationalBusinessFormValues,
} from "./InternationalBusinessForm";
import type { InternationalBusiness } from "../../types/internationalBusiness";
import { X } from "lucide-react";

export function InternationalBusinessModal({
  internationalBusiness,
  onClose,
  onSubmit,
}: {
  internationalBusiness?: InternationalBusiness;
  onClose: () => void;
  onSubmit: (values: InternationalBusinessFormValues) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(7,44,70,0.6)",
          backdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 24,
          padding: 28,
          background: M.white,
          boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: M.textPrimary,
              margin: 0,
            }}
          >
            {internationalBusiness
              ? "Edit International Business"
              : "Add Request for Quotation"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: M.bgTeal,
              color: M.textSec,
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <InternationalBusinessForm
          initial={internationalBusiness}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}