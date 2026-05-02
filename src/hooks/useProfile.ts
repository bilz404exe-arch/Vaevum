import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/utils";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (data: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  }) => Promise<{ error?: string }>;
  uploadAvatar: (
    base64: string,
    mimeType: string,
  ) => Promise<{ url?: string; error?: string }>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetchWithAuth("/api/profile");
        if (res.ok) {
          const data: Profile = await res.json();
          setProfile(data);
        }
      } catch {
        // No profile yet
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const updateProfile = async (data: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  }) => {
    try {
      const method = profile ? "PATCH" : "POST";
      const res = await fetchWithAuth("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "Failed to update profile" };
      setProfile(json as Profile);
      return {};
    } catch {
      return { error: "Something went wrong" };
    }
  };

  const uploadAvatar = async (
    base64: string,
    mimeType: string,
  ): Promise<{ url?: string; error?: string }> => {
    try {
      const res = await fetchWithAuth("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { error: (json as { error?: string }).error ?? "Upload failed" };
      }
      const { url } = json as { url: string };

      // Persist the URL to the profile
      const saveResult = await updateProfile({ avatar_url: url });
      if (saveResult.error) {
        return { error: saveResult.error };
      }

      return { url };
    } catch {
      return { error: "Something went wrong during upload" };
    }
  };

  return { profile, loading, updateProfile, uploadAvatar };
}
