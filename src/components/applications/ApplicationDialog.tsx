import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import type { ApplicationStatus, DematAccount, Ipo, IpoApplication, IpoApplicationFormData, PaymentMode } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

type FormState = IpoApplicationFormData & { ipo_id: string };

const emptyForm: FormState = {
  ipo_id: "",
  demat_account_id: "",
  lots_applied: "1",
  is_allotted: false,
  shares_allotted: "0",
  avg_selling_price: "",
  profit: "",
  status: "applied",
  payment_mode: "upi",
  notes: "",
};

const paymentModes: { value: PaymentMode; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "asba", label: "ASBA" },
];

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Application being edited; null = add new */
  application: IpoApplication | null;
  /** Fix the IPO (IPO detail page) — hides the IPO picker */
  fixedIpoId?: string;
  /** Fix the demat account (demat account page) — hides the account picker */
  fixedDematAccountId?: string;
  /** Options for the pickers that are not fixed */
  ipos?: Ipo[];
  dematAccounts?: DematAccount[];
  onSaved: () => void;
}

/** Shared add/edit dialog for IPO applications, used by the IPO detail and demat account pages. */
export function ApplicationDialog({
  open,
  onOpenChange,
  application,
  fixedIpoId,
  fixedDematAccountId,
  ipos = [],
  dematAccounts = [],
  onSaved,
}: ApplicationDialogProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (application) {
      setForm({
        ipo_id: application.ipo_id,
        demat_account_id: application.demat_account_id,
        lots_applied: application.lots_applied.toString(),
        is_allotted: application.is_allotted,
        shares_allotted: application.shares_allotted.toString(),
        avg_selling_price: application.avg_selling_price?.toString() || "",
        profit: application.profit?.toString() || "",
        status: application.status,
        payment_mode: application.payment_mode ?? "upi",
        notes: application.notes || "",
      });
    } else {
      setForm({
        ...emptyForm,
        ipo_id: fixedIpoId ?? ipos[0]?.id ?? "",
        demat_account_id: fixedDematAccountId ?? dematAccounts[0]?.id ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isEdit = !!application;
  const canSave = !!form.ipo_id && !!form.demat_account_id;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const payload = {
      user_id: user!.id,
      ipo_id: form.ipo_id,
      demat_account_id: form.demat_account_id,
      lots_applied: parseInt(form.lots_applied) || 1,
      is_allotted: form.is_allotted,
      shares_allotted: parseInt(form.shares_allotted) || 0,
      avg_selling_price: form.avg_selling_price ? parseFloat(form.avg_selling_price) : null,
      profit: form.profit ? parseFloat(form.profit) : null,
      status: form.status,
      payment_mode: form.payment_mode,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error: dbError } = isEdit
      ? await supabase.from("ipo_applications").update(payload).eq("id", application!.id)
      : await supabase.from("ipo_applications").insert(payload);
    setSaving(false);

    if (dbError) {
      // Keep the dialog open so the user can correct it
      setError(
        dbError.code === "23505"
          ? "An application from this demat account already exists for this IPO."
          : dbError.message
      );
      return;
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Application" : "Add Application"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the application details." : "Record a new IPO application."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {!fixedIpoId && (
            <div className="grid gap-1.5">
              <Label htmlFor="app_ipo">IPO <span className="text-destructive">*</span></Label>
              <Select
                value={form.ipo_id}
                onValueChange={(val) => setForm({ ...form, ipo_id: val })}
                disabled={isEdit}
              >
                <SelectTrigger id="app_ipo">
                  <SelectValue placeholder="Select IPO…" />
                </SelectTrigger>
                <SelectContent>
                  {ipos.map((ipo) => (
                    <SelectItem key={ipo.id} value={ipo.id}>
                      {ipo.name}
                      {ipo.close_date ? ` (closes ${formatDate(ipo.close_date)})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!fixedDematAccountId && (
            <div className="grid gap-1.5">
              <Label htmlFor="app_demat">Demat Account <span className="text-destructive">*</span></Label>
              <Select
                value={form.demat_account_id}
                onValueChange={(val) => setForm({ ...form, demat_account_id: val })}
                disabled={isEdit}
              >
                <SelectTrigger id="app_demat">
                  <SelectValue placeholder="Select account…" />
                </SelectTrigger>
                <SelectContent>
                  {dematAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.broker})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="lots">Lots Applied</Label>
              <Input id="lots" type="number" min="1" value={form.lots_applied} onChange={(e) => setForm({ ...form, lots_applied: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => {
                  const status = val as ApplicationStatus;
                  setForm({ ...form, status, is_allotted: ["allotted", "listed", "sold"].includes(status) });
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="payment_done">Payment Done</SelectItem>
                  <SelectItem value="allotted">Allotted</SelectItem>
                  <SelectItem value="not_allotted">Not Allotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="shares_allotted">Shares Allotted</Label>
              <Input id="shares_allotted" type="number" min="0" value={form.shares_allotted} onChange={(e) => setForm({ ...form, shares_allotted: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="avg_price">Avg Selling Price (₹)</Label>
              <Input id="avg_price" type="number" step="0.01" placeholder="0.00" value={form.avg_selling_price} onChange={(e) => setForm({ ...form, avg_selling_price: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profit">Profit / Loss (₹)</Label>
            <Input id="profit" type="number" step="0.01" placeholder="Positive = profit, negative = loss" value={form.profit} onChange={(e) => setForm({ ...form, profit: e.target.value })} />
          </div>

          <div className="grid gap-1.5">
            <Label>Payment Mode</Label>
            <div className="flex items-center gap-6 pt-1">
              {paymentModes.map((mode) => (
                <label key={mode.value} htmlFor={`pay_${mode.value}`} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    id={`pay_${mode.value}`}
                    type="radio"
                    name="payment_mode"
                    value={mode.value}
                    checked={form.payment_mode === mode.value}
                    onChange={() => setForm({ ...form, payment_mode: mode.value })}
                    className="h-4 w-4 accent-primary cursor-pointer"
                  />
                  {mode.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Any notes…" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? "Saving…" : isEdit ? "Update" : "Add Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
