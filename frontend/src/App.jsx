import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [step, setStep] = useState("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    marks: "",
    college: "BITS Pilani",
    programme: "B.E. Computer Science",
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
          college: formData.college,
          programme: formData.programme,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Prediction failed");

      const topMatch = data.predictions?.[0] || null;
      setResult({
        student: { ...formData, marks: Number(formData.marks) },
        prediction: topMatch,
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

            <div className="form-group">
              <label className="form-label" htmlFor="college">Targeted College</label>
              <select id="college" name="college" value={formData.college} onChange={handleInputChange} className="marks-input">
                <option value="BITS Pilani">BITS Pilani</option>
                <option value="BITS Goa">BITS Goa</option>
                <option value="BITS Hyderabad">BITS Hyderabad</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="programme">Targeted Programme</label>
              <select id="programme" name="programme" value={formData.programme} onChange={handleInputChange} className="marks-input">
                <option value="B.E. Computer Science">B.E. Computer Science</option>
                <option value="B.E. Electronics & Communication">B.E. Electronics & Communication</option>
                <option value="B.E. Electrical & Electronics">B.E. Electrical & Electronics</option>
                <option value="B.E. Mechanical">B.E. Mechanical</option>
                <option value="B.E. Chemical">B.E. Chemical</option>
                <option value="B.E. Civil">B.E. Civil</option>
                <option value="B.E. Electronics & Instrumentation">B.E. Electronics & Instrumentation</option>
                <option value="B.E. Manufacturing">B.E. Manufacturing</option>
                <option value="B. Pharm">B. Pharm</option>
                <option value="M.Sc. Biological Sciences">M.Sc. Biological Sciences</option>
                <option value="M.Sc. Chemistry">M.Sc. Chemistry</option>
                <option value="M.Sc. Economics">M.Sc. Economics</option>
                <option value="M.Sc. Mathematics">M.Sc. Mathematics</option>
                <option value="M.Sc. Physics">M.Sc. Physics</option>
                <option value="Mathematics & Computing">Mathematics & Computing</option>
              </select>
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
          <h2>Prediction Result</h2>
          <p className="result-intro">
            {result?.student?.name || "Student"}, based on your BITSAT score of {result?.student?.marks || 0}, your predicted result is:
          </p>

          {result?.prediction ? (
            <>
              <div className="result-card">
                <h3>{result.prediction.campus} • {result.prediction.branchName}</h3>
                <p className="result-subtitle">{result.prediction.degreeType}</p>
                <div className="probability-pill">{result.prediction.prediction?.percentage || 0}% Probability</div>
                <p className="result-status">Status: {result.prediction.prediction?.status || "Unavailable"}</p>
                <p className="result-status">
                  Target match: {result.prediction.prediction?.targetMatch?.college ? "College matched" : "College not matched"} • {result.prediction.prediction?.targetMatch?.programme ? "Programme matched" : "Programme not matched"}
                </p>
              </div>
              <div className="result-meta">
                <p><strong>Source:</strong> {result.dataSource}</p>
                <p><strong>Targeted College:</strong> {result.student.college}</p>
                <p><strong>Targeted Programme:</strong> {result.student.programme}</p>
              </div>
            </>
          ) : (
            <p className="error-text">No prediction available yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
