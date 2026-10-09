import { type CSSProperties, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../imports/logo.png";

export function MarquardtLogo({
  height = 36,
  width = 100,
  maxWidth,
  light = false,
  className,
  style,
  clickable = true,
  onClick,
}: {
  height?: number | string;
  width?: number | string;
  maxWidth?: number | string;
  light?: boolean;
  className?: string;
  style?: CSSProperties;
  clickable?: boolean;
  onClick?: (e: MouseEvent<HTMLImageElement>) => void;
}) {
  let navigate: any = null;
  try {
    navigate = useNavigate();
  } catch {
    // Router context fallback
  }

  const handleClick = (e: MouseEvent<HTMLImageElement>) => {
    if (onClick) {
      onClick(e);
    } else if (clickable) {
      if (navigate) {
        navigate("/");
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <img
      src={logoImg}
      alt="Marquardt"
      title={clickable || onClick ? "Marquardt - Return to Home" : "Marquardt"}
      className={className}
      onClick={clickable || onClick ? handleClick : undefined}
      role={clickable || onClick ? "button" : undefined}
      tabIndex={clickable || onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((clickable || onClick) && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          if (onClick) {
            onClick(e as any);
          } else if (clickable) {
            if (navigate) {
              navigate("/");
            } else {
              window.location.href = "/";
            }
          }
        }
      }}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width || "auto",
        maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth || "100%",
        display: "block",
        filter: light ? "brightness(0) invert(1)" : "none",
        objectFit: "contain",
        flexShrink: 0,
        cursor: clickable || onClick ? "pointer" : "default",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (clickable || onClick) {
          e.currentTarget.style.opacity = "0.85";
        }
      }}
      onMouseLeave={(e) => {
        if (clickable || onClick) {
          e.currentTarget.style.opacity = "1";
        }
      }}
    />
  );
}

export function MarquardtMark({
  size = 40,
  clickable = true,
  onClick,
}: {
  size?: number;
  clickable?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  let navigate: any = null;
  try {
    navigate = useNavigate();
  } catch {
    // Router context fallback
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    } else if (clickable) {
      if (navigate) {
        navigate("/");
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <div
      onClick={clickable || onClick ? handleClick : undefined}
      role={clickable || onClick ? "button" : undefined}
      tabIndex={clickable || onClick ? 0 : undefined}
      title={clickable || onClick ? "Return to Home" : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: "30%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.12)",
        flexShrink: 0,
        cursor: clickable || onClick ? "pointer" : "default",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (clickable || onClick) {
          e.currentTarget.style.opacity = "0.85";
        }
      }}
      onMouseLeave={(e) => {
        if (clickable || onClick) {
          e.currentTarget.style.opacity = "1";
        }
      }}
    >
      <img
        src={logoImg}
        alt="M"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          objectFit: "contain",
          filter: "brightness(0) invert(1)",
        }}
      />
    </div>
  );
}
