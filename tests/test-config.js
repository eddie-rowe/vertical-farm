// Test Configuration
// This file sets up proper authentication and database connections for testing

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Please create a .env file with:');
    console.error('SUPABASE_URL=your_supabase_url');
    console.error('SUPABASE_ANON_KEY=your_anon_key');
    console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional)');
    process.exit(1);
}

// Create Supabase clients
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Service role client for admin operations (if available)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : null;

// Test user credentials
export const TEST_USER = {
    email: 'test@verticalfarm.app',
    password: 'TestPass123!'
};

// Authentication helper functions
export async function signUpTestUser() {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: TEST_USER.email,
            password: TEST_USER.password,
            options: {
                emailRedirectTo: undefined // Skip email confirmation for testing
            }
        });
        
        if (error && !error.message.includes('already registered')) {
            throw error;
        }
        
        return { data, error: null };
    } catch (error) {
        console.warn('Sign up warning:', error.message);
        return { data: null, error };
    }
}

export async function signInTestUser() {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        if (error) {
            // Try to sign up if user doesn't exist
            if (error.message.includes('Invalid login credentials')) {
                console.log('Test user not found, creating...');
                await signUpTestUser();
                
                // Try signing in again
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                });
                
                return { data: retryData, error: retryError };
            }
            throw error;
        }
        
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function signOutTestUser() {
    try {
        const { error } = await supabase.auth.signOut();
        return { error };
    } catch (error) {
        return { error };
    }
}

// Database setup helper
export async function setupTestDatabase() {
    try {
        // Apply schema fixes migration if admin client available
        if (supabaseAdmin) {
            console.log('🔧 Applying schema fixes...');
            
            // Read and apply the schema fix migration
            const { error: migrationError } = await supabaseAdmin.rpc('setup_test_data');
            if (migrationError) {
                console.warn('Setup test data warning:', migrationError.message);
            }
        }
        
        // Sign in test user
        console.log('🔐 Setting up test authentication...');
        const { data: authData, error: authError } = await signInTestUser();
        
        if (authError) {
            console.error('Authentication setup failed:', authError.message);
            return { success: false, error: authError };
        }
        
        console.log('✅ Test user authenticated:', authData.user?.email);
        return { success: true, user: authData.user };
        
    } catch (error) {
        console.error('Database setup failed:', error.message);
        return { success: false, error };
    }
}

// Cleanup helper
export async function cleanupTestDatabase() {
    try {
        await signOutTestUser();
        console.log('🧹 Test cleanup completed');
    } catch (error) {
        console.warn('Cleanup warning:', error.message);
    }
}

// Real-time channel helper with proper authentication
export function createAuthenticatedChannel(channelName, config = {}) {
    return supabase
        .channel(channelName, {
            config: {
                presence: { key: 'test-presence' },
                broadcast: { self: true },
                ...config
            }
        });
}

// Test configuration export
export const TEST_CONFIG = {
    timeout: 30000, // 30 second timeout for tests
    retries: 3,     // Number of retries for failed tests
    verbose: process.env.TEST_VERBOSE === 'true',
    skipAuth: process.env.TEST_SKIP_AUTH === 'true'
};

// Logging helper
export function logTest(testName, status, details = '') {
    const timestamp = new Date().toISOString();
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
    
    console.log(`${statusIcon} [${timestamp}] ${testName}: ${status} ${details}`);
}

export default {
    supabase,
    supabaseAdmin,
    TEST_USER,
    TEST_CONFIG,
    signUpTestUser,
    signInTestUser,
    signOutTestUser,
    setupTestDatabase,
    cleanupTestDatabase,
    createAuthenticatedChannel,
    logTest
}; 