import { supabase } from "./supabase";

export type OverviewStats = {
  properties: number;
  available: number;
  underOffer: number;
  sold: number;
  let: number;
  communities: number;
  units: number;
  enquiries: number | null; // null = couldn't read (RLS not yet applied)
};

export type RecentProperty = {
  id: string;
  title: string;
  status: string;
  community: string;
  created_at: string;
};

export type RecentEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_title: string;
  status: string;
  submitted_at: string;
};

async function count(table: "properties" | "communities" | "property_units" | "property_enquiries", status?: string) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count: n, error } = await query;
  if (error) throw error;
  return n ?? 0;
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const [properties, available, underOffer, sold, letCount, communities, units] = await Promise.all([
    count("properties"),
    count("properties", "available"),
    count("properties", "under-offer"),
    count("properties", "sold"),
    count("properties", "let"),
    count("communities"),
    count("property_units"),
  ]);

  let enquiries: number | null;
  try {
    enquiries = await count("property_enquiries");
  } catch {
    enquiries = null;
  }

  return {
    properties,
    available,
    underOffer,
    sold,
    let: letCount,
    communities,
    units,
    enquiries,
  };
}

export async function fetchRecentProperties(): Promise<RecentProperty[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, status, community, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentEnquiries(): Promise<RecentEnquiry[] | null> {
  try {
    const { data, error } = await supabase
      .from("property_enquiries")
      .select("id, name, email, phone, property_title, status, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    return data ?? [];
  } catch {
    return null;
  }
}
