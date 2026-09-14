# ??? ParkinVoice

Application médicale d'aide au diagnostic de la **maladie de Parkinson** à partir de l'analyse de la voix.

---

## ?? Description

ParkinVoice est une application web qui permet aux médecins de :
- Gérer leurs patients
- Enregistrer ou uploader des échantillons vocaux
- Obtenir un diagnostic automatique (HC / PD)
- Consulter l'historique et les statistiques

---

## ??? Architecture

\\\
ParkinVoiceApp/
+-- backend/                 # API FastAPI
¦   +-- app/
¦   ¦   +-- main.py         # Point d'entrée
¦   ¦   +-- config.py       # Configuration
¦   ¦   +-- database.py     # Base de données
¦   ¦   +-- auth.py         # Authentification
¦   ¦   +-- schemas.py      # Schémas Pydantic
¦   ¦   +-- ml_inference.py # Inférence ML
¦   ¦   +-- models/         # Modèles SQLAlchemy
¦   ¦   +-- routes/         # Routes API
¦   ¦   +-- services/       # Services (email, etc.)
¦   +-- models_ia/          # Modèles ML
¦   +-- requirements.txt
¦   +-- Dockerfile
+-- frontend/               # Interface React
¦   +-- src/
¦   ¦   +-- components/     # Composants React
¦   ¦   +-- pages/          # Pages
¦   ¦   +-- services/       # API
¦   ¦   +-- utils/          # Utilitaires
¦   +-- package.json
¦   +-- vercel.json
+-- render.yaml             # Configuration Render
+-- README.md
\\\

---

## ?? Technologies

### Backend
- **FastAPI** - Framework web
- **SQLAlchemy** - ORM
- **PostgreSQL** - Base de données
- **TensorFlow** - Modèle ML
- **Librosa** - Traitement audio
- **JWT** - Authentification

### Frontend
- **React 18** - Interface
- **Vite** - Build tool
- **TailwindCSS** - Styles
- **Axios** - Requêtes HTTP
- **React Router** - Navigation

### Déploiement
- **Render** - Backend + Base de données
- **Vercel** - Frontend

---

## ?? Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend

\\\ash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Éditer .env avec vos valeurs
python -m uvicorn app.main:app --reload
\\\

### Frontend

\\\ash
cd frontend
npm install
cp .env.example .env
# Éditer .env avec vos valeurs
npm run dev
\\\

---

## ?? Variables d'environnement

### Backend (.env)
\\\env
DATABASE_URL=postgresql://user:password@localhost:5432/ParkinVoice_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173
RESEND_API_KEY=re_your_api_key
UPLOAD_DIR=./uploads
MODEL_PATH=./models_ia/model.h5
\\\

### Frontend (.env)
\\\env
VITE_API_URL=http://localhost:8000/api
\\\

---

## ?? Déploiement

### Render (Backend + DB)

1. Pousser le code sur GitHub
2. Sur Render : **New ? Blueprint**
3. Sélectionner le dépôt
4. Render détecte \
ender.yaml\
5. Cliquer sur **Apply**

### Vercel (Frontend)

\\\ash
cd frontend
npm install -g vercel
vercel --prod
\\\

---

## ?? API Endpoints

### Authentification
- \POST /api/auth/register\ - Inscription
- \POST /api/auth/login\ - Connexion
- \POST /api/auth/reset-password\ - Réinitialisation

### Admin
- \POST /api/admin/login\ - Connexion admin
- \GET /api/admin/dashboard\ - Statistiques
- \GET /api/admin/doctors\ - Liste médecins
- \GET /api/admin/predictions\ - Toutes les prédictions

### Patients
- \GET /api/patients\ - Liste
- \POST /api/patients\ - Créer
- \GET /api/patients/{id}\ - Détail
- \PUT /api/patients/{id}\ - Modifier
- \DELETE /api/patients/{id}\ - Supprimer

### Prédiction
- \POST /api/prediction/analyze\ - Analyser audio
- \GET /api/prediction/history\ - Historique

---

## ?? Tests

\\\ash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
\\\

---

## ?? Performance

- **Précision du modèle** : 73.28%
- **Stratégie** : Voting (segments de 1s avec chevauchement)
- **Seuil** : 0.27

---

## ?? Sécurité

- ? HTTPS activé (Render)
- ? JWT pour l'authentification
- ? Mots de passe hashés (bcrypt)
- ? CORS configuré
- ? Variables d'environnement sécurisées
- ? Validation des entrées (Pydantic)

---

## ?? Auteurs

- **Siwar** - Développement

---

## ?? Licence

Ce projet est sous licence MIT.

---

## ?? Remerciements

- Équipe Render
- Communauté FastAPI
- Communauté React

---

**Fait avec ?? pour la recherche médicale**

base de données :
Étape	Commande
1. Vérifier les modèles: Get-Content app\models\user.py
2. Supprimer les tables: psql -U postgres -d parkinvoice_db -c "DROP TABLE ..."
3. Recréer	python: init_postgres.py
4. Vérifier:	psql -U postgres -d parkinvoice_db -c "\d users"
