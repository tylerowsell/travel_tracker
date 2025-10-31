"use client"

import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, Users, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';

type SettlementCalculatorProps = {
  trip: any;
  expenses: any[];
};

export function SettlementCalculator({ trip, expenses }: SettlementCalculatorProps) {
  if (!trip || !expenses || expenses.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <DollarSign className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
        <div>
          <h3 className="text-lg font-semibold mb-2">No expenses to split</h3>
          <p className="text-muted-foreground">
            Add expenses to see who owes whom
          </p>
        </div>
      </div>
    );
  }

  // Calculate balances
  const balances: Record<number, number> = {};

  // Initialize balances
  trip.participants?.forEach((p: any) => {
    balances[p.id] = 0;
  });

  // Calculate what each person paid and owes
  expenses.forEach((expense: any) => {
    const paidAmount = parseFloat(expense.amount);
    const splitCount = expense.splits?.length || 1;
    const amountPerPerson = paidAmount / splitCount;

    // Payer gets credited
    balances[expense.payer_id] += paidAmount;

    // Each split participant gets debited
    expense.splits?.forEach((split: any) => {
      balances[split.participant_id] -= amountPerPerson;
    });
  });

  // Calculate settlements (who owes whom)
  const settlements: Array<{ from: any; to: any; amount: number }> = [];
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < -0.01)
    .map(([id, balance]) => ({
      participant: trip.participants.find((p: any) => p.id === parseInt(id)),
      amount: Math.abs(balance),
    }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0.01)
    .map(([id, balance]) => ({
      participant: trip.participants.find((p: any) => p.id === parseInt(id)),
      amount: balance,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Greedy algorithm to minimize number of transactions
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debt = debtors[i].amount;
    const credit = creditors[j].amount;
    const settlement = Math.min(debt, credit);

    if (settlement > 0.01) {
      settlements.push({
        from: debtors[i].participant,
        to: creditors[j].participant,
        amount: settlement,
      });
    }

    debtors[i].amount -= settlement;
    creditors[j].amount -= settlement;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  // Check if everything is settled
  const isSettled = settlements.length === 0 && expenses.length > 0;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Expenses</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: trip.home_currency,
            }).format(
              expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Travelers</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold">{trip.participants?.length || 0}</div>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Settlements</span>
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold">{settlements.length}</div>
        </Card>
      </div>

      {/* Individual Balances */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Individual Balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trip.participants?.map((participant: any, index: number) => {
            const balance = balances[participant.id] || 0;
            const isOwed = balance > 0.01;
            const owes = balance < -0.01;

            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 ${
                    isOwed
                      ? 'border-green-500/50 bg-green-500/5'
                      : owes
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{participant.display_name}</div>
                    {!isOwed && !owes && (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isOwed
                        ? 'text-green-400'
                        : owes
                        ? 'text-red-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isOwed && '+'}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: trip.home_currency,
                    }).format(Math.abs(balance))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {isOwed
                      ? 'is owed'
                      : owes
                      ? 'owes'
                      : 'settled up'}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Suggested Settlements */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Suggested Settlements</h3>

        {isSettled ? (
          <Card className="p-8 text-center border-green-500/50 bg-green-500/5">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h4 className="text-xl font-bold mb-2">All Settled Up! 🎉</h4>
            <p className="text-muted-foreground">
              Everyone has been reimbursed for their expenses
            </p>
          </Card>
        ) : settlements.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h4 className="text-xl font-bold mb-2">All Balanced!</h4>
            <p className="text-muted-foreground">
              No settlements needed - everyone's expenses are even
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* From */}
                    <div className="flex-1 text-right">
                      <div className="font-semibold">
                        {settlement.from.display_name}
                      </div>
                      <div className="text-sm text-muted-foreground">pays</div>
                    </div>

                    {/* Amount */}
                    <div className="px-6 py-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-xl font-bold text-primary">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: trip.home_currency,
                        }).format(settlement.amount)}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div>
                      <ArrowRight className="w-6 h-6 text-primary" />
                    </div>

                    {/* To */}
                    <div className="flex-1">
                      <div className="font-semibold">
                        {settlement.to.display_name}
                      </div>
                      <div className="text-sm text-muted-foreground">receives</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Breakdown by Person */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
        <div className="space-y-4">
          {trip.participants?.map((participant: any) => {
            const paidExpenses = expenses.filter(
              (e) => e.payer_id === participant.id
            );
            const totalPaid = paidExpenses.reduce(
              (sum, e) => sum + parseFloat(e.amount),
              0
            );

            return (
              <Card key={participant.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{participant.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {paidExpenses.length} expense{paidExpenses.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: trip.home_currency,
                  }).format(totalPaid)}{' '}
                  <span className="text-sm text-muted-foreground font-normal">
                    paid
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
