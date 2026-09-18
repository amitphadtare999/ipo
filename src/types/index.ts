export interface Ipo {
  id: string;
  user_id: string;
  name: string;
  start_date: string | null;
  close_date: string | null;
  price_band_low: number | null;
  price_band_high: number | null;
  allotment_date: string | null;
  listing_date: string | null;
  listing_price: number | null;
  ipo_size_cr: number | null;
  gmp: number | null;
  sub_qib: number | null;
  sub_bhni: number | null;
  sub_shni: number | null;
  sub_retail: number | null;
  created_at: string;
  updated_at: string;
}

export interface IpoFormData {
  name: string;
  start_date: string;
  close_date: string;
  price_band_low: string;
  price_band_high: string;
  allotment_date: string;
  listing_date: string;
  listing_price: string;
  ipo_size_cr: string;
  gmp: string;
  sub_qib: string;
  sub_bhni: string;
  sub_shni: string;
  sub_retail: string;
}

export interface DematAccount {
  id: string;
  user_id: string;
  name: string;
  broker: string;
  created_at: string;
  updated_at: string;
}

export interface DematAccountFormData {
  name: string;
  broker: string;
}

export type ApplicationStatus =
  | "applied"
  | "payment_done"
  | "allotted"
  | "not_allotted"
  | "listed" // legacy — kept so existing rows still display
  | "sold"; // legacy — kept so existing rows still display

export type PaymentMode = "upi" | "asba";

export interface IpoApplication {
  id: string;
  user_id: string;
  ipo_id: string;
  demat_account_id: string;
  lots_applied: number;
  is_allotted: boolean;
  shares_allotted: number;
  avg_selling_price: number | null;
  profit: number | null;
  status: ApplicationStatus;
  payment_mode: PaymentMode | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  demat_account?: DematAccount;
  ipo?: Ipo;
}

export interface IpoApplicationFormData {
  demat_account_id: string;
  lots_applied: string;
  is_allotted: boolean;
  shares_allotted: string;
  avg_selling_price: string;
  profit: string;
  status: ApplicationStatus;
  payment_mode: PaymentMode;
  notes: string;
}
