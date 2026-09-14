#!/usr/bin/env python
"""
Créer un compte Administrateur
Usage:
  Interactive: ..\.venv\Scripts\python.exe create_admin.py
  Direct:      ..\.venv\Scripts\python.exe create_admin.py admin@exemple.fr MonMotDePasse "Nom Admin"
"""

import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models import Admin
from app.auth import get_password_hash

def create_admin():
    '''Créer un admin'''
    
    print('='*80)
    print('👑 CRÉATION DU COMPTE ADMINISTRATEUR')
    print('='*80)
    
    init_db()
    db = SessionLocal()
    
    try:
        # Vérifier si des arguments sont passés en ligne de commande
        if len(sys.argv) >= 4:
            email = sys.argv[1].strip()
            password = sys.argv[2].strip()
            full_name = sys.argv[3].strip()
            phone = sys.argv[4].strip() if len(sys.argv) > 4 else None
        else:
            existing = db.query(Admin).first()
            if existing:
                print(f'\n⚠️  Un admin existe déjà: {existing.email}')
                choice = input('Créer un autre administrateur ? (o/n): ').strip().lower()
                if choice not in ['o', 'oui', 'y', 'yes']:
                    return
            
            print('\n📝 Informations de l\'Admin:')
            email = input('Email: ').strip()
            password = input('Mot de passe: ').strip()
            full_name = input('Nom complet: ').strip()
            phone = input('Téléphone (optionnel): ').strip()
        
        if not email or not password or not full_name:
            print('❌ Email, mot de passe et nom complet sont obligatoires.')
            return

        existing_email = db.query(Admin).filter(Admin.email == email).first()
        if existing_email:
            print(f'❌ L\'email {email} est déjà utilisé par un admin.')
            return
        
        admin = Admin(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone if phone else None,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print('\n' + '='*80)
        print('✅ COMPTE ADMIN CRÉÉ AVEC SUCCÈS')
        print('='*80)
        print(f'📧 Email: {admin.email}')
        print(f'👤 Nom: {admin.full_name}')
        print(f'🆔 ID: {admin.id}')
        print('='*80)
        
    except Exception as e:
        print(f'\n❌ Erreur: {e}')
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    create_admin()
