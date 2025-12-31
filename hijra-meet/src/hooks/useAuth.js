import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { roleManager } from '../core/roleManager';
import { setStoredHostName } from '../lib/database';

// Hook to manage authentication state
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);

            // If authenticated, set as host and save name
            if (session?.user) {
                roleManager.setRole('host');
                if (session.user.user_metadata?.name) {
                    setStoredHostName(session.user.user_metadata.name);
                }
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);

            if (session?.user) {
                roleManager.setRole('host');
                if (session.user.user_metadata?.name) {
                    setStoredHostName(session.user.user_metadata.name);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        roleManager.clearIdentity();
    };

    return {
        user,
        loading,
        signOut,
        isAuthenticated: !!user,
    };
};
