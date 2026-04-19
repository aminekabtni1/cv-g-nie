// improve-cv: reformulate CV content + generate tailored advice for a target position
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cv, posteCible } = await req.json();
    if (!cv || !posteCible) {
      return new Response(JSON.stringify({ error: "cv et posteCible requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquante");

    const systemPrompt = `Tu es un coach carrière francophone expert. Améliore un CV pour le rendre plus impactant pour un poste donné.
Garde la même structure JSON. Reformule chaque description d'expérience avec des verbes d'action et des résultats concrets.
Génère ensuite 5 à 7 conseils actionnables pour optimiser ce CV pour le poste cible.`;

    const tools = [{
      type: "function",
      function: {
        name: "improve_cv",
        description: "Renvoie le CV amélioré et une liste de conseils.",
        parameters: {
          type: "object",
          properties: {
            cv_ameliore: {
              type: "object",
              properties: {
                titre: { type: "string" },
                nom_complet: { type: "string" },
                email: { type: "string" },
                telephone: { type: "string" },
                adresse: { type: "string" },
                poste_actuel: { type: "string" },
                resume: { type: "string" },
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
            conseils: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titre: { type: "string" },
                  description: { type: "string" },
                },
                required: ["titre", "description"],
                additionalProperties: false,
              },
            },
          },
          required: ["cv_ameliore", "conseils"],
          additionalProperties: false,
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Poste cible : ${posteCible}\n\nCV actuel :\n${JSON.stringify(cv, null, 2)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "improve_cv" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erreur de l'IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Aucune amélioration renvoyée");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("improve-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
