#!/usr/bin/env python3
"""
Script de migration pour ajouter les colonnes manquantes à la base de données.
Ce script doit être exécuté avant daily_feed.py et autres scripts qui utilisent ces colonnes.
"""

import sqlite3
import sys
from pathlib import Path

def migrate_database(db_path: str = "veille.db"):
    """Ajoute les colonnes manquantes à la base de données."""
    
    db_file = Path(db_path)
    if not db_file.exists():
        print(f"❌ Base de données {db_path} non trouvée")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"🔧 Migration de la base de données {db_path}...")
        
        # Vérifier si les colonnes existent déjà
        cursor.execute("PRAGMA table_info(items)")
        columns = {col[1] for col in cursor.fetchall()}
        
        migrations_applied = 0
        
        # Ajouter tech_level si absent
        if "tech_level" not in columns:
            print("  + Ajout de la colonne tech_level")
            cursor.execute("ALTER TABLE items ADD COLUMN tech_level INTEGER DEFAULT 1")
            migrations_applied += 1
        
        # Ajouter final_score si absent
        if "final_score" not in columns:
            print("  + Ajout de la colonne final_score")
            cursor.execute("ALTER TABLE items ADD COLUMN final_score REAL DEFAULT 0.0")
            migrations_applied += 1
        
        # Ajouter marketing_score si absent
        if "marketing_score" not in columns:
            print("  + Ajout de la colonne marketing_score")
            cursor.execute("ALTER TABLE items ADD COLUMN marketing_score REAL DEFAULT 0.0")
            migrations_applied += 1
        
        # Ajouter is_excluded si absent
        if "is_excluded" not in columns:
            print("  + Ajout de la colonne is_excluded")
            cursor.execute("ALTER TABLE items ADD COLUMN is_excluded INTEGER DEFAULT 0")
            migrations_applied += 1
        
        conn.commit()
        conn.close()
        
        if migrations_applied == 0:
            print("✅ Base de données déjà à jour")
        else:
            print(f"✅ Migration terminée ({migrations_applied} modification(s) appliquée(s))")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Erreur lors de la migration: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)