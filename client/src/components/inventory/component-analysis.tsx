import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Search, AlertTriangle } from "lucide-react";

interface ComponentAnalysisProps {
  componentId: number;
  componentName: string;
  datasheetUrl: string | null;
}

interface Specification {
  [key: string]: string | number;
}

interface OperatingParameter {
  [key: string]: string | number | { min: number; max: number; unit: string };
}

interface Alternative {
  name: string;
  manufacturer: string;
  keyDifferences: string[];
  adjustmentsNeeded: string;
  availabilityNotes: string;
}

interface DatasheetAnalysis {
  specifications: Specification;
  package: string;
  operatingParameters: OperatingParameter;
  applications: string[];
  alternatives: string[];
  commonIssues: string[];
  technicalNotes: string;
  error?: string;
}

interface AlternativesAnalysis {
  alternatives: Alternative[];
  generalAdvice: string;
  error?: string;
}

export default function ComponentAnalysis({ componentId, componentName, datasheetUrl }: ComponentAnalysisProps) {
  const { toast } = useToast();
  const [datasheetData, setDatasheetData] = useState<DatasheetAnalysis | null>(null);
  const [alternativesData, setAlternativesData] = useState<AlternativesAnalysis | null>(null);
  
  // Datasheet analysis mutation
  const datasheetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ai/operation", {
        operation: "analyzeDatasheet",
        params: {
          componentName,
          datasheetUrl: datasheetUrl || "Unknown"
        }
      });
    },
    onSuccess: (data) => {
      setDatasheetData(data.result);
      toast({
        title: "Datasheet analysis complete",
      });
    },
    onError: (error) => {
      console.error("Datasheet analysis error:", error);
      toast({
        title: "Analysis failed",
        variant: "destructive",
      });
    }
  });
  
  // Alternatives search mutation
  const alternativesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ai/operation", {
        operation: "findAlternativeComponents",
        params: {
          componentName,
          specifications: datasheetData?.specifications || {}
        }
      });
    },
    onSuccess: (data) => {
      setAlternativesData(data.result);
      toast({
        title: "Alternatives found",
      });
    },
    onError: (error) => {
      console.error("Alternative search error:", error);
      toast({
        title: "Search failed",
        variant: "destructive",
      });
    }
  });
  
  const isAnalyzing = datasheetMutation.isPending;
  const isSearching = alternativesMutation.isPending;
  
  const handleAnalyzeDatasheet = () => {
    if (!datasheetUrl) {
      toast({
        title: "Missing datasheet",
        variant: "destructive",
      });
      return;
    }
    datasheetMutation.mutate();
  };
  
  const handleFindAlternatives = () => {
    if (!datasheetData) {
      toast({
        title: "Analyze datasheet first",
        variant: "destructive",
      });
      return;
    }
    alternativesMutation.mutate();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">Component Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Using AI to analyze datasheets and find alternative components
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyzeDatasheet}
            disabled={isAnalyzing || !datasheetUrl}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Analyze Datasheet
          </Button>
          
          <Button
            onClick={handleFindAlternatives}
            disabled={isSearching || !datasheetData}
            variant="default"
            className="flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find Alternatives
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="datasheet" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="datasheet">Datasheet Analysis</TabsTrigger>
          <TabsTrigger value="alternatives">Alternative Components</TabsTrigger>
        </TabsList>
        
        <TabsContent value="datasheet" className="mt-4">
          {datasheetMutation.isPending ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Analyzing datasheet...</p>
            </div>
          ) : datasheetData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datasheetData.error ? (
                <Card className="col-span-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-amber-500">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Analysis Warning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{datasheetData.error}</p>
                    {datasheetData.technicalNotes && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Technical Notes:</h4>
                        <p className="text-sm">{datasheetData.technicalNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Specifications</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        Package Type: {datasheetData.package || "Not specified"}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(datasheetData.specifications || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{key}:</span>
                            <span className="text-sm">{value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Operating Parameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(datasheetData.operatingParameters || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{key}:</span>
                            <span className="text-sm">
                              {typeof value === 'object' 
                                ? `${value.min} to ${value.max} ${value.unit}`
                                : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {datasheetData.applications?.map((app, index) => (
                          <Badge key={index} variant="secondary">
                            {app}
                          </Badge>
                        ))}
                        {(!datasheetData.applications || datasheetData.applications.length === 0) && 
                          <p className="text-sm text-muted-foreground">No applications listed</p>
                        }
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Common Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 list-disc list-inside text-sm">
                        {datasheetData.commonIssues?.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                        {(!datasheetData.commonIssues || datasheetData.commonIssues.length === 0) && 
                          <p className="text-sm text-muted-foreground">No common issues listed</p>
                        }
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {datasheetData.technicalNotes && (
                    <Card className="col-span-full">
                      <CardHeader>
                        <CardTitle>Technical Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-line">{datasheetData.technicalNotes}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center p-12 border rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No datasheet analysis available</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Analyze Datasheet" to extract component information
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="alternatives" className="mt-4">
          {alternativesMutation.isPending ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Searching for alternatives...</p>
            </div>
          ) : alternativesData ? (
            <div className="space-y-6">
              {alternativesData.error ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-amber-500">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Search Warning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{alternativesData.error}</p>
                    {alternativesData.generalAdvice && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">General Advice:</h4>
                        <p className="text-sm">{alternativesData.generalAdvice}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {alternativesData.alternatives?.map((alt, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{alt.name}</span>
                          <Badge variant="outline">{alt.manufacturer}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Key Differences:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {alt.keyDifferences.map((diff, i) => (
                              <li key={i} className="text-sm">{diff}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Adjustments Needed:</h4>
                          <p className="text-sm">{alt.adjustmentsNeeded}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Availability:</h4>
                          <p className="text-sm">{alt.availabilityNotes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {alternativesData.generalAdvice && (
                    <Card>
                      <CardHeader>
                        <CardTitle>General Advice</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-line">{alternativesData.generalAdvice}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center p-12 border rounded-lg">
              <Search className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No alternatives found yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                First analyze the datasheet, then click "Find Alternatives"
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}