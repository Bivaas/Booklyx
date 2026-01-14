"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "OAuthSignin":
        return "Failed to connect to the authentication provider. Please try again.";
      case "OAuthCallback":
        return "The authentication callback failed. Please try again.";
      case "OAuthCreateAccount":
        return "Could not create account. Please try again.";
      case "EmailCreateAccount":
        return "Could not create account with email. Please try again.";
      case "Callback":
        return "There was an error in the authentication process. Please try again.";
      case "OAuthAccountNotLinked":
        return "This email is already associated with another account.";
      case "SessionCallback":
        return "Error creating session. Please try again.";
      default:
        return "An unexpected error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex-shrink-0">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
        </div>

        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{getErrorMessage(error)}</p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/signin" className="block w-full">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              Back to Sign In
            </Button>
          </Link>
          <Link href="/" className="block w-full">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            If the problem persists, please check your environment variables and try again.
          </p>
        </div>
      </Card>
    </div>
  );
}
