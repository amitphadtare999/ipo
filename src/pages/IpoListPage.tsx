import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import type { Ipo, IpoFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataGrid, compareNumber, compareText, type Column } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, TrendingUp, Search } from "lucide-react";

const emptyForm: IpoFormData = {
  name: "",
  start_date: "",
  close_date: "",
  price_band_low: "",
  price_band_high: "",
  allotment_date: "",
  listing_date: "",
  listing_price: "",
  ipo_size_cr: "",
  gmp: "",
  sub_qib: "",
  sub_bhni: "",
  sub_shni: "",
  sub_retail: "",
};

type StatusVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const statusConfig: Record<string, { label: string; variant: StatusVariant; dot: string }> = {
  Listed:   { label: "Listed",   variant: "success",   dot: "bg-green-500" },
  Open:     { label: "Open",     variant: "default",   dot: "bg-primary" },
  Closed:   { label: "Closed",   variant: "secondary", dot: "bg-gray-400" },
  Upcoming: { label: "Upcoming", variant: "warning",   dot: "bg-yellow-500" },
};

function getIpoStatus(ipo: Ipo) {
  const today = new Date().toISOString().split("T")[0];
  if (ipo.listing_date && ipo.listing_date <= today) return statusConfig.Listed;
  if (ipo.close_date && ipo.close_date < today) return statusConfig.Closed;
  if (ipo.start_date && ipo.start_date <= today && (!ipo.close_date || ipo.close_date >= today))
    return statusConfig.Open;
  return statusConfig.Upcoming;
}

const statusOrder: Record<string, number> = { Open: 0, Upcoming: 1, Closed: 2, Listed: 3 };

const ipoSortComparators = {
  name: compareText<Ipo>((r) => r.name),
  status: compareNumber<Ipo>((r) => statusOrder[getIpoStatus(r).label]),
  price_band: compareNumber<Ipo>((r) => r.price_band_high),
  start_date: compareText<Ipo>((r) => r.start_date),
  close_date: compareText<Ipo>((r) => r.close_date),
  ipo_size_cr: compareNumber<Ipo>((r) => r.ipo_size_cr),
  gmp: compareNumber<Ipo>((r) => r.gmp),
  sub_qib: compareNumber<Ipo>((r) => r.sub_qib),
  sub_bhni: compareNumber<Ipo>((r) => r.sub_bhni),
  sub_shni: compareNumber<Ipo>((r) => r.sub_shni),
  sub_retail: compareNumber<Ipo>((r) => r.sub_retail),
};

