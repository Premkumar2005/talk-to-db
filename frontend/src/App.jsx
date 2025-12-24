import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000";

function App() {
  const [prompt, setPrompt] = useState("");
  const [generatedSql, setGeneratedSql] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("generate"); // 'generate' or 'run'
  const [pendingSQL, setPendingSQL] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);


  const [error, setError] = useState("");


  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a question.");
      return;
    }
    setLoading(true);
    setError("");
    setRows([]);
    try {
      const res = await axios.post(`${BACKEND_URL}/generate-sql`, { prompt });
      setGeneratedSql(res.data.generated_sql || "");
      setStep("run");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err.message || "Unknown error";
      setError("Error generating SQL: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!generatedSql.trim()) {
      alert("No SQL to run. Generate first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BACKEND_URL}/run-query`, {
        sql: generatedSql,
        confirm: false
      });

      // 🚨 Backend asks for confirmation
      if (res.data.needs_confirmation) {
        setPendingSQL(generatedSql);
        setShowConfirm(true);
        return;
      }

      // ✅ SELECT result
      setRows(res.data.data || []);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Unknown error";
      setError("Error running SQL: " + msg);
    } finally {
      setLoading(false);
    }
  };
  const handleConfirm = async () => {
    if (!pendingSQL) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BACKEND_URL}/run-query`, {
        sql: pendingSQL,
        confirm: true
      });

      // write queries don’t return rows
      if (res.data.data) {
        setRows(res.data.data);
      } else {
        setRows([]);
        alert(res.data.message || "Query executed successfully");
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Unknown error";
      setError("Error running SQL: " + msg);
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setPendingSQL(null);
    }
  };


  const firstRow = rows[0] || null;
  const columns = firstRow ? Object.keys(firstRow) : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "24px",
        background: "linear-gradient(to bottom right, #e2e8f0, #f8fafc)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)",
          border: "1px solid #e2e8f0",
        }}
      >
        <header style={{ marginBottom: "16px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#0f172a" }}>
            💬 Talk to DB
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
            Ask questions in English. The backend uses Gemini to generate SQL and runs it on MySQL.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "20px",
            alignItems: "stretch",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Natural language question</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Example: "Show total amount per user"
              </span>
            </label>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                marginTop: "6px",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #cbd5f5",
                fontSize: "14px",
                fontFamily: "system-ui, sans-serif",
                outline: "none",
              }}
              placeholder="Type your question about the users and transactions tables..."
            />

            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Working..." : "✨ Generate SQL"}
              </button>

              <button
                onClick={() => {
                  setPrompt("");
                  setGeneratedSql("");
                  setRows([]);
                  setError("");
                  setStep("generate");
                }}
                disabled={loading}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              >
                Reset
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div>
            <div style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                Generated SQL
              </span>
              {generatedSql && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  You can edit before running
                </span>
              )}
            </div>
            <textarea
              rows={5}
              value={generatedSql}
              onChange={(e) => setGeneratedSql(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #cbd5f5",
                fontFamily: "monospace",
                fontSize: "13px",
                background: "#0f172a",
                color: "#e5e7eb",
              }}
              placeholder="SQL will appear here after generation..."
            />

            <button
              onClick={handleRun}
              disabled={loading || !generatedSql.trim()}
              style={{
                marginTop: "10px",
                padding: "8px 14px",
                borderRadius: "999px",
                border: "none",
                background: "#16a34a",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                opacity: loading || !generatedSql.trim() ? 0.6 : 1,
              }}
            >
              ▶ Run on MySQL
            </button>
          </div>
        </section>

        <section style={{ marginTop: "24px" }}>
          <h2
            style={{
              fontSize: "16px",
              margin: "0 0 8px 0",
              color: "#0f172a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Results
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {rows.length ? `${rows.length} row(s)` : "No data yet"}
            </span>
          </h2>

          {rows.length === 0 ? (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px dashed #cbd5f5",
                background: "#f8fafc",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              Run a query to see table output here.
            </div>
          ) : (
            <div
              style={{
                maxHeight: "260px",
                overflow: "auto",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "white",
              }}
            >
              <table>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "1px solid #e2e8f0",
                          color: "#64748b",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((col) => (
                        <td
                          key={col}
                          style={{
                            padding: "8px 10px",
                            borderBottom: "1px solid #e5e7eb",
                            fontSize: "13px",
                            color: "#0f172a",
                          }}
                        >
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer style={{ marginTop: "18px", fontSize: "11px", color: "#94a3b8" }}>
          <div>Backend: FastAPI + Gemini Inference API + MySQL | Frontend: React + Vite</div>
        </footer>
      </div>
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              width: "320px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>⚠️ Confirm Action</h3>
            <p style={{ fontSize: "14px", color: "#334155" }}>
              This query will modify the database. Are you sure?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setPendingSQL(null);
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                style={{ background: "#dc2626", color: "white" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
