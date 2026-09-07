const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'testagent@clan.local',
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'admin', username: 'TestAgent' }
  });
  if (error) console.log("Error:", error.message);
  else console.log("User created:", data.user.id);
}
run();
