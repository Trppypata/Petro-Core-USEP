import { Q_KEYS } from '@/shared/qkeys';
import { useQuery } from '@tanstack/react-query';
import type { IRock, RockCategory } from '../rock.interface';
import { fetchRocks } from '../services';
import { useState } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UseReadRocksResult {
  data: IRock[];
  isLoading: boolean;
  error: Error | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refetch: () => Promise<void>;
}

export function useReadRocks(category: string | RockCategory): UseReadRocksResult {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const { data, isLoading, error, refetch: queryRefetch } = useQuery({
    queryKey: [Q_KEYS.ROCKS, category, page, pageSize],
    queryFn: () => fetchRocks(category, page, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refetch = async (): Promise<void> => {
    await queryRefetch();
  };

  return {
    data: data?.data || [],
    isLoading,
    error: error as Error | null,
    pagination: data?.pagination || { page, pageSize, total: 0, totalPages: 0 },
    setPage,
    setPageSize,
    refetch
  };
} 