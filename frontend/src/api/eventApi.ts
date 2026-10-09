// src/api/eventApi.ts

import api from "./client";
import { Event } from "../types/event";

export const getEvents = async () => {
    return (await api.get<Event[]>("/Event")).data;
};

export const createEvent = async (event: Omit<Event,"id">) => {
    return (await api.post("/Event", event)).data;
};

export const updateEvent = async (
    id:number,
    event:Partial<Event>
) => {
    return (await api.put(`/Event/${id}`,event)).data;
};

export const deleteEvent = async(id:number)=>{
    return api.delete(`/Event/${id}`);
};