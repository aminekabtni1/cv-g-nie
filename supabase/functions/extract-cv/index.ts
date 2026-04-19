// Edge function: extract structured CV data using Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rawText } = await req.json();
    if (!rawText || typeof rawText !== "string") {
      return new Response(JSON.stringify({ error: "rawText requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquante");

    const systemPrompt = `Tu es un expert RH francophone. À partir du texte brut d'un CV, extrais et structure les informations en JSON propre.
Reformule le contenu dans un français professionnel, clair et concis. Conserve les faits, améliore la formulation.`;

    const tools = [{
      type: "function",
      function: {
        name: "extract_cv",
        description: "Extrait et normalise les données structurées d'un CV.",
        parameters: {
          type: "object",
          properties: {
            titre: { type: "string", description: "Titre court pour ce CV (ex: 'CV Marie Dupont - Dev')" },
            nom_complet: { type: "string" },
            email: { type: "string" },
            telephone: { type: "string" },
            adresse: { type: "string" },
            poste_actuel: { type: "string" },
            resume: { type: "string", description: "Résumé professionnel en 2-3 phrases" },
            experiences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  poste: { type: "string" },
                  entreprise: { type: "string" },
                  periode: { type: "string" },
                  description: { type: "string" },
                },
                required: ["poste", "entreprise", "periode", "description"],
                additionalProperties: false,
              },
            },
            formations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diplome: { type: "string" },
                  etablissement: { type: "string" },
                  periode: { type: "string" },
                },
                required: ["diplome", "etablissement", "periode"],
                additionalProperties: false,
              },
            },
            competences: { type: "array", items: { type: "string" } },
            langues: { type: "array", items: { type: "string" } },
          },
          required: ["titre", "nom_complet", "resume", "experiences", "formations", "competences", "langues"],
          additionalProperties: false,
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici le texte brut du CV :\n\n${rawText.slice(0, 15000)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "extract_cv" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez des crédits dans votre workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erreur de l'IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Aucune extraction renvoyée par l'IA");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ cv: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
