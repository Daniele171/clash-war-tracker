import { requireAdmin, requirePermission } from '@/lib/auth';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import { MASTER_ADMIN_EMAIL } from '@/lib/constants';
import { createAdminClient } from '@/utils/supabase/admin';

function emailToUsername(email: string): string {
  if (email.endsWith('@clan.local')) {
    return email.replace('@clan.local', '');
  }
  return email;
}

// GET all users (Admin only)
export async function GET() {
  try {
    await requireAdmin();

    const adminAuthClient = createAdminClient();
    const { data, error } = await adminAuthClient.auth.admin.listUsers();
    
    if (error) {
      return apiError(error.message, 500);
    }

    const users = data.users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.user_metadata?.username || emailToUsername(u.email || ''),
      role: u.user_metadata?.role || 'viewer',
      createdAt: u.created_at
    }));

    return apiSuccess(users);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create user (Dynamic permission check)
export async function POST(request: Request) {
  try {
    await requirePermission('adminCanCreateUser');

    const body = await request.json().catch(() => ({}));
    const { password, role, email } = body;
    const username = body.username || (email ? email.replace('@clan.local', '').replace(/@.*/, '') : null);

    if (!username || !password || !email) {
      return apiError('Email, Username e Password sono obbligatori', 400);
    }

    if (typeof password !== 'string' || password.length < 6) {
      return apiError('La password deve avere almeno 6 caratteri', 400);
    }

    const adminAuthClient = createAdminClient();
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: { 
        username: username.trim(),
        role: role || 'viewer',
        must_change_password: true
      }
    });

    if (error) {
      return apiError(error.message, 400);
    }

    return apiSuccess({ success: true, user: data.user });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE user (Dynamic permission check)
export async function DELETE(request: Request) {
  try {
    const auth = await requirePermission('adminCanDeleteUser');

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return apiError('ID utente non valido', 400);
    }

    if (id === auth.user.id) {
      return apiError('Non puoi eliminare te stesso', 400);
    }

    const adminAuthClient = createAdminClient();
    
    // Check if target is Master Admin
    const { data: targetData, error: fetchErr } = await adminAuthClient.auth.admin.getUserById(id);
    if (fetchErr) {
      return apiError(fetchErr.message, 500);
    }

    if (targetData.user.email === MASTER_ADMIN_EMAIL) {
      return apiError('Questo è l\'Amministratore Assoluto e non può essere eliminato.', 403);
    }

    const { error } = await adminAuthClient.auth.admin.deleteUser(id);
    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH change user role (Dynamic permission check)
export async function PATCH(request: Request) {
  try {
    const auth = await requirePermission('adminCanChangeRole');

    const body = await request.json().catch(() => ({}));
    const { id, role } = body;

    if (!id || !role || typeof id !== 'string' || typeof role !== 'string') {
      return apiError('ID e nuovo ruolo sono obbligatori', 400);
    }

    if (id === auth.user.id && role !== 'admin') {
      return apiError('Non puoi toglierti i permessi da admin da solo', 400);
    }

    const adminAuthClient = createAdminClient();
    
    const { data: userData, error: userError } = await adminAuthClient.auth.admin.getUserById(id);
    if (userError) {
      return apiError(userError.message, 500);
    }

    if (userData.user.email === MASTER_ADMIN_EMAIL && role !== 'admin') {
      return apiError('Questo è l\'Amministratore Assoluto e non può essere declassato.', 403);
    }

    const currentMetadata = userData.user.user_metadata || {};

    const { error } = await adminAuthClient.auth.admin.updateUserById(id, {
      user_metadata: { 
        ...currentMetadata,
        role: role
      }
    });

    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
