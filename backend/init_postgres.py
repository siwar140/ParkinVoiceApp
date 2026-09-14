#!/usr/bin/env python
"""
Initialisation de la base PostgreSQL
Usage: python init_postgres.py
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from app.config import settings

def test_connection():
    '''Tester la connexion à PostgreSQL'''
    print('='*80)
    print('🔌 TEST DE CONNEXION POSTGRESQL')
    print('='*80)
    
    database_url = settings.DATABASE_URL
    print(f'📁 URL: {database_url.split("@")[-1]}')
    
    try:
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(text('SELECT version()'))
            version = result.fetchone()[0]
            print(f'✅ Connexion réussie!')
            print(f'📊 {version[:80]}...')
        return True
    except Exception as e:
        print(f'❌ Erreur: {e}')
        return False

def init_database():
    '''Initialiser la base de données'''
    print('\n' + '='*80)
    print('🗄️ INITIALISATION DE LA BASE')
    print('='*80)
    
    try:
        from app.database import engine, Base
        from app.models import Doctor, Patient, Prediction, VerificationCode, Admin
        
        print('\n📊 Création des tables...')
        Base.metadata.create_all(bind=engine)
        print('✅ Tables créées avec succès!')
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f'\n📋 Tables créées: {len(tables)}')
        for table in tables:
            print(f'   ✅ {table}')
        
        return True
    except Exception as e:
        print(f'❌ Erreur: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print('='*80)
    print('🐘 INITIALISATION POSTGRESQL - PARKINVOICE')
    print('='*80)
    
    if not test_connection():
        sys.exit(1)
    
    if not init_database():
        sys.exit(1)
    
    print('\n' + '='*80)
    print('✅ INITIALISATION TERMINÉE')
    print('='*80)
