import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your expense tracking account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              <Chrome className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
