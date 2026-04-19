// Shared CV templates for preview & PDF export
export type CvData = {
  nom_complet?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  poste_actuel?: string;
  resume?: string;
  experiences?: { poste: string; entreprise: string; periode: string; description: string }[];
  formations?: { diplome: string; etablissement: string; periode: string }[];
  competences?: string[];
  langues?: string[];
};

const wrap = (children: React.ReactNode, style: React.CSSProperties): React.ReactElement => (
  <div style={{ width: "210mm", minHeight: "297mm", padding: "16mm", boxSizing: "border-box", background: "#fff", color: "#0f172a", fontFamily: "Inter, system-ui, sans-serif", ...style }}>
    {children}
  </div>
);

import React from "react";

export const TemplateModern = ({ cv }: { cv: CvData }) =>
  wrap(
    <>
      <div style={{ borderBottom: "3px solid #2563eb", paddingBottom: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: 0, color: "#0f172a" }}>{cv.nom_complet || "Sans nom"}</h1>
        {cv.poste_actuel && <p style={{ color: "#2563eb", margin: "4px 0 0", fontWeight: 600 }}>{cv.poste_actuel}</p>}
        <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0" }}>
          {[cv.email, cv.telephone, cv.adresse].filter(Boolean).join(" • ")}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          {cv.resume && <Section title="Profil" color="#2563eb"><p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{cv.resume}</p></Section>}
          {cv.experiences?.length ? (
            <Section title="Expériences" color="#2563eb">
              {cv.experiences.map((e, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{e.poste} <span style={{ fontWeight: 400, color: "#475569" }}>— {e.entreprise}</span></p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0" }}>{e.periode}</p>
                  <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{e.description}</p>
                </div>
              ))}
            </Section>
          ) : null}
          {cv.formations?.length ? (
            <Section title="Formations" color="#2563eb">
              {cv.formations.map((f, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{f.diplome}</p>
                  <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{f.etablissement} • {f.periode}</p>
                </div>
              ))}
            </Section>
          ) : null}
        </div>
        <div>
          {cv.competences?.length ? (
            <Section title="Compétences" color="#2563eb">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {cv.competences.map((c, i) => (
                  <span key={i} style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11, padding: "4px 10px", borderRadius: 999 }}>{c}</span>
                ))}
              </div>
            </Section>
          ) : null}
          {cv.langues?.length ? (
            <Section title="Langues" color="#2563eb">
              <ul style={{ paddingLeft: 16, margin: 0 }}>{cv.langues.map((l, i) => <li key={i} style={{ fontSize: 12.5 }}>{l}</li>)}</ul>
            </Section>
          ) : null}
        </div>
      </div>
    </>,
    {}
  );

export const TemplateClassic = ({ cv }: { cv: CvData }) =>
  wrap(
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: 0, letterSpacing: 1 }}>{cv.nom_complet || "Sans nom"}</h1>
        {cv.poste_actuel && <p style={{ margin: "4px 0 0", fontStyle: "italic", color: "#475569" }}>{cv.poste_actuel}</p>}
        <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0" }}>{[cv.email, cv.telephone, cv.adresse].filter(Boolean).join(" • ")}</p>
        <hr style={{ border: 0, borderTop: "1px solid #cbd5e1", margin: "16px auto", width: "60%" }} />
      </div>
      {cv.resume && <Section title="Profil professionnel" color="#0f172a" centered><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{cv.resume}</p></Section>}
      {cv.experiences?.length ? (
        <Section title="Expériences professionnelles" color="#0f172a" centered>
          {cv.experiences.map((e, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>{e.poste}</p>
              <p style={{ fontSize: 12, fontStyle: "italic", margin: "2px 0", color: "#475569" }}>{e.entreprise} — {e.periode}</p>
              <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{e.description}</p>
            </div>
          ))}
        </Section>
      ) : null}
      {cv.formations?.length ? (
        <Section title="Formations" color="#0f172a" centered>
          {cv.formations.map((f, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{f.diplome}</p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0, fontStyle: "italic" }}>{f.etablissement} • {f.periode}</p>
            </div>
          ))}
        </Section>
      ) : null}
      {cv.competences?.length ? (
        <Section title="Compétences" color="#0f172a" centered>
          <p style={{ fontSize: 13, textAlign: "center", margin: 0 }}>{cv.competences.join(" • ")}</p>
        </Section>
      ) : null}
    </>,
    {}
  );

export const TemplateMinimal = ({ cv }: { cv: CvData }) =>
  wrap(
    <>
      <h1 style={{ fontSize: 28, fontWeight: 300, margin: 0, letterSpacing: -0.5 }}>{cv.nom_complet || "Sans nom"}</h1>
      {cv.poste_actuel && <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>{cv.poste_actuel}</p>}
      <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 24px" }}>{[cv.email, cv.telephone, cv.adresse].filter(Boolean).join("  ·  ")}</p>
      {cv.resume && <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 20px", color: "#334155" }}>{cv.resume}</p>}
      {cv.experiences?.length ? (
        <Section title="EXPÉRIENCE" color="#94a3b8" small>
          {cv.experiences.map((e, i) => (
            <div key={i} style={{ marginBottom: 14, display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{e.periode}</p>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{e.poste} <span style={{ fontWeight: 400, color: "#64748b" }}>· {e.entreprise}</span></p>
                <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "4px 0 0", color: "#475569" }}>{e.description}</p>
              </div>
            </div>
          ))}
        </Section>
      ) : null}
      {cv.formations?.length ? (
        <Section title="FORMATION" color="#94a3b8" small>
          {cv.formations.map((f, i) => (
            <div key={i} style={{ marginBottom: 8, display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{f.periode}</p>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{f.diplome}</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{f.etablissement}</p>
              </div>
            </div>
          ))}
        </Section>
      ) : null}
      {cv.competences?.length ? (
        <Section title="COMPÉTENCES" color="#94a3b8" small>
          <p style={{ fontSize: 12.5, color: "#475569", margin: 0 }}>{cv.competences.join(" · ")}</p>
        </Section>
      ) : null}
    </>,
    {}
  );

const Section = ({ title, color, children, centered, small }: { title: string; color: string; children: React.ReactNode; centered?: boolean; small?: boolean }) => (
  <div style={{ marginBottom: 18 }}>
    <h2 style={{
      fontSize: small ? 11 : 14,
      fontWeight: small ? 600 : 700,
      color,
      textTransform: small ? "uppercase" : "none",
      letterSpacing: small ? 1.5 : 0,
      margin: "0 0 8px",
      textAlign: centered ? "center" : "left",
    }}>{title}</h2>
    {children}
  </div>
);

export const TEMPLATES = {
  modern: { name: "Moderne", component: TemplateModern },
  classic: { name: "Classique", component: TemplateClassic },
  minimal: { name: "Minimaliste", component: TemplateMinimal },
} as const;

export type TemplateKey = keyof typeof TEMPLATES;
