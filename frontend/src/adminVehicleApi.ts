import { apiRequest } from "./api";
import type { Vehicle } from "./vehicleApi";

export type CreateVehicleInput = {
  vin: string;
  make: string;
  model: string;
  category: string;
  year: number;
  mileage?: number;
  price: number;
  quantity: number;
  status: "AVAILABLE" | "SOLD" | "MAINTENANCE";
};

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

type VehicleResponse = {
  success: boolean;
  data: Vehicle;
};

export async function createVehicle(
  input: CreateVehicleInput,
): Promise<VehicleResponse> {
  const token = localStorage.getItem("token");

  return apiRequest<VehicleResponse>("/vehicles", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export async function updateVehicle(
  vehicleId: string,
  input: UpdateVehicleInput,
): Promise<VehicleResponse> {
  const token = localStorage.getItem("token");

  return apiRequest<VehicleResponse>(`/vehicles/${vehicleId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export async function deleteVehicle(
  vehicleId: string,
): Promise<{ success: boolean; data: null }> {
  const token = localStorage.getItem("token");

  return apiRequest<{ success: boolean; data: null }>(
    `/vehicles/${vehicleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function restockVehicle(
  vehicleId: string,
  quantity: number,
): Promise<VehicleResponse> {
  const token = localStorage.getItem("token");

  return apiRequest<VehicleResponse>(
    `/vehicles/${vehicleId}/restock`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    },
  );
}