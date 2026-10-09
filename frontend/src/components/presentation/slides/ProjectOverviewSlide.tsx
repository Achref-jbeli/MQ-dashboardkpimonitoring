import React from "react";
import { M } from "../../../theme/tokens";
import type { PublicProject } from "../../../api/publicDashboardApi";
import { SlideHeader } from "../SlideHeader";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function ProjectOverviewSlide({ projects }: { projects: PublicProject[] }) {
  const total = projects.length;
  const onTrack = projects.filter(p => p.status === "On Track").length;
  const delayed = projects.filter(p => p.status === "Delayed").length;
  const risk = projects.filter(p => p.status === "Risk").length;
  
  const completionRate = total > 0 ? Math.round((onTrack / total) * 100) : 0;

  const pieData = [
    { name: "On Time", value: onTrack, color: "#16A34A" },
    { name: "Delayed", value: delayed, color: "#DC2626" },
    { name: "At Risk", value: risk, color: "#F59E0B" }
  ].filter(d => d.value > 0);

  const Th = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: "#08475E", color: M.white, padding: "1.5vh", textAlign: "center", fontWeight: 700, fontSize: "2vh", border: `2px solid ${M.white}` }}>
      {children}
    </div>
  );

  const Td = ({ children, bg = M.white }: { children: React.ReactNode, bg?: string }) => (
    <div style={{ background: bg, padding: "2vh", textAlign: "center", fontWeight: 800, fontSize: "3.5vh", border: `2px solid #E5E7EB`, color: M.textPrimary }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
       <SlideHeader title="PEP / PROJECT OVERVIEW" />

       <div style={{ flex: 1, background: M.white, borderRadius: "2vh", padding: "4vh", boxShadow: "0 1vh 3vh rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "4vw" }}>
          
          <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: `2px solid ${M.border}`, paddingRight: "4vw" }}>
             <h3 style={{ fontSize: "2.5vh", fontWeight: 700, color: M.textPrimary, margin: "0 0 2vh 0", textAlign: "center" }}>Overall Project Status</h3>
             
             <div style={{ position: "relative", width: "100%", height: "45vh" }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius="0%" outerRadius="80%" stroke={M.white} strokeWidth={4}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
               </ResponsiveContainer>
             </div>

             <div style={{ display: "flex", justifyContent: "center", gap: "2vw", marginTop: "2vh" }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                     <div style={{ width: "2vh", height: "2vh", background: d.color }} />
                     <span style={{ fontSize: "2vh", fontWeight: 600 }}>{d.name} ({d.value})</span>
                  </div>
                ))}
             </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4vh" }}>
             <div>
                <h3 style={{ fontSize: "2.5vh", fontWeight: 700, color: M.textPrimary, margin: "0 0 2vh 0" }}>Project Summary</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", overflow: "hidden", borderRadius: "1vh", border: `2px solid #08475E` }}>
                   <Th>Total Projects</Th>
                   <Th>On Track</Th>
                   <Th>Completion %</Th>
                   
                   <Td bg="#F3F4F6">{total}</Td>
                   <Td bg="#DCFCE7">{onTrack}</Td>
                   <Td bg="#F3F4F6">{completionRate}%</Td>
                </div>
             </div>

             <div>
                <h3 style={{ fontSize: "2.5vh", fontWeight: 700, color: M.textPrimary, margin: "0 0 2vh 0" }}>Risks & Delays</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", borderRadius: "1vh", border: `2px solid #08475E` }}>
                   <Th>At Risk</Th>
                   <Th>Delayed</Th>
                   
                   <Td bg="#FEF3C7">{risk}</Td>
                   <Td bg="#FEE2E2">{delayed}</Td>
                </div>
             </div>
          </div>

       </div>
    </div>
  );
}
