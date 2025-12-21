import { getSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, TrendingUp, Wallet } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await getSession()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            <span className="text-xl font-bold">ExpenseTracker</span>
          </div>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-balance sm:text-6xl">Track Your Expenses with Ease</h1>
          <p className="mt-6 text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            A simple, secure, and powerful expense tracking app. Keep your finances organized and gain insights into
            your spending habits.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signin">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Secure & Private</h3>
                <p className="mt-2 text-muted-foreground">
                  Your data is encrypted and isolated. Only you can access your expenses.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Insights & Analytics</h3>
                <p className="mt-2 text-muted-foreground">
                  Visualize your spending patterns and make informed financial decisions.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Easy to Use</h3>
                <p className="mt-2 text-muted-foreground">
                  Intuitive interface makes tracking expenses quick and effortless.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 ExpenseTracker. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
