import express from "express";
import cors from "cors";
import crypto from "crypto";
import db from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const VALID_STATUSES = ["Applied", "Screening", "Interview", "Offer", "Rejected"];

app.get("/api/applications", (req, res) => {
  const rows = db.prepare("SELECT * FROM applications ORDER BY dateApplied DESC, createdAt DESC").all();
  res.json(rows);
});

app.get("/api/applications/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

app.post("/api/applications", (req, res) => {
  const { company, role, status = "Applied", dateApplied = "", link = "", notes = "" } = req.body;

  if (!company?.trim() || !role?.trim()) {
    return res.status(400).json({ error: "company and role are required" });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` });
  }

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO applications (id, company, role, status, dateApplied, link, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, company.trim(), role.trim(), status, dateApplied, link, notes);

  const created = db.prepare("SELECT * FROM applications WHERE id = ?").get(id);
  res.status(201).json(created);
});

app.put("/api/applications/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { company, role, status, dateApplied, link, notes } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` });
  }

  db.prepare(
    `UPDATE applications
     SET company = ?, role = ?, status = ?, dateApplied = ?, link = ?, notes = ?, updatedAt = datetime('now')
     WHERE id = ?`
  ).run(
    company ?? existing.company,
    role ?? existing.role,
    status ?? existing.status,
    dateApplied ?? existing.dateApplied,
    link ?? existing.link,
    notes ?? existing.notes,
    req.params.id
  );

  const updated = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/applications/:id
app.delete("/api/applications/:id", (req, res) => {
  const result = db.prepare("DELETE FROM applications WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

// GET /api/stats — quick summary numbers
app.get("/api/stats", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as c FROM applications").get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM applications WHERE status != 'Rejected'").get().c;
  const interviewing = db
    .prepare("SELECT COUNT(*) as c FROM applications WHERE status IN ('Interview','Offer')")
    .get().c;
  const responded = db.prepare("SELECT COUNT(*) as c FROM applications WHERE status != 'Applied'").get().c;
  res.json({
    total,
    active,
    interviewing,
    responseRate: total ? Math.round((responded / total) * 100) : 0,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Tracker API running on http://localhost:${PORT}`));
