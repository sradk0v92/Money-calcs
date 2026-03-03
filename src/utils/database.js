/**
 * Supabase data utility
 * Handles all database queries for calculations, scenarios, and calculator types
 */

import { supabase } from './auth.js';

/**
 * Fetch all active calculator types
 * @returns {Promise<{calculators, error}>}
 */
export async function fetchCalculatorTypes() {
  try {
    const { data, error } = await supabase
      .from('calculator_types')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      return { calculators: [], error: error.message };
    }

    return { calculators: data || [], error: null };
  } catch (error) {
    return { calculators: [], error: error.message };
  }
}

/**
 * Fetch a single calculator type using preferred slug order
 * @param {string[]} slugs - Preferred slugs in priority order
 * @returns {Promise<{calculatorType, error}>}
 */
export async function fetchCalculatorTypeBySlugs(slugs = []) {
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return { calculatorType: null, error: 'No slugs provided' };
  }

  try {
    const { data, error } = await supabase
      .from('calculator_types')
      .select('id, slug, name, is_active')
      .in('slug', slugs)
      .eq('is_active', true);

    if (error) {
      return { calculatorType: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { calculatorType: null, error: null };
    }

    const sorted = [...data].sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
    return { calculatorType: sorted[0], error: null };
  } catch (error) {
    return { calculatorType: null, error: error.message };
  }
}

/**
 * Fetch user's recent calculations
 * @param {string} userId - User ID
 * @param {number} limit - Number of results to fetch (default 5)
 * @returns {Promise<{calculations, error}>}
 */
export async function fetchUserCalculations(userId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('calculations')
      .select(`
        id,
        calculator_type_id,
        inputs,
        results,
        created_at,
        calculator_types(name, slug)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { calculations: [], error: error.message };
    }

    return { calculations: data || [], error: null };
  } catch (error) {
    return { calculations: [], error: error.message };
  }
}

/**
 * Fetch a single calculation by ID
 * @param {string} calculationId - Calculation ID
 * @returns {Promise<{calculation, error}>}
 */
export async function fetchCalculation(calculationId) {
  try {
    const { data, error } = await supabase
      .from('calculations')
      .select(`
        id,
        calculator_type_id,
        inputs,
        results,
        created_at,
        calculator_types(name, slug)
      `)
      .eq('id', calculationId)
      .single();

    if (error) {
      return { calculation: null, error: error.message };
    }

    return { calculation: data, error: null };
  } catch (error) {
    return { calculation: null, error: error.message };
  }
}

/**
 * Save a new calculation
 * @param {string} userId - User ID
 * @param {string} calculatorTypeId - Calculator type ID
 * @param {object} inputs - Input parameters
 * @param {object} results - Calculation results
 * @returns {Promise<{calculation, error}>}
 */
export async function saveCalculation(userId, calculatorTypeId, inputs, results) {
  try {
    const { data, error } = await supabase
      .from('calculations')
      .insert({
        user_id: userId,
        calculator_type_id: calculatorTypeId,
        inputs,
        results,
      })
      .select()
      .single();

    if (error) {
      return { calculation: null, error: error.message };
    }

    return { calculation: data, error: null };
  } catch (error) {
    return { calculation: null, error: error.message };
  }
}

/**
 * Fetch user's scenarios
 * @param {string} userId - User ID
 * @param {number} limit - Number of results to fetch (default 5)
 * @returns {Promise<{scenarios, error}>}
 */
export async function fetchUserScenarios(userId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select(`
        id,
        title,
        calculator_type_id,
        inputs,
        created_at,
        updated_at,
        calculator_types(name, slug)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { scenarios: [], error: error.message };
    }

    return { scenarios: data || [], error: null };
  } catch (error) {
    return { scenarios: [], error: error.message };
  }
}

/**
 * Fetch a single scenario by ID
 * @param {string} scenarioId - Scenario ID
 * @returns {Promise<{scenario, error}>}
 */
export async function fetchScenario(scenarioId) {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select(`
        id,
        title,
        calculator_type_id,
        inputs,
        created_at,
        updated_at,
        calculator_types(name, slug)
      `)
      .eq('id', scenarioId)
      .single();

    if (error) {
      return { scenario: null, error: error.message };
    }

    return { scenario: data, error: null };
  } catch (error) {
    return { scenario: null, error: error.message };
  }
}

/**
 * Create a new scenario
 * @param {string} userId - User ID
 * @param {string} calculatorTypeId - Calculator type ID
 * @param {string} title - Scenario title
 * @param {object} inputs - Input parameters
 * @returns {Promise<{scenario, error}>}
 */
export async function createScenario(userId, calculatorTypeId, title, inputs) {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .insert({
        user_id: userId,
        calculator_type_id: calculatorTypeId,
        title,
        inputs,
      })
      .select()
      .single();

    if (error) {
      return { scenario: null, error: error.message };
    }

    return { scenario: data, error: null };
  } catch (error) {
    return { scenario: null, error: error.message };
  }
}

/**
 * Update a scenario
 * @param {string} scenarioId - Scenario ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{scenario, error}>}
 */
export async function updateScenario(scenarioId, updates) {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioId)
      .select()
      .single();

    if (error) {
      return { scenario: null, error: error.message };
    }

    return { scenario: data, error: null };
  } catch (error) {
    return { scenario: null, error: error.message };
  }
}

/**
 * Delete a scenario
 * @param {string} scenarioId - Scenario ID
 * @returns {Promise<{error}>}
 */
export async function deleteScenario(scenarioId) {
  try {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', scenarioId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}
