import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCoursesPage } from '@/lib/admin/queries';

export function usePaginatedCourses(pageSize=25){
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey:['admin','courses','page',page,pageSize], queryFn: ()=> fetchCoursesPage(page,pageSize), placeholderData:(prev)=> prev });
  return { ...query, page, setPage, pageSize };
}
