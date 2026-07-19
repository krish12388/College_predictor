import { useState, useEffect } from "react";

// Local fallback cutoff data in case backend API is not running or fails
const localCutoffsData = [
  // Pilani Campus
  { branchCode: "CS", branchName: "Computer Science", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 331, 2023: 331, 2022: 320 } },
  { branchCode: "ECE", branchName: "Electronics & Communication", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 302, 2023: 296, 2022: 279 } },
  { branchCode: "EEE", branchName: "Electrical & Electronics", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 282, 2023: 272, 2022: 258 } },
  { branchCode: "ENI", branchName: "Electronics & Instrumentation", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 275, 2023: 266, 2022: 249 } },
  { branchCode: "ME", branchName: "Mechanical Engineering", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 244, 2023: 244, 2022: 223 } },
  { branchCode: "CH", branchName: "Chemical Engineering", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 217, 2023: 224, 2022: 191 } },
  { branchCode: "CE", branchName: "Civil Engineering", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 205, 2023: 213, 2022: 167 } },
  { branchCode: "MF", branchName: "Manufacturing Engineering", campus: "Pilani", degreeType: "B.E.", cutoffs: { 2024: 202, 2023: 220, 2022: 172 } },
  { branchCode: "ECO", branchName: "M.Sc. Economics", campus: "Pilani", degreeType: "M.Sc.", cutoffs: { 2024: 280, 2023: 276, 2022: 257 } },
  { branchCode: "PHY", branchName: "M.Sc. Physics", campus: "Pilani", degreeType: "M.Sc.", cutoffs: { 2024: 252, 2023: 244, 2022: 214 } },
  { branchCode: "MTH", branchName: "M.Sc. Mathematics", campus: "Pilani", degreeType: "M.Sc.", cutoffs: { 2024: 248, 2023: 244, 2022: 219 } },
  { branchCode: "CHM", branchName: "M.Sc. Chemistry", campus: "Pilani", degreeType: "M.Sc.", cutoffs: { 2024: 218, 2023: 213, 2022: 168 } },
  { branchCode: "BIO", branchName: "M.Sc. Biological Sciences", campus: "Pilani", degreeType: "M.Sc.", cutoffs: { 2024: 212, 2023: 204, 2022: 164 } },

  // Goa Campus
  { branchCode: "CS", branchName: "Computer Science", campus: "Goa", degreeType: "B.E.", cutoffs: { 2024: 310, 2023: 295, 2022: 286 } },
  { branchCode: "ECE", branchName: "Electronics & Communication", campus: "Goa", degreeType: "B.E.", cutoffs: { 2024: 279, 2023: 267, 2022: 256 } },
  { branchCode: "EEE", branchName: "Electrical & Electronics", campus: "Goa", degreeType: "B.E.", cutoffs: { 2024: 262, 2023: 252, 2022: 238 } },
  { branchCode: "ENI", branchName: "Electronics & Instrumentation", campus: "Goa", degreeType: "B.E.", cutoffs: { 2024: 253, 2023: 244, 2022: 224 } },
  { branchCode: "ME", branchName: "Mechanical Engineering", campus: "Goa", degreeType: "B.E.", cutoffs: { 2024: 223, 2023: 223, 2022: 191 } },
  { branchCode: "CH", branchName: "Chemical Engineering", campus: "Goa", degreeType: "B.E.", cutoffs: { 2024: 197, 2023: 207, 2022: 165 } },
  { branchCode: "ECO", branchName: "M.Sc. Economics", campus: "Goa", degreeType: "M.Sc.", cutoffs: { 2024: 255, 2023: 250, 2022: 230 } },
  { branchCode: "PHY", branchName: "M.Sc. Physics", campus: "Goa", degreeType: "M.Sc.", cutoffs: { 2024: 229, 2023: 223, 2022: 188 } },
  { branchCode: "MTH", branchName: "M.Sc. Mathematics", campus: "Goa", degreeType: "M.Sc.", cutoffs: { 2024: 227, 2023: 221, 2022: 187 } },
  { branchCode: "CHM", branchName: "M.Sc. Chemistry", campus: "Goa", degreeType: "M.Sc.", cutoffs: { 2024: 193, 2023: 195, 2022: 163 } },
  { branchCode: "BIO", branchName: "M.Sc. Biological Sciences", campus: "Goa", degreeType: "M.Sc.", cutoffs: { 2024: 188, 2023: 188, 2022: 164 } },

  // Hyderabad Campus
  { branchCode: "CS", branchName: "Computer Science", campus: "Hyderabad", degreeType: "B.E.", cutoffs: { 2024: 298, 2023: 284, 2022: 279 } },
  { branchCode: "ECE", branchName: "Electronics & Communication", campus: "Hyderabad", degreeType: "B.E.", cutoffs: { 2024: 273, 2023: 262, 2022: 240 } },
  { branchCode: "EEE", branchName: "Electrical & Electronics", campus: "Hyderabad", degreeType: "B.E.", cutoffs: { 2024: 257, 2023: 251, 2022: 230 } },
  { branchCode: "ENI", branchName: "Electronics & Instrumentation", campus: "Hyderabad", degreeType: "B.E.", cutoffs: { 2024: 248, 2023: 243, 2022: 222 } },
  { branchCode: "ME", branchName: "Mechanical Engineering", campus: "Hyderabad", degreeType: "B.E.", cutoffs: { 2024: 218, 2023: 218, 2022: 182 } },
  { branchCode: "CH", branchName: "Chemical Engineering", campus: "Hyderabad", degreeType: "B.E.", cutoffs: { 2024: 192, 2023: 200, 2022: 162 } },
  { branchCode: "CE", branchName: "Civil Engineering", campus: "Hyderabad", degreeType: "B.E.", cutoffs: { 2024: 188, 2023: 204, 2022: 162 } },
  { branchCode: "ECO", branchName: "M.Sc. Economics", campus: "Hyderabad", degreeType: "M.Sc.", cutoffs: { 2024: 251, 2023: 248, 2022: 220 } },
  { branchCode: "PHY", branchName: "M.Sc. Physics", campus: "Hyderabad", degreeType: "M.Sc.", cutoffs: { 2024: 224, 2023: 219, 2022: 173 } },
  { branchCode: "MTH", branchName: "M.Sc. Mathematics", campus: "Hyderabad", degreeType: "M.Sc.", cutoffs: { 2024: 223, 2023: 219, 2022: 177 } },
  { branchCode: "CHM", branchName: "M.Sc. Chemistry", campus: "Hyderabad", degreeType: "M.Sc.", cutoffs: { 2024: 190, 2023: 190, 2022: 160 } },
  { branchCode: "BIO", branchName: "M.Sc. Biological Sciences", campus: "Hyderabad", degreeType: "M.Sc.", cutoffs: { 2024: 186, 2023: 185, 2022: 158 } }
];

