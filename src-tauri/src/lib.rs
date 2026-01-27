use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use tauri::State;

// Estructura para los registros de métricas corporales
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BodyMetric {
    pub id: Option<i64>,
    pub recorded_at: String,
    pub weight: f64,
    pub bmi: Option<f64>,
    pub fat_mass_kg: Option<f64>,
    pub fat_mass_percent: Option<f64>,
    pub muscle_mass_kg: Option<f64>,
    pub free_mass_kg: Option<f64>,
    pub water_kg: Option<f64>,
    pub water_percent: Option<f64>,
    pub bone_mass_kg: Option<f64>,
    pub visceral_fat: Option<f64>,
    pub bmr: Option<f64>,
    pub metabolic_age: Option<i32>,
    pub phase_angle: Option<f64>,
    pub resistance: Option<f64>,
    pub reactance: Option<f64>,
}

// Estado de la conexión a la base de datos
pub struct DbConnection(pub Mutex<Connection>);

// Inicializar la base de datos
fn init_database() -> Result<Connection, String> {
    // Obtener directorio de datos del usuario
    let data_dir = dirs::data_dir()
        .ok_or("No se pudo obtener el directorio de datos")?
        .join("healthdashboard");
    
    // Crear directorio si no existe
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Error creando directorio: {}", e))?;
    
    let db_path = data_dir.join("data.db");
    log::info!("Base de datos en: {:?}", db_path);
    
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Error abriendo base de datos: {}", e))?;
    
    // Crear tabla si no existe
    conn.execute(
        "CREATE TABLE IF NOT EXISTS body_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recorded_at TEXT NOT NULL,
            weight REAL NOT NULL,
            bmi REAL,
            fat_mass_kg REAL,
            fat_mass_percent REAL,
            muscle_mass_kg REAL,
            free_mass_kg REAL,
            water_kg REAL,
            water_percent REAL,
            bone_mass_kg REAL,
            visceral_fat REAL,
            bmr REAL,
            metabolic_age INTEGER,
            phase_angle REAL,
            resistance REAL,
            reactance REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).map_err(|e| format!("Error creando tabla: {}", e))?;
    
    Ok(conn)
}

// Comando: Obtener todos los registros
#[tauri::command]
fn get_all_records(db: State<DbConnection>) -> Result<Vec<BodyMetric>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, recorded_at, weight, bmi, fat_mass_kg, fat_mass_percent,
                muscle_mass_kg, free_mass_kg, water_kg, water_percent,
                bone_mass_kg, visceral_fat, bmr, metabolic_age,
                phase_angle, resistance, reactance
         FROM body_metrics
         ORDER BY recorded_at ASC"
    ).map_err(|e| e.to_string())?;
    
    let records = stmt.query_map([], |row| {
        Ok(BodyMetric {
            id: Some(row.get(0)?),
            recorded_at: row.get(1)?,
            weight: row.get(2)?,
            bmi: row.get(3)?,
            fat_mass_kg: row.get(4)?,
            fat_mass_percent: row.get(5)?,
            muscle_mass_kg: row.get(6)?,
            free_mass_kg: row.get(7)?,
            water_kg: row.get(8)?,
            water_percent: row.get(9)?,
            bone_mass_kg: row.get(10)?,
            visceral_fat: row.get(11)?,
            bmr: row.get(12)?,
            metabolic_age: row.get(13)?,
            phase_angle: row.get(14)?,
            resistance: row.get(15)?,
            reactance: row.get(16)?,
        })
    }).map_err(|e| e.to_string())?;
    
    records.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// Comando: Crear un nuevo registro
