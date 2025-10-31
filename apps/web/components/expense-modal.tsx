"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, MapPin, FileText, Plus, Minus, Camera, Upload } from 'lucide-react';

type ExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  trip: any;
  expense?: any; // If provided, we're editing
};

export function ExpenseModal({ isOpen, onClose, onSubmit, trip, expense }: ExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dt: new Date().toISOString().split('T')[0],
    amount: '',
    currency: trip?.home_currency || 'USD',
    category: 'food',
    note: '',
    merchant_name: '',
    location_text: '',
    payer_id: trip?.participants?.[0]?.id || '',
  });

  const [splits, setSplits] = useState(
    trip?.participants?.map((p: any) => ({
      participant_id: p.id,
      selected: true,
      share_type: 'equal',
      share_value: null,
    })) || []
  );

  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');

  // Initialize form data when editing
  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        dt: expense.dt,
        amount: expense.amount.toString(),
        currency: expense.currency,
        category: expense.category || 'food',
        note: expense.note || '',
        merchant_name: expense.merchant_name || '',
        location_text: expense.location_text || '',
        payer_id: expense.payer_id,
      });

      if (expense.splits && expense.splits.length > 0) {
        setSplits(
          trip?.participants?.map((p: any) => {
            const existingSplit = expense.splits.find((s: any) => s.participant_id === p.id);
            return {
              participant_id: p.id,
              selected: !!existingSplit,
              share_type: existingSplit?.share_type || 'equal',
              share_value: existingSplit?.share_value || null,
            };
          }) || []
        );
      }

      setPhotos(expense.receipt_urls || []);
    } else if (isOpen && !expense) {
      // Reset for new expense
      setFormData({
        dt: new Date().toISOString().split('T')[0],
        amount: '',
        currency: trip?.home_currency || 'USD',
        category: 'food',
        note: '',
        merchant_name: '',
        location_text: '',
        payer_id: trip?.participants?.[0]?.id || '',
      });
      setSplits(
        trip?.participants?.map((p: any) => ({
          participant_id: p.id,
          selected: true,
          share_type: 'equal',
          share_value: null,
        })) || []
      );
      setPhotos([]);
    }
  }, [isOpen, expense, trip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.payer_id) return;

    setIsSubmitting(true);
    try {
      const selectedSplits = splits.filter((s: any) => s.selected);
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        fx_rate_to_home: 1.0,
        receipt_urls: photos.length > 0 ? photos : null,
        splits: selectedSplits.map((s: any) => ({
          participant_id: s.participant_id,
          share_type: s.share_type,
          share_value: s.share_value,
        })),
      });

      // Reset form only if not editing (will be closed anyway)
      if (!expense) {
        setFormData({
          dt: new Date().toISOString().split('T')[0],
          amount: '',
          currency: trip?.home_currency || 'USD',
          category: 'food',
          note: '',
          merchant_name: '',
          location_text: '',
          payer_id: trip?.participants?.[0]?.id || '',
        });
        setSplits(
          trip?.participants?.map((p: any) => ({
            participant_id: p.id,
            selected: true,
            share_type: 'equal',
            share_value: null,
          })) || []
        );
        setPhotos([]);
        setPhotoInput('');
      }
      onClose();
    } catch (error) {
      console.error(`Failed to ${expense ? 'update' : 'create'} expense:`, error);
      alert(`Failed to ${expense ? 'update' : 'create'} expense. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSplit = (participantId: number) => {
    setSplits(
      splits.map((s: any) =>
        s.participant_id === participantId ? { ...s, selected: !s.selected } : s
      )
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-card/95 backdrop-blur">
            <div>
              <h2 className="text-2xl font-bold">{expense ? 'Edit' : 'Add'} Expense</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {expense ? `Update expense details for ${trip?.title}` : `Record a new expense for ${trip?.title}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Amount *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    required
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-24 px-3 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.dt}
                  onChange={(e) => setFormData({ ...formData, dt: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="accommodation">Accommodation</option>
                  <option value="food">Food & Dining</option>
                  <option value="transport">Transportation</option>
                  <option value="activities">Activities</option>
                  <option value="shopping">Shopping</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Merchant & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Merchant / Vendor</label>
                <input
                  type="text"
                  value={formData.merchant_name}
                  onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                  placeholder="e.g., Restaurant Name"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location_text}
                  onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
                  placeholder="e.g., Paris, France"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Note / Description
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Add any details about this expense..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Paid By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Paid By *</label>
              <select
                value={formData.payer_id}
                onChange={(e) => setFormData({ ...formData, payer_id: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {trip?.participants?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Between */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Split Between</label>
              <div className="space-y-2">
                {trip?.participants?.map((p: any, index: number) => {
                  const split = splits.find((s: any) => s.participant_id === p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        split?.selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={split?.selected || false}
                        onChange={() => toggleSplit(p.id)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <span className="flex-1">{p.display_name}</span>
                      {split?.selected && formData.amount && (
                        <span className="text-sm text-muted-foreground">
                          ~{' '}
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: formData.currency,
                          }).format(
                            parseFloat(formData.amount) /
                              splits.filter((s: any) => s.selected).length
                          )}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Photo Attachments */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Receipt Photos (Optional)
              </label>

              {/* Photo URL Input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  placeholder="Paste image URL (e.g., https://...)"
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (photoInput.trim()) {
                      setPhotos([...photos, photoInput.trim()]);
                      setPhotoInput('');
                    }
                  }}
                  className="px-4 py-3 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Photo List */}
              {photos.length > 0 && (
                <div className="space-y-2">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/50"
                    >
                      <img
                        src={photo}
                        alt={`Receipt ${index + 1}`}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48"/%3E%3C/svg%3E';
                        }}
                      />
                      <div className="flex-1 truncate text-sm text-muted-foreground">
                        {photo}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                <Upload className="w-3 h-3 inline mr-1" />
                Tip: Upload images to a service like Imgur or use existing URLs. Full file upload coming soon with Plaid integration!
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.amount || !formData.payer_id}
                className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {expense ? 'Updating...' : 'Adding...'}
                  </span>
                ) : (
                  expense ? 'Update Expense' : 'Add Expense'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
