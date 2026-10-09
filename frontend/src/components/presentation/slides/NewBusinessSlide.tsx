import { type ReactNode } from "react";
import type { PublicInternationalBusiness } from "../../../api/publicDashboardApi";
import { SlideHeader } from "../SlideHeader";
import {
  resolveImageUrl,
  FALLBACK_IMAGE,
} from "../../../utils/imageUrl";
import { NewBusinessBadge } from "../../internationalBusiness/BusinessCard";
import { Building2 } from "lucide-react";

function BusinessRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "clamp(110px, 10vw, 150px) minmax(0, 1fr)",
        columnGap: "1vh",
        alignItems: "start",
        fontSize: "1.4vh",
        lineHeight: 1.4,
      }}
    >
      {/* Label */}
      <span
        style={{
          color: "rgba(255,255,255,0.78)",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Value */}
      <span
        style={{
          color: "#FFFFFF",
          fontWeight: 500,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function NewBusinessSlide({
  newBusiness,
}: {
  newBusiness: PublicInternationalBusiness[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <SlideHeader title="RFQs" />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: "2vw",
          overflow: "hidden",
          padding: "1vh 0",
          alignItems: "flex-start",
          alignContent: "flex-start",
          justifyContent: "center",
        }}
      >
        {newBusiness.slice(0, 6).map((nb, i) => {
          const rawPhoto =
            nb.photos && nb.photos.length > 0
              ? nb.photos[0]
              : null;

          const resolvedPhoto = rawPhoto
            ? resolveImageUrl(rawPhoto)
            : null;

          const photoUrl = resolvedPhoto
            ? `${resolvedPhoto}${nb.updatedAtUtc
              ? `?v=${new Date(nb.updatedAtUtc).getTime()}`
              : ""
            }`
            : FALLBACK_IMAGE;

          return (
            <div
              key={nb.id || i}
              style={{
                background: "#006D75",
                borderRadius: "1.5vh",
                padding: "2.5vh 3vh",
                boxShadow: "0 0.8vh 2vh rgba(0,0,0,0.18)",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(255,255,255,0.15)",
                overflow: "hidden",
                position: "relative",
                color: "#FFFFFF",
                minHeight: 0,
                /* each card is exactly 1/3 of the container minus gaps */
                width: "calc(33.333% - 1.4vw)",
                boxSizing: "border-box",
                flexShrink: 0,
              }}
            >
              {/* NEW BADGE */}
              {nb.isNewBusiness && (
                <NewBusinessBadge className="business-new-badge" />
              )}

              {/* PROJECT NAME */}
              <h3
                style={{
                  fontSize: "2.6vh",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  margin: "0 0 1.5vh 0",
                  paddingRight: nb.isNewBusiness ? "8vh" : 0,
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {nb.name || `Opportunity ${i + 1}`}
              </h3>

              {/* CUSTOMER */}
              {nb.partnerName && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "clamp(110px, 10vw, 150px) minmax(0, 1fr)",

                    columnGap: "1vh",
                    alignItems: "center",

                    marginBottom: "1vh",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.5vh",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.78)",
                    }}
                  >
                    Customer
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <Building2
                      size={14}
                      color="#FFFFFF"
                      style={{
                        flexShrink: 0,
                      }}
                    />

                    <span
                      style={{
                        fontSize: "1.5vh",
                        fontWeight: 700,
                        color: "#FFFFFF",

                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {nb.partnerName}
                    </span>
                  </div>
                </div>
              )}

              {/* INFORMATION */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65vh",

                  flex: 1,
                  minHeight: 0,
                }}
              >
                {nb.projectInfo && (
                  <BusinessRow
                    label="Project Info"
                    value={nb.projectInfo}
                  />
                )}

                {nb.volumeLifetime && (
                  <BusinessRow
                    label="Volume Lifetime"
                    value={nb.volumeLifetime}
                  />
                )}

                {nb.salesLifetime && (
                  <BusinessRow
                    label="Sales Lifetime"
                    value={nb.salesLifetime}
                  />
                )}

                {nb.sop && (
                  <BusinessRow
                    label="SOP"
                    value={nb.sop}
                  />
                )}

                {nb.productionLocation && (
                  <BusinessRow
                    label="Production Location"
                    value={nb.productionLocation}
                  />
                )}

                {nb.country && (
                  <BusinessRow
                    label="Country"
                    value={nb.country}
                  />
                )}
              </div>

              {/* PRODUCT IMAGE */}
              <div
                style={{
                  width: "100%",
                  height: "39vh",
                  marginTop: "1.5vh",
                  background: "#F3F3F3",
                  border: "1px solid rgba(0,0,0,0.18)",
                  overflow: "hidden",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={photoUrl}
                  alt={nb.name || "Opportunity"}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>
          );
        })}

        {newBusiness.length === 0 && (
          <div
            style={{
              gridColumn: "span 3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "2.2vh",
              background: "#006D75",
              border:
                "1px dashed rgba(255,255,255,0.3)",
              borderRadius: "1.2vh",
            }}
          >
            No international business opportunities available.
          </div>
        )}
      </div>
    </div>
  );
}