import { checkEnvironmentVariables } from "@/lib/actions/system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CheckEnvPage() {
  if (process.env.NODE_ENV !== "development") {
    return <div className="p-4">Not available in production</div>;
  }

  const result = await checkEnvironmentVariables();

  // エラーハンドリング
  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{result.error || "Unknown error occurred"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { environment, checks, previews } = result.data;

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold mb-6">Environment Check</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="font-medium">NODE_ENV</span>
              <Badge variant="outline">{environment}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckItem
              label="BETTER_AUTH_SECRET"
              status={checks.betterAuthSecret}
            />
            <CheckItem
              label="BETTER_AUTH_GOOGLE_CLIENT_ID"
              status={checks.googleClientId}
              preview={previews.clientIdPreview}
            />
            <CheckItem
              label="BETTER_AUTH_GOOGLE_CLIENT_SECRET"
              status={checks.googleClientSecret}
              preview={previews.secretPreview}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckItem({
  label,
  status,
  preview,
}: {
  label: string;
  status: boolean;
  preview?: string;
}) {
  return (
    <div className="flex flex-col space-y-1 p-3 border rounded-lg">
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm">{label}</span>
        <Badge variant={status ? "default" : "destructive"}>
          {status ? "Set" : "Missing"}
        </Badge>
      </div>
      {preview && (
        <div className="text-xs text-muted-foreground font-mono mt-1">
          Value: {preview}
        </div>
      )}
    </div>
  );
}
