import api from "./client";

export interface RealizationEntryDto {
  id: number;
  departmentId: number;
  month: number;
  year: number;
  plannedValue: number;
  realizedValue: number;
  targetValue?: number | null;
  forecastValue?: number | null;
  updatedAt: string;
}

export interface UpsertRealizationEntryDto {
  departmentId: number;
  month: number;
  year: number;
  plannedValue: number;
  realizedValue: number;
  targetValue?: number | null;
  forecastValue?: number | null;
}

export async function getRealizationEntries(
  departmentId: number,
  year: number
): Promise<RealizationEntryDto[]> {
  const res = await api.get<RealizationEntryDto[]>("/Realization", {
    params: { departmentId, year },
  });
  return res.data;
}

export async function upsertRealizationEntry(
  dto: UpsertRealizationEntryDto
): Promise<RealizationEntryDto> {
  const res = await api.put<RealizationEntryDto>("/Realization", dto);
  return res.data;
}

export async function deleteRealizationEntry(id: number): Promise<void> {
  await api.delete(`/Realization/${id}`);
}
