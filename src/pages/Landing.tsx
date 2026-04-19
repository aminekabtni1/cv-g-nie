import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Download, Upload, ArrowRight, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-cv.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Nav */}
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="h-9 w-9 rounded-lg bg-gradient-hero flex items-center justify-center shadow-soft">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>CV Genius</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Se connecter</Link></Button>
          <Button asChild><Link to="/register">Créer un compte</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container pt-12 pb-20 md:pt-20 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border bg-accent/60 px-4 py-1.5 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Propulsé par l'IA
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Créez un CV professionnel en quelques <span className="text-primary">minutes</span> grâce à l'IA
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Importez votre CV, laissez notre IA l'améliorer, et exportez-le en PDF avec des templates élégants.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild size="lg" className="shadow-md hover:shadow-glow transition-all">
              <Link to="/register">Créer un compte <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Gratuit pour démarrer</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Aucune carte requise</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-3xl rounded-full" />
          <img src={heroImg} alt="Aperçu CV Genius" width={1024} height={1024} className="relative drop-shadow-2xl" />
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 border-t">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tout ce qu'il vous faut</h2>
          <p className="text-muted-foreground">Trois étapes simples pour un CV qui se démarque.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Upload, title: "Importer un CV", desc: "Glissez-déposez votre PDF ou DOCX. Notre IA extrait automatiquement vos informations." },
            { icon: Sparkles, title: "Amélioration IA", desc: "Reformulation professionnelle, conseils ciblés selon le poste visé." },
            { icon: Download, title: "Export PDF", desc: "Choisissez parmi 3 templates et téléchargez votre CV en un clic." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-card border shadow-soft hover:shadow-elev-md transition-smooth">
              <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 shadow-soft">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>© {new Date().getFullYear()} CV Genius</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Conditions</a>
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
