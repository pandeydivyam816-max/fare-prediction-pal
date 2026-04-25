import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useRideIntel } from "@/context/RideIntelContext";

const chartConfig = {
  actual: { label: "Actual", color: "hsl(var(--secondary))" },
  predicted: { label: "Predicted", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function Predictions() {
  const { prediction } = useRideIntel();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Predictions</h1>
        <p className="text-sm text-muted-foreground">Forecast band and modeled fare drivers for the current route.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr,1fr]">
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardHeader>
            <CardTitle className="text-lg">Prediction vs actual trend</CardTitle>
            <CardDescription>Modeled band compared with recent rides.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ResponsiveContainer>
                <AreaChart data={prediction?.trend ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="actual" stroke="var(--color-actual)" fill="var(--color-actual)" fillOpacity={0.12} />
                  <Area type="monotone" dataKey="predicted" stroke="var(--color-predicted)" fill="var(--color-predicted)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-panel/90 shadow-panel">
          <CardHeader>
            <CardTitle className="text-lg">Forecast summary</CardTitle>
            <CardDescription>Expected pricing band for this route.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-surface/70 p-4">
              <div className="text-sm text-muted-foreground">Predicted fare</div>
              <div className="mt-1 text-3xl font-semibold">₹{prediction?.predictedFare.toFixed(0) ?? "--"}</div>
              <div className="text-sm text-muted-foreground">₹{prediction?.lowRange.toFixed(0) ?? "--"} to ₹{prediction?.highRange.toFixed(0) ?? "--"}</div>
            </div>
            <div className="space-y-3">
              {prediction?.drivers.map((driver) => (
                <div key={driver.label} className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background/50 p-3">
                  <div>
                    <div className="font-medium">{driver.label}</div>
                    <div className="text-sm text-muted-foreground">{driver.impact}</div>
                  </div>
                  <TrendingDown className="mt-1 h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
