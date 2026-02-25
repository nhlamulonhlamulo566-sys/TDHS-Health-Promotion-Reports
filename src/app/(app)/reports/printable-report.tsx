
"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useState } from "react";

interface ReportData {
  summary: any;
  breakdown: { [key: string]: number };
  activities: any[];
  config: any;
  users: any[];
}

interface PrintableReportProps {
  data: ReportData;
  onClose: () => void;
}

// helper labels used in various places
const healthyTopicsList = [
  { id: "physical-activity", label: "Importance of Physical Activity" },
  { id: "obesity-overweight", label: "Obesity & Overweight" },
  { id: "nutrition", label: "Nutrition and Sugar" },
  { id: "salt-reduction", label: "Salt Reduction" },
  { id: "substance-abuse", label: "Tobacco, Alcohol Abuse & Substance Abuse" },
  { id: "sexual-behaviour", label: "Safe Sexual Behaviour" },
];

export function PrintableReport({ data, onClose }: PrintableReportProps) {
  const { activities } = data;

  // Section 1: Health Education on Healthy Lifestyle
  const section1 = healthyTopicsList.map((topic) => {
    let facilityCount = 0;
    let schoolCount = 0;

    activities.forEach((act) => {
      if (act.type === "Health Talk") {
        const topicsArr = act.details.topics || [];
        if (topicsArr.some((t: any) => t.id === topic.id)) {
          facilityCount += act.details.peopleReached || 0;
        }
      } else if (act.type === "School Visit") {
        const topicsArr = act.details.topics || [];
        if (topicsArr.some((t: any) => t.id === topic.id)) {
          schoolCount += act.details.studentsReached || 0;
        }
      }
    });

    return {
      label: topic.label,
      facilityCount,
      schoolCount,
      total: facilityCount + schoolCount,
    };
  });

  // validation: section1 only aggregates from Health Talk and School Visit
  const invalidSection1 = section1.some(row => row.facilityCount < 0 || row.schoolCount < 0);
  if (invalidSection1) {
    console.warn("Unexpected values in section1 counts", section1);
  }

  // Helper to format a topic array or single topic for display
  const formatTopics = (topics: any[], otherTopic?: string) => {
    if (!topics) return "";
    return topics
      .map((t) => {
        if (t.id === "other" && otherTopic) {
          return otherTopic;
        }
        return t.label || t;
      })
      .join(", ");
  };

  // Section 2: Health Talk on other Topics (anything that is not one of the healthy topics or 'other')
  const section2 = activities
    .filter((act) => {
      if (act.type !== "Health Talk") return false;
      const topicsArr = act.details.topics || [];
      const ids = topicsArr.map((t: any) => t.id);
      const hasHealthy = ids.some((id: string) => healthyTopicsList.map(t => t.id).includes(id));
      const hasOther = ids.includes("other");
      return hasOther || !hasHealthy;
    })
    .map((act) => ({
      date: act.date,
      venue: act.details.venue,
      activity: formatTopics(act.details.topics, act.details.otherTopic),
      people: act.details.peopleReached || 0,
    }));

  // Section 3 & 4: School visits split by topic membership
  const schoolVisits = activities.filter((a) => a.type === "School Visit");
  const section3 = schoolVisits.filter((sv) => {
    const ids = (sv.details.topics || []).map((t: any) => t.id);
    return ids.every((id: string) =>
      healthyTopicsList.map((t) => t.id).includes(id)
    );
  });
  const section4 = schoolVisits.filter((sv) => {
    const ids = (sv.details.topics || []).map((t: any) => t.id);
    // include those that have at least one non-healthy or "other"
    return ids.some(
      (id: string) =>
        !healthyTopicsList.map((t) => t.id).includes(id) || id === "other"
    );
  });

  // Section 5 & 6: Creche visits normal vs other
  const crecheVisits = activities.filter((a) => a.type === "Creche Visit");
  const section5 = crecheVisits.filter(
    (cv) => !cv.details.topic || !cv.details.topic.includes("Other")
  );
  const section6 = crecheVisits.filter(
    (cv) => cv.details.topic && cv.details.topic.includes("Other")
  );

  // Helper to build generic listing for other activity types
  const buildList = (type: string) => {
    return activities
      .filter((a) => a.type === type)
      .map((a) => ({ ...a.details, Date: a.date }));
  };

  const section7 = buildList("Health Campaign");
  const section8 = buildList("Social Mobilization");
  const section9 = buildList("IMCI Training");
  const section10 = buildList("Outbreak Response");
  const section11 = buildList("Support Group");
  const section12 = buildList("Corner to Corner");
  const section13 = buildList("TISH");
  const section14 = buildList("Health Special Project");

  // cell formatting helper
  const formatValue = (key: string, raw: any) => {
    if (key === "services" && Array.isArray(raw)) {
      return raw
        .map((s: any) => {
          const label = s.label || s.id || JSON.stringify(s);
          const count = s.peopleReached != null ? ` (${s.peopleReached})` : "";
          return `${label}${count}`;
        })
        .join("; ");
    }
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            if (item.label) {
              const count = item.peopleReached != null ? ` (${item.peopleReached})` : "";
              return `${item.label}${count}`;
            }
            return JSON.stringify(item);
          }
          return String(item);
        })
        .join(", ");
    }
    if (typeof raw === "object" && raw !== null) {
      if (raw.label) return raw.label;
      return JSON.stringify(raw);
    }
    return raw;
  };

  return (
    <div className="printable-report p-8">
      {/* print-specific stylesheet for any printer */}
      <style>{`
        @media print {
          /* hide interactive controls */
          .printable-report button { display: none !important; }

          /* ensure full width and remove margins/padding for tables */
          .printable-report table { width: 100%; page-break-inside: auto; border-collapse: collapse; }
          .printable-report tr { page-break-inside: avoid; page-break-after: auto; }
          .printable-report thead { display: table-header-group; }
          .printable-report tfoot { display: table-footer-group; }

          /* allow browser defaults for page margins */
          @page { size: auto; margin: 10mm; }

          /* force background colors or patterns to print if possible */
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }

          /* remove any shadows or extraneous UI elements */
          .printable-report * { box-shadow: none !important; }
        }
      `}</style>
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Print
        </Button>
      </div>

      {/* Section 1 */}
      <h2 className="text-xl font-bold mb-2">1. Health Education on Healthy Lifestyle</h2>
      <table className="w-full table-auto border-collapse mb-8 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Indicator</th>
            <th className="border px-2 py-1">Number of people reached at facilities</th>
            <th className="border px-2 py-1">Number of learners reached at schools</th>
            <th className="border px-2 py-1">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {section1.map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{row.label}</td>
              <td className="border px-2 py-1 text-center">{row.facilityCount}</td>
              <td className="border px-2 py-1 text-center">{row.schoolCount}</td>
              <td className="border px-2 py-1 text-center">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section 2 */}
      <h2 className="text-xl font-bold mb-2">2. Health Talk on other Topics</h2>
      <table className="w-full table-auto border-collapse mb-8 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Venue</th>
            <th className="border px-2 py-1">Activity</th>
            <th className="border px-2 py-1">No of people reached</th>
          </tr>
        </thead>
        <tbody>
          {section2.map((r, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{format(new Date(r.date), "yyyy-MM-dd")}</td>
              <td className="border px-2 py-1">{r.venue}</td>
              <td className="border px-2 py-1">{r.activity}</td>
              <td className="border px-2 py-1 text-center">{r.people}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section 3: Schools */}
      <h2 className="text-xl font-bold mb-2">3. Schools</h2>
      <table className="w-full table-auto border-collapse mb-8 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Name of the school</th>
            <th className="border px-2 py-1">Grade</th>
            <th className="border px-2 py-1">TOPICS COVERED</th>
            <th className="border px-2 py-1">No of people reached</th>
          </tr>
        </thead>
        <tbody>
          {section3.map((sv, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{format(new Date(sv.date), "yyyy-MM-dd")}</td>
              <td className="border px-2 py-1">{sv.details.schoolName}</td>
              <td className="border px-2 py-1">{Array.isArray(sv.details.gradeLevel) ? sv.details.gradeLevel.join(", ") : sv.details.gradeLevel}</td>
              <td className="border px-2 py-1">{formatTopics(sv.details.topics, sv.details.otherTopic)}</td>
              <td className="border px-2 py-1 text-center">{sv.details.studentsReached}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section 4: Schools Other Topics */}
      <h2 className="text-xl font-bold mb-2">4. Schools: Other Topics</h2>
      <table className="w-full table-auto border-collapse mb-8 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Name of the school</th>
            <th className="border px-2 py-1">Grade</th>
            <th className="border px-2 py-1">TOPICS COVERED</th>
            <th className="border px-2 py-1">No of people reached</th>
          </tr>
        </thead>
        <tbody>
          {section4.map((sv, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{format(new Date(sv.date), "yyyy-MM-dd")}</td>
              <td className="border px-2 py-1">{sv.details.schoolName}</td>
              <td className="border px-2 py-1">{Array.isArray(sv.details.gradeLevel) ? sv.details.gradeLevel.join(", ") : sv.details.gradeLevel}</td>
              <td className="border px-2 py-1">{formatTopics(sv.details.topics, sv.details.otherTopic)}</td>
              <td className="border px-2 py-1 text-center">{sv.details.studentsReached}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section 5: Creches */}
      <h2 className="text-xl font-bold mb-2">5. Creches</h2>
      <table className="w-full table-auto border-collapse mb-8 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Name of the creche</th>
            <th className="border px-2 py-1">Age Group</th>
            <th className="border px-2 py-1">TOPICS COVERED</th>
            <th className="border px-2 py-1">Number of children minders reached</th>
            <th className="border px-2 py-1">Number of parents reached</th>
            <th className="border px-2 py-1">Number of children reached</th>
          </tr>
        </thead>
        <tbody>
          {section5.map((cv, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{format(new Date(cv.date), "yyyy-MM-dd")}</td>
              <td className="border px-2 py-1">{cv.details.crecheName}</td>
              <td className="border px-2 py-1">{cv.details.ageGroup}</td>
              <td className="border px-2 py-1">{(cv.details.topic || []).join(", ")} {cv.details.otherTopic ? `(${cv.details.otherTopic})` : ""}</td>
              <td className="border px-2 py-1 text-center">{cv.details.childrenMindersReached}</td>
              <td className="border px-2 py-1 text-center">{cv.details.parentsReached}</td>
              <td className="border px-2 py-1 text-center">{cv.details.childrenReached}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section 6: Creches Other topics */}
      <h2 className="text-xl font-bold mb-2">6. Creches: Other topics</h2>
      <table className="w-full table-auto border-collapse mb-8 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Name of the creche</th>
            <th className="border px-2 py-1">Age Group</th>
            <th className="border px-2 py-1">Topics Covered</th>
            <th className="border px-2 py-1">Number of children minders reached</th>
            <th className="border px-2 py-1">Number of parents reached</th>
            <th className="border px-2 py-1">Number of children reached</th>
          </tr>
        </thead>
        <tbody>
          {section6.map((cv, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{format(new Date(cv.date), "yyyy-MM-dd")}</td>
              <td className="border px-2 py-1">{cv.details.crecheName}</td>
              <td className="border px-2 py-1">{cv.details.ageGroup}</td>
              <td className="border px-2 py-1">{(cv.details.topic || []).join(", ")} {cv.details.otherTopic ? `(${cv.details.otherTopic})` : ""}</td>
              <td className="border px-2 py-1 text-center">{cv.details.childrenMindersReached}</td>
              <td className="border px-2 py-1 text-center">{cv.details.parentsReached}</td>
              <td className="border px-2 py-1 text-center">{cv.details.childrenReached}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Following sections (7 through 14) use generic lists */}
      {[
        {
          title: "7. Health Calendar Campaigns",
          data: section7,
          columns: [
            { key: "Date", label: "Date" },
            { key: "campaignType", label: "Campaign Type" },
            { key: "targetGroup", label: "Target group" },
            { key: "venue", label: "Venue" },
            { key: "peopleReached", label: "Number of people reached" },
          ],
        },
        {
          title: "8. Social Mobilization",
          data: section8,
          columns: [
            { key: "Date", label: "Date" },
            { key: "campaignType", label: "Campaign Type" },
            { key: "mobilizationMethod", label: "Mobilization type" },
            { key: "topic", label: "Topic covered" },
            { key: "peopleReached", label: "Number of people reached" },
          ],
        },
        {
          title: "9. IMCI",
          data: section9,
          columns: [
            { key: "Date", label: "Date" },
            { key: "venue", label: "Venue" },
            { key: "peopleReached", label: "Number of people reached" },
            { key: "traineeType", label: "Who was trained" },
          ],
        },
        {
          title: "10. Outbreak Response",
          data: section10,
          columns: [
            { key: "Date", label: "Date" },
            { key: "diseaseType", label: "Disease/Outbreak type" },
            { key: "topics", label: "Topics Covered" },
            { key: "peopleReached", label: "Number of people reached" },
          ],
        },
        {
          title: "11. Support group",
          data: section11,
          columns: [
            { key: "Date", label: "Date" },
            { key: "venue", label: "Venue" },
            { key: "supportGroupType", label: "Support group type" },
            { key: "topic", label: "Topic covered" },
            { key: "physicalActivity", label: "Physical activity" },
            { key: "peopleReached", label: "People reached" },
          ],
        },
        {
          title: "12. Corner to Corner",
          data: section12,
          columns: [
            { key: "Date", label: "Date" },
            { key: "venue", label: "Venue" },
            { key: "services", label: "Services rendered" },
            { key: "peopleReached", label: "No reached" },
          ],
        },
        {
          title: "13. TISH",
          data: section13,
          columns: [
            { key: "Date", label: "Date" },
            { key: "venue", label: "Venue" },
            { key: "services", label: "Services rendered" },
            { key: "peopleReached", label: "No. Reached" },
          ],
        },
        {
          title: "14. Special Projects",
          data: section14,
          columns: [
            { key: "Date", label: "Date" },
            { key: "projectName", label: "Project Name" },
            { key: "description", label: "Projects Description" },
            { key: "peopleReached", label: "Number of people Reached" },
          ],
        },
      ].map((sec, idx) => (
        <section key={idx} className="mb-8">
          <h2 className="text-xl font-bold mb-2">{sec.title}</h2>
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr>
                {sec.columns.map((col) => (
                  <th key={col.key} className="border px-2 py-1">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sec.data.map((row: any, ridx: number) => (
                <tr key={ridx}>
                  {sec.columns.map((col) => {
                    const raw = row[col.key];
                    let display = raw;
                    if (col.key === "Date") {
                      display = format(new Date(row.Date), "yyyy-MM-dd");
                    } else {
                      display = formatValue(col.key, raw);
                    }
                    return (
                      <td key={col.key} className="border px-2 py-1">
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
