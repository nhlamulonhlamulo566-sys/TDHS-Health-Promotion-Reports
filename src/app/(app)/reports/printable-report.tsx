
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
        // sum peopleReached for this specific topic from the health talk's topics array
        const matching = topicsArr.find((t: any) => t.id === topic.id);
        if (matching) {
          facilityCount += Number(matching.peopleReached || 0);
        }
      } else if (act.type === "School Visit") {
        const topicsArr = act.details.topics || [];
        // sum studentsReached for this specific topic from the school visit's topics array
        const matching = topicsArr.find((t: any) => t.id === topic.id);
        if (matching) {
          schoolCount += Number(matching.studentsReached || 0);
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

  // Section 2: Health Talk on other Topics (per-topic rows)
  const section2 = activities
    .filter((act) => act.type === "Health Talk")
    .flatMap((act) => {
      const topicsArr = act.details.topics || [];
      if (Array.isArray(topicsArr) && topicsArr.length > 0) {
        return topicsArr
          .filter((t: any) => {
            const id = t.id;
            const isHealthy = healthyTopicsList.map((h) => h.id).includes(id);
            return id === "other" || !isHealthy;
          })
          .map((t: any) => ({
            date: act.date,
            venue: act.details.venue,
            activity: t.id === "other" ? act.details.otherTopic || "Other" : t.label || t.id,
            people: Number(t.peopleReached || 0),
          }));
      }
      // fallback: if no topics array, include the activity-level entry
      return [
        {
          date: act.date,
          venue: act.details.venue,
          activity: act.details.otherTopic || act.details.topic || "Other",
          people: act.details.peopleReached || 0,
        },
      ];
    });

  // Section 3 & 4: School visits split by topic membership
  const schoolVisits = activities.filter((a) => a.type === "School Visit");
  // Section 3: Schools (healthy topics) - expand to per-topic rows
  const section3 = schoolVisits.flatMap((sv) => {
    const topics = sv.details.topics || [];
    if (Array.isArray(topics) && topics.length > 0) {
      return topics
        .filter((t: any) => healthyTopicsList.map((h) => h.id).includes(t.id))
        .map((t: any) => ({
          date: sv.date,
          schoolName: sv.details.schoolName,
          gradeLevel: sv.details.gradeLevel,
          topic: t.id === "other" ? sv.details.otherTopic || "Other" : t.label || t.id,
          studentsReached: Number(t.studentsReached || 0),
        }));
    }
    // fallback include whole activity
    return [
      {
        date: sv.date,
        schoolName: sv.details.schoolName,
        gradeLevel: sv.details.gradeLevel,
        topic: sv.details.otherTopic || sv.details.topic || "Other",
        studentsReached: sv.details.studentsReached || 0,
      },
    ];
  });

  // Section 4: Schools Other Topics - expand to per-topic rows for non-healthy or other
  const section4 = schoolVisits.flatMap((sv) => {
    const topics = sv.details.topics || [];
    if (Array.isArray(topics) && topics.length > 0) {
      return topics
        .filter((t: any) => !healthyTopicsList.map((h) => h.id).includes(t.id) || t.id === "other")
        .map((t: any) => ({
          date: sv.date,
          schoolName: sv.details.schoolName,
          gradeLevel: sv.details.gradeLevel,
          topic: t.id === "other" ? sv.details.otherTopic || "Other" : t.label || t.id,
          studentsReached: Number(t.studentsReached || 0),
        }));
    }
    // fallback include whole activity
    return [
      {
        date: sv.date,
        schoolName: sv.details.schoolName,
        gradeLevel: sv.details.gradeLevel,
        topic: sv.details.otherTopic || sv.details.topic || "Other",
        studentsReached: sv.details.studentsReached || 0,
      },
    ];
  });

  

  // Helper: expand activities by their topics into per-topic rows when available.
  const buildPerTopicList = (type: string) => {
    return activities
      .filter((a) => a.type === type)
      .flatMap((act) => {
        const topics = act.details.topics || [];
        if (Array.isArray(topics) && topics.length > 0) {
          return topics.map((t: any) => ({
            Date: act.date,
            ...act.details,
            topic: t.id === "other" ? act.details.otherTopic || "Other" : t.label || t.id,
            peopleReached: t.peopleReached != null ? Number(t.peopleReached) : act.details.peopleReached,
            studentsReached: t.studentsReached != null ? Number(t.studentsReached) : act.details.studentsReached,
          }));
        }
        return [{ Date: act.date, ...act.details }];
      });
  };

  // Section 5 & 6: Creche visits normal vs other
  const crecheVisits = activities.filter((a) => a.type === "Creche Visit");
  // Expand creche visits by topics when available, then split into normal vs other
  const perCreche = buildPerTopicList("Creche Visit");
  const section5 = perCreche.filter((cv) => String(cv.topic || "").toLowerCase() !== "other");
  const section6 = perCreche.filter((cv) => String(cv.topic || "").toLowerCase() === "other");

  // Helper to build generic listing for other activity types
  const buildList = (type: string) => {
    return activities
      .filter((a) => a.type === type)
      .map((a) => ({ ...a.details, Date: a.date }));
  };

  // Use per-topic expanded rows for most activity types (other than Health Talk and School Visit)
  const section7 = buildPerTopicList("Health Campaign");
  const section8 = buildPerTopicList("Social Mobilization");
  const section9 = buildPerTopicList("IMCI Training");
  const section10 = buildPerTopicList("Outbreak Response");
  const section11 = buildPerTopicList("Support Group");
  const section12 = buildPerTopicList("Corner to Corner");
  const section13 = buildPerTopicList("TISH");
  const section14 = buildPerTopicList("Health Special Project");

  // cell formatting helper
  const formatValue = (key: string, raw: any, row?: any) => {
    // Special handling for people counts: prefer topic-level counts when present
    if (key === "peopleReached") {
      if (raw != null) return raw;
      if (row) {
        // If this row lists services with individual counts, sum them for the peopleReached cell
        if (Array.isArray(row.services) && row.services.length > 0) {
          return row.services.reduce((acc: number, s: any) => acc + Number(s.peopleReached ?? s.count ?? s.number ?? 0), 0);
        }
        // Health Talk topics -> sum peopleReached
        if (Array.isArray(row.topics) && row.topics.some((t: any) => t.peopleReached != null)) {
          return row.topics.reduce((acc: number, t: any) => acc + Number(t.peopleReached || 0), 0);
        }
        // School visits topics -> sum studentsReached
        if (Array.isArray(row.topics) && row.topics.some((t: any) => t.studentsReached != null)) {
          return row.topics.reduce((acc: number, t: any) => acc + Number(t.studentsReached || 0), 0);
        }
        if (row.studentsReached != null) return row.studentsReached;
        if (row.childrenReached != null) return row.childrenReached;
        if (row.listenership != null) return row.listenership;
      }
      return raw;
    }
    
    
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
          // if the array contains the literal 'Other', prefer the matching other... field from the row when available
          if (typeof item === 'string' && item.toLowerCase() === 'other' && row) {
            return (
              row.otherTopic || row.otherCampaignType || row.otherMobilizationMethod || row.otherSupportGroupType || row.otherPhysicalActivity || item
            );
          }
          return String(item);
        })
        .join(", ");
    }
    if (typeof raw === "object" && raw !== null) {
      if (raw.label) return raw.label;
      return JSON.stringify(raw);
    }
    // If this is a simple topic field and is 'Other', prefer to show the specified otherTopic
    if (key === "topic" && typeof raw === "string") {
      if ((raw.toLowerCase && raw.toLowerCase() === "other") && row && row.otherTopic) return row.otherTopic;
      return raw;
    }
    return raw;
  };

  const formatDateSafe = (d: any) => {
    const val = d || d === 0 ? d : undefined;
    const parsed = val ? new Date(val) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return "";
    return format(parsed, "yyyy-MM-dd");
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
              <td className="border px-2 py-1">{sv.schoolName}</td>
              <td className="border px-2 py-1">{Array.isArray(sv.gradeLevel) ? sv.gradeLevel.join(", ") : sv.gradeLevel}</td>
                      <td className="border px-2 py-1">{sv.topic}</td>
                      <td className="border px-2 py-1 text-center">{sv.studentsReached}</td>
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
              <td className="border px-2 py-1">{sv.schoolName}</td>
              <td className="border px-2 py-1">{Array.isArray(sv.gradeLevel) ? sv.gradeLevel.join(", ") : sv.gradeLevel}</td>
              <td className="border px-2 py-1">{sv.topic}</td>
              <td className="border px-2 py-1 text-center">{sv.studentsReached}</td>
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
              <td className="border px-2 py-1">{formatDateSafe(cv.Date ?? cv.date)}</td>
              <td className="border px-2 py-1">{cv.crecheName}</td>
              <td className="border px-2 py-1">{cv.ageGroup}</td>
              <td className="border px-2 py-1">{String(cv.topic || cv.topics || "")}{cv.otherTopic ? ` (${cv.otherTopic})` : ""}</td>
              <td className="border px-2 py-1 text-center">{cv.childrenMindersReached ?? cv.childrenMindersReached === 0 ? cv.childrenMindersReached : cv.peopleReached}</td>
              <td className="border px-2 py-1 text-center">{cv.parentsReached ?? cv.parentsReached === 0 ? cv.parentsReached : cv.peopleReached}</td>
              <td className="border px-2 py-1 text-center">{cv.childrenReached ?? cv.childrenReached === 0 ? cv.childrenReached : cv.studentsReached ?? cv.peopleReached}</td>
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
              <td className="border px-2 py-1">{formatDateSafe(cv.Date ?? cv.date)}</td>
              <td className="border px-2 py-1">{cv.crecheName}</td>
              <td className="border px-2 py-1">{cv.ageGroup}</td>
              <td className="border px-2 py-1">{String(cv.topic || cv.topics || "")}{cv.otherTopic ? ` (${cv.otherTopic})` : ""}</td>
              <td className="border px-2 py-1 text-center">{cv.childrenMindersReached ?? cv.childrenMindersReached === 0 ? cv.childrenMindersReached : cv.peopleReached}</td>
              <td className="border px-2 py-1 text-center">{cv.parentsReached ?? cv.parentsReached === 0 ? cv.parentsReached : cv.peopleReached}</td>
              <td className="border px-2 py-1 text-center">{cv.childrenReached ?? cv.childrenReached === 0 ? cv.childrenReached : cv.studentsReached ?? cv.peopleReached}</td>
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
          title: "8. Meetings",
          data: buildList("Meeting"),
          columns: [
            { key: "Date", label: "Date" },
            { key: "venue", label: "Venue" },
            { key: "purpose", label: "Purpose" },
            { key: "startTime", label: "Start Time" },
            { key: "endTime", label: "End Time" },
            { key: "notes", label: "Notes" },
          ],
        },
        {
          title: "9. Radio Slots",
          data: buildList("Radio Slot"),
          columns: [
            { key: "Date", label: "Date" },
            { key: "radioName", label: "Radio Station" },
            { key: "topic", label: "Topic covered" },
            { key: "listenership", label: "Listenership" },
            { key: "startTime", label: "Start Time" },
            { key: "endTime", label: "End Time" },
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
            { key: "wardNumber", label: "Ward Number" },
            { key: "peopleReached", label: "Number of Streets Reached" },
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
            { key: "healthTalkTopic", label: "Health talk topic" },
            { key: "healthTalkAttendees", label: "No. attended" },
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
            { key: "healthTalkTopic", label: "Health talk topic" },
            { key: "healthTalkAttendees", label: "No. attended" },
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
                      display = formatValue(col.key, raw, row);
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
