import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModernCard } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, UserPlus, Settings, Trash2, BarChart3 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  profiles: {
    full_name: string;
    role: string;
  } | null;
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

export const TeamManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_memberships(count)
        `);

      if (error) throw error;

      const teamsWithCount = data?.map(team => ({
        ...team,
        member_count: team.team_memberships?.[0]?.count || 0
      })) || [];

      setTeams(teamsWithCount);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .in('role', ['learner', 'manager']);

      if (error) throw error;

      const formattedUsers = data?.map(user => ({
        id: user.user_id,
        full_name: user.full_name || 'Unknown',
        role: user.role
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      // First get team memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('team_memberships')
        .select('id, user_id, team_id, assigned_at')
        .eq('team_id', teamId);

      if (membershipsError) throw membershipsError;

      // Then get profile data for each member
      const membersWithProfiles = [];
      for (const membership of memberships || []) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('user_id', membership.user_id)
          .single();

        membersWithProfiles.push({
          ...membership,
          profiles: profile || { full_name: 'Unknown', role: 'learner' }
        });
      }

      setTeamMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const createTeam = async () => {
    try {
      const { error } = await supabase
        .from('teams')
        .insert([{
          ...newTeam,
          created_by: profile?.user_id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team created successfully",
      });

      setCreateTeamOpen(false);
      setNewTeam({ name: '', description: '' });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const addMemberToTeam = async (userId: string) => {
    if (!selectedTeam) return;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .insert([{
          user_id: userId,
          team_id: selectedTeam.id,
          assigned_by: profile?.user_id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member added to team",
      });

      setAddMemberOpen(false);
      fetchTeamMembers(selectedTeam.id);
      fetchTeams();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member to team",
        variant: "destructive",
      });
    }
  };

  const removeMemberFromTeam = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed from team",
      });

      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id);
      }
      fetchTeams();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const canManageTeams = profile?.role === 'owner' || profile?.role === 'admin';

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Management</h1>
        {canManageTeams && (
          <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <Label htmlFor="teamDescription">Description</Label>
                  <Textarea
                    id="teamDescription"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Enter team description"
                  />
                </div>
                <Button onClick={createTeam} className="w-full">
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <ModernCard
            key={team.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setSelectedTeam(team);
              fetchTeamMembers(team.id);
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                </div>
                <Badge variant="secondary">{team.member_count || 0} members</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{team.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedTeam(team); fetchTeamMembers(team.id); }}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Open
                </Button>
              </div>
            </div>
          </ModernCard>
        ))}
      </div>

      {selectedTeam && (
        <ModernCard>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedTeam.name} Members</h2>
              {canManageTeams && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Member to {selectedTeam.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select onValueChange={addMemberToTeam}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter(user => !teamMembers.some(member => member.user_id === user.id))
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name} ({user.role})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{member.profiles?.full_name || 'Unknown User'}</p>
                    <Badge variant="outline" className="text-xs">
                      {member.profiles?.role || 'Unknown Role'}
                    </Badge>
                  </div>
                  {canManageTeams && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMemberFromTeam(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No members in this team yet.
                </p>
              )}
              {canManageTeams && selectedTeam && (
                <div className="flex items-center gap-2 pt-2">
                  <Select onValueChange={(val) => addMemberToTeam(val)}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Add member" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => !teamMembers.some(tm => tm.user_id === u.id)).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </ModernCard>
      )}
    </div>
  );
};