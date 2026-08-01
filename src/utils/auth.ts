import { supabase, isSupabaseConfigured } from './supabase';
import type { BloodType, UserRole, User } from '../types';

export interface AuthError {
  message: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: AuthError;
}

// Keep the app usable during local development when a Supabase project has not
// been configured. This is intentionally browser-only demo authentication; a
// configured Supabase project always remains the source of truth in production.
const LOCAL_USERS_KEY = 'redpulse-demo-users';
const LOCAL_SESSION_KEY = 'redpulse-demo-session';

type LocalUser = User & { password: string };

const readLocalUsers = (): LocalUser[] => {
  try {
    const stored = localStorage.getItem(LOCAL_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const notifyLocalAuthChange = (user: User | null) => {
  window.dispatchEvent(new CustomEvent<User | null>('redpulse-auth-change', { detail: user }));
};

const createLocalUserId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Reset password for user
export const resetPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: AuthError }> => {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: `Demo Mode: Password reset instructions simulated for ${email}`,
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    return {
      success: true,
      message: `Password reset link sent to ${email}. Please check your inbox.`,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Failed to send password reset email' },
    };
  }
};

// Resend email verification
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message?: string; error?: AuthError }> => {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: `Demo Mode: Verification email resent to ${email}`,
    };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    return {
      success: true,
      message: `Verification link sent to ${email}. Please verify your email address.`,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Failed to resend verification email' },
    };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  if (!isSupabaseConfigured) {
    const localUser = readLocalUsers().find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (!localUser || localUser.password !== password) {
      return { success: false, error: { message: 'Invalid email or password' } };
    }

    const { password: _password, ...user } = localUser;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    notifyLocalAuthChange(user);
    return { success: true, user };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    if (!data.user) {
      return { success: false, error: { message: 'No user returned' } };
    }

    // Try fetching profile from users or profiles table
    let userRole: UserRole = (data.user.user_metadata?.role as UserRole) || 'donor';
    let fullName = data.user.user_metadata?.full_name || email.split('@')[0];
    let phone = data.user.user_metadata?.phone;
    let bloodType = data.user.user_metadata?.blood_type;
    let location = data.user.user_metadata?.location;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile) {
      userRole = profile.role as UserRole;
      fullName = profile.full_name || fullName;
      phone = profile.phone || phone;
      bloodType = profile.blood_type || bloodType;
      location = profile.location || location;
    } else {
      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (userRow) {
        userRole = userRow.role as UserRole;
        fullName = userRow.full_name || fullName;
        phone = userRow.phone || phone;
      }
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      role: userRole,
      fullName,
      name: fullName,
      phone,
      bloodType,
      bloodGroup: bloodType,
      location,
    };

    return { success: true, user };
  } catch (error) {
    return { 
      success: false, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Sign up new user
export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
  phone?: string,
  bloodType?: string,
  location?: string
): Promise<AuthResult> => {
  if (!isSupabaseConfigured) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readLocalUsers();

    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: { message: 'An account with this email already exists' } };
    }

    const user: User = {
      id: createLocalUserId(),
      email: normalizedEmail,
      role,
      fullName,
      phone,
      bloodType: bloodType as BloodType | undefined,
      bloodGroup: bloodType as BloodType | undefined,
      location,
    };
    users.push({ ...user, password });
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    notifyLocalAuthChange(user);
    return { success: true, user };
  }

  try {
    // Create auth user with metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone,
          blood_type: bloodType,
          location: location,
        },
      },
    });

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    if (!data.user) {
      return { success: false, error: { message: 'No user returned' } };
    }

    const user: User = {
      id: data.user.id,
      email: email,
      role: role,
      fullName: fullName,
      phone: phone,
      bloodType: bloodType as BloodType | undefined,
      bloodGroup: bloodType as BloodType | undefined, // Alias for backward compatibility
      location: location,
    };

    // Attempt writing to public.users table and public.profiles table if present
    try {
      await supabase.from('users').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        phone: phone,
        role: role as any,
      });
    } catch {
      // Ignore if table missing or trigger handled it
    }

    try {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        phone: phone,
        role: role as any,
        blood_type: bloodType,
        location: location,
      });
    } catch {
      // Ignore if table missing or trigger handled it
    }

    // If role is donor, attempt creating entry in public.donors
    if (role === 'donor') {
      try {
        await supabase.from('donors').insert({
          user_id: data.user.id,
          blood_group: bloodType || 'O+',
          eligible: true,
          availability: true,
          response_score: 100,
        });
      } catch {
        // Ignore if donors table not initialized yet
      }

      import('./emergency').then(({ initializeDonorAvailability }) => {
        initializeDonorAvailability(data.user.id, location).catch(err => {
          console.warn('Failed to initialize donor availability:', err);
        });
      });
    }

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
};