function App() {
  const [marks, setMarks] = useState(260);
  const [campusFilter, setCampusFilter] = useState("All");
  const [degreeFilter, setDegreeFilter] = useState("All");
  const [predictions, setPredictions] = useState([]);
  const [dataSource, setDataSource] = useState("local_fallback");
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);

  // Fallback predictor engine running client-side
  const predictClientSide = (score) => {
    return localCutoffsData.map((data) => {
      const cutoff2024 = data.cutoffs[2024];
      const cutoff2023 = data.cutoffs[2023];
      const cutoff2022 = data.cutoffs[2022];
      
      const maxCutoff = Math.max(cutoff2024 || 0, cutoff2023 || 0, cutoff2022 || 0);
      const minCutoff = Math.min(cutoff2024 || 390, cutoff2023 || 390, cutoff2022 || 390);
      const avgCutoff = Math.round(((cutoff2024 || 0) + (cutoff2023 || 0) + (cutoff2022 || 0)) / 3);

      let status = "Unavailable";
      let percentage = 0;

      if (score >= cutoff2024 + 15) {
        status = "Very High";
        percentage = 95 + Math.min(5, Math.max(0, (score - cutoff2024 - 15) * 0.3));
      } else if (score >= cutoff2024) {
        status = "High";
        percentage = 75 + ((score - cutoff2024) / 15) * 20;
      } else if (score >= cutoff2024 - 10) {
        status = "Medium";
        percentage = 40 + ((score - (cutoff2024 - 10)) / 10) * 35;
      } else if (score >= cutoff2024 - 25) {
        status = "Low";
        percentage = 10 + ((score - (cutoff2024 - 25)) / 15) * 30;
      } else {
        status = "Unavailable";
        percentage = Math.max(0, (score / cutoff2024) * 8);
      }

      percentage = Math.round(Math.min(100, Math.max(0, percentage)));

      return {
        ...data,
        prediction: {
          status,
          percentage,
          avgCutoff,
          minCutoff,
          maxCutoff
        }
      };
    });
  };

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch("https://college-predictor-a9po.onrender.com/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marks })
        });
        if (response.ok) {
          const data = await response.json();
          setPredictions(data.predictions);
          setDataSource(data.dataSource === "database" ? "MongoDB Atlas / Compass" : "Backend Server Cache");
          setIsBackendAvailable(true);
        } else {
          throw new Error("Server error");
        }
      } catch (err) {
        // Fallback to client-side logic
        const fallbackResults = predictClientSide(marks);
        setPredictions(fallbackResults);
        setDataSource("Local Engine (Offline Mode)");
        setIsBackendAvailable(false);
      }
    };

    fetchPredictions();
  }, [marks]);

  // Filtered branches
  const filteredPredictions = predictions.filter((item) => {
    const matchesCampus = campusFilter === "All" || item.campus === campusFilter;
    const matchesDegree = degreeFilter === "All" || item.degreeType === degreeFilter;
    return matchesCampus && matchesDegree;
  });

  // Calculate high chance branch count
  const safeChanceCount = predictions.filter(
    (item) => item.prediction.status === "Very High" || item.prediction.status === "High"
  ).length;

  const totalBranches = predictions.length;
  const overallSuccessRate = totalBranches > 0 ? Math.round((safeChanceCount / totalBranches) * 100) : 0;

  // Circle progress math
  const dashOffset = 377 - (377 * overallSuccessRate) / 100;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="badge-pill">BITS Pilani • Goa • Hyderabad</div>
        <h1>BITSAT College & Branch Predictor</h1>
        <p>
          Analyze your chances of getting B.E. and M.Sc. programs across BITS campuses using real cutoff data.
        </p>
      </header>

      {/* Grid */}
      <div className="dashboard-grid">
        {/* Left column - Controls */}
        <aside className="control-panel glass-panel">
          <div className="form-group">
            <label className="form-label" htmlFor="marks-input">
              Enter BITSAT Score (0-390)
            </label>
            <div className="marks-input-wrapper">
              <input
                id="marks-input"
                type="number"
                min="0"
                max="390"
                value={marks}
                onChange={(e) => setMarks(Math.min(390, Math.max(0, Number(e.target.value))))}
                className="marks-input"
              />
            </div>
            <input
              type="range"
              min="0"
              max="390"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              className="score-slider"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Campus Location</label>
            <div className="filter-btn-group">
              {["All", "Pilani", "Goa", "Hyderabad"].map((campus) => (
                <button
                  key={campus}
                  type="button"
                  className={`filter-btn ${campusFilter === campus ? "active" : ""}`}
                  onClick={() => setCampusFilter(campus)}
                >
                  {campus}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Degree Type</label>
            <div className="filter-btn-group">
              {["All", "B.E.", "M.Sc."].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  className={`filter-btn ${degreeFilter === deg ? "active" : ""}`}
                  onClick={() => setDegreeFilter(deg)}
                >
                  {deg}
                </button>
              ))}
            </div>
          </div>

          {/* Success Gauge */}
          <div className="gauge-card glass-panel">
            <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#e5e7eb" }}>Admission Chance Index</h4>
            <div className="gauge-wrapper">
              <svg className="gauge-svg">
                <circle className="gauge-bg" cx="70" cy="70" r="60" />
                <circle
                  className="gauge-fill"
                  cx="70"
                  cy="70"
                  r="60"
                  style={{
                    strokeDashoffset: dashOffset,
                    stroke: overallSuccessRate > 60 ? "#10b981" : overallSuccessRate > 25 ? "#3b82f6" : "#f59e0b"
                  }}
                />
              </svg>
              <div className="gauge-center-text">
                <span className="gauge-val">{overallSuccessRate}%</span>
                <span className="gauge-lbl">Branches Open</span>
              </div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Based on score <strong>{marks}</strong>, you have high/very high chance in {safeChanceCount} out of {totalBranches} programs.
            </p>
          </div>

          {/* Source Indicator */}
          <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#6b7280", textAlign: "center" }}>
            Engine Status:{" "}
            <span style={{ color: isBackendAvailable ? "#10b981" : "#f59e0b", fontWeight: "600" }}>
              {dataSource}
            </span>
          </div>
        </aside>

        {/* Right column - Predictions */}
        <main className="results-panel">
          {["Pilani", "Goa", "Hyderabad"].map((campusName) => {
            // Check if campus fits current campus filter
            if (campusFilter !== "All" && campusFilter !== campusName) return null;

            const campusItems = filteredPredictions.filter((item) => item.campus === campusName);

            if (campusItems.length === 0) return null;

            return (
              <section className="campus-section" key={campusName}>
                <h3 className="campus-title">
                  <span>BITS {campusName}</span>
                  <span className={`campus-badge badge-${campusName.toLowerCase()}`}>
                    {campusItems.length} Available
                  </span>
                </h3>

                <div className="prediction-list">
                  {campusItems
                    .sort((a, b) => b.prediction.percentage - a.prediction.percentage)
                    .map((item) => {
                      const { branchCode, branchName, degreeType, cutoffs, prediction } = item;
                      const { status, percentage } = prediction;

                      let statusClass = "chance-unavailable";
                      if (status === "Very High") statusClass = "chance-very-high";
                      else if (status === "High") statusClass = "chance-high";
                      else if (status === "Medium") statusClass = "chance-medium";
                      else if (status === "Low") statusClass = "chance-low";

                      return (
                        <div className="prediction-card" key={`${campusName}-${branchCode}`}>
                          {/* Branch Title */}
                          <div className="branch-info">
                            <span className="branch-name">
                              {degreeType} {branchName} ({branchCode})
                            </span>
                            <span className="branch-meta">
                              <span>BITS {campusName}</span>
                              <span>•</span>
                              <span>{degreeType} Program</span>
                            </span>
                          </div>

                          {/* 2024 Cutoff */}
                          <div className="cutoff-value">
                            <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>2024 CUTOFF</div>
                            <strong>{cutoffs[2024] || "N/A"}</strong>
                          </div>

                          {/* Historical trend */}
                          <div className="cutoff-history">
                            <div>2023: {cutoffs[2023] || "N/A"}</div>
                            <div>2022: {cutoffs[2022] || "N/A"}</div>
                          </div>

                          {/* Chances Badge */}
                          <div className="chance-container">
                            <span className={`chance-badge ${statusClass}`}>
                              {status}
                            </span>
                            <div className="probability-bar">
                              <div
                                className="probability-fill"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor:
                                    status === "Very High"
                                      ? "var(--color-very-high)"
                                      : status === "High"
                                      ? "var(--color-high)"
                                      : status === "Medium"
                                      ? "var(--color-medium)"
                                      : status === "Low"
                                      ? "var(--color-low)"
                                      : "var(--color-unavailable)"
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "0.65rem", color: "#9ca3af", marginTop: "0.2rem" }}>
                              {percentage}% probability
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            );
          })}

          {filteredPredictions.length === 0 && (
            <div className="empty-state glass-panel">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: "var(--text-muted)", marginBottom: "1rem" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <h3>No matches found</h3>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Adjust your filters or increase BITSAT Score to see predicted branches.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
