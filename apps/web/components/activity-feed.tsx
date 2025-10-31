'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import {
  Activity,
  DollarSign,
  Users,
  MessageCircle,
  Heart,
  MapPin,
  Calendar,
  Plane,
} from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ActivityLog {
  id: number;
  trip_id: number;
  user_id: string;
  action_type: string;
  action_metadata?: any;
  created_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
  };
}

const actionIcons: Record<string, any> = {
  expense_added: DollarSign,
  expense_updated: DollarSign,
  expense_deleted: DollarSign,
  member_joined: Users,
  member_left: Users,
  comment_added: MessageCircle,
  reaction_added: Heart,
  itinerary_added: MapPin,
  itinerary_updated: MapPin,
  accommodation_added: Calendar,
  trip_updated: Plane,
};

const actionColors: Record<string, string> = {
  expense_added: 'text-green-400 bg-green-500/10',
  expense_updated: 'text-blue-400 bg-blue-500/10',
  expense_deleted: 'text-red-400 bg-red-500/10',
  member_joined: 'text-purple-400 bg-purple-500/10',
  member_left: 'text-orange-400 bg-orange-500/10',
  comment_added: 'text-blue-400 bg-blue-500/10',
  reaction_added: 'text-pink-400 bg-pink-500/10',
  itinerary_added: 'text-cyan-400 bg-cyan-500/10',
  itinerary_updated: 'text-cyan-400 bg-cyan-500/10',
  accommodation_added: 'text-yellow-400 bg-yellow-500/10',
  trip_updated: 'text-indigo-400 bg-indigo-500/10',
};

function getActivityMessage(activity: ActivityLog): string {
  const userName = activity.user?.display_name || 'Someone';

  switch (activity.action_type) {
    case 'expense_added':
      return `${userName} added a new expense`;
    case 'expense_updated':
      return `${userName} updated an expense`;
    case 'expense_deleted':
      return `${userName} deleted an expense`;
    case 'member_joined':
      return `${userName} joined the trip`;
    case 'member_left':
      return `${userName} left the trip`;
    case 'comment_added':
      return `${userName} commented on an expense`;
    case 'reaction_added':
      return `${userName} reacted with ${activity.action_metadata?.emoji || '❤️'}`;
    case 'itinerary_added':
      return `${userName} added an itinerary item`;
    case 'itinerary_updated':
      return `${userName} updated an itinerary item`;
    case 'accommodation_added':
      return `${userName} added accommodation`;
    case 'trip_updated':
      return `${userName} updated trip details`;
    default:
      return `${userName} performed an action`;
  }
}

export function ActivityFeed({ tripId }: { tripId: number }) {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['trip-activity', tripId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/trips/${tripId}/activity`, {
        headers: { 'x-user-sub': user?.id || '' },
        params: { limit: 50 },
      });
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for near real-time updates
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 p-4 bg-card rounded-lg border border-border">
            <div className="w-10 h-10 bg-accent rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-accent rounded animate-pulse w-3/4" />
              <div className="h-3 bg-accent rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Activity will appear here as trip members interact with the trip
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = actionIcons[activity.action_type] || Activity;
        const colorClass = actionColors[activity.action_type] || 'text-gray-400 bg-gray-500/10';

        return (
          <div
            key={activity.id}
            className="flex gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/20 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {activity.user?.avatar_url ? (
                    <img
                      src={activity.user.avatar_url}
                      alt={activity.user.display_name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <p className="text-sm font-medium">{getActivityMessage(activity)}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>

              {activity.action_metadata && Object.keys(activity.action_metadata).length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {activity.action_metadata.amount && (
                    <span className="font-mono">${activity.action_metadata.amount}</span>
                  )}
                  {activity.action_metadata.category && (
                    <span className="ml-2 px-2 py-0.5 bg-accent rounded capitalize">
                      {activity.action_metadata.category}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
