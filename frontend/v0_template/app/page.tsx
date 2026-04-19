'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Target, Rocket, CheckCircle } from 'lucide-react'

export default function Home() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <h1 className="text-2xl font-bold text-primary">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-dark border-b border-border/50 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary font-display tracking-wider hover:scale-105 transition-transform duration-300 animate-neon-flicker">
            APPLYR
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-foreground hover:text-primary transition-smooth hover-lift">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="button-neon">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden page-enter">
        {/* Animated background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full glass-effect animate-scale-in hover-lift">
            <span className="text-sm text-primary font-semibold">✨ Powered by AI</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 text-balance animate-slide-in-up tracking-tighter">
            Land Your Dream Job
            <span className="gradient-text block animate-neon-flicker"> Faster</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            Automate your job applications with AI-powered extraction, intelligent matching, and seamless management. Focus on preparing for interviews while Applyr handles the paperwork.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <Link href="/auth/register">
              <Button size="lg" className="button-neon gap-2 hover-lift">
                Start for Free <ArrowRight size={20} />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="button-outline-neon gap-2 hover-lift">
                Learn More <ArrowRight size={20} />
              </Button>
            </Link>
          </div>

          {/* Stats with animations */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 pt-12 border-t border-border/30 animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
            {[
              { value: '10K+', label: 'Jobs Applied' },
              { value: '2.5x', label: 'Faster Applications' },
              { value: '98%', label: 'Accuracy Rate' }
            ].map((stat, idx) => (
              <div key={idx} className="hover-lift hover-glow p-4 rounded-lg transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to streamline your job search process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'AI Job Extraction',
                description: 'Extract job details automatically from any job posting URL or description',
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: 'Smart Matching',
                description: 'Get matched with jobs that align with your skills and experience',
              },
              {
                icon: <Rocket className="w-6 h-6" />,
                title: 'One-Click Apply',
                description: 'Apply to jobs in seconds with your auto-filled resume and cover letter',
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: 'Application Tracking',
                description: 'Keep track of all your applications in one organized dashboard',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Resume Management',
                description: 'Store and manage multiple versions of your resume',
              },
              {
                icon: <Rocket className="w-6 h-6" />,
                title: 'Analytics & Insights',
                description: 'Get insights on your application success rate and trends',
              },
            ].map((feature, i) => (
              <div key={i} className="card-dark glass-effect p-6 hover:border-primary/50 transition-colors">
                <div className="text-primary mb-4 glow-effect inline-block p-3 rounded-lg bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your job search needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Get started with the basics',
                features: ['5 applications/month', 'Basic job tracking', '1 resume'],
                cta: 'Get Started',
              },
              {
                name: 'Pro',
                price: '$9',
                description: 'Most popular plan',
                features: ['Unlimited applications', 'Advanced analytics', '5 resumes', 'Priority support'],
                cta: 'Start Free Trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For teams and organizations',
                features: ['Everything in Pro', 'Team management', 'Custom integrations', 'Dedicated support'],
                cta: 'Contact Sales',
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`card-dark p-8 rounded-xl transition-all ${
                  plan.highlighted
                    ? 'glass-effect border-primary/50 shadow-lg shadow-primary/20'
                    : 'glass-effect'
                }`}
              >
                <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
                </div>
                <Button className="w-full button-neon mb-6">
                  {plan.cta}
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to land your dream job?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of job seekers who are automating their applications
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="button-neon gap-2">
              Get Started for Free <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Applyr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
