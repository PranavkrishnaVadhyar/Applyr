'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Download, X } from 'lucide-react'

const subscriptionPlans = [
  {
    name: 'Free',
    price: '$0',
    features: ['5 applications/month', 'Basic job tracking', '1 resume'],
  },
  {
    name: 'Pro',
    price: '$9',
    current: true,
    features: ['Unlimited applications', 'Advanced analytics', '5 resumes', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Everything in Pro', 'Team management', 'Custom integrations', 'Dedicated support'],
  },
]

const invoices = [
  {
    id: 'INV-001',
    date: '2024-03-01',
    amount: '$9.00',
    status: 'Paid',
  },
  {
    id: 'INV-002',
    date: '2024-02-01',
    amount: '$9.00',
    status: 'Paid',
  },
  {
    id: 'INV-003',
    date: '2024-01-01',
    amount: '$9.00',
    status: 'Paid',
  },
]

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription and billing</p>
        </div>

        {/* Current Subscription */}
        <Card className="card-dark glass-effect p-8 border-primary/50">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Current Plan</p>
              <h2 className="font-display text-3xl font-bold mt-2">Pro</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">$9</p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">
            Your subscription renews on <span className="text-foreground font-semibold">April 1, 2024</span>
          </p>

          <div className="flex gap-3 flex-col sm:flex-row">
            <Button className="button-neon">Upgrade Plan</Button>
            <Button variant="outline" className="button-outline-neon">
              Manage Payment Method
            </Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10">
              Cancel Subscription
            </Button>
          </div>
        </Card>

        {/* Plans Comparison */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Plans & Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`card-dark glass-effect p-6 transition-all ${
                  plan.current ? 'border-primary/50 shadow-lg shadow-primary/20' : ''
                }`}
              >
                <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-6">
                  {plan.price}
                  {plan.price !== 'Custom' && <span className="text-lg text-muted-foreground">/mo</span>}
                </p>

                {plan.current && (
                  <p className="text-xs text-primary font-semibold mb-4 px-3 py-1 bg-primary/20 inline-block rounded">
                    Current Plan
                  </p>
                )}

                <Button
                  className={plan.current ? 'w-full opacity-50 cursor-not-allowed' : 'w-full button-neon'}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Billing History</h2>
          <Card className="card-dark glass-effect overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="px-6 py-4 font-medium text-foreground">{invoice.id}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" className="button-outline-neon gap-2">
                          <Download size={16} />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Payment Method */}
        <Card className="card-dark glass-effect p-6">
          <h3 className="font-display text-lg font-bold mb-4">Payment Method</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-primary rounded flex items-center justify-center text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium text-foreground">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" className="button-outline-neon">
              Update
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
