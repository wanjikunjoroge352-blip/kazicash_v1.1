import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const __dirname = process.cwd();
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const env = process.env;

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.warn("Supabase backend credentials are not configured yet.");
}
const supabase = (SUPABASE_URL && SUPABASE_SECRET_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
  : null;

function id(prefix) {
  return prefix + "_" + crypto.randomBytes(6).toString("hex");
}
function requireAdmin(req, res, next) {
  if (!env.ADMIN_SECRET || req.headers["x-admin-secret"] !== env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
function requireDB(req, res, next) {
  if (!supabase) return res.status(503).json({ error: "KaziCash database is not configured yet" });
  next();
}

app.get("/api/health", (req, res) => res.json({
  ok: true,
  app: "KaziCash",
  databaseConfigured: !!supabase,
  payments: {
    mpesaConfigured: !!(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET),
    b2cConfigured: !!(env.MPESA_B2C_SHORTCODE && env.MPESA_INITIATOR_NAME && env.MPESA_SECURITY_CREDENTIAL)
  }
}));

app.get("/api/jobs", requireDB, async (req, res) => {
  const { data, error } = await supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(j => ({ ...j, reward: Number(j.reward), active: j.status === "open" })));
});

app.post("/api/register", requireDB, async (req, res) => {
  const { name, phone, email } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: "Name and M-Pesa phone are required" });

  const { data: existing, error: findError } = await supabase.from("users").select("*").eq("phone", phone).maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });

  if (existing) return res.json({ user: existing });

  const { data, error } = await supabase.from("users").insert({
    name, phone, email: email || "", role: "worker", balance: 0
  }).select("*").single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

app.get("/api/user/:id", requireDB, async (req, res) => {
  const userId = Number(req.params.id);
  const [{ data: user, error: userError }, { data: transactions, error: txError }, { data: withdrawals, error: wdError }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", userId).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ]);
  if (userError || txError || wdError) return res.status(500).json({ error: (userError || txError || wdError).message });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ ...user, transactions: transactions || [], withdrawals: withdrawals || [] });
});

app.post("/api/submissions", requireDB, async (req, res) => {
  const { userId, jobId, answer } = req.body || {};
  if (!userId || !jobId) return res.status(400).json({ error: "userId and jobId are required" });

  const [{ data: user }, { data: job }] = await Promise.all([
    supabase.from("users").select("*").eq("id", Number(userId)).maybeSingle(),
    supabase.from("jobs").select("*").eq("id", Number(jobId)).eq("status", "open").maybeSingle()
  ]);
  if (!user || !job) return res.status(400).json({ error: "Invalid user or job" });

  const { data, error } = await supabase.from("submissions").insert({
    user_id: Number(userId), job_id: Number(jobId), proof: answer || "", status: "pending"
  }).select("*").single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/withdraw", requireDB, async (req, res) => {
  const { userId, amount } = req.body || {};
  const n = Number(amount);
  if (!userId || !Number.isFinite(n) || n < 50) return res.status(400).json({ error: "Minimum withdrawal is KSh 50" });

  const { data: u, error: ue } = await supabase.from("users").select("*").eq("id", Number(userId)).maybeSingle();
  if (ue) return res.status(500).json({ error: ue.message });
  if (!u) return res.status(404).json({ error: "User not found" });
  if (n > Number(u.balance)) return res.status(400).json({ error: "Insufficient approved balance" });

  const { data: w, error } = await supabase.from("withdrawals").insert({
    user_id: Number(userId), phone: u.phone, amount: n, status: "pending"
  }).select("*").single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(w);
});

/* Daraja OAuth */
async function mpesaToken() {
  const base = env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
  const basic = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const r = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` }
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).access_token;
}

/* Employer funding via M-Pesa Express */
app.post("/api/payments/stk", requireDB, async (req, res) => {
  try {
    const { phone, amount, accountReference = "KAZICASH" } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ error: "phone and amount required" });
    if (!env.MPESA_SHORTCODE || !env.MPESA_PASSKEY || !env.APP_BASE_URL) {
      return res.status(503).json({ error: "M-Pesa STK is not configured yet" });
    }

    const token = await mpesaToken();
    const base = env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
    const ts = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${ts}`).toString("base64");

    const r = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: Number(amount),
        PartyA: phone,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: `${env.APP_BASE_URL}/api/payments/stk/callback`,
        AccountReference: accountReference,
        TransactionDesc: "KaziCash job funding"
      })
    });
    const data = await r.json();
    res.status(r.ok ? 200 : 400).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/payments/stk/callback", async (req, res) => {
  console.log("STK CALLBACK", JSON.stringify(req.body));
  // Payment reconciliation should be added here before production.
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

