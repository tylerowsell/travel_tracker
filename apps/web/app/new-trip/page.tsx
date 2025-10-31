'use client';
import { useState } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin, Calendar, Users, DollarSign, TrendingUp,
  Plus, Trash2, ArrowRight, ArrowLeft, Check, Plane,
  Home, Activity
} from 'lucide-react';

type Participant = {
  display_name: string;
  weight: number;
};

type CategoryBudget = {
  category: string;
  planned_amount: string;
};

type ItineraryItem = {
  type: string;
  title: string;
  start_dt: string;
  location_text: string;
  notes: string;
};

const CATEGORIES = [
  { value: 'accommodation', label: 'Accommodation', icon: Home },
  { value: 'food', label: 'Food & Dining', icon: Activity },
  { value: 'transport', label: 'Transportation', icon: Plane },
  { value: 'activities', label: 'Activities', icon: Activity },
  { value: 'shopping', label: 'Shopping', icon: Activity },
  { value: 'other', label: 'Other', icon: Activity },
];

export default function NewTrip() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 2: Budget
  const [totalBudget, setTotalBudget] = useState('');
  const [perDiemBudget, setPerDiemBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([
    { category: 'accommodation', planned_amount: '' },
    { category: 'food', planned_amount: '' },
    { category: 'transport', planned_amount: '' },
    { category: 'activities', planned_amount: '' },
  ]);

  // Step 3: Participants
  const [participants, setParticipants] = useState<Participant[]>([
    { display_name: 'Me', weight: 1.0 }
  ]);

  // Step 4: Initial Itinerary (Optional)
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);

  const addParticipant = () => {
    setParticipants([...participants, { display_name: '', weight: 1.0 }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string | number) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const updateCategoryBudget = (category: string, amount: string) => {
    const updated = categoryBudgets.map(cb =>
      cb.category === category ? { ...cb, planned_amount: amount } : cb
    );
    setCategoryBudgets(updated);
  };

  const addItineraryItem = () => {
    setItineraryItems([...itineraryItems, {
      type: 'flight',
      title: '',
      start_dt: startDate || '',
      location_text: '',
      notes: ''
    }]);
  };

  const removeItineraryItem = (index: number) => {
    setItineraryItems(itineraryItems.filter((_, i) => i !== index));
  };

  const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: string) => {
    const updated = [...itineraryItems];
    updated[index] = { ...updated[index], [field]: value };
    setItineraryItems(updated);
  };

  const canProceed = () => {
    if (step === 1) {
      return title.trim() && startDate && endDate && destination.trim();
    }
    if (step === 3) {
      return participants.every(p => p.display_name.trim());
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      // Create trip with participants
      const tripData = {
        title,
        destination,
        home_currency: homeCurrency,
        start_date: startDate,
        end_date: endDate,
        total_budget: totalBudget ? parseFloat(totalBudget) : null,
        per_diem_budget: perDiemBudget ? parseFloat(perDiemBudget) : null,
        participants: participants.map(p => ({
          display_name: p.display_name,
          weight: p.weight
        }))
      };

      const { data: trip } = await api.post('/trips', tripData);
      const tripId = trip.id;

      // Add category budgets
      const validBudgets = categoryBudgets.filter(cb => cb.planned_amount && parseFloat(cb.planned_amount) > 0);
      if (validBudgets.length > 0) {
        await Promise.all(
          validBudgets.map(cb =>
            api.post(`/category-budgets/${tripId}`, {
              category: cb.category,
              planned_amount: parseFloat(cb.planned_amount)
            })
          )
        );
      }

      // Add itinerary items
      if (itineraryItems.length > 0) {
        const validItems = itineraryItems.filter(item => item.title.trim());
        if (validItems.length > 0) {
          await Promise.all(
            validItems.map(item =>
              api.post(`/itinerary/${tripId}`, {
                ...item,
                start_dt: new Date(item.start_dt).toISOString()
              })
            )
          );
        }
      }

      // Navigate to the trip detail page
      router.push(`/trip/${tripId}`);
    } catch (error) {
      console.error('Failed to create trip:', error);
      alert('Failed to create trip. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Trip Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer in Europe"
                className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Paris, France"
                className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Home Currency
              </label>
              <select
                value={homeCurrency}
                onChange={(e) => setHomeCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CHF">CHF - Swiss Franc</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Total Budget
                </label>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="5000"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">Optional - your overall trip budget</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Daily Budget
                </label>
                <input
                  type="number"
                  value={perDiemBudget}
                  onChange={(e) => setPerDiemBudget(e.target.value)}
                  placeholder="200"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">Optional - average spending per day</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Category Budgets (Optional)</label>
              </div>

              <div className="grid gap-3">
                {CATEGORIES.map(cat => (
                  <div key={cat.value} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">{cat.label}</div>
                    <input
                      type="number"
                      value={categoryBudgets.find(cb => cb.category === cat.value)?.planned_amount || ''}
                      onChange={(e) => updateCategoryBudget(cat.value, e.target.value)}
                      placeholder="0"
                      step="0.01"
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Travelers
              </label>
              <button
                type="button"
                onClick={addParticipant}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Traveler
              </button>
            </div>

            <div className="space-y-3">
              {participants.map((participant, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={participant.display_name}
                      onChange={(e) => updateParticipant(index, 'display_name', e.target.value)}
                      placeholder="Name"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <input
                      type="number"
                      value={participant.weight}
                      onChange={(e) => updateParticipant(index, 'weight', parseFloat(e.target.value) || 1.0)}
                      step="0.1"
                      min="0.1"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">Split weight</p>
                  </div>
                  {participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Split weight</strong> determines how expenses are divided. Use 1.0 for equal splits,
                or adjust for different spending arrangements (e.g., 1.5 if someone pays more).
              </p>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Plane className="w-4 h-4 text-primary" />
                  Initial Itinerary Items
                </label>
                <p className="text-xs text-muted-foreground mt-1">Optional - add flights, activities, etc.</p>
              </div>
              <button
                type="button"
                onClick={addItineraryItem}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {itineraryItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No itinerary items yet</p>
                <p className="text-sm mt-1">You can add these later from the trip page</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itineraryItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-border bg-card/50 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <select
                        value={item.type}
                        onChange={(e) => updateItineraryItem(index, 'type', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="flight">Flight</option>
                        <option value="stay">Accommodation</option>
                        <option value="transport">Transport</option>
                        <option value="activity">Activity</option>
                        <option value="note">Note</option>
                      </select>

                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItineraryItem(index, 'title', e.target.value)}
                        placeholder="Title (e.g., Flight to Paris)"
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                      />

                      <button
                        type="button"
                        onClick={() => removeItineraryItem(index)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="datetime-local"
                        value={item.start_dt}
                        onChange={(e) => updateItineraryItem(index, 'start_dt', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={item.location_text}
                        onChange={(e) => updateItineraryItem(index, 'location_text', e.target.value)}
                        placeholder="Location"
                        className="px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItineraryItem(index, 'notes', e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        );
    }
  };

  const steps = [
    { number: 1, title: 'Trip Details', description: 'Basic information' },
    { number: 2, title: 'Budget', description: 'Set your budgets' },
    { number: 3, title: 'Travelers', description: 'Who\'s coming?' },
    { number: 4, title: 'Itinerary', description: 'Plan activities (optional)' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold gradient-text">Create New Trip</h1>
        <p className="text-muted-foreground">
          Plan your adventure with detailed budgets, travelers, and itinerary
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((s, idx) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{
                  scale: step >= s.number ? 1 : 0.8,
                  backgroundColor: step >= s.number ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.number ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                {step > s.number ? <Check className="w-5 h-5" /> : s.number}
              </motion.div>
              <div className="text-center mt-2">
                <div className="text-xs font-medium">{s.title}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{s.description}</div>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                step > s.number ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>{steps[step - 1].title}</CardTitle>
          <CardDescription>{steps[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Trip
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Skip button for optional step */}
      {step === 4 && itineraryItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip itinerary and create trip →
          </button>
        </motion.div>
      )}
    </div>
  );
}
