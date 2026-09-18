import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { DematAccount, DematAccountFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CreditCard, Building2 } from "lucide-react";

const emptyForm: DematAccountFormData = { name: "", broker: "" };

const brokerColors: Record<string, string> = {
  zerodha:   "bg-[#387ed1]/10 text-[#387ed1]",
  groww:     "bg-[#00d09c]/10 text-[#00a879]",
  angelone:  "bg-[#e2482c]/10 text-[#e2482c]",
  upstox:    "bg-[#7b2ff7]/10 text-[#7b2ff7]",
  hdfc:      "bg-[#004c8f]/10 text-[#004c8f]",
  icicidirect: "bg-[#f7941d]/10 text-[#c07010]",
};

function getBrokerColor(broker: string) {
  const key = broker.toLowerCase().replace(/\s+/g, "");
  return brokerColors[key] || "bg-primary/10 text-primary";
}

function BrokerInitial({ broker }: { broker: string }) {
  const color = getBrokerColor(broker);
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${color}`}>
      {broker.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function DematAccountsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<DematAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DematAccount | null>(null);
  const [form, setForm] = useState<DematAccountFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("demat_accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const openAddDialog = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (account: DematAccount) => {
    setEditingAccount(account);
    setForm({ name: account.name, broker: account.broker });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.broker.trim()) return;
    setSaving(true);
    const payload = {
      user_id: user!.id,
      name: form.name.trim(),
      broker: form.broker.trim(),
      updated_at: new Date().toISOString(),
    };
    if (editingAccount) {
      await supabase.from("demat_accounts").update(payload).eq("id", editingAccount.id);
    } else {
      await supabase.from("demat_accounts").insert(payload);
    }
    setSaving(false);
    setDialogOpen(false);
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account? All associated applications will also be deleted.")) return;
    await supabase.from("demat_accounts").delete().eq("id", id);
    fetchAccounts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading accounts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button onClick={openAddDialog} className="gap-2 shrink-0 ml-auto">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Empty state */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No accounts yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Link your demat accounts to start tracking IPO applications across brokers.
          </p>
          <Button onClick={openAddDialog} className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Add your first account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/demat-accounts/${account.id}`)}
              onKeyDown={(e) => { if (e.key === "Enter") navigate(`/demat-accounts/${account.id}`); }}
              className="group relative flex items-start gap-4 bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
            >
              <BrokerInitial broker={account.broker} />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{account.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">{account.broker}</p>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-2">
                  Added {new Date(account.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Action buttons — visible on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); openEditDialog(account); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Demat Account"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Update the account details." : "Enter the details of your demat account."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="acc_name">
                Account Holder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="acc_name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Amit Sharma"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="broker">
                Broker <span className="text-destructive">*</span>
              </Label>
              <Input
                id="broker"
                value={form.broker}
                onChange={(e) => setForm({ ...form, broker: e.target.value })}
                placeholder="e.g., Zerodha, Groww, Angel One"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.broker.trim()}
            >
              {saving ? "Saving…" : editingAccount ? "Update" : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