// Sign out
export const signOut = async (): Promise<{ success: boolean; error?: AuthError }> => {
  if (!isSupabaseConfigured) {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    notifyLocalAuthChange(null);
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: { message: error.message } };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Get current session
export const getCurrentSession = async (): Promise<AuthResult> => {
  if (!isSupabaseConfigured) {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      return stored
        ? { success: true, user: JSON.parse(stored) as User }
        : { success: false, error: { message: 'No session' } };
    } catch {
      return { success: false, error: { message: 'No session' } };
    }
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    if (!session?.user) {
      return { success: false, error: { message: 'No session' } };
    }

    // Fetch profile from profiles or users table with user_metadata fallback
    let userRole: UserRole = (session.user.user_metadata?.role as UserRole) || 'donor';
    let fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
    let phone = session.user.user_metadata?.phone;
    let bloodType = session.user.user_metadata?.blood_type;
    let location = session.user.user_metadata?.location;
    let dob: string | undefined = undefined;
    let gender: any = undefined;
    let emergencyContact: string | undefined = undefined;
    let medicalNotes: string | undefined = undefined;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile) {
      userRole = profile.role as UserRole;
      fullName = profile.full_name || fullName;
      phone = profile.phone || phone;
      bloodType = profile.blood_type || bloodType;
      location = profile.location || location;
      dob = profile.date_of_birth;
      gender = profile.gender;
      emergencyContact = profile.emergency_contact;
      medicalNotes = profile.medical_notes;
    } else {
      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userRow) {
        userRole = userRow.role as UserRole;
        fullName = userRow.full_name || fullName;
        phone = userRow.phone || phone;
      }
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email || '',
      role: userRole,
      fullName,
      name: fullName,
      phone,
      bloodType,
      bloodGroup: bloodType,
      location,
      dob,
      gender,
      emergencyContact,
      medicalNotes,
    };

    return { success: true, user };
  } catch (error) {
    return { 
      success: false, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Update user profile
export const updateProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<AuthResult> => {
  if (!isSupabaseConfigured) {
    const users = readLocalUsers();
    const index = users.findIndex((user) => user.id === userId);
    if (index === -1) {
      return { success: false, error: { message: 'Profile not found' } };
    }

    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    const { password: _password, ...user } = updatedUser;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    notifyLocalAuthChange(user);
    return { success: true, user };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        phone: updates.phone,
        blood_type: updates.bloodType ?? updates.bloodGroup,
        location: updates.location,
        date_of_birth: updates.dob,
        gender: updates.gender,
        emergency_contact: updates.emergencyContact,
        medical_notes: updates.medicalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: { message: error.message } };
    }

    // Fetch updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: { message: 'Profile not found' } };
    }

    const user: User = {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      fullName: profile.full_name,
      phone: profile.phone,
      bloodType: profile.blood_type,
      bloodGroup: profile.blood_type, // Alias for backward compatibility
      location: profile.location,
      dob: profile.date_of_birth,
      gender: profile.gender,
      emergencyContact: profile.emergency_contact,
      medicalNotes: profile.medical_notes,
    };

    return { success: true, user };
  } catch (error) {
    return { 
      success: false, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!isSupabaseConfigured) {
    const handler = (event: Event) => callback((event as CustomEvent<User | null>).detail);
    window.addEventListener('redpulse-auth-change', handler);
    return { unsubscribe: () => window.removeEventListener('redpulse-auth-change', handler) };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        const result = await getCurrentSession();
        if (result.success && result.user) {
          callback(result.user);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    }
  );

  return subscription;
};
