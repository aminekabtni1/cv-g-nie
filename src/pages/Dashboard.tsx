import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Pencil, Download, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Cv = { id: string; titre: string; created_at: string };

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<Cv[] | null>(null);
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: cvData, error }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("cvs").select("id, titre, created_at").order("created_at", { ascending: false }),
      ]);
      if (profile?.full_name) setFullName(profile.full_name.split(" ")[0]);
      if (error) toast.error("Erreur de chargement");
      setCvs((cvData as Cv[]) ?? []);
    })();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce CV ?")) return;
    const { error } = await supabase.from("cvs").delete().eq("id", id);
    if (error) { toast.error("Suppression échouée"); return; }
    setCvs((prev) => prev?.filter((c) => c.id !== id) ?? null);
    toast.success("CV supprimé");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />
      <main className="container py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Bonjour, {fullName || "vous"} 👋</h1>
            <p className="text-muted-foreground mt-1">Gérez vos CV et créez-en de nouveaux avec l'IA.</p>
          </div>
          <Button asChild size="lg" className="shadow-md hover:shadow-glow transition-all">
            <Link to="/upload"><Plus className="h-4 w-4 mr-2" />Importer un CV</Link>
          </Button>
        </div>

        {cvs === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : cvs.length === 0 ? (
          <Card className="border-dashed border-2 bg-card/50">
            <CardContent className="py-16 text-center space-y-4">
              <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Aucun CV pour le moment</h3>
                <p className="text-muted-foreground mt-1">Importez votre premier CV pour commencer.</p>
              </div>
              <Button asChild size="lg">
                <Link to="/upload"><Plus className="h-4 w-4 mr-2" />Importer un CV</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvs.map((cv) => (
              <Card key={cv.id} className="group hover:shadow-elev-md transition-smooth bg-gradient-card border">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{cv.titre}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Créé {formatDistanceToNow(new Date(cv.created_at), { locale: fr, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/cv/${cv.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />Éditer
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/cv/${cv.id}/export`)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />Exporter
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cv.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
