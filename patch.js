const fs = require('fs');
const path = 'frontend/src/pages/public/PublicDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add imports
code = code.replace(
  'import { getPublicDepartmentDashboard,',
  'import { getPublicBusinessUnitsDashboard, getPublicDepartmentDashboard,'
);
code = code.replace(
  'import { TaskTrendChart } from "../../components/charts/TaskTrendChart";',
  'import { TaskTrendChart } from "../../components/charts/TaskTrendChart";\nimport { BUDashboard } from "../../components/charts/BUDashboard";\nimport { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";'
);
code = code.replace(
  'import type { BusinessUnitDashboard } from "../../api/dashboardApi";',
  '' // Ensure no duplicate if added
);

// Add state for BUs
code = code.replace(
  'const [dashboardData, setDashboardData] = useState<PublicDepartmentDashboard | null>(null);',
  'const [dashboardData, setDashboardData] = useState<PublicDepartmentDashboard | null>(null);\n  const [buDashboards, setBuDashboards] = useState<any[]>([]);\n  const [currentIndex, setCurrentIndex] = useState(0);\n  const [isPaused, setIsPaused] = useState(false);'
);

// Add API call for BUs
code = code.replace(
  'const data = await getPublicDepartmentDashboard(selectedDepartmentId);',
  'const data = await getPublicDepartmentDashboard(selectedDepartmentId);\n        const buData = await getPublicBusinessUnitsDashboard(selectedDepartmentId);\n        setBuDashboards(buData);'
);

// Add loop effect
code = code.replace(
  'const projectRows = useMemo(() => {',
  `useEffect(() => {
    if (buDashboards.length <= 1 || isPaused || view !== "dashboard") return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % buDashboards.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [buDashboards.length, isPaused, view]);

  const projectRows = useMemo(() => {`
);

// Add BU loop UI
const buLoopUI = `

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Business Unit Analytics</h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: M.white, padding: "4px 8px", borderRadius: 999, border: \`1px solid \${M.border}\` }}>
                <button 
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + buDashboards.length) % buDashboards.length)}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: isPaused ? M.teal : \`\${M.teal}20\`, color: isPaused ? M.white : M.teal, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>

                <button 
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % buDashboards.length)}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronRight size={16} />
                </button>

                <div style={{ display: "flex", gap: 4, marginLeft: 8, marginRight: 8 }}>
                  {buDashboards.map((_, i) => (
                    <div 
                      key={i} 
                      style={{ width: 6, height: 6, borderRadius: "50%", background: i === currentIndex ? M.teal : M.border, transition: "background 0.3s" }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ position: "relative", marginBottom: 24 }}>
              {buDashboards.map((bu, i) => (
                <div key={bu.name} style={{ display: i === currentIndex ? "block" : "none" }}>
                  <BUDashboard data={bu} visible={i === currentIndex} />
                </div>
              ))}
            </div>
`;

code = code.replace(
  '<TaskTrendChart data={dashboardCharts.completionTrend} />',
  '<TaskTrendChart data={dashboardCharts.completionTrend} />' + buLoopUI
);

fs.writeFileSync(path, code);
