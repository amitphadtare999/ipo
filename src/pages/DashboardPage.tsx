import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Ipo, IpoApplication } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, BarChart3, Target, Wallet,
  CheckCircle2, XCircle, Clock,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  valueClass,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconClass?: string;
  valueClass?: string;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass || "bg-primary/10"}`}>
            <Icon className={`h-4 w-4 ${iconClass ? "" : "text-primary"}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${valueClass || ""}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

const statusLabels: Record<string, string> = {
  applied: "Applied",
  payment_done: "Payment Done",
  allotted: "Allotted",
  not_allotted: "Not Allotted",
  listed: "Listed",
  sold: "Sold",
};

export default function DashboardPage() {
  const [ipos, setIpos] = useState<Ipo[]>([]);
  const [applications, setApplications] = useState<(IpoApplication & { ipo?: Ipo })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [ipoRes, appRes] = await Promise.all([
        supabase.from("ipos").select("*"),
        supabase.from("ipo_applications").select("*, ipo:ipos(name)").order("created_at", { ascending: false }),
      ]);
      if (ipoRes.data) setIpos(ipoRes.data);
      if (appRes.data) setApplications(appRes.data as (IpoApplication & { ipo?: Ipo })[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const totalProfit = applications.reduce((sum, app) => sum + (app.profit || 0), 0);
  const allottedApps = applications.filter((a) => a.is_allotted);
  const profitableApps = applications.filter((a) => (a.profit || 0) > 0);
  const lossApps = applications.filter((a) => (a.profit || 0) < 0);
  const allotmentRate = applications.length > 0
    ? ((allottedApps.length / applications.length) * 100).toFixed(1)
    : "0";
  const avgProfit = allottedApps.length > 0
    ? (totalProfit / allottedApps.length).toFixed(2)
    : "0.00";

  // Status breakdown
  const statusBreakdown = ["applied", "payment_done", "allotted", "not_allotted", "listed", "sold"].map((s) => ({
    status: s,
    count: applications.filter((a) => a.status === s).length,
  })).filter((x) => x.count > 0);

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    applied: "outline",
    payment_done: "warning",
    allotted: "success",
    not_allotted: "destructive",
    listed: "default",
    sold: "secondary",
  };

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total IPOs"
          value={ipos.length}
          subtitle={`${applications.length} application${applications.length !== 1 ? "s" : ""} total`}
          icon={BarChart3}
          iconClass="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total P&L"
          value={`₹${Math.abs(totalProfit).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${profitableApps.length} profitable · ${lossApps.length} loss`}
          icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
          iconClass={totalProfit >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}
          valueClass={totalProfit >= 0 ? "text-green-600" : "text-red-500"}
        />
        <StatCard
          title="Allotment Rate"
          value={`${allotmentRate}%`}
          subtitle={`${allottedApps.length} allotted out of ${applications.length}`}
          icon={Target}
          iconClass="bg-violet-50 text-violet-600"
        />
        <StatCard
          title="Avg P&L / Allotment"
          value={`₹${parseFloat(avgProfit).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="per allotted application"
          icon={Wallet}
          iconClass="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Status breakdown + Recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status breakdown */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
            ) : (
              <div className="space-y-3">
                {statusBreakdown.map(({ status, count }) => {
                  const pct = Math.round((count / applications.length) * 100);
                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariants[status]} className="text-xs py-0">
                            {statusLabels[status]}
                          </Badge>
                        </div>
                        <span className="font-medium tabular-nums text-xs">
                          {count} <span className="text-muted-foreground">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No applications yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Head to <Link to="/" className="text-primary underline underline-offset-2">IPOs</Link> to add your first application.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {applications.slice(0, 8).map((app) => {
                  const isPositive = (app.profit || 0) >= 0;
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      {/* Status icon */}
                      <div className="shrink-0">
                        {app.is_allotted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : app.status === "not_allotted" ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Name + date */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {(app.ipo as unknown as { name?: string })?.name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                          {" · "}
                          {app.lots_applied} lot{app.lots_applied !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* P&L + status */}
                      <div className="text-right shrink-0">
                        {app.profit !== null ? (
                          <p className={`text-sm font-semibold tabular-nums ${isPositive ? "text-green-600" : "text-red-500"}`}>
                            {isPositive ? "+" : ""}₹{app.profit.toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">—</p>
                        )}
                        <Badge variant={statusVariants[app.status]} className="text-[10px] py-0 mt-0.5">
                          {statusLabels[app.status]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
