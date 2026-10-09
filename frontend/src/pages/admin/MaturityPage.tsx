import { useEffect, useRef, useState } from "react";
import { M } from "../../theme/tokens";
import { Activity, Upload, Trash2, ImageOff, Loader2 } from "lucide-react";
import api from "../../api/client";

const BASE = "http://localhost:5189";
const CATEGORY = "maturity";

async function fetchPhotos(): Promise<string[]> {
  const res = await api.get<{ urls: string[] }>(`/photo/list/${CATEGORY}`);
  return res.data.urls;
}

async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post<{ url: string }>(`/photo/upload/${CATEGORY}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}

async function deletePhoto(url: string): Promise<void> {
  await api.delete(`/photo/delete?url=${encodeURIComponent(url)}`);
}

export function MaturityPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { setPhotos(await fetchPhotos()); } catch { setPhotos([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadPhoto(file);
      }
      await load();
    } catch (e: any) {
      alert(e?.response?.data ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm("Remove this photo?")) return;
    try {
      await deletePhoto(url);
      setPhotos((p) => p.filter((u) => u !== url));
    } catch {
      alert("Failed to delete photo.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Activity size={20} color={M.teal} />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: M.textPrimary }}>Maturity Gallery</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: M.textSec }}>Upload and manage Maturity Dashboard photos</p>
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 14, border: "none",
            background: M.teal, color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: uploading ? "wait" : "pointer",
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Uploading…" : "Upload Photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? M.teal : M.border}`,
          borderRadius: 16,
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? `${M.teal}0a` : "var(--surface-secondary,#EEF4F7)",
          transition: "all 0.2s",
        }}
      >
        <Upload size={28} color={dragging ? M.teal : M.textSec} style={{ marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: M.textPrimary }}>
          Drag & drop photos here, or click to browse
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: M.textSec }}>JPG, PNG, WEBP — max 5 MB each</p>
      </div>

      {/* Gallery */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: M.textSec }}>
          <Loader2 size={24} className="animate-spin" style={{ color: M.teal }} />
        </div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: M.textSec }}>
          <ImageOff size={40} style={{ opacity: 0.35, marginBottom: 12, color: M.teal }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: M.textPrimary }}>No photos yet</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>Upload Maturity Dashboard photos to display them here</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {photos.map((url) => (
            <div
              key={url}
              style={{
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                aspectRatio: "4/3",
                background: "var(--surface-secondary,#EEF4F7)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: `1px solid ${M.border}`,
                cursor: "pointer",
              }}
              onClick={() => setLightbox(url)}
            >
              <img
                src={`${BASE}${url}`}
                alt="Maturity"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0)",
                  transition: "background 0.2s",
                  display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(url); }}
                  title="Delete photo"
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: "none",
                    background: "rgba(220,38,38,0.85)", color: "#fff",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.88)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <img
            src={`${BASE}${lightbox}`}
            alt="Maturity"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
          />
        </div>
      )}
    </div>
  );
}
