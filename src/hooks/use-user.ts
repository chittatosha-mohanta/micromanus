'use client';

import { useQuery } from '@tanstack/react-query';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  credits: number;
  settings: {
    theme: string;
    defaultModel: string | null;
    defaultProvider: string | null;
  } | null;
}

export function useUser() {
  return useQuery<UserData>({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('/api/user');
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
  });
}

export function useCredits() {
  const { data: user, ...rest } = useUser();
  return {
    credits: user?.credits ?? 0,
    hasCredits: (user?.credits ?? 0) > 0,
    ...rest,
  };
}
