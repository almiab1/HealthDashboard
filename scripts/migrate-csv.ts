import { db } from '../src/db/client';
import { bodyMetrics } from '../src/db/schema';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'date-fns';
import 'dotenv/config';

// Mapping based on dataProcessor.ts and CSV headers
const CSV_MAPPING = {
  'Date': 'recordedAt',
  'Weight (kg)': 'weight',
  'BMI': 'bmi',
  'Fat Mass (kg)': 'fatMassKg',
  'Fat Mass (%)': 'fatMassPercent',
  'Fat Free Mass (kg)': 'freeMassKg',
  'Muscle Mass (kg)': 'muscleMassKg',
  'Total Body Water (kg)': 'waterKg',
  'Total Body Water (%)': 'waterPercent',
  'Basal Metabolic Rate (kcal)': 'bmr',
  'Metabolic Age': 'metabolicAge',
  'Visceral Fat Rating': 'visceralFat',
  'Bone Mineral Mass (kg)': 'boneMassKg',
  'Phase Angle': 'phaseAngle',
  'Resistance (R)': 'resistance',
  'Reactance (Xc)': 'reactance'
};

async function migrate() {
  console.log('Starting migration...');
  
  const csvPath = path.join(process.cwd(), 'src', 'data', 'registros.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at:', csvPath);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].trim().split(',');

  const recordsToInsert = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    const entry: any = {};

    headers.forEach((header, index) => {
      const trimmedHeader = header.trim();
      // @ts-ignore
      const dbKey = CSV_MAPPING[trimmedHeader];
      
      if (dbKey) {
        const value = values[index]?.trim();
        
        if (dbKey === 'recordedAt') {
           // Parse DD/MM/YYYY to Date object
           const [day, month, year] = value.split('/').map(Number);
           entry[dbKey] = new Date(year, month - 1, day);
        } else {
           const numValue = parseFloat(value);
           entry[dbKey] = isNaN(numValue) ? null : numValue;
        }
      }
    });
    
    // Basic validation
    if (!entry.recordedAt || !entry.weight) {
        console.warn(`Skipping invalid row ${i}:`, line);
        continue;
    }

    recordsToInsert.push(entry);
  }

  if (recordsToInsert.length > 0) {
      try {
        await db.insert(bodyMetrics).values(recordsToInsert);
        console.log(`Successfully migrated ${recordsToInsert.length} records.`);
      } catch (error) {
          console.error('Error inserting records:', error);
      }
  } else {
      console.log('No records found to migrate.');
  }

  process.exit(0);
}

migrate();
