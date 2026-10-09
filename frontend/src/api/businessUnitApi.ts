import client from "./client";

export interface BusinessUnit {
  id: number;
  name: string;
}

export const getBusinessUnits = async (): Promise<BusinessUnit[]> => {
  const { data } = await client.get("/BusinessUnit");
  return data;
};

export const createBusinessUnit = async (name: string): Promise<BusinessUnit> => {
  const { data } = await client.post("/BusinessUnit", { name });
  return data;
};

export const updateBusinessUnit = async (id: number, name: string): Promise<void> => {
  await client.put(`/BusinessUnit/${id}`, { name });
};

export const deleteBusinessUnit = async (id: number): Promise<void> => {
  await client.delete(`/BusinessUnit/${id}`);
};
