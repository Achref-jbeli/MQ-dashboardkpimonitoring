import { useState, type ReactNode } from "react";
import { M } from "../../theme/tokens";
import type { PublicInternationalBusiness } from "../../api/publicDashboardApi";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../utils/imageUrl";
import { Sparkles, Globe2, Building2, Calendar, MapPin, Layers, DollarSign, Info } from "lucide-react";

export function NewBusinessBadge({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 10,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)",
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        boxShadow: "0 0 14px rgba(234, 88, 12, 0.45), 0 2px 6px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255, 255, 255, 0.35)",
        userSelect: "none",
        animation: "subtleGlow 3s ease-in-out infinite",
      }}
    >
      <Sparkles size={12} />
      <span>NEW</span>
    </div>
  );
}

export function BusinessDetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: ReactNode;
}) {
  if (!value || !value.trim()) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px minmax(0, 1fr)",
        alignItems: "start",
        columnGap: 10,
        fontSize: "clamp(10px, 0.78vw, 13px)",
        lineHeight: 1.4,
        color: "#FFFFFF",
      }}
    >
      {/* LABEL */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4vh",
          color: "rgba(255,255,255,0.72)",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {icon && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              opacity: 0.8,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>

      {/* VALUE */}
      <div
        style={{
          minWidth: 0,
          color: "#FFFFFF",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function BusinessCard({
  business,
  style,
}: {
  business: PublicInternationalBusiness;
  style?: React.CSSProperties;
}) {
  const [imageError, setImageError] = useState(false);

  const rawPhoto =
    business.photos && business.photos.length > 0
      ? business.photos[0]
      : null;

  const resolvedPhoto = rawPhoto
    ? resolveImageUrl(rawPhoto)
    : null;

  const imageSrc = resolvedPhoto
    ? `${resolvedPhoto}${business.updatedAtUtc
      ? `?v=${new Date(business.updatedAtUtc).getTime()}`
      : ""
    }`
    : FALLBACK_IMAGE;

  return (
    <div
      style={{
        ...style,
        display: "flex",
        flexDirection: "column",

        /* CARD DESIGN */
        background: "#006D75",
        color: "#FFFFFF",

        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.14)",

        overflow: "hidden",

        boxShadow: "0 6px 20px rgba(0,0,0,0.16)",

        transition:
          "transform 0.25s ease, box-shadow 0.25s ease",

        position: "relative",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",

        padding: "16px 18px 0",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
          "0 12px 30px rgba(0,0,0,0.24)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 6px 20px rgba(0,0,0,0.16)";
      }}
    >
      <style>{`
        @keyframes subtleGlow {
          0%, 100% {
            box-shadow:
              0 0 12px rgba(234, 88, 12, 0.4),
              0 2px 6px rgba(0,0,0,0.3);
          }

          50% {
            box-shadow:
              0 0 20px rgba(234, 88, 12, 0.7),
              0 3px 8px rgba(0,0,0,0.4);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .business-new-badge {
            animation: none !important;
          }
        }
      `}</style>

      {/* NEW BADGE */}
      {business.isNewBusiness && (
        <NewBusinessBadge className="business-new-badge" />
      )}

      {/* ── ROW 1: PROJECT NAME ── */}
      <h3
        style={{
          fontSize: "clamp(13px, 1vw, 17px)",
          fontWeight: 800,
          color: "#FFFFFF",
          margin: 0,
          marginBottom: 10,
          paddingRight: business.isNewBusiness ? 72 : 0,
          letterSpacing: "0.01em",
          lineHeight: 1.25,
          textTransform: "uppercase",
          wordBreak: "break-word",
        }}
      >
        {business.name || "Unnamed Opportunity"}
      </h3>

      {/* ── ROW 2: CUSTOMER | PARTNER (two-column) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* Customer column */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.60)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Customer
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              minWidth: 0,
            }}
          >
            <Building2
              size={13}
              color="#FFFFFF"
              style={{ flexShrink: 0, opacity: 0.85 }}
            />
            <span
              style={{
                fontSize: "clamp(11px, 0.85vw, 14px)",
                fontWeight: 700,
                color: "#FFFFFF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {business.partnerName || "—"}
            </span>
          </div>
        </div>

        {/* Partner / Country column */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.60)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Partner
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              minWidth: 0,
            }}
          >
            <Globe2
              size={13}
              color="#FFFFFF"
              style={{ flexShrink: 0, opacity: 0.85 }}
            />
            <span
              style={{
                fontSize: "clamp(11px, 0.85vw, 14px)",
                fontWeight: 700,
                color: "#FFFFFF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {business.country || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW 3: INFO ROWS ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
          minHeight: 0,
        }}
      >
        <BusinessDetailItem
          label="Project Info"
          value={business.projectInfo}
          icon={<Info size={11} />}
        />

        <BusinessDetailItem
          label="Volume"
          value={business.volumeLifetime}
          icon={<Layers size={11} />}
        />

        <BusinessDetailItem
          label="Sales"
          value={business.salesLifetime}
          icon={<DollarSign size={11} />}
        />

        <BusinessDetailItem
          label="SOP"
          value={business.sop}
          icon={<Calendar size={11} />}
        />

        <BusinessDetailItem
          label="Production"
          value={business.productionLocation}
          icon={<MapPin size={11} />}
        />

        {business.description && (
          <div
            style={{
              marginTop: 4,
              paddingTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.14)",
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={business.description}
          >
            {business.description}
          </div>
        )}
      </div>

      {/* ── ROW 4: PRODUCT IMAGE (bottom, full-width) ── */}
      <div
        style={{
          position: "relative",
          width: "calc(100% + 36px)",  /* bleed past the 18px padding on each side */
          marginLeft: -18,
          height: 285,
          marginTop: 14,
          background: "#F1F1F1",
          borderTop: "1px solid rgba(0,0,0,0.12)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={imageError ? FALLBACK_IMAGE : imageSrc}
          alt={business.name || "Business"}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            /* DON'T CROP THE PRODUCT */
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );

}
