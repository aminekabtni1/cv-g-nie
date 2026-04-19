import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// PDF.js for browser-side text extraction
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return text;
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
}

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<string>("");

  const handleFile = useCallback(async (file: File) => {
    if (!user) return;
    setProcessing(true);
    try {
      setStep("Lecture du fichier...");
      const ext = file.name.toLowerCase().split(".").pop();
      let rawText = "";
      if (ext === "pdf") rawText = await extractPdfText(file);
      else if (ext === "docx" || ext === "doc") rawText = await extractDocxText(file);
      else throw new Error("Format non supporté (PDF ou DOCX uniquement)");

      if (!rawText.trim()) throw new Error("Impossible d'extraire du texte de ce fichier");

      setStep("Analyse par l'IA...");
      const { data, error } = await supabase.functions.invoke("extract-cv", { body: { rawText } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const cv = data.cv;
      const normalise = `${cv.resume || ""}\n\nExpériences:\n${(cv.experiences || []).map((e: any) => `• ${e.poste} chez ${e.entreprise} (${e.periode}) — ${e.description}`).join("\n")}`;

      setStep("Sauvegarde...");
      const { data: inserted, error: insErr } = await supabase
        .from("cvs")
        .insert({
          user_id: user.id,
          titre: cv.titre || file.name.replace(/\.[^.]+$/, ""),
          contenu_json: cv,
          contenu_normalise: normalise,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      toast.success("CV importé avec succès");
      navigate(`/cv/${inserted.id}/edit`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de l'import");
      setProcessing(false);
      setStep("");
    }
  }, [user, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleFile(files[0]),
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: processing,
  });

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />
      <main className="container py-8 md:py-12 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Importer un CV</h1>
          <p className="text-muted-foreground mt-2">Glissez-déposez votre CV au format PDF ou DOCX. L'IA extrait et reformule automatiquement.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {[
            { label: "Upload", active: true },
            { label: "Amélioration", active: false },
            { label: "Export", active: false },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs ${s.active ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <span className={s.active ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
              {i < arr.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-elev-md">
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`p-12 md:p-20 text-center rounded-xl border-2 border-dashed transition-smooth cursor-pointer ${
                isDragActive ? "border-primary bg-accent/40" : "border-border hover:border-primary/40 hover:bg-accent/20"
              } ${processing ? "pointer-events-none opacity-70" : ""}`}
            >
              <input {...getInputProps()} />
              {processing ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Traitement en cours...</p>
                    <p className="text-sm text-muted-foreground mt-1">{step}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow">
                    <UploadCloud className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{isDragActive ? "Déposez votre fichier ici" : "Glissez-déposez votre CV"}</p>
                    <p className="text-sm text-muted-foreground mt-1">ou cliquez pour parcourir vos fichiers</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>PDF ou DOCX • 10 Mo max</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Upload;
