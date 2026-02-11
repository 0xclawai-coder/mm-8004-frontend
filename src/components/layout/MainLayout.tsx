import { Header } from './Header'
import { Footer } from './Footer'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background gradient effect */}
      <div className="bg-gradient-radial pointer-events-none fixed inset-0 -z-10" />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
