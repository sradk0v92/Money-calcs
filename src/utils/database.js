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
        title,
        summary,
        calculator_type_id,
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
        title,
        summary,
        scenario_id,
        calculator_type_id,
        inputs,
        results,
        created_at,
        updated_at,
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
 * @param {object|string} payloadOrUserId - Payload object or user ID for backwards compatibility
 * @param {string} calculatorTypeIdArg - Calculator type ID (legacy signature)
 * @param {object} inputsArg - Input parameters (legacy signature)
 * @param {object} resultsArg - Calculation results (legacy signature)
 * @param {object} optionsArg - Optional fields (legacy signature)
 * @returns {Promise<{calculation, error}>}
 */
export async function saveCalculation(payloadOrUserId, calculatorTypeIdArg, inputsArg, resultsArg, optionsArg = {}) {
  const payload = typeof payloadOrUserId === 'object' && payloadOrUserId !== null
    ? payloadOrUserId
    : {
      userId: payloadOrUserId,
      calculatorTypeId: calculatorTypeIdArg,
      inputs: inputsArg,
      results: resultsArg,
      ...optionsArg,
    };

  try {
    const { data, error } = await supabase
      .from('calculations')
      .insert({
        user_id: payload.userId,
        calculator_type_id: payload.calculatorTypeId,
        inputs: payload.inputs,
        results: payload.results,
        title: payload.title ?? null,
        summary: payload.summary ?? null,
        scenario_id: payload.scenarioId ?? null,
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
 * Fetch user history rows optimized for list view.
 * @param {string} userId - User ID
 * @param {number} limit - Number of rows to fetch
 * @returns {Promise<{calculations, error}>}
 */
export async function fetchCalculationHistory(userId, limit = 20) {
  return fetchUserCalculations(userId, limit);
}

/**
 * Delete calculation by id
 * @param {string} calculationId - Calculation ID
 * @returns {Promise<{error}>}
 */
export async function deleteCalculation(calculationId) {
  try {
    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', calculationId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Update calculation title
 * @param {string} calculationId - Calculation ID
 * @param {string} title - New title
 * @returns {Promise<{calculation, error}>}
 */
export async function updateCalculationTitle(calculationId, title) {
  try {
    const { data, error } = await supabase
      .from('calculations')
      .update({
        title: title || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', calculationId)
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
 * Fetch user's scenarios (now primarily for comparisons)
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
        left_calculation_id,
        right_calculation_id,
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
 * Fetch a single scenario by ID (with full comparison details)
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
        left_calculation_id,
        right_calculation_id,
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
/**
 * Save a new comparison (as a scenario)
 * @param {string} userId - User ID
 * @param {string} calculatorTypeId - Calculator type ID
 * @param {string} title - Comparison title
 * @param {string} leftCalculationId - First calculation ID
 * @param {string} rightCalculationId - Second calculation ID
 * @returns {Promise<{comparison, error}>}
 */
export async function saveComparison(userId, calculatorTypeId, title, leftCalculationId, rightCalculationId) {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .insert({
        user_id: userId,
        calculator_type_id: calculatorTypeId,
        title,
        left_calculation_id: leftCalculationId,
        right_calculation_id: rightCalculationId,
      })
      .select()
      .single();

    if (error) {
      return { comparison: null, error: error.message };
    }

    return { comparison: data, error: null };
  } catch (error) {
    return { comparison: null, error: error.message };
  }
}

/**
 * Fetch both calculations for a comparison (helper for compare page)
 * @param {string} id1 - First calculation ID
 * @param {string} id2 - Second calculation ID
 * @returns {Promise<{calc1, calc2, error}>}
 */
export async function fetchComparisonPair(id1, id2) {
  try {
    const [calc1Result, calc2Result] = await Promise.all([
      fetchCalculation(id1),
      fetchCalculation(id2),
    ]);

    if (calc1Result.error || calc2Result.error) {
      return {
        calc1: null,
        calc2: null,
        error: calc1Result.error || calc2Result.error,
      };
    }

    return {
      calc1: calc1Result.calculation,
      calc2: calc2Result.calculation,
      error: null,
    };
  } catch (error) {
    return {
      calc1: null,
      calc2: null,
      error: error.message,
    };
  }
}