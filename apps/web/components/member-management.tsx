'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Crown, Shield, Eye, Trash2, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface TripMember {
  id: number;
  trip_id: number;
  user_id: string;
  role: string;
  invite_status: string;
  joined_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface TripInvite {
  id: string;
  trip_id: number;
  created_by: string;
  expires_at?: string;
  max_uses?: number;
  used_count: number;
  created_at: string;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye,
};

const roleColors = {
  owner: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  admin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  member: 'text-green-400 bg-green-500/10 border-green-500/20',
  viewer: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export function MemberManagement({ tripId, ownerSub }: { tripId: number; ownerSub: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  // Fetch members
  const { data: members = [] } = useQuery<TripMember[]>({
    queryKey: ['trip-members', tripId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/trips/${tripId}/members`, {
        headers: { 'x-user-sub': user?.id || '' },
      });
      return data;
    },
    enabled: !!user,
  });

  // Fetch invites
  const { data: invites = [] } = useQuery<TripInvite[]>({
    queryKey: ['trip-invites', tripId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/trips/${tripId}/invites`, {
        headers: { 'x-user-sub': user?.id || '' },
      });
      return data;
    },
    enabled: !!user,
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(
        `${API_URL}/trips/${tripId}/invites`,
        { expires_at: null, max_uses: null },
        { headers: { 'x-user-sub': user?.id || '' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-invites', tripId] });
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      const { data } = await axios.put(
        `${API_URL}/trips/${tripId}/members/${memberId}`,
        { role },
        { headers: { 'x-user-sub': user?.id || '' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await axios.delete(`${API_URL}/trips/${tripId}/members/${memberId}`, {
        headers: { 'x-user-sub': user?.id || '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-members', tripId] });
    },
  });

  const isOwner = user?.id === ownerSub;
  const currentMember = members.find(m => m.user_id === user?.id);
  const isAdmin = isOwner || currentMember?.role === 'admin';

  // Debug logging - remove after debugging
  console.log('Member Management Debug:', {
    userId: user?.id,
    ownerSub,
    isOwner,
    currentMember,
    currentMemberRole: currentMember?.role,
    isAdmin,
    allMembers: members.map(m => ({ user_id: m.user_id, role: m.role }))
  });

  const copyInviteLink = (inviteId: string) => {
    const inviteUrl = `${window.location.origin}/invite/${inviteId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(inviteId);
    setTimeout(() => setCopiedInvite(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Members List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Trip Members ({members.length})
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Invite People
            </button>
          )}
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || Users;
            const roleColor = roleColors[member.role as keyof typeof roleColors];

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  {member.user?.avatar_url ? (
                    <img
                      src={member.user.avatar_url}
                      alt={member.user.display_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{member.user?.display_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && member.user_id !== ownerSub ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })
                      }
                      className="px-3 py-1 bg-background border border-border rounded-lg text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${roleColor}`}>
                      <RoleIcon className="w-4 h-4" />
                      <span className="text-sm font-medium capitalize">{member.role}</span>
                    </div>
                  )}

                  {isAdmin && member.user_id !== ownerSub && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this member?')) {
                          removeMemberMutation.mutate(member.id);
                        }
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Links */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5" />
            Active Invite Links
          </h3>

          {invites.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active invites. Create one to share this trip with others.
            </p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate text-muted-foreground">
                      {window.location.origin}/invite/{invite.id}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used {invite.used_count} times
                      {invite.max_uses && ` / ${invite.max_uses} max`}
                    </p>
                  </div>

                  <button
                    onClick={() => copyInviteLink(invite.id)}
                    className="ml-4 flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-sm font-medium"
                  >
                    {copiedInvite === invite.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Create Invite Link</h3>
            <p className="text-muted-foreground mb-6">
              Create a shareable link that others can use to join this trip. The link will never
              expire and can be used unlimited times.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  createInviteMutation.mutate();
                  setShowInviteModal(false);
                }}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Create Link
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 bg-background border border-border py-2 rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
