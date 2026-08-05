import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useBudgetTracking } from "@/hooks/useBudgetTracking";
import { DollarSign } from "lucide-react";

interface BudgetTrackingChartProps {
  initiativeId?: string;
}

export function BudgetTrackingChart({ initiativeId }: BudgetTrackingChartProps) {
  const { data: budgets, isLoading } = useBudgetTracking(initiativeId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Estimated vs actual costs across initiatives</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading budget data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Estimated vs actual costs across initiatives</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No budget data available</p>
            <p className="text-sm">Add budget items to track spending</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Angled labels only earn their keep once names would collide side by side.
  const angled = budgets.length > 3;
  const maxLabel = angled ? 20 : 32;

  const chartData = budgets.map(budget => ({
    name: budget.initiativeTitle.length > maxLabel
      ? budget.initiativeTitle.substring(0, maxLabel) + "..."
      : budget.initiativeTitle,
    estimated: budget.totalEstimated,
    actual: budget.totalActual,
  }));

  const totalEstimated = budgets.reduce((sum, b) => sum + b.totalEstimated, 0);
  const totalActual = budgets.reduce((sum, b) => sum + b.totalActual, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>
          Total: ${totalActual.toLocaleString()} of ${totalEstimated.toLocaleString()} allocated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: angled ? 24 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              angle={angled ? -45 : 0}
              textAnchor={angled ? "end" : "middle"}
              height={angled ? 90 : 32}
              interval={0}
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            {/* Above the plot so angled axis labels can never collide with it. */}
            <Legend verticalAlign="top" align="right" height={28} />
            <Bar
              dataKey="estimated"
              name="Estimated"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={72}
            />
            <Bar
              dataKey="actual"
              name="Actual"
              fill="hsl(var(--success))"
              radius={[4, 4, 0, 0]}
              maxBarSize={72}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