#[tauri::command]
fn create_record(db: State<DbConnection>, data: BodyMetric) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO body_metrics (
            recorded_at, weight, bmi, fat_mass_kg, fat_mass_percent,
            muscle_mass_kg, free_mass_kg, water_kg, water_percent,
            bone_mass_kg, visceral_fat, bmr, metabolic_age,
            phase_angle, resistance, reactance
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![
            data.recorded_at,
            data.weight,
            data.bmi,
            data.fat_mass_kg,
            data.fat_mass_percent,
            data.muscle_mass_kg,
            data.free_mass_kg,
            data.water_kg,
            data.water_percent,
            data.bone_mass_kg,
            data.visceral_fat,
            data.bmr,
            data.metabolic_age,
            data.phase_angle,
            data.resistance,
            data.reactance,
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

// Comando: Actualizar un registro
#[tauri::command]
fn update_record(db: State<DbConnection>, id: i64, data: BodyMetric) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE body_metrics SET
            recorded_at = ?1, weight = ?2, bmi = ?3, fat_mass_kg = ?4,
            fat_mass_percent = ?5, muscle_mass_kg = ?6, free_mass_kg = ?7,
            water_kg = ?8, water_percent = ?9, bone_mass_kg = ?10,
            visceral_fat = ?11, bmr = ?12, metabolic_age = ?13,
            phase_angle = ?14, resistance = ?15, reactance = ?16
         WHERE id = ?17",
        params![
            data.recorded_at,
            data.weight,
            data.bmi,
            data.fat_mass_kg,
            data.fat_mass_percent,
            data.muscle_mass_kg,
            data.free_mass_kg,
            data.water_kg,
            data.water_percent,
            data.bone_mass_kg,
            data.visceral_fat,
            data.bmr,
            data.metabolic_age,
            data.phase_angle,
            data.resistance,
            data.reactance,
            id,
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

// Comando: Eliminar un registro
#[tauri::command]
fn delete_record(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM body_metrics WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

// Comando: Guardar archivo CSV en la ruta especificada
#[tauri::command]
fn save_csv_file(content: String, filename: String) -> Result<String, String> {
    // filename es la ruta completa del archivo (seleccionada por el usuario en el diálogo)
    fs::write(&filename, content)
        .map_err(|e| format!("Error guardando archivo: {}", e))?;
    
    Ok(filename)
}

// Comando: Obtener un registro por ID
#[tauri::command]
fn get_record_by_id(db: State<DbConnection>, id: i64) -> Result<Option<BodyMetric>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, recorded_at, weight, bmi, fat_mass_kg, fat_mass_percent,
                muscle_mass_kg, free_mass_kg, water_kg, water_percent,
                bone_mass_kg, visceral_fat, bmr, metabolic_age,
                phase_angle, resistance, reactance
         FROM body_metrics WHERE id = ?1"
    ).map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;
    
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(BodyMetric {
            id: Some(row.get(0).map_err(|e| e.to_string())?),
            recorded_at: row.get(1).map_err(|e| e.to_string())?,
            weight: row.get(2).map_err(|e| e.to_string())?,
            bmi: row.get(3).map_err(|e| e.to_string())?,
            fat_mass_kg: row.get(4).map_err(|e| e.to_string())?,
            fat_mass_percent: row.get(5).map_err(|e| e.to_string())?,
            muscle_mass_kg: row.get(6).map_err(|e| e.to_string())?,
            free_mass_kg: row.get(7).map_err(|e| e.to_string())?,
            water_kg: row.get(8).map_err(|e| e.to_string())?,
            water_percent: row.get(9).map_err(|e| e.to_string())?,
            bone_mass_kg: row.get(10).map_err(|e| e.to_string())?,
            visceral_fat: row.get(11).map_err(|e| e.to_string())?,
            bmr: row.get(12).map_err(|e| e.to_string())?,
            metabolic_age: row.get(13).map_err(|e| e.to_string())?,
            phase_angle: row.get(14).map_err(|e| e.to_string())?,
            resistance: row.get(15).map_err(|e| e.to_string())?,
            reactance: row.get(16).map_err(|e| e.to_string())?,
        }))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inicializar la base de datos
    let db_connection = init_database()
        .expect("Error inicializando la base de datos");
    
    tauri::Builder::default()
        .manage(DbConnection(Mutex::new(db_connection)))
        .invoke_handler(tauri::generate_handler![
            get_all_records,
            create_record,
            update_record,
            delete_record,
            get_record_by_id,
            save_csv_file
        ])
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
