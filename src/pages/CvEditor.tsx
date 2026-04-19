import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Download, Loader2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Conseil = { titre: string; description: string };

const Stepper = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="flex items-center gap-2 mb-8 text-sm">
    {["Upload", "Amélioration", "Export"].map((label, i, arr) => {
      const idx = i + 1;
      const active = idx <= step;
      return (
        <div key={label} className="flex items-center gap-2 flex-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs ${active ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground"}`}>{idx}</div>
          <span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
          {i < arr.length - 1 && <div className="flex-1 h-px bg-border" />}
        </div>
      );
    })}
  </div>
);

const CvEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cv, setCv] = useState<any>(null);
  const [conseils, setConseils] = useState<Conseil[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [posteCible, setPosteCible] = useState("");
  const [improving, setImproving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("cvs").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("CV introuvable"); navigate("/dashboard"); return; }
      setCv(data);
      if (data.poste_cible) setPosteCible(data.poste_cible);
    })();
  }, [id, navigate]);

  const handleImprove = async () => {
    if (!posteCible.trim()) { toast.error("Indiquez un poste cible"); return; }
    setImproving(true);
    setModalOpen(false);
    try {
      const { data, error } = await supabase.functions.invoke("improve-cv", {
        body: { cv: cv.contenu_json, posteCible: posteCible.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const improved = data.cv_ameliore;
      const tips = data.conseils as Conseil[];
      const normalise = `${improved.resume || ""}\n\nExpériences:\n${(improved.experiences || []).map((e: any) => `• ${e.poste} chez ${e.entreprise} (${e.periode}) — ${e.description}`).join("\n")}`;

      const { error: updErr } = await supabase
        .from("cvs")
        .update({
          contenu_json: improved,
          contenu_normalise: normalise,
          poste_cible: posteCible.trim(),
          titre: improved.titre || cv.titre,
        })
        .eq("id", id!);
      if (updErr) throw updErr;

      setCv({ ...cv, contenu_json: improved, contenu_normalise: normalise, poste_cible: posteCible.trim(), titre: improved.titre || cv.titre });
      setConseils(tips);
      toast.success("CV amélioré avec succès");
    } catch (e: any) {
      toast.error(e.message || "Échec de l'amélioration");
    } finally {
      setImproving(false);
    }
  };

  if (!cv) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navbar />
        <main className="container py-12 max-w-5xl space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  const content = cv.contenu_json || {};

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />
      <main className="container py-8 md:py-12 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>

        <Stepper step={2} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{cv.titre}</h1>
            {cv.poste_cible && <p className="text-sm text-muted-foreground mt-1">Poste cible : <span className="font-medium text-foreground">{cv.poste_cible}</span></p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModalOpen(true)} disabled={improving} className="shadow-md hover:shadow-glow transition-all">
              {improving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Reformuler et améliorer
            </Button>
            <Button variant="outline" onClick={() => navigate(`/cv/${id}/export`)}>
              <Download className="h-4 w-4 mr-2" />Exporter
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${conseils ? "lg:grid-cols-[1fr,360px]" : ""}`}>
          {/* CV preview */}
          <Card className="border-0 shadow-elev-md">
            <CardHeader>
              <CardTitle>{content.nom_complet || "Sans nom"}</CardTitle>
              <p className="text-sm text-muted-foreground">{content.poste_actuel}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {improving && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/40 border border-primary/20">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm">L'IA améliore votre CV...</p>
                </div>
              )}
              {content.resume && <Section title="Résumé"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{content.resume}</p></Section>}
              {content.experiences?.length > 0 && (
                <Section title="Expériences">
                  <div className="space-y-4">
                    {content.experiences.map((e: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-4">
                        <p className="font-medium">{e.poste} <span className="text-muted-foreground font-normal">— {e.entreprise}</span></p>
                        <p className="text-xs text-muted-foreground">{e.periode}</p>
                        <p className="text-sm mt-1">{e.description}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {content.formations?.length > 0 && (
                <Section title="Formations">
                  <div className="space-y-2">
                    {content.formations.map((f: any, i: number) => (
                      <div key={i}>
                        <p className="font-medium text-sm">{f.diplome} <span className="text-muted-foreground font-normal">— {f.etablissement}</span></p>
                        <p className="text-xs text-muted-foreground">{f.periode}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {content.competences?.length > 0 && (
                <Section title="Compétences">
                  <div className="flex flex-wrap gap-2">
                    {content.competences.map((c: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs">{c}</span>
                    ))}
                  </div>
                </Section>
              )}
            </CardContent>
          </Card>

          {/* Advice panel */}
          {conseils && (
            <Card className="border-0 shadow-elev-md bg-gradient-card lg:sticky lg:top-24 self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Conseils IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {conseils.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-sm font-semibold">{i + 1}. {c.titre}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quel poste visez-vous ?</DialogTitle>
            <DialogDescription>L'IA reformulera votre CV et générera des conseils ciblés pour ce poste.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="poste">Poste cible</Label>
            <Input id="poste" placeholder="Ex : Développeur Full-Stack Senior" value={posteCible} onChange={(e) => setPosteCible(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && handleImprove()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleImprove} disabled={!posteCible.trim()}>
              <Sparkles className="h-4 w-4 mr-2" />Lancer l'IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="font-semibold mb-3 text-primary">{title}</h3>
    {children}
  </section>
);

export default CvEditor;
