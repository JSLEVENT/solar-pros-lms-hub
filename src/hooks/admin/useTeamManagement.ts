import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamsPage, fetchTeamDetail, createTeam, updateTeam, deleteTeam, toggleTeamArchived, assignManager, removeManager, addMemberToTeam, removeMemberFromTeam, bulkAddMembers, exportTeamMembers } from '@/lib/admin/queries';

interface Pagination { page:number; pageSize:number; search:string; includeArchived:boolean }

export function useTeamManagement(){
  const qc = useQueryClient();
  const [pagination, setPagination] = useState<Pagination>({ page:0, pageSize:20, search:'', includeArchived:true });
  const [selectedId, setSelectedId] = useState<string|null>(null);

  const teamsPage = useQuery({
    queryKey:['admin','teams','page', pagination],
    queryFn: ()=> fetchTeamsPage({ page: pagination.page, pageSize: pagination.pageSize, search: pagination.search, includeArchived: pagination.includeArchived })
  });

  const teamDetail = useQuery({
    queryKey:['admin','team', selectedId],
    queryFn: ()=> selectedId? fetchTeamDetail(selectedId): null,
    enabled: !!selectedId,
    staleTime: 30_000
  });

  const invalidateList = () => qc.invalidateQueries({ queryKey:['admin','teams'] });

  const createMutation = useMutation({
    mutationFn: ({ name, description}:{ name:string; description:string }) => createTeam(name, description),
    onSuccess: ()=> invalidateList()
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, name, description}:{ id:string; name?:string; description?:string }) => updateTeam(id,{ name, description }),
    onSuccess: (_,_vars)=>{ qc.invalidateQueries({ queryKey:['admin','team', _vars.id] }); invalidateList(); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id:string)=> deleteTeam(id),
    onSuccess: ()=> { setSelectedId(null); invalidateList(); }
  });
  const archiveMutation = useMutation({
    mutationFn: ({ id, next }:{ id:string; next:boolean })=> toggleTeamArchived(id,next),
    onSuccess: (_,_vars)=>{ qc.invalidateQueries({ queryKey:['admin','team', _vars.id] }); invalidateList(); }
  });
  const assignManagerMutation = useMutation({
    mutationFn: ({ team_id, manager_id }:{ team_id:string; manager_id:string })=> assignManager(team_id, manager_id),
    onSuccess: (_,_vars)=> qc.invalidateQueries({ queryKey:['admin','team', _vars.team_id] })
  });
  const removeManagerMutation = useMutation({
    mutationFn: ({ team_id, manager_id }:{ team_id:string; manager_id:string })=> removeManager(team_id, manager_id),
    onSuccess: (_,_vars)=> qc.invalidateQueries({ queryKey:['admin','team', _vars.team_id] })
  });
  const addMemberMutation = useMutation({
    mutationFn: ({ team_id, user_id }:{ team_id:string; user_id:string })=> addMemberToTeam(team_id, user_id),
    onSuccess: (_,_vars)=> qc.invalidateQueries({ queryKey:['admin','team', _vars.team_id] })
  });
  const removeMemberMutation = useMutation({
    mutationFn: ({ team_id, user_id }:{ team_id:string; user_id:string })=> removeMemberFromTeam(team_id, user_id),
    onSuccess: (_,_vars)=> qc.invalidateQueries({ queryKey:['admin','team', _vars.team_id] })
  });
  const bulkAddMutation = useMutation({
    mutationFn: ({ team_id, user_ids }:{ team_id:string; user_ids:string[] })=> bulkAddMembers(team_id, user_ids),
    onSuccess: (_,_vars)=> qc.invalidateQueries({ queryKey:['admin','team', _vars.team_id] })
  });
  const exportMembersMutation = useMutation({
    mutationFn: (team_id:string)=> exportTeamMembers(team_id)
  });

  const setSearch = useCallback((search:string)=> setPagination(p=> ({ ...p, page:0, search })),[]);
  const setPage = useCallback((page:number)=> setPagination(p=> ({ ...p, page })),[]);
  const setIncludeArchived = useCallback((includeArchived:boolean)=> setPagination(p=> ({ ...p, includeArchived })),[]);

  return {
    pagination,
    setSearch,
    setPage,
    setIncludeArchived,
    setSelectedId,
    selectedId,
    teamsPage,
    teamDetail,
    createMutation,
    updateMutation,
    deleteMutation,
    archiveMutation,
    assignManagerMutation,
    removeManagerMutation,
    addMemberMutation,
    removeMemberMutation,
    bulkAddMutation,
    exportMembersMutation
  };
}
