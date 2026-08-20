import { useState, useEffect, useMemo } from "react";
import { Plus, Search, X, Trash2, Pencil, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { api } from "./api";

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Rejected"];

const STAGE_COLOR = {
  Applied: "#8A8577",
  Screening: "#C08A3E",
  Interview: "#2197a4",
  Offer: "#1e793b",
  Rejected: "#ff4830",
};

const STAGE_ORDER = ["Applied", "Screening", "Interview", "Offer"];

const emptyForm = { company: "", role: "", status: "Applied", dateApplied: "", link: "", notes: "" };

function StagePipeline({ status }) {
  const rejected = status === "Rejected";
  const activeIndex = rejected ? STAGE_ORDER.length : STAGE_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STAGE_ORDER.map((s, i) => {
        const filled = i <= activeIndex && !rejected;
        return (
          <div
            key={s}
            title={s}
            style={{
              height: 6,
              flex: 1,
              borderRadius: 2,
              background: filled ? STAGE_COLOR[s] : "#D8D2C2", /*ones for filler don't change*/
              opacity: rejected ? 0.4 : 1,
            }}
          />
        );
      })}
      {rejected && (
        <span
          className="ml-1 text-[10px] tracking-wide font-semibold px-1.5 py-0.5 rounded"
          style={{ color: STAGE_COLOR.Rejected, background: "#683b352d" }}/*bg of closed box*/
        >
          CLOSED
        </span>
      )}
    </div>
  );
}

export default function App() {
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, interviewing: 0, responseRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setError(null);
    try {
      const [list, s] = await Promise.all([api.list(), api.stats()]);
      setApps(list);
      setStats(s);
    } catch (e) {
      setError("Can't reach the backend. Is the server running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return apps
      .filter((a) => (filter === "All" ? true : a.status === filter))
      .filter((a) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      });
  }, [apps, query, filter]);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(app) {
    setForm(app);
    setEditingId(app.id);
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.update(editingId, form);
      } else {
        await api.create(form);
      }
      setModalOpen(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await api.remove(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
/*background colour + default text*/
  return (
    <div className="min-h-screen w-full" style={{ background: "#000000", color: "#8A8577" }}>
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="ff-mono text-xs tracking-[0.2em] mb-1" style={{ color: "#8A8577" }}>
              APPLICATION TRACKER
            </div>
            <h1 className="ff-display text-4xl" style={{ fontWeight: 600 }}>
              Case Log
            </h1>
          </div>
          <div className="flex gap-6 ff-mono">
            <Stat label="TOTAL" value={stats.total} />
            <Stat label="ACTIVE" value={stats.active} />
            <Stat label="INTERVIEWING+" value={stats.interviewing} />
            <Stat label="RESPONSE RATE" value={`${stats.responseRate}%`} />
          </div>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 mb-6 text-sm"
            style={{ background: "#A6483B18", border: "1px solid #A6483B55", color: "#A6483B" }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-2 flex-1 min-w-[200px]"
            style={{ background: "#040303", border: "3px solid #8A8577" }}/*search bar*/
          >
            <Search size={16} style={{ color: "#8A8577" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}/*search symbol*/
              placeholder="Search company or role"
              className="bg-transparent w-full text-sm outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm ff-mono"
            style={{ background: "#050505", border: "3px solid #8A8577" }}/*sorting box*/
          >
            <option>All</option>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
            style={{ background: "#1E2A28" }}
          >
            <Plus size={16} /> Add application
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center" style={{ color: "#8A8577" }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "#8A8577" }}>
            <FileText className="mx-auto mb-3" size={28} />
            <p className="ff-display text-lg mb-1">Nothing filed here yet</p>
            <p className="text-sm">Add an application to start the log.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="p-4 transition-colors"
                style={{ background: "#F5F2E9", border: "1px solid #D8D2C2", borderLeft: "3px solid #1E2A28" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="ff-display text-lg" style={{ fontWeight: 600 }}>
                        {a.company}
                      </h3>
                      <span
                        className="ff-mono text-[10px] tracking-wide px-1.5 py-0.5 rounded"
                        style={{ color: STAGE_COLOR[a.status], background: `${STAGE_COLOR[a.status]}22` }}
                      >
                        {a.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#5B564A" }}>
                      {a.role}
                    </p>
                    {a.dateApplied && (
                      <p className="ff-mono text-[11px] mt-1" style={{ color: "#8A8577" }}>
                        Applied {a.dateApplied}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer" className="p-1.5" style={{ color: "#8A8577" }}>
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button onClick={() => openEdit(a)} className="p-1.5" style={{ color: "#8A8577" }}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(a.id)} className="p-1.5" style={{ color: "#A6483B" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <StagePipeline status={a.status} />
                </div>
                {a.notes && (
                  <p className="text-sm mt-3 pt-3" style={{ color: "#5B564A", borderTop: "1px solid #D8D2C2" }}>
                    {a.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#1E2A2899" }}
        >
          <form onSubmit={save} className="w-full max-w-md p-6" style={{ background: "#F5F2E9", border: "1px solid #D8D2C2" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="ff-display text-xl" style={{ fontWeight: 600 }}>
                {editingId ? "Edit entry" : "New entry"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} style={{ color: "#8A8577" }}>
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3">
              <Field label="Company">
                <input
                  autoFocus
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #D8D2C2" }}
                  required
                />
              </Field>
              <Field label="Role">
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #D8D2C2" }}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ background: "#fff", border: "1px solid #D8D2C2" }}
                  >
                    {STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date applied">
                  <input
                    type="date"
                    value={form.dateApplied || ""}
                    onChange={(e) => setForm({ ...form, dateApplied: e.target.value })}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ background: "#fff", border: "1px solid #D8D2C2" }}
                  />
                </Field>
              </div>
              <Field label="Job link">
                <input
                  value={form.link || ""}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #D8D2C2" }}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #D8D2C2" }}
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "#1E2A28" }}
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add to log"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] tracking-wide" style={{ color: "#8A8577" }}>
        {label}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="ff-mono text-[10px] tracking-wide block mb-1" style={{ color: "#8A8577" }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}
