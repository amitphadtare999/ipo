import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { Ipo, IpoApplication, DematAccount, ApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid, compareNumber, compareText, type Column } from "@/components/ui/data-grid";
import { ApplicationDialog } from "@/components/applications/ApplicationDialog";
import {
  ArrowLeft, Plus, Pencil, Trash2, CalendarDays, IndianRupee,
  BarChart3, TrendingUp, AlertCircle,
} from "lucide-react";

const statusConfig: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  applied:      { label: "Applied",      variant: "outline" },
  payment_done: { label: "Payment Done", variant: "warning" },
  allotted:     { label: "Allotted",     variant: "success" },
  not_allotted: { label: "Not Allotted", variant: "destructive" },
  listed:       { label: "Listed",       variant: "default" },
  sold:         { label: "Sold",         variant: "secondary" },
};

const appSortComparators = {
  account: compareText<IpoApplication>((r) => r.demat_account?.name),
  broker: compareText<IpoApplication>((r) => r.demat_account?.broker),
  lots_applied: compareNumber<IpoApplication>((r) => r.lots_applied),
  status: compareText<IpoApplication>((r) => r.status),
  payment_mode: compareText<IpoApplication>((r) => r.payment_mode),
  shares_allotted: compareNumber<IpoApplication>((r) => r.shares_allotted),
  avg_selling_price: compareNumber<IpoApplication>((r) => r.avg_selling_price),
  profit: compareNumber<IpoApplication>((r) => r.profit),
  notes: compareText<IpoApplication>((r) => r.notes),
};

