import { apiRequest } from "./api";

export type Vehicle = {
  id: string;
  vin: string;
  make: string;
  model: string;
  category: string;
  year: number;
  mileage?: number | null;
  price: number | string;
  status: "AVAILABLE" | "SOLD" | "MAINTENANCE";
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

type VehicleListResponse = {
  success: boolean;
  data: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type VehicleResponse = {
  success: boolean;
  data: Vehicle;
};

export type VehicleFilters = {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  limit?: number;
};

export async function getVehicles(
  filters: VehicleFilters = {},
): Promise<VehicleListResponse> {
  const params = new URLSearchParams();

  if (filters.make) params.set("make", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  return apiRequest<VehicleListResponse>(
    `/vehicles?${params.toString()}`,
  );
}

export async function purchaseVehicle(
  vehicleId: string,
): Promise<VehicleResponse> {
  const token = localStorage.getItem("token");

  return apiRequest<VehicleResponse>(
    `/vehicles/${vehicleId}/purchase`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}