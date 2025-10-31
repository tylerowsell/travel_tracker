"use client"

import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import { Filter, DollarSign, Users, User, Camera, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type TripMapProps = {
  expenses: any[];
  itinerary: any[];
  trip: any;
};

type MapFilters = {
  categories: string[];
  spendType: 'all' | 'group' | 'personal';
  showPhotos: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: '#3b82f6',
  food: '#10b981',
  transport: '#f59e0b',
  activities: '#8b5cf6',
  shopping: '#ec4899',
  other: '#6b7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: 'Accommodation',
  food: 'Food & Dining',
  transport: 'Transportation',
  activities: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
};

export function TripMap({ expenses, itinerary, trip }: TripMapProps) {
  const [filters, setFilters] = useState<MapFilters>({
    categories: Object.keys(CATEGORY_COLORS),
    spendType: 'all',
    showPhotos: false,
  });

  // Combine expenses and itinerary items with locations
  const mapPoints = useMemo(() => {
    const points: any[] = [];

    // Add expenses with locations
    expenses
      ?.filter((e) => e.lat && e.lng)
      .forEach((expense) => {
        // Filter by category
        if (!filters.categories.includes(expense.category)) return;

        // Filter by spend type
        if (filters.spendType === 'personal' && expense.splits?.length > 1) return;
        if (filters.spendType === 'group' && expense.splits?.length === 1) return;

        points.push({
          type: 'expense',
          id: `expense-${expense.id}`,
          lat: expense.lat,
          lng: expense.lng,
          data: expense,
          color: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other,
        });
      });

    // Add itinerary items with locations
    itinerary
      ?.filter((item) => item.lat && item.lng)
      .forEach((item) => {
        points.push({
          type: 'itinerary',
          id: `itinerary-${item.id}`,
          lat: item.lat,
          lng: item.lng,
          data: item,
          color: '#6366f1',
        });
      });

    return points;
  }, [expenses, itinerary, filters]);

  // Create journey line from itinerary items
  const journeyLine = useMemo(() => {
    if (!itinerary || itinerary.length === 0) return [];

    const sortedItems = [...itinerary]
      .filter((item) => item.lat && item.lng)
      .sort((a, b) => new Date(a.start_dt).getTime() - new Date(b.start_dt).getTime());

    return sortedItems.map((item) => [item.lat, item.lng] as [number, number]);
  }, [itinerary]);

  // Calculate map center and bounds
  const mapCenter = useMemo(() => {
    if (mapPoints.length === 0) return [35.6762, 139.6503]; // Default to Tokyo

    const avgLat = mapPoints.reduce((sum, p) => sum + p.lat, 0) / mapPoints.length;
    const avgLng = mapPoints.reduce((sum, p) => sum + p.lng, 0) / mapPoints.length;

    return [avgLat, avgLng];
  }, [mapPoints]);

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (mapPoints.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <MapPin className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
        <div>
          <h3 className="text-lg font-semibold mb-2">No location data yet</h3>
          <p className="text-muted-foreground">
            Add expenses or itinerary items with locations to see them on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Category Filters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Filter by Category</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const isActive = filters.categories.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'border-2'
                        : 'border border-border opacity-50 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: isActive ? CATEGORY_COLORS[key] : undefined,
                      backgroundColor: isActive ? `${CATEGORY_COLORS[key]}20` : undefined,
                      color: isActive ? CATEGORY_COLORS[key] : undefined,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spend Type Toggle */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Spend Type</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, spendType: 'all' }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  filters.spendType === 'all'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                All Expenses
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, spendType: 'group' }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  filters.spendType === 'group'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Users className="w-4 h-4" />
                Group Expenses
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, spendType: 'personal' }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  filters.spendType === 'personal'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <User className="w-4 h-4" />
                Personal Only
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-border grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-primary">{mapPoints.length}</div>
              <div className="text-xs text-muted-foreground">Points on Map</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(
                  expenses
                    ?.filter((e) => e.lat && e.lng && filters.categories.includes(e.category))
                    .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0,
                  trip.home_currency
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Shown</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{journeyLine.length}</div>
              <div className="text-xs text-muted-foreground">Journey Stops</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card className="p-0 overflow-hidden">
        <div className="h-[600px] relative">
          <MapContainer
            center={mapCenter as [number, number]}
            zoom={6}
            scrollWheelZoom={true}
            className="h-full w-full rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Journey Line */}
            {journeyLine.length > 1 && (
              <Polyline
                positions={journeyLine}
                pathOptions={{
                  color: '#6366f1',
                  weight: 3,
                  opacity: 0.6,
                  dashArray: '10, 10',
                }}
              />
            )}

            {/* Expense Markers */}
            {mapPoints.map((point) => {
              if (point.type === 'expense') {
                const expense = point.data;
                const payer = trip.participants?.find((p: any) => p.id === expense.payer_id);

                return (
                  <CircleMarker
                    key={point.id}
                    center={[point.lat, point.lng]}
                    radius={8}
                    pathOptions={{
                      fillColor: point.color,
                      fillOpacity: 0.8,
                      color: '#fff',
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-2 space-y-2 min-w-[200px]">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-base">
                              {formatCurrency(parseFloat(expense.amount), expense.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">{expense.category}</div>
                          </div>
                          <div
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${point.color}20`,
                              color: point.color,
                            }}
                          >
                            {CATEGORY_LABELS[expense.category]}
                          </div>
                        </div>

                        {expense.merchant_name && (
                          <div className="text-sm">
                            <strong>Merchant:</strong> {expense.merchant_name}
                          </div>
                        )}

                        {expense.note && (
                          <div className="text-sm text-muted-foreground">{expense.note}</div>
                        )}

                        {expense.location_text && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {expense.location_text}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Paid by {payer?.display_name} • Split {expense.splits?.length || 1} way
                          {expense.splits?.length > 1 ? 's' : ''}
                        </div>

                        {expense.receipt_urls && expense.receipt_urls.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Camera className="w-3 h-3" />
                            {expense.receipt_urls.length} photo
                            {expense.receipt_urls.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              }

              // Itinerary markers
              const item = point.data;
              return (
                <Marker key={point.id} position={[point.lat, point.lng]}>
                  <Popup>
                    <div className="p-2 space-y-2">
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.type}</div>
                      {item.location_text && (
                        <div className="text-sm">{item.location_text}</div>
                      )}
                      {item.notes && (
                        <div className="text-sm text-muted-foreground">{item.notes}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm">Itinerary Stop</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary opacity-60" style={{ width: '20px' }} />
              <span className="text-sm">Journey Path</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Click markers for details • Scroll to zoom
          </div>
        </div>
      </Card>
    </div>
  );
}
