// utils/testSupabase.js
import { supabase } from '../supabaseClient';

export async function testSupabaseConnection() {
    try {
        console.log('🔍 Testing Supabase connection...');

        // Test 1: Basic connection
        const { data, error } = await supabase
            .from('profili')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Database connection failed:', error.message);
            console.error('🔧 Check your Supabase credentials in supabaseClient.js');
            return false;
        }

        console.log('✅ Database connection successful!');

        // Test 2: Auth connection
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError) {
            console.error('❌ Auth connection failed:', authError.message);
        } else {
            console.log('✅ Auth connection successful!');
            console.log('👤 Current session:', session ? 'Logged in' : 'Not logged in');
        }

        // Test 3: Check if tables exist
        const { data: categories, error: catError } = await supabase
            .from('categorie')
            .select('*')
            .limit(3);

        if (catError) {
            console.error('❌ Cannot read categories table:', catError.message);
            console.error('💡 Make sure you ran the database schema SQL in Supabase');
        } else {
            console.log('📂 Categories found:', categories?.length || 0);
            if (categories && categories.length > 0) {
                console.log('📋 Sample category:', categories[0]);
            }
        }

        console.log('🎉 Supabase test completed!');
        return true;

    } catch (error) {
        console.error('❌ Supabase test failed:', error);
        console.error('🔧 Check your internet connection and Supabase setup');
        return false;
    }
}