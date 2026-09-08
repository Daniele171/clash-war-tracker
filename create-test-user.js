const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestAdmin() {
  const email = 'testadmin@clan.local';
  const password = 'password123';
  
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("Error listing users:", listErr);
    return;
  }
  
  let user = list.users.find(u => u.email === email);
  if (user) {
    console.log("Test user already exists. Updating role...");
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { role: 'admin', username: 'TestAdmin' }
    });
    console.log("User updated successfully.");
  } else {
    console.log("Creating new test user...");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', username: 'TestAdmin' }
    });
    if (error) console.error("Error:", error);
    else console.log("User created:", data.user.id);
  }
}
createTestAdmin();
