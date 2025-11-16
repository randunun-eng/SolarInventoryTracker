/**
 * Diagnostic Test Page - Check if frontend is working
 * Access at /test-diagnostic
 */

import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestDiagnostic() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { data: components, isLoading: componentsLoading, error: componentsError } = useQuery({
    queryKey: ["/api/components"],
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🔍 Diagnostic Test Page</h1>

      {/* Environment Info */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Mock Mode:</span>
              <Badge variant={import.meta.env.VITE_USE_MOCK_DATA === 'true' ? 'default' : 'secondary'}>
                {import.meta.env.VITE_USE_MOCK_DATA === 'true' ? '🎭 ENABLED' : '❌ DISABLED'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Environment:</span>
              <Badge>{import.meta.env.MODE}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Status */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Loading:</span>
              <Badge variant={isLoading ? 'default' : 'secondary'}>
                {isLoading ? '⏳ Loading...' : '✅ Complete'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Authenticated:</span>
              <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </Badge>
            </div>
            {user && (
              <div className="mt-4 p-4 bg-slate-50 rounded">
                <p className="font-semibold mb-2">User Info:</p>
                <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Test */}
      <Card>
        <CardHeader>
          <CardTitle>API Test - /api/components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Loading:</span>
              <Badge variant={componentsLoading ? 'default' : 'secondary'}>
                {componentsLoading ? '⏳ Loading...' : '✅ Complete'}
              </Badge>
            </div>
            {componentsError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-800 mb-2">Error:</p>
                <pre className="text-sm text-red-600">{String(componentsError)}</pre>
              </div>
            )}
            {components && (
              <div className="mt-4 p-4 bg-green-50 rounded">
                <p className="font-semibold mb-2 text-green-800">
                  ✅ Success - {Array.isArray(components) ? components.length : 'N/A'} components loaded
                </p>
                <pre className="text-sm max-h-96 overflow-auto">{JSON.stringify(components, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Browser Info */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Browser Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p><span className="font-semibold">User Agent:</span> {navigator.userAgent}</p>
            <p><span className="font-semibold">URL:</span> {window.location.href}</p>
            <p><span className="font-semibold">Origin:</span> {window.location.origin}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
