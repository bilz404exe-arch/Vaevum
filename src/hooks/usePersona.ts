import { useState, useEffect } from "react";
import { Persona, CreatePersonaInput } from "@/types";
import { fetchWithAuth } from "@/lib/utils";

interface UsePersonaReturn {
  personas: Persona[];
  loading: boolean;
  createPersona: (data: CreatePersonaInput) => Promise<Persona | null>;
  updatePersona: (
    id: string,
    data: Partial<CreatePersonaInput>,
  ) => Promise<void>;
  deletePersona: (id: string) => Promise<void>;
}

export function usePersona(): UsePersonaReturn {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const res = await fetchWithAuth("/api/personas");
        if (!res.ok) {
          console.error(
            "Failed to fetch personas:",
            res.status,
            res.statusText,
          );
          return;
        }
        const data: Persona[] = await res.json();
        setPersonas(data);
      } catch (err) {
        console.error("Error fetching personas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  const createPersona = async (
    data: CreatePersonaInput,
  ): Promise<Persona | null> => {
    try {
      const res = await fetchWithAuth("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.error("Failed to create persona:", res.status, res.statusText);
        return null;
      }
      const created: Persona = await res.json();
      setPersonas((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("Error creating persona:", err);
      return null;
    }
  };

  const updatePersona = async (
    id: string,
    data: Partial<CreatePersonaInput>,
  ): Promise<void> => {
    try {
      const res = await fetchWithAuth(`/api/personas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.error("Failed to update persona:", res.status, res.statusText);
        return;
      }
      const updated: Persona = await res.json();
      setPersonas((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error("Error updating persona:", err);
    }
  };

  const deletePersona = async (id: string): Promise<void> => {
    try {
      const res = await fetchWithAuth(`/api/personas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Failed to delete persona:", res.status, res.statusText);
        return;
      }
      setPersonas((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting persona:", err);
    }
  };

  return { personas, loading, createPersona, updatePersona, deletePersona };
}
