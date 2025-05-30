import { Q_KEYS } from '@/shared/qkeys';
import { useQuery } from '@tanstack/react-query';
import { fetchMinerals } from '../services/minerals.service';
import type { IMineral, MineralCategory } from '../mineral.interface';
import { useState } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UseReadMineralsResult {
  data: IMineral[];
  isLoading: boolean;
  error: Error | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refetch: () => Promise<void>;
}

export const useReadMinerals = (category: string): UseReadMineralsResult => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [Q_KEYS.MINERALS, category, page, pageSize],
    queryFn: () => fetchMinerals(category, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const minerals = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page,
    pageSize,
    totalPages: 0
  };

  return {
    data: minerals,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    refetch
  };
}; 