import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
}

type StaffRole =
  | 'manager'
  | 'cashier'

interface CreateStaffRequest {
  fullName: string
  username: string
  email: string
  phone?: string
  password: string
  role: StaffRole
}

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,
        'Content-Type':
          'application/json',
      },
    },
  )
}

Deno.serve(
  async (request) => {
    if (
      request.method ===
      'OPTIONS'
    ) {
      return new Response(
        'ok',
        {
          headers:
            corsHeaders,
        },
      )
    }

    if (
      request.method !==
      'POST'
    ) {
      return jsonResponse(
        {
          error:
            'Method not allowed.',
        },
        405,
      )
    }

    const supabaseUrl =
      Deno.env.get(
        'SUPABASE_URL',
      )

    const anonKey =
      Deno.env.get(
        'SUPABASE_ANON_KEY',
      )

    const serviceRoleKey =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY',
      )

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            'Supabase environment configuration is missing.',
        },
        500,
      )
    }

    const authorization =
      request.headers.get(
        'Authorization',
      )

    if (!authorization) {
      return jsonResponse(
        {
          error:
            'Authentication required.',
        },
        401,
      )
    }

    /*
     * Client scoped to the currently
     * logged-in manager.
     */
    const userClient =
      createClient(
        supabaseUrl,
        anonKey,
        {
          global: {
            headers: {
              Authorization:
                authorization,
            },
          },

          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        },
      )

    const {
      data: {
        user:
          currentUser,
      },

      error:
        currentUserError,
    } =
      await userClient
        .auth
        .getUser()

    if (
      currentUserError ||
      !currentUser
    ) {
      return jsonResponse(
        {
          error:
            'Invalid login session.',
        },
        401,
      )
    }

    /*
     * Admin client.
     *
     * service_role remains only
     * inside this Edge Function.
     */
    const adminClient =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        },
      )

    /*
     * Find currently logged-in
     * staff member.
     */
    const {
      data:
        managerStaff,
      error:
        managerError,
    } =
      await adminClient
        .from('staff')
        .select(`
          id,
          business_id,
          branch_id,
          is_active,
          roles (
            name
          )
        `)
        .eq(
          'auth_user_id',
          currentUser.id,
        )
        .single()

    if (
      managerError ||
      !managerStaff
    ) {
      return jsonResponse(
        {
          error:
            'Staff profile was not found.',
        },
        403,
      )
    }

    const managerRole =
      Array.isArray(
        managerStaff.roles,
      )
        ? managerStaff
            .roles[0]
            ?.name
        : managerStaff
            .roles
            ?.name

    if (
      managerRole !==
      'manager'
    ) {
      return jsonResponse(
        {
          error:
            'Only managers can create staff accounts.',
        },
        403,
      )
    }

    if (
      !managerStaff
        .is_active
    ) {
      return jsonResponse(
        {
          error:
            'Your staff account is disabled.',
        },
        403,
      )
    }

    let body:
      CreateStaffRequest

    try {
      body =
        await request.json()
    } catch {
      return jsonResponse(
        {
          error:
            'Invalid request body.',
        },
        400,
      )
    }

    const fullName =
      String(
        body.fullName ??
          '',
      ).trim()

    const username =
      String(
        body.username ??
          '',
      )
        .trim()
        .toLowerCase()

    const email =
      String(
        body.email ??
          '',
      )
        .trim()
        .toLowerCase()

    const phone =
      String(
        body.phone ??
          '',
      ).trim()

    const password =
      String(
        body.password ??
          '',
      )

    const role =
      body.role

    /*
     * Validation
     */
    if (!fullName) {
      return jsonResponse(
        {
          error:
            'Full name is required.',
        },
        400,
      )
    }

    if (
      username.length <
      3
    ) {
      return jsonResponse(
        {
          error:
            'Username must contain at least 3 characters.',
        },
        400,
      )
    }

    if (
      !/^[a-z0-9._-]+$/.test(
        username,
      )
    ) {
      return jsonResponse(
        {
          error:
            'Username contains invalid characters.',
        },
        400,
      )
    }

    if (
      !email ||
      !email.includes('@')
    ) {
      return jsonResponse(
        {
          error:
            'A valid email address is required.',
        },
        400,
      )
    }

    if (
      password.length <
      8
    ) {
      return jsonResponse(
        {
          error:
            'Password must contain at least 8 characters.',
        },
        400,
      )
    }

    if (
      role !==
        'manager' &&
      role !==
        'cashier'
    ) {
      return jsonResponse(
        {
          error:
            'Invalid staff role.',
        },
        400,
      )
    }

    /*
     * Username must be unique.
     */
    const {
      data:
        existingUsername,
    } =
      await adminClient
        .from('staff')
        .select('id')
        .eq(
          'business_id',
          managerStaff
            .business_id,
        )
        .eq(
          'username',
          username,
        )
        .maybeSingle()

    if (
      existingUsername
    ) {
      return jsonResponse(
        {
          error:
            'This username is already in use.',
        },
        409,
      )
    }

    /*
     * Resolve role_id.
     */
    const {
      data:
        roleRow,
      error:
        roleError,
    } =
      await adminClient
        .from('roles')
        .select(
          'id, name',
        )
        .eq(
          'name',
          role,
        )
        .single()

    if (
      roleError ||
      !roleRow
    ) {
      return jsonResponse(
        {
          error:
            'Staff role was not found.',
        },
        500,
      )
    }

    /*
     * Create Supabase Auth user.
     */
    const {
      data:
        authResult,
      error:
        authError,
    } =
      await adminClient
        .auth
        .admin
        .createUser({
          email,

          password,

          email_confirm:
            true,

          user_metadata: {
            full_name:
              fullName,

            username,

            role,
          },
        })

    if (
      authError ||
      !authResult.user
    ) {
      return jsonResponse(
        {
          error:
            authError
              ?.message ??
            'Unable to create login account.',
        },
        400,
      )
    }

    const authUserId =
      authResult.user.id

    /*
     * Create linked staff profile.
     */
    const {
      data:
        newStaff,
      error:
        staffError,
    } =
      await adminClient
        .from('staff')
        .insert({
          auth_user_id:
            authUserId,

          business_id:
            managerStaff
              .business_id,

          branch_id:
            managerStaff
              .branch_id,

          role_id:
            roleRow.id,

          full_name:
            fullName,

          username,

          phone:
            phone ||
            null,

          is_active:
            true,
        })
        .select(`
          id,
          auth_user_id,
          business_id,
          branch_id,
          role_id,
          full_name,
          username,
          phone,
          is_active,
          created_at,
          updated_at,
          roles (
            name
          )
        `)
        .single()

    if (
      staffError ||
      !newStaff
    ) {
      /*
       * Roll back Auth user if
       * staff profile creation fails.
       */
      await adminClient
        .auth
        .admin
        .deleteUser(
          authUserId,
        )

      return jsonResponse(
        {
          error:
            staffError
              ?.message ??
            'Unable to create staff profile.',
        },
        400,
      )
    }

    return jsonResponse(
      {
        success:
          true,

        message:
          'Staff account created successfully.',

        staff:
          newStaff,
      },
      201,
    )
  },
)