export default function IpoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ipo, setIpo] = useState<Ipo | null>(null);
  const [applications, setApplications] = useState<(IpoApplication & { demat_account: DematAccount })[]>([]);
  const [dematAccounts, setDematAccounts] = useState<DematAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<IpoApplication | null>(null);

  const fetchData = async () => {
    if (!id) return;
    const [ipoRes, appsRes, dematsRes] = await Promise.all([
      supabase.from("ipos").select("*").eq("id", id).single(),
      supabase.from("ipo_applications").select("*, demat_account:demat_accounts(*)").eq("ipo_id", id).order("created_at", { ascending: true }),
      supabase.from("demat_accounts").select("*").order("name"),
    ]);
    if (ipoRes.data) setIpo(ipoRes.data);
    if (appsRes.data) setApplications(appsRes.data as unknown as (IpoApplication & { demat_account: DematAccount })[]);
    if (dematsRes.data) setDematAccounts(dematsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const openAddDialog = () => {
    setEditingApp(null);
    setDialogOpen(true);
  };

  const openEditDialog = (app: IpoApplication) => {
    setEditingApp(app);
    setDialogOpen(true);
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("ipo_applications").delete().eq("id", appId);
    fetchData();
  };

  const dash = <span className="text-muted-foreground">—</span>;

  const appColumns: Column<IpoApplication>[] = [
    {
      key: "account",
      name: "Account",
      minWidth: 140,
      cellClass: "font-medium",
      renderCell: ({ row: app }) => app.demat_account?.name || "—",
    },
    {
      key: "broker",
      name: "Broker",
      minWidth: 120,
      cellClass: "text-muted-foreground",
      renderCell: ({ row: app }) => app.demat_account?.broker || "—",
    },
    {
      key: "lots_applied",
      name: "Lots",
      width: 80,
      cellClass: "tabular-nums",
    },
    {
      key: "status",
      name: "Status",
      width: 130,
      renderCell: ({ row: app }) => {
        const sc = statusConfig[app.status];
        return <Badge variant={sc.variant} className="font-medium">{sc.label}</Badge>;
      },
    },
    {
      key: "payment_mode",
      name: "Payment",
      width: 100,
      renderCell: ({ row: app }) =>
        app.payment_mode ? app.payment_mode.toUpperCase() : dash,
    },
    {
      key: "shares_allotted",
      name: "Shares",
      width: 90,
      cellClass: "tabular-nums",
      renderCell: ({ row: app }) => app.shares_allotted || "—",
    },
    {
      key: "avg_selling_price",
      name: "Avg Sell",
      width: 110,
      cellClass: "tabular-nums",
      renderCell: ({ row: app }) => (app.avg_selling_price ? `₹${app.avg_selling_price}` : dash),
    },
    {
      key: "profit",
      name: "P&L",
      width: 120,
      cellClass: "tabular-nums font-medium",
      renderCell: ({ row: app }) =>
        app.profit !== null ? (
          <span className={app.profit >= 0 ? "text-green-600" : "text-red-500"}>
            {app.profit >= 0 ? "+" : ""}₹{app.profit.toFixed(2)}
          </span>
        ) : (
          dash
        ),
    },
    {
      key: "notes",
      name: "Notes",
      minWidth: 120,
      cellClass: "text-xs text-muted-foreground",
      renderCell: ({ row: app }) => <span title={app.notes || undefined}>{app.notes || "—"}</span>,
    },
    {
      key: "actions",
      name: "",
      width: 80,
      resizable: false,
      renderCell: ({ row: app }) => (
        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(app)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteApp(app.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!ipo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium">IPO not found</p>
        <Link to="/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to list</Button></Link>
      </div>
    );
  }

  const totalProfit = applications.reduce((sum, app) => sum + (app.profit || 0), 0);
  const allotted = applications.filter((a) => a.is_allotted).length;

  return (
    <div className="space-y-6">
      {/* Back navigation + IPO name */}
      <div className="space-y-2">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to IPOs
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{ipo.name}</h2>
          {(ipo.start_date || ipo.close_date) && (
            <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
              {formatDate(ipo.start_date) || "—"} to {formatDate(ipo.close_date) || "—"}
            </p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Price */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Price Band</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {ipo.price_band_low && ipo.price_band_high
                ? `₹${ipo.price_band_low} – ₹${ipo.price_band_high}`
                : "—"}
            </div>
            {ipo.listing_price && (
              <p className="text-xs text-muted-foreground mt-1">
                Listed at <span className="font-medium text-foreground">₹{ipo.listing_price}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Key Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Open",      value: ipo.start_date },
              { label: "Close",     value: ipo.close_date },
              { label: "Allotment", value: ipo.allotment_date },
              { label: "Listing",   value: ipo.listing_date },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{formatDate(value) || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "QIB",    value: ipo.sub_qib },
              { label: "b HNI",  value: ipo.sub_bhni },
              { label: "s HNI",  value: ipo.sub_shni },
              { label: "Retail", value: ipo.sub_retail },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">
                  {value !== null && value !== undefined ? `${value}×` : "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "IPO Size",   value: ipo.ipo_size_cr ? `₹${ipo.ipo_size_cr} Cr` : "—" },
              { label: "GMP",        value: ipo.gmp !== null ? `${ipo.gmp > 0 ? "+" : ""}${ipo.gmp}%` : "—", color: ipo.gmp !== null ? (ipo.gmp >= 0 ? "text-green-600" : "text-red-500") : "" },
              { label: "Applications", value: applications.length.toString() },
              { label: "Total P&L",  value: `₹${totalProfit.toFixed(2)}`, color: totalProfit >= 0 ? "text-green-600" : "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium tabular-nums ${color || ""}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Applications section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Applications</h2>
            <p className="text-sm text-muted-foreground">
              {applications.length} total · {allotted} allotted
            </p>
          </div>
          <Button size="sm" onClick={openAddDialog} disabled={dematAccounts.length === 0} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>

        {dematAccounts.length === 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              You need to <Link to="/demat-accounts" className="font-semibold underline underline-offset-2">add demat accounts</Link> before creating applications.
            </span>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">No applications yet</p>
            <p className="text-xs text-muted-foreground mt-1">Track your IPO applications from each demat account.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <DataGrid
              columns={appColumns}
              rows={applications}
              rowKeyGetter={(app) => app.id}
              sortComparators={appSortComparators}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Application Dialog */}
      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={editingApp}
        fixedIpoId={id}
        dematAccounts={dematAccounts}
        onSaved={fetchData}
      />
    </div>
  );
}