export default function IpoListPage() {
  const { user } = useAuth();
  const [ipos, setIpos] = useState<Ipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIpo, setEditingIpo] = useState<Ipo | null>(null);
  const [form, setForm] = useState<IpoFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchIpos = async () => {
    const { data, error } = await supabase
      .from("ipos")
      .select("*")
      .order("close_date", { ascending: false, nullsFirst: false });
    if (!error) setIpos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchIpos(); }, []);

  const openAddDialog = () => {
    setEditingIpo(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (ipo: Ipo) => {
    setEditingIpo(ipo);
    setForm({
      name: ipo.name,
      start_date: ipo.start_date || "",
      close_date: ipo.close_date || "",
      price_band_low: ipo.price_band_low?.toString() || "",
      price_band_high: ipo.price_band_high?.toString() || "",
      allotment_date: ipo.allotment_date || "",
      listing_date: ipo.listing_date || "",
      listing_price: ipo.listing_price?.toString() || "",
      ipo_size_cr: ipo.ipo_size_cr?.toString() || "",
      gmp: ipo.gmp?.toString() || "",
      sub_qib: ipo.sub_qib?.toString() || "",
      sub_bhni: ipo.sub_bhni?.toString() || "",
      sub_shni: ipo.sub_shni?.toString() || "",
      sub_retail: ipo.sub_retail?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      user_id: user!.id,
      name: form.name.trim(),
      start_date: form.start_date || null,
      close_date: form.close_date || null,
      price_band_low: form.price_band_low ? parseFloat(form.price_band_low) : null,
      price_band_high: form.price_band_high ? parseFloat(form.price_band_high) : null,
      allotment_date: form.allotment_date || null,
      listing_date: form.listing_date || null,
      listing_price: form.listing_price ? parseFloat(form.listing_price) : null,
      ipo_size_cr: form.ipo_size_cr ? parseFloat(form.ipo_size_cr) : null,
      gmp: form.gmp ? parseFloat(form.gmp) : null,
      sub_qib: form.sub_qib ? parseFloat(form.sub_qib) : null,
      sub_bhni: form.sub_bhni ? parseFloat(form.sub_bhni) : null,
      sub_shni: form.sub_shni ? parseFloat(form.sub_shni) : null,
      sub_retail: form.sub_retail ? parseFloat(form.sub_retail) : null,
      updated_at: new Date().toISOString(),
    };
    if (editingIpo) {
      await supabase.from("ipos").update(payload).eq("id", editingIpo.id);
    } else {
      await supabase.from("ipos").insert(payload);
    }
    setSaving(false);
    setDialogOpen(false);
    fetchIpos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this IPO? This cannot be undone.")) return;
    await supabase.from("ipos").delete().eq("id", id);
    fetchIpos();
  };

  const updateField = (field: keyof IpoFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const filtered = ipos.filter((ipo) =>
    ipo.name.toLowerCase().includes(search.toLowerCase())
  );

  const dash = <span className="text-muted-foreground">—</span>;

  const ipoColumns: Column<Ipo>[] = [
    {
      key: "name",
      name: "Name",
      frozen: true,
      minWidth: 160,
      cellClass: "font-medium",
      renderCell: ({ row: ipo }) => (
        <Link to={`/ipo/${ipo.id}`} className="text-primary hover:underline underline-offset-4">
          {ipo.name}
        </Link>
      ),
    },
    {
      key: "status",
      name: "Status",
      width: 105,
      renderCell: ({ row: ipo }) => {
        const status = getIpoStatus(ipo);
        return (
          <Badge variant={status.variant} className="gap-1.5 font-medium">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: "price_band",
      name: "Price Band",
      width: 125,
      cellClass: "tabular-nums",
      renderCell: ({ row: ipo }) =>
        ipo.price_band_low && ipo.price_band_high
          ? `₹${ipo.price_band_low} – ₹${ipo.price_band_high}`
          : dash,
    },
    {
      key: "start_date",
      name: "Open",
      width: 105,
      cellClass: "tabular-nums text-muted-foreground",
      renderCell: ({ row: ipo }) => formatDate(ipo.start_date) || dash,
    },
    {
      key: "close_date",
      name: "Close",
      width: 105,
      cellClass: "tabular-nums text-muted-foreground",
      renderCell: ({ row: ipo }) => formatDate(ipo.close_date) || dash,
    },
    {
      key: "ipo_size_cr",
      name: "Size (Cr)",
      width: 95,
      cellClass: "tabular-nums",
      renderCell: ({ row: ipo }) => (ipo.ipo_size_cr ? `₹${ipo.ipo_size_cr}` : dash),
    },
    {
      key: "gmp",
      name: "GMP %",
      width: 85,
      cellClass: "tabular-nums font-medium",
      renderCell: ({ row: ipo }) =>
        ipo.gmp !== null ? (
          <span className={ipo.gmp >= 0 ? "text-green-600" : "text-red-500"}>
            {ipo.gmp > 0 ? "+" : ""}{ipo.gmp}%
          </span>
        ) : (
          dash
        ),
    },
    {
      key: "sub_qib",
      name: "QIB",
      width: 70,
      headerCellClass: "text-right",
      cellClass: "text-right tabular-nums",
      renderCell: ({ row: ipo }) => (ipo.sub_qib !== null ? `${ipo.sub_qib}x` : dash),
    },
    {
      key: "sub_bhni",
      name: "bHNI",
      width: 70,
      headerCellClass: "text-right",
      cellClass: "text-right tabular-nums",
      renderCell: ({ row: ipo }) => (ipo.sub_bhni !== null ? `${ipo.sub_bhni}x` : dash),
    },
    {
      key: "sub_shni",
      name: "sHNI",
      width: 70,
      headerCellClass: "text-right",
      cellClass: "text-right tabular-nums",
      renderCell: ({ row: ipo }) => (ipo.sub_shni !== null ? `${ipo.sub_shni}x` : dash),
    },
    {
      key: "sub_retail",
      name: "Retail",
      width: 76,
      headerCellClass: "text-right",
      cellClass: "text-right tabular-nums",
      renderCell: ({ row: ipo }) => (ipo.sub_retail !== null ? `${ipo.sub_retail}x` : dash),
    },
    {
      key: "actions",
      name: "",
      width: 72,
      resizable: false,
      renderCell: ({ row: ipo }) => (
        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => openEditDialog(ipo)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(ipo.id)}
          >
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
          <p className="text-sm text-muted-foreground">Loading IPOs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar: search + add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search IPOs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openAddDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add IPO
        </Button>
      </div>

      {/* Empty state */}
      {ipos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No IPOs yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Add your first IPO to start tracking subscriptions, allotments, and profits.
          </p>
          <Button onClick={openAddDialog} className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Add your first IPO
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No IPOs match "<strong>{search}</strong>"</p>
        </div>
      ) : (
        /* Table */
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <DataGrid
            columns={ipoColumns}
            rows={filtered}
            rowKeyGetter={(ipo) => ipo.id}
            sortComparators={ipoSortComparators}
            defaultSort={[{ columnKey: "close_date", direction: "DESC" }]}
          />
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIpo ? "Edit IPO" : "Add New IPO"}</DialogTitle>
            <DialogDescription>
              {editingIpo ? "Update the IPO details below." : "Fill in the details for the new IPO."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="name">IPO Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Tata Technologies"
              />
            </div>

            {/* Dates row 1 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="start_date">Open Date</Label>
                <Input id="start_date" type="date" value={form.start_date} onChange={(e) => updateField("start_date", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="close_date">Close Date</Label>
                <Input id="close_date" type="date" value={form.close_date} onChange={(e) => updateField("close_date", e.target.value)} />
              </div>
            </div>

            {/* Price band */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="price_band_low">Price Band Low (₹)</Label>
                <Input id="price_band_low" type="number" step="0.01" placeholder="0.00" value={form.price_band_low} onChange={(e) => updateField("price_band_low", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="price_band_high">Price Band High (₹)</Label>
                <Input id="price_band_high" type="number" step="0.01" placeholder="0.00" value={form.price_band_high} onChange={(e) => updateField("price_band_high", e.target.value)} />
              </div>
            </div>

            {/* Dates row 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="allotment_date">Allotment Date</Label>
                <Input id="allotment_date" type="date" value={form.allotment_date} onChange={(e) => updateField("allotment_date", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="listing_date">Listing Date</Label>
                <Input id="listing_date" type="date" value={form.listing_date} onChange={(e) => updateField("listing_date", e.target.value)} />
              </div>
            </div>

            {/* Financials */}
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="listing_price">Listing Price (₹)</Label>
                <Input id="listing_price" type="number" step="0.01" placeholder="0.00" value={form.listing_price} onChange={(e) => updateField("listing_price", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ipo_size_cr">IPO Size (Cr)</Label>
                <Input id="ipo_size_cr" type="number" step="0.01" placeholder="0.00" value={form.ipo_size_cr} onChange={(e) => updateField("ipo_size_cr", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="gmp">GMP (%)</Label>
                <Input id="gmp" type="number" step="0.01" placeholder="0" value={form.gmp} onChange={(e) => updateField("gmp", e.target.value)} />
              </div>
            </div>

            {/* Subscription */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Subscription (×)</Label>
              <div className="grid grid-cols-4 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="sub_qib" className="text-xs">QIB</Label>
                  <Input id="sub_qib" type="number" step="0.01" placeholder="0" value={form.sub_qib} onChange={(e) => updateField("sub_qib", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sub_bhni" className="text-xs">b HNI</Label>
                  <Input id="sub_bhni" type="number" step="0.01" placeholder="0" value={form.sub_bhni} onChange={(e) => updateField("sub_bhni", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sub_shni" className="text-xs">s HNI</Label>
                  <Input id="sub_shni" type="number" step="0.01" placeholder="0" value={form.sub_shni} onChange={(e) => updateField("sub_shni", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sub_retail" className="text-xs">Retail</Label>
                  <Input id="sub_retail" type="number" step="0.01" placeholder="0" value={form.sub_retail} onChange={(e) => updateField("sub_retail", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Saving…" : editingIpo ? "Update IPO" : "Add IPO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
