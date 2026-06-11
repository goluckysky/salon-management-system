import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-87bffbae/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Create Employee ──────────────────────────────────────────────────────────
// Only callable with a valid admin JWT. Creates an auth user + links to stylist.
app.post("/make-server-87bffbae/create-employee", async (c) => {
  try {
    // Verify the caller is an admin using their JWT
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Check caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: profile, error: profileErr } = await callerClient
      .from("profiles")
      .select("role")
      .single();

    if (profileErr || profile?.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    // Parse body
    const { name, email, password, stylistId } = await c.req.json();
    if (!name || !email || !password || !stylistId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Use service role to create auth user
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: "employee" },
    });

    if (createErr) {
      return c.json({ error: createErr.message }, 400);
    }

    // Link profile to stylist
    const { error: updateErr } = await adminClient
      .from("profiles")
      .update({ stylist_id: stylistId, role: "employee" })
      .eq("id", newUser.user.id);

    if (updateErr) {
      return c.json({ error: updateErr.message }, 400);
    }

    return c.json({ success: true, userId: newUser.user.id });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ─── Delete Employee ──────────────────────────────────────────────────────────
app.delete("/make-server-87bffbae/delete-employee/:userId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: profile } = await callerClient.from("profiles").select("role").single();
    if (profile?.role !== "admin") return c.json({ error: "Admin access required" }, 403);

    const userId = c.req.param("userId");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return c.json({ error: error.message }, 400);

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);