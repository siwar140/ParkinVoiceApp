#!/usr/bin/env python
"""
Script de vérification avant déploiement
Usage: python check_deployment.py
"""

import os
import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def check_file(path, description):
    """Vérifier qu'un fichier existe"""
    if os.path.exists(path):
        print(f"   ✅ {description}: {path}")
        return True
    else:
        print(f"   ❌ {description}: {path} (MANQUANT)")
        return False

def check_backend():
    """Vérifier le backend"""
    print("\n" + "="*80)
    print("🔧 VÉRIFICATION DU BACKEND")
    print("="*80)
    
    checks = []
    
    # Fichiers principaux
    checks.append(check_file("backend/app/main.py", "Application principale"))
    checks.append(check_file("backend/app/config.py", "Configuration"))
    checks.append(check_file("backend/app/database.py", "Base de données"))
    checks.append(check_file("backend/app/auth.py", "Authentification"))
    checks.append(check_file("backend/app/schemas.py", "Schémas"))
    checks.append(check_file("backend/app/ml_inference.py", "Inférence ML"))
    
    # Modèles
    checks.append(check_file("backend/app/models/__init__.py", "Modèles"))
    checks.append(check_file("backend/app/models/admin.py", "Modèle Admin"))
    
    # Routes
    checks.append(check_file("backend/app/routes/__init__.py", "Routes"))
    checks.append(check_file("backend/app/routes/admin.py", "Routes Admin"))
    
    # Configuration
    checks.append(check_file("backend/requirements.txt", "Dépendances"))
    checks.append(check_file("backend/.env.example", "Variables d'environnement"))
    checks.append(check_file("backend/Dockerfile", "Dockerfile"))
    
    return all(checks)

def check_frontend():
    """Vérifier le frontend"""
    print("\n" + "="*80)
    print("🎨 VÉRIFICATION DU FRONTEND")
    print("="*80)
    
    checks = []
    
    # Fichiers principaux
    checks.append(check_file("frontend/package.json", "Package.json"))
    checks.append(check_file("frontend/vite.config.js", "Configuration Vite"))
    checks.append(check_file("frontend/index.html", "Page HTML"))
    checks.append(check_file("frontend/src/main.jsx", "Point d'entrée"))
    checks.append(check_file("frontend/src/App.jsx", "Application"))
    checks.append(check_file("frontend/src/services/api.js", "Service API"))
    checks.append(check_file("frontend/.env.example", "Variables d'environnement"))
    checks.append(check_file("frontend/vercel.json", "Configuration Vercel"))
    
    return all(checks)

def check_deployment_files():
    """Vérifier les fichiers de déploiement"""
    print("\n" + "="*80)
    print("🚀 VÉRIFICATION DES FICHIERS DE DÉPLOIEMENT")
    print("="*80)
    
    checks = []
    
    checks.append(check_file("render.yaml", "Configuration Render"))
    checks.append(check_file(".gitignore", "Gitignore"))
    checks.append(check_file("README.md", "Documentation"))
    
    return all(checks)

def check_env():
    """Vérifier les variables d'environnement"""
    print("\n" + "="*80)
    print("🔐 VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT")
    print("="*80)
    
    # Vérifier .env backend
    if os.path.exists("backend/.env"):
        print("   ✅ backend/.env existe")
        with open("backend/.env", "r") as f:
            content = f.read()
            if "DATABASE_URL" in content:
                print("   ✅ DATABASE_URL défini")
            if "SECRET_KEY" in content:
                print("   ✅ SECRET_KEY défini")
            if "RESEND_API_KEY" in content:
                print("   ✅ RESEND_API_KEY défini")
    else:
        print("   ⚠️  backend/.env manquant (copiez .env.example)")
    
    # Vérifier .env frontend
    if os.path.exists("frontend/.env"):
        print("   ✅ frontend/.env existe")
    else:
        print("   ⚠️  frontend/.env manquant (copiez .env.example)")

def main():
    """Fonction principale"""
    print("="*80)
    print("🔍 VÉRIFICATION DE PRÉPARATION AU DÉPLOIEMENT")
    print("="*80)
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    deploy_ok = check_deployment_files()
    
    check_env()
    
    # Résumé
    print("\n" + "="*80)
    print("📋 RÉSUMÉ")
    print("="*80)
    
    print(f"   Backend: {'✅ OK' if backend_ok else '❌ Problèmes'}")
    print(f"   Frontend: {'✅ OK' if frontend_ok else '❌ Problèmes'}")
    print(f"   Déploiement: {'✅ OK' if deploy_ok else '❌ Problèmes'}")
    
    if backend_ok and frontend_ok and deploy_ok:
        print("\n   🎉 TOUT EST PRÊT POUR LE DÉPLOIEMENT !")
    else:
        print("\n   ⚠️  CORRIGEZ LES PROBLÈMES AVANT DE DÉPLOYER")
    
    print("="*80)

if __name__ == "__main__":
    main()