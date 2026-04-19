// cv-report: generate strengths/weaknesses/match-score for export step
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cv, posteCible } = await req.json();
    if (!cv) return new Response(JSON.stringify({ error: "cv requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquante");

    const tools = [{
      type: "function",
      function: {
        name: "build_report",
        description: "Évalue le CV pour le poste visé.",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number", description: "Score d'adéquation 0-100" },
            forces: { type: "array", items: { type: "string" } },
            faiblesses: { type: "array", items: { type: "string" } },
            recommandations: { type: "array", items: { type: "string" } },
          },
          required: ["score", "forces", "faiblesses", "recommandations"],
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
          { role: "system", content: "Tu es un recruteur senior francophone. Analyse un CV pour un poste et fournis un rapport synthétique." },
          { role: "user", content: `Poste cible : ${posteCible || "non précisé"}\n\nCV :\n${JSON.stringify(cv, null, 2)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "build_report" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erreur de l'IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Aucun rapport généré");
    return new Response(toolCall.function.arguments, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("cv-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
