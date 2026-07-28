import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [step, setStep] = useState("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    marks: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          marks: Number(formData.marks),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Prediction failed");

      setResult({
        student: { ...formData, marks: Number(formData.marks) },
        predictions: data.predictions || [],
        dataSource: data.dataSource,
      });
      setStep("result");
    } catch (err) {
      setError(err.message || "Unable to generate prediction right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="badge-pill">BITS Pilani • Goa • Hyderabad</div>
        <h1>BITSAT College Predictor</h1>
        <p>
          Enter student details and get a predicted college/programme with admission probability driven by the backend cutoff PDF.
        </p>
      </header>

      {step === "form" ? (
        <div className="glass-panel form-panel">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Student Name</label>
              <input id="name" name="name" value={formData.name} onChange={handleInputChange} className="marks-input" required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="marks-input" required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="marks">BITSAT Marks</label>
              <input id="marks" name="marks" type="number" min="0" max="390" value={formData.marks} onChange={handleInputChange} className="marks-input" required />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Predicting..." : "Predict Admission Chance"}
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-panel result-panel">
          <button className="back-btn" onClick={() => setStep("form")}>← Back to Form</button>
          <h2>Prediction Results</h2>
          <p className="result-intro">
            {result?.student?.name || "Student"}, based on your BITSAT score of <strong>{result?.student?.marks || 0}</strong>, here are your predicted colleges and programmes:
          </p>

          {result?.predictions && result.predictions.length > 0 ? (
            <div className="predictions-list">
              {result.predictions.map((pred, idx) => (
                <div key={idx} className="result-card">
                  <div className="result-header">
                    <h3>{pred.campus} • {pred.branchName}</h3>
                    <div className="probability-pill">{pred.prediction?.percentage || 0}%</div>
                  </div>
                  <p className="result-subtitle">{pred.degreeType}</p>
                  <p className="result-status">Status: <strong>{pred.prediction?.status || "Unavailable"}</strong></p>
                  {pred.prediction?.latestCutoff && (
                    <p className="result-status">Cutoff: {pred.prediction.latestCutoff}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="error-text">No predictions available.</p>
          )}
          
          <div className="result-meta">
            <p><strong>Data Source:</strong> {result?.dataSource}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