/* Real worker payout via Daraja B2C. */
app.post("/api/admin/withdrawals/:id/pay", requireAdmin, requireDB, async (req, res) => {
  try {
    const withdrawalId = Number(req.params.id);
    const { data: w, error: we } = await supabase.from("withdrawals").select("*").eq("id", withdrawalId).maybeSingle();
    if (we) return res.status(500).json({ error: we.message });
    if (!w || w.status !== "pending") return res.status(400).json({ error: "Withdrawal unavailable" });

    const { data: u, error: ue } = await supabase.from("users").select("*").eq("id", Number(w.user_id)).maybeSingle();
    if (ue) return res.status(500).json({ error: ue.message });
    if (!u) return res.status(404).json({ error: "User missing" });

    if (!env.MPESA_B2C_SHORTCODE || !env.MPESA_INITIATOR_NAME || !env.MPESA_SECURITY_CREDENTIAL) {
      return res.status(503).json({ error: "B2C credentials are not configured yet" });
    }
    if (Number(w.amount) > Number(u.balance)) return res.status(400).json({ error: "Insufficient balance" });

    const token = await mpesaToken();
    const base = env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
    const conversation = id("KC");
    const body = {
      OriginatorConversationID: conversation,
      InitiatorName: env.MPESA_INITIATOR_NAME,
      SecurityCredential: env.MPESA_SECURITY_CREDENTIAL,
      CommandID: "BusinessPayment",
      Amount: Number(w.amount),
      PartyA: env.MPESA_B2C_SHORTCODE,
      PartyB: u.phone,
      Remarks: "KaziCash worker payout",
      QueueTimeOutURL: `${env.APP_BASE_URL}/api/payments/b2c/timeout`,
      ResultURL: `${env.APP_BASE_URL}/api/payments/b2c/result`,
      Occassion: "KaziCash"
    };

    const r = await fetch(`${base}/mpesa/b2c/v3/paymentrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await r.json();

    if (r.ok) {
      await supabase.from("withdrawals").update({
        status: "processing"
      }).eq("id", withdrawalId);
    }
    res.status(r.ok ? 200 : 400).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/payments/b2c/result", async (req, res) => {
  console.log("B2C RESULT", JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});
app.post("/api/payments/b2c/timeout", async (req, res) => {
  console.log("B2C TIMEOUT", JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

/* Admin */
app.get("/api/admin/submissions", requireAdmin, requireDB, async (req, res) => {
  const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get("/api/admin/withdrawals", requireAdmin, requireDB, async (req, res) => {
  const { data, error } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post("/api/admin/submissions/:id/approve", requireAdmin, requireDB, async (req, res) => {
  const submissionId = Number(req.params.id);
  const { data: s, error: se } = await supabase.from("submissions").select("*").eq("id", submissionId).maybeSingle();
  if (se) return res.status(500).json({ error: se.message });
  if (!s || s.status !== "pending") return res.status(400).json({ error: "Submission unavailable" });

  const [{ data: u, error: ue }, { data: job, error: je }] = await Promise.all([
    supabase.from("users").select("*").eq("id", Number(s.user_id)).maybeSingle(),
    supabase.from("jobs").select("*").eq("id", Number(s.job_id)).maybeSingle()
  ]);
  if (ue || je) return res.status(500).json({ error: (ue || je).message });
  if (!u || !job) return res.status(404).json({ error: "User or job missing" });

  const reward = Number(job.reward);
  const { error: su } = await supabase.from("submissions").update({
    status: "approved", reviewed_at: new Date().toISOString()
  }).eq("id", submissionId);
  if (su) return res.status(500).json({ error: su.message });

  const { error: bu } = await supabase.from("users").update({
    balance: Number(u.balance) + reward
  }).eq("id", Number(u.id));
  if (bu) return res.status(500).json({ error: bu.message });

  const { error: tx } = await supabase.from("transactions").insert({
    user_id: Number(u.id), type: "task_reward", amount: reward,
    reference: `SUB-${submissionId}`, description: "Approved task reward"
  });
  if (tx) return res.status(500).json({ error: tx.message });

  res.json({ ok: true, submissionId });
});

app.post("/api/admin/submissions/:id/reject", requireAdmin, requireDB, async (req, res) => {
  const submissionId = Number(req.params.id);
  const { data, error } = await supabase.from("submissions").update({
    status: "rejected", reviewed_at: new Date().toISOString()
  }).eq("id", submissionId).eq("status", "pending").select("*").maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(400).json({ error: "Submission unavailable" });
  res.json(data);
});

/* SPA fallback */
app.use((req, res) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  res.status(404).json({ error: "Not found" });
});

if (!process.env.VERCEL) {
  app.listen(env.PORT || 3000, () => console.log(`KaziCash running on ${env.PORT || 3000}`));
}

export default app;
