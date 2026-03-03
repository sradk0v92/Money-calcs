/**
 * Supabase Authentication utility
 * Handles user login, registration, logout, and session management
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const missingEnvMessage = 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env';

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function ensureSupabaseClient() {
  if (!supabase) {
    return { error: missingEnvMessage };
  }
  return { error: null };
}

/**
 * Register a new user
 * @param {string} email
 * @param {string} password
 * @param {object} userData - Additional user data (firstName, lastName, etc.)
 * @returns {Promise<{user, error}>}
 */
export async function register(email, password, userData = {}) {
  const clientCheck = ensureSupabaseClient();
  if (clientCheck.error) {
    return { user: null, error: clientCheck.error };
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
        }
      }
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    // Create profile in profiles table
    if (authData.user) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim();

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName || null,
        });

      if (profileError) {
        return { user: authData.user, error: profileError.message };
      }
    }

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

/**
 * Log in a user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, error}>}
 */
export async function login(email, password) {
  const clientCheck = ensureSupabaseClient();
  if (clientCheck.error) {
    return { user: null, error: clientCheck.error };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

/**
 * Log out the current user
 * @returns {Promise<{error}>}
 */
export async function logout() {
  const clientCheck = ensureSupabaseClient();
  if (clientCheck.error) {
    return { error: clientCheck.error };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<{user}>}
 */
export async function getCurrentUser() {
  const clientCheck = ensureSupabaseClient();
  if (clientCheck.error) {
    return { user: null, error: clientCheck.error };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return { user };
  } catch (error) {
    return { user: null };
  }
}

/**
 * Get the current session
 * @returns {Promise<{session}>}
 */
export async function getSession() {
  const clientCheck = ensureSupabaseClient();
  if (clientCheck.error) {
    return { session: null, error: clientCheck.error };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return { session };
  } catch (error) {
    return { session: null };
  }
}

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function that receives (user, event) parameters
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    callback(null, 'MISSING_ENV');
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });

  return () => subscription?.unsubscribe();
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const { session } = await getSession();
  return !!session;
}

export { supabase };
