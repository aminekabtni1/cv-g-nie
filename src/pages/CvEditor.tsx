import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CvEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cv, setCv] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("cvs").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("CV introuvable"); navigate("/dashboard"); return; }
      setCv(data);
    })();
  }, [id, navigate]);

  if (!cv) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navbar />
        <main className="container py-12 max-w-4xl space-y-4">
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
      <main className="container py-8 md:py-12 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{cv.titre}</h1>
            <p className="text-muted-foreground mt-1">Aperçu du contenu extrait</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Sparkles className="h-4 w-4 mr-2" />Reformuler (étape 2)
            </Button>
            <Button disabled>
              <Download className="h-4 w-4 mr-2" />Exporter (étape 2)
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-elev-md">
          <CardHeader>
            <CardTitle>{content.nom_complet || "Sans nom"}</CardTitle>
            <p className="text-sm text-muted-foreground">{content.poste_actuel}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {content.resume && (
              <section>
                <h3 className="font-semibold mb-2 text-primary">Résumé</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content.resume}</p>
              </section>
            )}
            {content.experiences?.length > 0 && (
              <section>
                <h3 className="font-semibold mb-3 text-primary">Expériences</h3>
                <div className="space-y-4">
                  {content.experiences.map((e: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-4">
                      <p className="font-medium">{e.poste} <span className="text-muted-foreground font-normal">— {e.entreprise}</span></p>
                      <p className="text-xs text-muted-foreground">{e.periode}</p>
                      <p className="text-sm mt-1">{e.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {content.formations?.length > 0 && (
              <section>
                <h3 className="font-semibold mb-3 text-primary">Formations</h3>
                <div className="space-y-2">
                  {content.formations.map((f: any, i: number) => (
                    <div key={i}>
                      <p className="font-medium text-sm">{f.diplome} <span className="text-muted-foreground font-normal">— {f.etablissement}</span></p>
                      <p className="text-xs text-muted-foreground">{f.periode}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {content.competences?.length > 0 && (
              <section>
                <h3 className="font-semibold mb-3 text-primary">Compétences</h3>
                <div className="flex flex-wrap gap-2">
                  {content.competences.map((c: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs">{c}</span>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          🚧 Reformulation IA, conseils personnalisés et export PDF arrivent dans l'étape 2.
        </p>
      </main>
    </div>
  );
};

export default CvEditor;
