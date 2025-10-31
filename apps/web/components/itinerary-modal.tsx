'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Plane, Home, Car, Activity as ActivityIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  item?: any; // If provided, we're editing
}

const ITEM_TYPES = [
  { value: 'flight', label: 'Flight', icon: Plane, color: 'blue' },
  { value: 'stay', label: 'Accommodation', icon: Home, color: 'purple' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'orange' },
  { value: 'activity', label: 'Activity', icon: ActivityIcon, color: 'green' },
  { value: 'note', label: 'Note', icon: FileText, color: 'gray' },
];

export function ItineraryModal({ isOpen, onClose, tripId, item }: ItineraryModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: item?.type || 'activity',
    title: item?.title || '',
    location_text: item?.location_text || '',
    start_dt: item?.start_dt ? new Date(item.start_dt).toISOString().slice(0, 16) : '',
    end_dt: item?.end_dt ? new Date(item.end_dt).toISOString().slice(0, 16) : '',
    notes: item?.notes || '',
    conf_code: item?.conf_code || '',
  });

  // Create or update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = item
        ? `${API_URL}/itinerary/${tripId}/${item.id}`
        : `${API_URL}/itinerary/${tripId}`;
      const method = item ? 'put' : 'post';

      const { data: result } = await axios[method](url, {
        ...data,
        start_dt: new Date(data.start_dt).toISOString(),
        end_dt: data.end_dt ? new Date(data.end_dt).toISOString() : null,
      }, {
        headers: { 'x-user-sub': user?.id || '' },
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
      onClose();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`${API_URL}/itinerary/${tripId}/${item.id}`, {
        headers: { 'x-user-sub': user?.id || '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this itinerary item?')) {
      deleteMutation.mutate();
    }
  };

  if (!isOpen) return null;

  const selectedType = ITEM_TYPES.find(t => t.value === formData.type);
  const Icon = selectedType?.icon || ActivityIcon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {item ? 'Edit' : 'Add'} Itinerary Item
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {ITEM_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.type === type.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <TypeIcon className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Flight to Tokyo, Dinner at..."
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location_text}
                  onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="City, venue, or address"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_dt" className="block text-sm font-medium mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    id="start_dt"
                    type="datetime-local"
                    required
                    value={formData.start_dt}
                    onChange={(e) => setFormData({ ...formData, start_dt: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="end_dt" className="block text-sm font-medium mb-2">
                    End Date & Time
                  </label>
                  <input
                    id="end_dt"
                    type="datetime-local"
                    value={formData.end_dt}
                    onChange={(e) => setFormData({ ...formData, end_dt: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Confirmation Code */}
              <div>
                <label htmlFor="conf_code" className="block text-sm font-medium mb-2">
                  Confirmation Code
                </label>
                <input
                  id="conf_code"
                  type="text"
                  value={formData.conf_code}
                  onChange={(e) => setFormData({ ...formData, conf_code: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Booking reference"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Additional details..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {item && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-6 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : item ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
