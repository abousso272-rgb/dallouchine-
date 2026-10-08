# Directives pour Claude Code (Projet Dallouchine)

## Intégration Supabase & Base de Données

- **Supabase Project Ref / ID** : `splsjtguapquznbiacad`
- **Région** : `eu-central-1`
- **Serveur MCP Supabase** : Connecté et autorisé (`mcp__supabase__*`)

### Règles d'Exécution SQL et Actions Supabase (Autonomie Maximale) :
1. **Application Directe des Migrations & SQL** :
   - Lorsque tu génères ou modifies des tables, fonctions, déclencheurs (triggers), politiques RLS ou indexes SQL, **APPLIQUE-LES DIRECTEMENT** en appelant l'outil MCP `mcp__supabase__execute_sql` ou `mcp__supabase__apply_migration` avec le `project_id: "splsjtguapquznbiacad"`.
   - **Ne demande pas** à l'utilisateur de copier/coller ou d'exécuter le SQL manuellement dans la console Supabase Studio.
   - Enregistre systématiquement une copie des fichiers SQL de migration dans le dossier `supabase/migrations/` avec un horodatage (ex: `supabase/migrations/<YYYYMMDDHHMMSS>_<nom>.sql`).

2. **Inspection & Vérification** :
   - Avant toute modification de schéma, inspecte les tables existantes avec `mcp__supabase__list_tables(project_id: "splsjtguapquznbiacad")` pour éviter les conflits et comprendre la structure en place.
   - Si une erreur survient, consulte les logs ou les avis de sécurité avec `mcp__supabase__get_advisors(project_id: "splsjtguapquznbiacad")`.

3. **Permissions & Outils MCP** :
   - Tous les outils `mcp__supabase__*` (`execute_sql`, `apply_migration`, `list_tables`, `list_migrations`, etc.) sont pré-approuvés sans confirmation requise.

## Stack Technique
- Frontend : React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide React
- Backend : Node.js / Express (`server/app.ts`, `server.ts`)
- Database & Auth : Supabase (`@supabase/supabase-js`)
- Port de développement : 3000
