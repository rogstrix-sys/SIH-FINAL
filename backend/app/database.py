import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "desludging_scenarios.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        site_conditions TEXT NOT NULL,
        selected_equipment_id TEXT,
        results_snapshot TEXT,
        is_preset BOOLEAN DEFAULT 0
    )
    """)
    conn.commit()
    conn.close()

# Auto-initialize database schema on module load
init_db()


def save_scenario(
    scenario_id: str,
    name: str,
    description: str,
    site_conditions: Dict[str, Any],
    selected_equipment_id: Optional[str] = None,
    results_snapshot: Optional[Dict[str, Any]] = None,
    is_preset: bool = False
) -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM scenarios WHERE id = ?", (scenario_id,))
    exists = cursor.fetchone()
    
    if exists:
        cursor.execute("""
            UPDATE scenarios 
            SET name = ?, description = ?, updated_at = ?, site_conditions = ?, selected_equipment_id = ?, results_snapshot = ?
            WHERE id = ?
        """, (
            name,
            description,
            now,
            json.dumps(site_conditions),
            selected_equipment_id,
            json.dumps(results_snapshot) if results_snapshot else None,
            scenario_id
        ))
    else:
        cursor.execute("""
            INSERT INTO scenarios (id, name, description, created_at, updated_at, site_conditions, selected_equipment_id, results_snapshot, is_preset)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            scenario_id,
            name,
            description,
            now,
            now,
            json.dumps(site_conditions),
            selected_equipment_id,
            json.dumps(results_snapshot) if results_snapshot else None,
            1 if is_preset else 0
        ))
    conn.commit()
    conn.close()
    return get_scenario_by_id(scenario_id)

def get_all_scenarios() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scenarios ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    scenarios = []
    for r in rows:
        scenarios.append({
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "site_conditions": json.loads(r["site_conditions"]),
            "selected_equipment_id": r["selected_equipment_id"],
            "results_snapshot": json.loads(r["results_snapshot"]) if r["results_snapshot"] else None,
            "is_preset": bool(r["is_preset"])
        })
    return scenarios

def get_scenario_by_id(scenario_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scenarios WHERE id = ?", (scenario_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return {
        "id": r["id"],
        "name": r["name"],
        "description": r["description"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "site_conditions": json.loads(r["site_conditions"]),
        "selected_equipment_id": r["selected_equipment_id"],
        "results_snapshot": json.loads(r["results_snapshot"]) if r["results_snapshot"] else None,
        "is_preset": bool(r["is_preset"])
    }

def delete_scenario(scenario_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scenarios WHERE id = ?", (scenario_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
