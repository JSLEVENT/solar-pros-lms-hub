import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsersPage } from '@/lib/admin/queries';

export function usePaginatedUsers(pageSize=25){
  const [page, setPage] = useState(0);
  const query = useQuery({ 
    queryKey:['admin','users','page',page,pageSize], 
    queryFn: ()=> fetchUsersPage(page,pageSize), 
    placeholderData: (prev)=> prev
  });
  return { ...query, page, setPage, pageSize };
}
