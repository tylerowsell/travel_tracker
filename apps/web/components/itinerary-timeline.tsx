"use client"

import { motion } from 'framer-motion';
import { Plane, Home, MapPin, Activity, FileText, Calendar, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type ItineraryTimelineProps = {
  items: any[];
  onItemClick?: (item: any) => void;
  onAddClick?: () => void;
};

const typeIcons: Record<string, any> = {
  flight: Plane,
  stay: Home,
  transport: MapPin,
  activity: Activity,
  note: FileText,
};

const typeColors: Record<string, string> = {
  flight: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  stay: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  transport: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  activity: 'text-green-400 bg-green-500/10 border-green-500/20',
  note: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export function ItineraryTimeline({ items, onItemClick, onAddClick }: ItineraryTimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
        <div>
          <h3 className="text-lg font-semibold mb-2">No itinerary items yet</h3>
          <p className="text-muted-foreground mb-4">
            Add flights, accommodations, activities, and more to plan your trip
          </p>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Add Itinerary Item
            </button>
          )}
        </div>
      </div>
    );
  }

  // Sort items by start date
  const sortedItems = [...items].sort((a, b) =>
    new Date(a.start_dt).getTime() - new Date(b.start_dt).getTime()
  );

  return (
    <div className="space-y-8">
      {sortedItems.map((item, index) => {
        const Icon = typeIcons[item.type] || Activity;
        const colorClass = typeColors[item.type] || typeColors.note;
        const startDate = new Date(item.start_dt);
        const endDate = item.end_dt ? new Date(item.end_dt) : null;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onItemClick?.(item)}
            className={`relative pl-8 pb-8 border-l-2 border-border last:pb-0 ${
              onItemClick ? 'cursor-pointer hover:bg-accent/30 rounded-lg -mx-2 px-4' : ''
            }`}
          >
            {/* Timeline dot */}
            <div className={`absolute left-0 top-0 -translate-x-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="ml-4 space-y-2">
              {/* Type badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                  {item.type}
                </span>
                {item.conf_code && (
                  <span className="text-xs text-muted-foreground">
                    Conf: {item.conf_code}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold">{item.title}</h3>

              {/* Date/Time */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(item.start_dt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {startDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {endDate && ` - ${endDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                  </span>
                </div>
                {item.location_text && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location_text}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">
                  {item.notes}
                </p>
              )}

              {/* Duration for activities with end time */}
              {endDate && (
                <div className="text-xs text-muted-foreground">
                  Duration:{' '}
                  {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))}h{' '}
                  {Math.round(
                    ((endDate.getTime() - startDate.getTime()) % (1000 * 60 * 60)) /
                      (1000 * 60)
                  )}m
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
