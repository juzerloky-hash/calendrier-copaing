# Calendrier des copains (Next.js + Supabase + Vercel)

Chacun indique ses jours **dispo**, **peut-être** ou **pas dispo**. Le calendrier colore les jours selon le nombre de personnes libres et liste les meilleurs jours. Les mises à jour apparaissent en direct chez tout le monde.

## 1. Créer la table dans Supabase

1. Ouvre ton projet Supabase → **SQL Editor → New query**.
2. Colle le contenu de `supabase/schema.sql` et clique sur **Run**.

Cela crée la table `dispos`, active la sécurité (RLS) et le temps réel.

## 2. Lancer en local

```bash
npm install
npm run dev
```

Le fichier `.env.local` contient déjà l'URL et la clé publique de ton projet Supabase. Ouvre http://localhost:3000.

## 3. Envoyer sur GitHub

```bash
git init
git add .
git commit -m "Calendrier partagé"
git branch -M main
git remote add origin git@github.com:juzerloky-hash/calendrier-copaing.git
git push -u origin main
```

`.env.local` est ignoré par git (voir `.gitignore`), il ne part donc pas sur GitHub.

## 4. Déployer sur Vercel

1. https://vercel.com → **Add New → Project** → importe le dépôt `calendrier-copaing`.
2. Dans **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. **Deploy**. Chaque `git push` redéploie automatiquement.

## Utilisation

- Clique sur un jour, choisis ton statut, enregistre.
- **Choisir plusieurs jours** remplit une série de jours d'un coup.
- Le lien `?g=nom` définit le groupe : chaque nom est un calendrier distinct. Utilise **Copier le lien à partager**.

## Sécurité

Il n'y a pas de comptes : chaque appareil reçoit un identifiant aléatoire. Les règles Supabase laissent toute personne ayant le lien lire et modifier les dispos. C'est suffisant entre amis ; choisis un nom de groupe peu devinable (ex. `copains-7xk2`). La clé `sb_publishable_…` est faite pour être publique, mais ne mets jamais la clé `secret` dans ce projet.

## Structure

- `app/` : page, mise en page, styles
- `components/Calendar.jsx` : calendrier, temps réel, actions
- `components/DayModal.jsx`, `NameModal.jsx`, `Modal.jsx` : fenêtres
- `lib/` : client Supabase et utilitaires
- `supabase/schema.sql` : table et règles d'accès
