"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { runGoogleAuthDiagnostic, getAuthConfigStatus } from "@/utils/auth-diagnostics"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"

export default function AuthDiagnosticsPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [configStatus, setConfigStatus] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [recommendations, setRecommendations] = useState<string[]>([])

  useEffect(() => {
    // Check config status on load
    setConfigStatus(getAuthConfigStatus())
  }, [])

  useEffect(() => {
    if (diagnosticResult) {
      const newRecommendations: string[] = []

      // Generate recommendations based on diagnostic results
      if (diagnosticResult.errorCode === "auth/unauthorized-domain") {
        newRecommendations.push(
          `Add "${diagnosticResult.currentDomain}" to the authorized domains list in your Firebase console.`,
        )
        newRecommendations.push(
          "Ensure your Firebase project has Google authentication enabled in the Authentication > Sign-in method section.",
        )
      }

      if (!configStatus?.isComplete) {
        newRecommendations.push("Complete your Firebase configuration by adding all required environment variables.")
      }

      if (diagnosticResult.errorCode === "auth/configuration-not-found") {
        newRecommendations.push("Verify that your Firebase project is properly set up and the API key is correct.")
      }

      if (diagnosticResult.errorCode === "auth/internal-error") {
        newRecommendations.push("Check browser console for more detailed error information.")
        newRecommendations.push("Ensure you're using a modern browser with third-party cookies enabled.")
      }

      // If no specific recommendations, add general ones
      if (newRecommendations.length === 0) {
        newRecommendations.push("Verify that Google Sign-In is enabled in your Firebase Authentication console.")
        newRecommendations.push("Check that your Firebase project's API key has proper restrictions set.")
        newRecommendations.push("Ensure your application is using the correct Firebase project credentials.")
      }

      setRecommendations(newRecommendations)
    }
  }, [diagnosticResult, configStatus])

  const runDiagnostic = async () => {
    setIsRunning(true)
    try {
      const result = await runGoogleAuthDiagnostic()
      setDiagnosticResult(result)
      console.log("Diagnostic result:", result)
    } catch (error) {
      console.error("Error running diagnostics:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-violet-700">Authentication Diagnostics</CardTitle>
          <CardDescription className="text-center">
            Troubleshoot Google authentication issues in Letter Share
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant={configStatus?.isComplete ? "default" : "destructive"}>
            {configStatus?.isComplete ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>Firebase Configuration</AlertTitle>
            <AlertDescription>
              {configStatus?.isComplete ? (
                "All required Firebase configuration variables are present."
              ) : (
                <div>
                  <p>Missing configuration variables:</p>
                  <ul className="list-disc pl-5 mt-2">
                    {configStatus?.missingKeys.map((key: string) => (
                      <li key={key}>{key}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>

          {diagnosticResult && (
            <>
              <Alert variant={diagnosticResult.success ? "default" : "destructive"}>
                {diagnosticResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>Authentication Test Result</AlertTitle>
                <AlertDescription>
                  {diagnosticResult.success ? (
                    "Google authentication is working correctly."
                  ) : (
                    <div>
                      <p>Error: {diagnosticResult.errorCode}</p>
                      <p className="text-sm mt-1">{diagnosticResult.errorMessage}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-amber-800">Domain Information</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Current domain: <span className="font-mono">{diagnosticResult.currentDomain}</span>
                    </p>
                    <p className="text-sm text-amber-700">
                      Auth domain: <span className="font-mono">{diagnosticResult.authDomain}</span>
                    </p>
                  </div>
                </div>
              </div>

              {recommendations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-blue-800">Recommendations</h3>
                      <ul className="list-disc pl-5 mt-2 text-sm text-blue-700 space-y-1">
                        {recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runDiagnostic} disabled={isRunning} className="w-full bg-violet-600 hover:bg-violet-700">
            {isRunning ? "Running Diagnostics..." : "Run Authentication Diagnostic"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
