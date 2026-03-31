import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentList } from "@/components/upload/document-list";

type ProfileDocumentItem = {
  id: string;
  title: string;
  type: string;
  sourceFilename?: string;
  updatedLabel?: string;
  parsedStatus?: string;
};

export function ProfileDocumentsCard({
  documents,
  hasParsedResume,
  hasParsedJob,
}: {
  documents: ProfileDocumentItem[];
  hasParsedResume: boolean;
  hasParsedJob: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Documents</CardTitle>
        <div className="flex gap-1.5">
          <Badge variant={hasParsedResume ? "success" : "outline"}>
            {hasParsedResume ? "Resume ready" : "Resume missing"}
          </Badge>
          <Badge variant={hasParsedJob ? "success" : "outline"}>
            {hasParsedJob ? "Job ready" : "Job missing"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <DocumentList documents={documents} allowDelete />
      </CardContent>
    </Card>
  );
}
