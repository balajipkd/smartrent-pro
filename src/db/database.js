import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Adapter to match the previous IndexedDB API structure
// This allows us to switch backend without rewriting all components
const dbAdapter = {
  async getAll(table) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return data;
  },

  async get(table, id) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async add(table, data) {
    // Remove ID if present but null/undefined/0 to let Postgres generate it
    if (!data.id) delete data.id;

    // Handle receiptImage specific for expenses (Base64 string)
    // Supabase 'text' column can handle base64 strings fine.
    // In SQL schema we mapped camelCase fields to snake_case?
    // Wait, the user SQL script used snake_case: 'building_id', 'unit_number', 'rent_amount'
    // BUT our JS app uses camelCase: 'buildingId', 'unitNumber', 'rentAmount'.
    // We need to map keys! OR update the JS to use snake_case.
    // Mapping keys in this adapter is safer.

    const snakeCaseData = toSnakeCase(data);
    const { data: result, error } = await supabase.from(table).insert(snakeCaseData).select();

    if (error) {
      console.error('Supabase Add Error:', error);
      throw error;
    }
    return result[0] ? toCamelCase(result[0]) : null;
  },

  async put(table, data) {
    if (!data.id) throw new Error('Update requires an ID');
    const id = data.id;
    const snakeCaseData = toSnakeCase(data);
    // Don't update ID
    delete snakeCaseData.id;

    const { data: result, error } = await supabase.from(table).update(snakeCaseData).eq('id', id).select();
    if (error) throw error;
    return result[0] ? toCamelCase(result[0]) : null;
  },

  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

/**
 * Helpers to convert between CamelCase (JS) and SnakeCase (DB)
 */
function toSnakeCase(obj) {
  const newObj = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
}

function toCamelCase(obj) {
  const newObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
}

// Wrap adapter to support the existing code pattern: `const db = await getDB();`
// We also wrap the return values of getAll/get to convert snake_case DB results back to camelCase for the frontend
const dbWrapper = {
  getAll: async (table) => {
    const data = await dbAdapter.getAll(table);
    return data.map(toCamelCase);
  },
  get: async (table, id) => {
    const data = await dbAdapter.get(table, id);
    return data ? toCamelCase(data) : null;
  },
  add: dbAdapter.add,
  put: dbAdapter.put,
  delete: dbAdapter.delete
};

export const getDB = async () => {
  // Return the wrapper interface
  return dbWrapper;
};

// No-op for initDB as Supabase connectivity is stateless/HTTP
export const initDB = async () => {
  console.log('Supabase initialized');
};

// Seed function - optional, can be adapted if needed but user already manually created tables?
// We might want to seed initial data if empty.
export const seedDatabase = async () => {
  // Optional: Check buildings
  try {
    const { count } = await supabase.from('buildings').select('*', { count: 'exact', head: true });
    if (count === 0) {
      console.log('Seeding Supabase...');
      // Need to insert using snake_case keys or use our helper
      await dbAdapter.add('buildings', { name: 'Sunset Apartments', address: '123 Cloud Blvd' });
      // Advanced seeding skipped for now to avoid complexity with foreign keys
    }
  } catch (err) {
    console.warn('Seeding check failed', err);
  }
}
