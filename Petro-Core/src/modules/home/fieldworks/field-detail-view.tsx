import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fieldWorksList } from "./types";

interface Chapter {
  id: string;
  title: string;
  pdfUrl: string;
}

interface Assignment {
  id: string;
  title: string;
  openedDate: string;
  dueDate: string;
  instructions: string[];
}

interface Section {
  id: string;
  title: string;
  chapters: Chapter[];
  assignments: Assignment[];
}

// Mock data for the field work details
const fieldWorkSections: Record<string, Section[]> = {
  "geohazard": [
    {
      id: "section1",
      title: "Introduction and Fluid Properties",
      chapters: [
        { id: "ch1", title: "Chapter 1 - Introduction", pdfUrl: "/pdfs/geohazard-intro.pdf" },
        { id: "ch2", title: "Chapter 2 - Fluid Properties", pdfUrl: "/pdfs/geohazard-fluid.pdf" },
      ],
      assignments: [
        {
          id: "assign1",
          title: "Assignment 1 (Chapter 1 & 2)",
          openedDate: "Tuesday, 4 February 2025, 12:00 AM",
          dueDate: "Tuesday, 11 February 2025, 12:00 AM",
          instructions: [
            "Please answer the problems indicated in the file.",
            "Use A4 or Long bond paper (preferably the white one) when writing your solutions or you have also the option to encode your solutions.",
            "Final answers must be in three decimal places but in the solution, avoid rounding up to prevent errors in the calculation - you may round up the digits in the final answer if the values are stored in the calculator during the solution process.",
            "Deadline is strictly observed - please ensure that you've submitted your output in the UVE. Late submissions will be subjected in this criterion: less than day late - minus 3, two to five days late - minus 4, and more than five days late - minus 5. Please notify me in case any uncontrollable events can cause you to submit late."
          ]
        }
      ]
    },
    {
      id: "section2",
      title: "Geohazard Assessment Techniques",
      chapters: [
        { id: "ch3", title: "Chapter 3 - Risk Assessment", pdfUrl: "/pdfs/geohazard-risk.pdf" },
        { id: "ch4", title: "Chapter 4 - Mitigation Strategies", pdfUrl: "/pdfs/geohazard-mitigation.pdf" },
      ],
      assignments: [
        {
          id: "assign2",
          title: "Assignment 2 (Chapter 3 & 4)",
          openedDate: "Tuesday, 18 February 2025, 12:00 AM",
          dueDate: "Tuesday, 25 February 2025, 12:00 AM",
          instructions: [
            "Please complete the field assessment form provided in the attachment.",
            "Include photographic documentation where specified.",
            "Submit your completed assessment with supporting documentation."
          ]
        }
      ]
    }
  ],
  "hydrogeologic": [
    {
      id: "section1",
      title: "Water Sampling Techniques",
      chapters: [
        { id: "ch1", title: "Chapter 1 - Sampling Protocols", pdfUrl: "/pdfs/hydro-protocols.pdf" },
        { id: "ch2", title: "Chapter 2 - Water Quality Parameters", pdfUrl: "/pdfs/hydro-quality.pdf" },
      ],
      assignments: [
        {
          id: "assign1",
          title: "Field Sampling Exercise",
          openedDate: "Monday, 3 February 2025, 12:00 AM",
          dueDate: "Monday, 10 February 2025, 12:00 AM",
          instructions: [
            "Collect water samples following the protocol in Chapter 1.",
            "Measure and record all required parameters as specified in the lab manual.",
            "Prepare a detailed report of your findings including all raw data."
          ]
        }
      ]
    }
  ],
  "research": [
    {
      id: "section1",
      title: "Research Methodology and Resources",
      chapters: [
        { id: "ch1", title: "Chapter 1 - Research Methods in Geology", pdfUrl: "/pdfs/research-methods.pdf" },
        { id: "ch2", title: "Chapter 2 - Literature Review Techniques", pdfUrl: "/pdfs/literature-review.pdf" },
      ],
      assignments: [
        {
          id: "assign1",
          title: "Research Proposal",
          openedDate: "Wednesday, 5 February 2025, 12:00 AM",
          dueDate: "Wednesday, 19 February 2025, 12:00 AM",
          instructions: [
            "Prepare a 3-5 page research proposal on a geological topic of your choice.",
            "Include background, objectives, methodology, and expected outcomes.",
            "Minimum of 10 academic references required in APA format.",
            "Submit your proposal with a preliminary timeline for research completion."
          ]
        }
      ]
    },
    {
      id: "section2",
      title: "Data Analysis and Publication",
      chapters: [
        { id: "ch3", title: "Chapter 3 - Statistical Methods in Geology", pdfUrl: "/pdfs/statistical-methods.pdf" },
        { id: "ch4", title: "Chapter 4 - Scientific Writing and Publication", pdfUrl: "/pdfs/scientific-writing.pdf" },
      ],
      assignments: [
        {
          id: "assign2",
          title: "Research Paper Draft",
          openedDate: "Monday, 24 February 2025, 12:00 AM",
          dueDate: "Monday, 17 March 2025, 12:00 AM",
          instructions: [
            "Prepare a draft of your research paper (10-15 pages).",
            "Include all sections: abstract, introduction, methodology, results, discussion, and conclusion.",
            "Properly format figures, tables, and references according to the journal guidelines.",
            "Be prepared for peer review following submission."
          ]
        }
      ]
    }
  ],
  // Add more field work types as needed
};

const FieldDetailView = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Find the field work from our list
  const fieldWork = fieldWorksList.find(work => {
    const path = work.path || "";
    return path.endsWith(`/${fieldId}`);
  });

  // Get sections for this field work
  const sections = fieldId ? fieldWorkSections[fieldId] || [] : [];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (!fieldWork) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/field-works">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Field Works
          </Button>
        </Link>
        <div className="text-center py-8 bg-card rounded-lg shadow">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">Field work not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/field-works">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Field Works
        </Button>
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{fieldWork.title}</h1>
        <p className="text-muted-foreground">{fieldWork.description}</p>
      </div>
      
      {sections.map(section => (
        <Card key={section.id} className="mb-4 overflow-hidden border-sedimentary/30">
          <div 
            className="p-4 bg-white text-foreground border-b border-sedimentary/30 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection(section.id)}
          >
            <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
            {expandedSections[section.id] ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
          
          {expandedSections[section.id] && (
            <div className="p-4 bg-white text-foreground border-t border-sedimentary/30">
              {/* Chapters */}
              {section.chapters.map(chapter => (
                <div key={chapter.id} className="mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <a 
                    href={chapter.pdfUrl} 
                    className="text-primary hover:underline flex items-center"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {chapter.title} <span className="ml-2 text-sm text-muted-foreground">PDF</span>
                  </a>
                </div>
              ))}
              
              {/* Assignments */}
              {section.assignments.map(assignment => (
                <div key={assignment.id} className="mt-6 border-t border-sedimentary/30 pt-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-accent">{assignment.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div>Opened: {assignment.openedDate}</div>
                      <div>Due: {assignment.dueDate}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Instructions:</h4>
                    <ol className="list-decimal pl-5 space-y-2">
                      {assignment.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
      
      {sections.length === 0 && (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No content available for this field work yet.</p>
        </Card>
      )}
    </div>
  );
};

export default FieldDetailView;
