import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { ApplicationStatus, DematAccount, Ipo, IpoApplication } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationDialog } from "@/components/applications/ApplicationDialog";
import { DataGrid, compareNumber, compareText, type Column } from "@/components/ui/data-grid";
import { ArrowLeft, BarChart3, Building2, Plus } from "lucide-react";

type AppRow = IpoApplication & { ipo: Ipo | null };

const statusConfig: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  applied:      { label: "Applied",      variant: "outline" },
  payment_done: { label: "Payment Done", variant: "warning" },
  allotted:     { label: "Allotted",     variant: "success" },
  not_allotted: { label: "Not Allotted", variant: "destructive" },
  listed:       { label: "Listed",       variant: "default" },
  sold:         { label: "Sold",         variant: "secondary" },
};

const sortComparators = {
  ipo: compareText<AppRow>((r) => r.ipo?.name),
  close_date: compareText<AppRow>((r) => r.ipo?.close_date),
  lots_applied: compareNumber<AppRow>((r) => r.lots_applied),
  status: compareText<AppRow>((r) => r.status),
  payment_mode: compareText<AppRow>((r) => r.payment_mode),
  shares_allotted: compareNumber<AppRow>((r) => r.shares_allotted),
  avg_selling_price: compareNumber<AppRow>((r) => r.avg_selling_price),
  profit: compareNumber<AppRow>((r) => r.profit),
  notes: compareText<AppRow>((r) => r.notes),
};

const dash = <span className="text-muted-foreground">—</span>;

const columns: Column<AppRow>[] = [
  {
    key: "ipo",
    name: "IPO",
    minWidth: 180,
    frozen: true,
    cellClass: "font-medium",
    renderCell: ({ row }) =>
      row.ipo ? (
        <Link to={`/ipo/${row.ipo.id}`} className="text-primary hover:underline underline-offset-4">
          {row.ipo.name}
        </Link>
      ) : (
        dash
      ),
  },
  {
    key: "close_date",
    name: "Close Date",
    width: 115,
    cellClass: "tabular-nums text-muted-foreground",
    renderCell: ({ row }) => formatDate(row.ipo?.close_date) || dash,
  },
  { key: "lots_applied", name: "Lots", width: 80, cellClass: "tabular-nums" },
  {
    key: "status",
    name: "Status",
    width: 130,
    renderCell: ({ row }) => {
      const sc = statusConfig[row.status];
      return <Badge variant={sc.variant} className="font-medium">{sc.label}</Badge>;
    },
  },
  {
    key: "payment_mode",
    name: "Payment",
    width: 100,
    renderCell: ({ row }) => (row.payment_mode ? row.payment_mode.toUpperCase() : dash),
  },
  {
    key: "shares_allotted",
    name: "Shares",
    width: 90,
    cellClass: "tabular-nums",
    renderCell: ({ row }) => row.shares_allotted || "—",
  },
  {
    key: "avg_selling_price",
    name: "Avg Sell",
    width: 110,
    cellClass: "tabular-nums",
    renderCell: ({ row }) => (row.avg_selling_price ? `₹${row.avg_selling_price}` : dash),
  },
  {
    key: "profit",
    name: "P&L",
    width: 120,
    cellClass: "tabular-nums font-medium",
    renderCell: ({ row }) =>
      row.profit !== null ? (
        <span className={row.profit >= 0 ? "text-green-600" : "text-red-500"}>
          {row.profit >= 0 ? "+" : ""}₹{row.profit.toFixed(2)}
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
    renderCell: ({ row }) => <span title={row.notes || undefined}>{row.notes || "—"}</span>,
  },
];

export default function DematAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<DematAccount | null>(null);
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [ipos, setIpos] = useState<Ipo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [accRes, appsRes, iposRes] = await Promise.all([
      supabase.from("demat_accounts").select("*").eq("id", id).single(),
      supabase.from("ipo_applications").select("*, ipo:ipos(*)").eq("demat_account_id", id),
      supabase.from("ipos").select("*").order("close_date", { ascending: false, nullsFirst: false }),
    ]);
    if (!accRes.error) setAccount(accRes.data);
    if (!appsRes.error) setApplications((appsRes.data as AppRow[]) || []);
    if (!iposRes.error) setIpos(iposRes.data || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [id]);

  // Only offer IPOs this account hasn't applied to yet (one application per IPO per account)
  const availableIpos = useMemo(() => {
    const applied = new Set(applications.map((a) => a.ipo_id));
    return ipos.filter((ipo) => !applied.has(ipo.id));
  }, [ipos, applications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading account…</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Demat account not found.</p>
        <Link to="/demat-accounts">
          <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to accounts</Button>
        </Link>
      </div>
    );
  }

  const allotted = applications.filter((a) => a.shares_allotted > 0).length;
  const totalProfit = applications.reduce((sum, a) => sum + (a.profit ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/demat-accounts">
            <Button variant="outline" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h2 className="text-lg font-semibold leading-tight">{account.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {account.broker}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Applications</p>
            <p className="font-semibold tabular-nums">{applications.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Allotted</p>
            <p className="font-semibold tabular-nums">{allotted}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total P&L</p>
            <p className={`font-semibold tabular-nums ${totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
              {totalProfit >= 0 ? "+" : ""}₹{totalProfit.toFixed(2)}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={availableIpos.length === 0}
            title={availableIpos.length === 0 ? "No IPOs left to apply for from this account" : undefined}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">No applications from this account yet</p>
          <p className="text-xs text-muted-foreground mt-1">Use "Add Application" to record one.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <DataGrid
            columns={columns}
            rows={applications}
            rowKeyGetter={(r) => r.id}
            sortComparators={sortComparators}
            defaultSort={[{ columnKey: "close_date", direction: "DESC" }]}
          />
        </div>
      )}

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={null}
        fixedDematAccountId={account.id}
        ipos={availableIpos}
        onSaved={fetchData}
      />
    </div>
  );
}
