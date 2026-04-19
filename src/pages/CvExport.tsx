import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TEMPLATES, TemplateKey } from "@/components/cv-templates";

type Report = { score: number; forces: string[]; faiblesses: string[]; recommandations: string[] };

const CvExport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cv, setCv] = useState<any>(null);
  const [template, setTemplate] = useState<TemplateKey>("modern");
  const [report, setReport] = useState<Report | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("cvs").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("CV introuvable"); navigate("/dashboard"); return; }
      setCv(data);
    })();
  }, [id, navigate]);

  const generateReport = async () => {
    if (!cv) return;
    setLoadingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke("cv-report", {
        body: { cv: cv.contenu_json, posteCible: cv.poste_cible },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data);
      toast.success("Rapport IA généré");
    } catch (e: any) {
      toast.error(e.message || "Échec du rapport");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: `${(cv.titre || "cv").replace(/[^a-z0-9-_]/gi, "_")}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(printRef.current)
        .save();
      toast.success("PDF téléchargé");
    } catch (e: any) {
      toast.error("Échec du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  if (!cv) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navbar />
        <main className="container py-12 max-w-5xl space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  const Tmpl = TEMPLATES[template].component;
  const content = cv.contenu_json || {};

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />
      <main className="container py-8 md:py-12 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/cv/${id}/edit`)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Retour à l'éditeur
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Exporter le CV</h1>
            <p className="text-muted-foreground mt-1">Choisissez un template et téléchargez votre CV en PDF.</p>
          </div>
          <Button size="lg" onClick={handleDownload} disabled={downloading} className="shadow-md hover:shadow-glow transition-all">
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Télécharger PDF
          </Button>
        </div>

        {/* Template selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setTemplate(key)}
              className={`p-4 rounded-xl border-2 transition-smooth text-left ${template === key ? "border-primary bg-accent/40 shadow-soft" : "border-border hover:border-primary/40"}`}
            >
              <p className="font-semibold text-sm">{TEMPLATES[key].name}</p>
              <p className="text-xs text-muted-foreground mt-1">{key === "modern" ? "Coloré, deux colonnes" : key === "classic" ? "Élégant, centré" : "Épuré, condensé"}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr,360px] gap-6">
          {/* PDF preview */}
          <Card className="border-0 shadow-elev-md overflow-hidden">
            <CardContent className="p-0 bg-muted/40 flex justify-center py-6 overflow-auto">
              <div className="origin-top scale-[0.65] md:scale-90 transition-transform" style={{ transformOrigin: "top center" }}>
                <div ref={printRef}>
                  <Tmpl cv={content} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Report */}
          <div className="space-y-4 lg:sticky lg:top-24 self-start">
            <Card className="border-0 shadow-elev-md bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Rapport IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!report && !loadingReport && (
                  <>
                    <p className="text-sm text-muted-foreground">Obtenez une analyse de votre CV avec score d'adéquation, forces et axes d'amélioration.</p>
                    <Button onClick={generateReport} className="w-full" variant="outline">
                      <Sparkles className="h-4 w-4 mr-2" />Générer le rapport
                    </Button>
                  </>
                )}
                {loadingReport && (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm">Analyse en cours...</p>
                  </div>
                )}
                {report && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Score d'adéquation</span>
                        <span className="text-2xl font-bold text-primary">{report.score}/100</span>
                      </div>
                      <Progress value={report.score} className="h-2" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-success mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Forces</p>
                      <ul className="space-y-1.5">{report.forces.map((f, i) => <li key={i} className="text-xs text-muted-foreground">• {f}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-destructive mb-2 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" />À améliorer</p>
                      <ul className="space-y-1.5">{report.faiblesses.map((f, i) => <li key={i} className="text-xs text-muted-foreground">• {f}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-primary mb-2">Recommandations</p>
                      <ul className="space-y-1.5">{report.recommandations.map((f, i) => <li key={i} className="text-xs text-muted-foreground">• {f}</li>)}</ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CvExport;
