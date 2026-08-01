import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Search,
  SlidersHorizontal,
  Flame,
  Layers,
  CheckCircle,
  Plus,
  Phone,
  Navigation,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Info,
  X,
  QrCode,
  Award,
  Filter,
  RefreshCw,
  Droplet,
} from 'lucide-react';
import { BloodDrive, BloodType, User } from '../types';

interface BloodDrivesSectionProps {
  user?: User;
  onOpenEmergencyModal?: () => void;
}

const INITIAL_DRIVES: BloodDrive[] = [
  {
    id: 'drv-001',
    name: 'Metropolitan Red Cross Mega Drive',
    organizer: 'Indian Red Cross Society',
    locationName: 'Central City Civic Pavilion, Sector 4',
    address: 'Connaught Place Main Circle, Sector 4',
    lat: 28.6280,
    lng: 77.2180,
    distanceKm: 1.8,
    startDate: '2026-08-01',
    timeRange: '08:30 AM - 06:00 PM',
    status: 'active',
    targetBloodGroups: ['O-', 'O+', 'A-', 'B-'],
    targetUnits: 150,
    registeredDonors: 92,
    availableSlots: 58,
    contactPhone: '+91-1123456700',
    demandIntensity: 0.95,
    description: 'Urgent drive addressing acute O-negative and O-positive inventory depletion in emergency trauma care.',
    amenities: ['Air Conditioned Hall', 'Doctor Consultation', 'Complimentary Juice & Snacks', 'Donor Certificate'],
  },
  {
    id: 'drv-002',
    name: 'City Trauma Center Emergency Drive',
    organizer: 'City General Emergency Hospital',
    locationName: 'Blood Bank Auditorium, Ground Floor',
    address: 'Ring Road Expressway, Zone 2',
    lat: 28.6020,
    lng: 77.1950,
    distanceKm: 3.2,
    startDate: '2026-08-01',
    timeRange: '09:00 AM - 08:00 PM',
    status: 'active',
    targetBloodGroups: ['AB-', 'B-', 'A+'],
    targetUnits: 100,
    registeredDonors: 78,
    availableSlots: 22,
    contactPhone: '+91-1123456890',
    demandIntensity: 0.88,
    description: 'Hospital-hosted urgent collection camp supporting surgical operations and cardiac ICU patients.',
    amenities: ['Hospital Grade Sanitization', 'Refreshments', 'Free Complete Blood Count (CBC) Check'],
  },
  {
    id: 'drv-003',
    name: 'Rotary Club Weekend Life Saver Camp',
    organizer: 'Rotary International Metro Club',
    locationName: 'Community Sports Complex, East Wing',
    address: 'Vasant Vihar District Center',
    lat: 28.6350,
    lng: 77.2320,
    distanceKm: 4.5,
    startDate: '2026-08-03',
    timeRange: '09:00 AM - 04:30 PM',
    status: 'upcoming',
    targetBloodGroups: ['O+', 'A+', 'B+', 'AB+'],
    targetUnits: 200,
    registeredDonors: 110,
    availableSlots: 90,
    contactPhone: '+91-9811002233',
    demandIntensity: 0.70,
    description: 'Community-wide voluntary donation camp with family health awareness activities and instant blood typing.',
    amenities: ['Parking Available', 'Refreshments & Fruit Basket', 'Digital Badge & Social Media Pass'],
  },
  {
    id: 'drv-004',
    name: 'Apex Surgical Center Mobile Donation Van',
    organizer: 'Apex Trauma & Healthcare',
    locationName: 'Mobile Unit outside Tech Park Gate 3',
    address: 'IT Corridor Phase 1',
    lat: 28.5850,
    lng: 77.2400,
    distanceKm: 6.1,
    startDate: '2026-08-01',
    timeRange: '10:00 AM - 05:00 PM',
    status: 'active',
    targetBloodGroups: ['O-', 'A-', 'B+'],
    targetUnits: 80,
    registeredDonors: 54,
    availableSlots: 26,
    contactPhone: '+91-9876501234',
    demandIntensity: 0.92,
    description: 'State-of-the-art climate-controlled mobile blood collection bus stationed for quick corporate donors.',
    amenities: ['Quick 15-min Process', 'WiFi Enabled Lounge', 'Protein Drink & Energy Bar'],
  },
  {
    id: 'drv-005',
    name: 'Suburban Community Health Drive',
    organizer: 'National Health Mission & Lions Club',
    locationName: 'Suburban Govt School Ground',
    address: 'Rohini Sector 11 West',
    lat: 28.6500,
    lng: 77.1680,
    distanceKm: 8.4,
    startDate: '2026-08-05',
    timeRange: '09:30 AM - 04:00 PM',
    status: 'upcoming',
    targetBloodGroups: ['A-', 'B-', 'O+', 'AB-'],
    targetUnits: 120,
    registeredDonors: 45,
    availableSlots: 75,
    contactPhone: '+91-1127003344',
    demandIntensity: 0.65,
    description: 'Routine quarterly drive ensuring buffer stocks for regional pediatric and maternity wards.',
    amenities: ['Shaded Waiting Pavilion', 'Health Screening', 'Nutritional Kit'],
  },
];

// Heatmap data points representing demand & shortage intensity
const HEATMAP_POINTS = [
  { lat: 28.6280, lng: 77.2180, intensity: 1.0, label: 'Central Crisis Zone' },
  { lat: 28.6020, lng: 77.1950, intensity: 0.85, label: 'Trauma Hub' },
  { lat: 28.5850, lng: 77.2400, intensity: 0.9, label: 'East Expressway Need' },
  { lat: 28.6350, lng: 77.2320, intensity: 0.7, label: 'North Suburb' },
  { lat: 28.6500, lng: 77.1680, intensity: 0.6, label: 'Suburban Cluster' },
  // Additional shortage hotspots for realistic heatmap canvas rendering
  { lat: 28.6150, lng: 77.2050, intensity: 0.95, label: 'AIIMS & Emergency Belt' },
  { lat: 28.6210, lng: 77.2250, intensity: 0.80, label: 'Maternity Hospital Hub' },
  { lat: 28.5950, lng: 77.2100, intensity: 0.75, label: 'South District Hospital' },
  { lat: 28.6400, lng: 77.1900, intensity: 0.65, label: 'West Industrial Belt' },
];

export const BloodDrivesSection: React.FC<BloodDrivesSectionProps> = ({
  user,
  onOpenEmergencyModal,
}) => {
  const [drives, setDrives] = useState<BloodDrive[]>(INITIAL_DRIVES);
  const [selectedDrive, setSelectedDrive] = useState<BloodDrive | null>(INITIAL_DRIVES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming'>('all');
  const [selectedBloodType, setSelectedBloodType] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'heatmap'>('both');
  
  // Appointment Booking Modal state
  const [bookingDrive, setBookingDrive] = useState<BloodDrive | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM - 10:30 AM');
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);

  // New Blood Drive Creation Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDriveForm, setNewDriveForm] = useState({
    name: '',
    organizer: user?.hospitalName || user?.name || 'Community Health Initiative',
    locationName: '',
    address: '',
    startDate: new Date().toISOString().split('T')[0],
    timeRange: '09:00 AM - 05:00 PM',
    targetUnits: 100,
    contactPhone: user?.phone || '+91-9876543210',
    description: '',
  });

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const canvasLayerRef = useRef<HTMLCanvasElement | null>(null);

  // Filtered drives
  const filteredDrives = drives.filter((drive) => {
    const matchesSearch =
      drive.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || drive.status === statusFilter;
    const matchesDistance = drive.distanceKm <= maxDistance;
    const matchesBloodType =
      selectedBloodType === 'all' ||
      drive.targetBloodGroups.includes(selectedBloodType as BloodType);

    return matchesSearch && matchesStatus && matchesDistance && matchesBloodType;
  });

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing map instance if container re-mounted
    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 12,
        zoomControl: true,
      });

      // CartoDB Positron / OpenStreetMap clean tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m: L.Marker) => m.remove());
    markersRef.current = {};

    // Custom Icon generator for blood drives
    const createCustomIcon = (drive: BloodDrive, isSelected: boolean) => {
      const isActive = drive.status === 'active';
      const bgColor = isSelected
        ? 'bg-red-600 ring-4 ring-red-400/50 text-white scale-110'
        : isActive
        ? 'bg-red-600 text-white hover:bg-red-700'
        : 'bg-indigo-600 text-white hover:bg-indigo-700';

      const iconHtml = `
        <div class="relative group cursor-pointer transition-all transform hover:scale-110">
          ${isActive ? '<div class="absolute -inset-1 rounded-full bg-red-500/40 animate-ping"></div>' : ''}
          <div class="relative w-9 h-9 rounded-2xl ${bgColor} flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/20"></div>
        </div>
      `;

      return L.divIcon({
        html: iconHtml,
        className: 'custom-blood-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32],
      });
    };

    // Render Markers for filtered drives
    if (viewMode !== 'heatmap') {
      filteredDrives.forEach((drive) => {
        const isSelected = selectedDrive?.id === drive.id;
        const marker = L.marker([drive.lat, drive.lng], {
          icon: createCustomIcon(drive, isSelected),
        }).addTo(map);

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 4px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #dc2626; margin-bottom: 2px;">
              ${drive.status === 'active' ? '● Active Today' : '📅 Upcoming Drive'}
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
              ${drive.name}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
              📍 ${drive.locationName} (${drive.distanceKm} km)
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
              ⏰ ${drive.timeRange}
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px;">
              ${drive.targetBloodGroups.map(bg => `<span style="background:#fee2e2; color:#dc2626; font-size:10px; font-weight:800; padding:2px 6px; border-radius:6px;">${bg}</span>`).join('')}
            </div>
            <button id="book-btn-${drive.id}" style="width: 100%; background: #dc2626; color: white; border: none; border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 700; cursor: pointer;">
              Book Slot (${drive.availableSlots} Left)
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          setSelectedDrive(drive);
        });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`book-btn-${drive.id}`);
          if (btn) {
            btn.onclick = () => {
              setBookingDrive(drive);
              setBookingConfirmed(false);
            };
          }
        });

        markersRef.current[drive.id] = marker;
      });
    }

    // HEATMAP CANVAS OVERLAY LOGIC
    if (viewMode === 'heatmap' || viewMode === 'both') {
      // Custom Leaflet Heatmap Layer drawing onto an HTML5 Canvas
      let customHeatLayer: L.Layer | null = null;

      const HeatOverlay = L.Layer.extend({
        onAdd: function (map: L.Map) {
          const pane = map.getPane('overlayPane');
          if (!pane) return this;

          const canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-canvas') as HTMLCanvasElement;
          canvas.style.position = 'absolute';
          canvas.style.pointerEvents = 'none';
          canvas.style.opacity = '0.75';

          pane.appendChild(canvas);
          this._canvas = canvas;
          this._map = map;

          map.on('moveend zoomend resize', this._draw, this);
          this._draw();
          return this;
        },

        onRemove: function (map: L.Map) {
          map.off('moveend zoomend resize', this._draw, this);
          if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
          }
          return this;
        },

        _draw: function () {
          if (!this._map || !this._canvas) return;
          const map = this._map;
          const canvas = this._canvas;
          const size = map.getSize();

          canvas.width = size.x;
          canvas.height = size.y;

          const topLeft = map.containerPointToLayerPoint([0, 0]);
          L.DomUtil.setPosition(canvas, topLeft);

          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, size.x, size.y);

          // Draw heat intensity radial gradients for demand points
          HEATMAP_POINTS.forEach((pt) => {
            const containerPoint = map.latLngToContainerPoint([pt.lat, pt.lng]);
            const radius = 90 * (map.getZoom() / 12); // scale with zoom

            const grad = ctx.createRadialGradient(
              containerPoint.x,
              containerPoint.y,
              0,
              containerPoint.x,
              containerPoint.y,
              radius
            );

            const int = pt.intensity;
            grad.addColorStop(0, `rgba(220, 38, 38, ${int * 0.85})`); // Intense Crimson Red center
            grad.addColorStop(0.35, `rgba(249, 115, 22, ${int * 0.65})`); // Orange
            grad.addColorStop(0.65, `rgba(234, 179, 8, ${int * 0.45})`); // Gold / Yellow
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Transparent outer border

            ctx.beginPath();
            ctx.fillStyle = grad;
            ctx.arc(containerPoint.x, containerPoint.y, radius, 0, Math.PI * 2);
            ctx.fill();
          });
        },
      });

      customHeatLayer = new (HeatOverlay as any)();
      if (customHeatLayer) {
        map.addLayer(customHeatLayer);
      }

      return () => {
        if (customHeatLayer && map) {
          map.removeLayer(customHeatLayer);
        }
      };
    }
  }, [filteredDrives, selectedDrive, viewMode]);

  // Center map on drive click from card list
  const handleSelectDrive = (drive: BloodDrive) => {
    setSelectedDrive(drive);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([drive.lat, drive.lng], 14, { duration: 1.2 });
      const marker = markersRef.current[drive.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleCreateDriveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: BloodDrive = {
      id: `drv-${Date.now().toString().slice(-4)}`,
      name: newDriveForm.name,
      organizer: newDriveForm.organizer,
      locationName: newDriveForm.locationName,
      address: newDriveForm.address,
      lat: 28.6180 + (Math.random() - 0.5) * 0.05,
      lng: 77.2100 + (Math.random() - 0.5) * 0.05,
      distanceKm: 2.5,
      startDate: newDriveForm.startDate,
      timeRange: newDriveForm.timeRange,
      status: 'active',
      targetBloodGroups: ['O+', 'O-', 'A+', 'B+'],
      targetUnits: Number(newDriveForm.targetUnits),
      registeredDonors: 1,
      availableSlots: Number(newDriveForm.targetUnits) - 1,
      contactPhone: newDriveForm.contactPhone,
      demandIntensity: 0.90,
      description: newDriveForm.description || 'Newly created emergency community blood drive.',
      amenities: ['Doctor Consultation', 'Snacks & Juice', 'Donor Certificate'],
    };

    setDrives((prev) => [created, ...prev]);
    setSelectedDrive(created);
    setIsCreateModalOpen(false);
    alert(`Success! "${created.name}" has been published and mapped live for donors.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar & Quick Actions */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                Live Geographic Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/80 text-white text-[11px] font-bold">
                ● 5 Drives Active
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <MapPin className="w-7 h-7 text-amber-300 animate-bounce" />
              <span>Nearby Blood Drives &amp; Demand Heatmap</span>
            </h2>
            <p className="text-xs text-red-100 max-w-2xl mt-1 leading-relaxed">
              Find nearby donation camps, view real-time blood shortage heatmaps across districts, and reserve your appointment slot in under 30 seconds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-white text-red-600 hover:bg-red-50 font-bold text-xs rounded-2xl shadow-md flex items-center gap-2 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Organize Blood Drive</span>
            </button>
            
            {onOpenEmergencyModal && (
              <button
                onClick={onOpenEmergencyModal}
                className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl border border-white/20 flex items-center gap-2 transition"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>AI SOS Dispatch</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-red-200 text-[11px] font-medium">Active Drives Nearby</div>
            <div className="text-xl font-black mt-0.5">
              {drives.filter((d) => d.status === 'active').length} Camps
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-red-200 text-[11px] font-medium">Available Open Slots</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              {drives.reduce((acc, d) => acc + d.availableSlots, 0)} Slots
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-red-200 text-[11px] font-medium">Critical Shortage Area</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              Central Sector 4
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-red-200 text-[11px] font-medium">Target Collection</div>
            <div className="text-xl font-black mt-0.5">
              {drives.reduce((acc, d) => acc + d.targetUnits, 0)} Units
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drive name, location, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 flex items-center bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              All Drives
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition ${
                statusFilter === 'active'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ● Active Today
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition ${
                statusFilter === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Upcoming
            </button>
          </div>

          {/* Blood Type Target Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Blood Types Needed</option>
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bg) => (
                <option key={bg} value={bg}>
                  Target: {bg} Needed
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle (Map vs Heatmap) */}
          <div className="md:col-span-3 flex items-center justify-end bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('both')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                viewMode === 'both'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Combined Pins + Heatmap"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pins &amp; Heat</span>
            </button>

            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                viewMode === 'heatmap'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Heatmap Density View"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heatmap</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                viewMode === 'map'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Standard Drive Pins"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Pins Only</span>
            </button>
          </div>

        </div>

        {/* Distance Radius Slider */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Distance Radius: <strong className="text-slate-900 dark:text-white">{maxDistance} km</strong></span>
          </div>
          <input
            type="range"
            min="2"
            max="50"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>
      </div>

      {/* Main Workspace: Interactive Leaflet Map & Drives Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEAFLET MAP CONTAINER */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-2 shadow-lg overflow-hidden relative">
          
          {/* Map Top Floating Overlay Info Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-md pointer-events-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Live Leaflet Geospatial View</span>
            </div>

            {/* Heatmap Legend */}
            {(viewMode === 'heatmap' || viewMode === 'both') && (
              <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-bold shadow-md pointer-events-auto flex items-center gap-2 border border-slate-700">
                <span>Shortage Intensity:</span>
                <div className="w-20 h-2.5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600" />
                <span className="text-red-400">Critical</span>
              </div>
            )}
          </div>

          {/* Leaflet DOM Mounting Container */}
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] rounded-2xl z-10"
            style={{ minHeight: '520px' }}
          />

          {/* Selected Drive Bar on Map Bottom */}
          {selectedDrive && (
            <div className="mt-2 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  <Droplet className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedDrive.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    📍 {selectedDrive.locationName} • ⏰ {selectedDrive.timeRange} ({selectedDrive.distanceKm} km away)
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setBookingDrive(selectedDrive);
                  setBookingConfirmed(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reserve Slot ({selectedDrive.availableSlots} Open)</span>
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR: NEARBY DRIVES CARDS LIST */}
        <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1 mb-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Droplet className="w-4 h-4 text-red-600" />
              <span>Available Drives ({filteredDrives.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Sorted by proximity</span>
          </div>

          {filteredDrives.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No blood drives match your filters</p>
              <p className="text-[11px] text-slate-500 mt-1">Try expanding the search distance radius or clearing blood type filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSelectedBloodType('all');
                  setMaxDistance(50);
                }}
                className="mt-3 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredDrives.map((drive) => {
              const isSelected = selectedDrive?.id === drive.id;
              const isActive = drive.status === 'active';

              return (
                <div
                  key={drive.id}
                  onClick={() => handleSelectDrive(drive)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-red-50/90 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/30 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isActive
                            ? 'bg-red-600 text-white'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {isActive ? '● Active Today' : '📅 Upcoming'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {drive.distanceKm} km away
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {drive.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Org: {drive.organizer}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {drive.availableSlots} slots left
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Target: {drive.targetUnits} units
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 my-2 leading-relaxed">
                    📍 {drive.locationName} — {drive.description}
                  </p>

                  {/* Target Blood Groups Needed */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">Needed:</span>
                      {drive.targetBloodGroups.map((bg) => (
                        <span
                          key={bg}
                          className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-extrabold rounded-md"
                        >
                          {bg}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingDrive(drive);
                        setBookingConfirmed(false);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* MODAL 1: APPOINTMENT SLOT BOOKING MODAL */}
      {bookingDrive && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setBookingDrive(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {!bookingConfirmed ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    <Droplet className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                      Appointment Slot Booking
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {bookingDrive.name}
                    </h3>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <div>📍 <strong>Location:</strong> {bookingDrive.locationName}</div>
                  <div>📅 <strong>Date:</strong> {bookingDrive.startDate} ({bookingDrive.timeRange})</div>
                  <div>📞 <strong>Contact:</strong> {bookingDrive.contactPhone}</div>
                </div>

                {/* Slot Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Donation Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      '09:00 AM - 09:30 AM',
                      '10:30 AM - 11:00 AM',
                      '01:00 PM - 01:30 PM',
                      '03:30 PM - 04:00 PM',
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                          selectedSlot === slot
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Donor Pre-check banner */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified eligible donor profile: <strong>{user?.name || 'Melria Smith'}</strong> ({user?.bloodGroup || user?.bloodType || 'O+'})</span>
                </div>

                <button
                  onClick={() => setBookingConfirmed(true)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Slot Reservation</span>
                </button>
              </div>
            ) : (
              /* CONFIRMATION TICKET PASS */
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Slot Booking Confirmed!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your digital appointment pass has been issued and SMS details sent to {user?.phone || '+91-9876543210'}.
                  </p>
                </div>

                {/* Digital Ticket Card */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl text-left text-xs space-y-2 border border-slate-800 relative overflow-hidden">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-red-400 uppercase tracking-wider text-[10px]">
                      RedPulse AI Digital Pass #DRV-{Math.floor(1000 + Math.random() * 9000)}
                    </span>
                    <QrCode className="w-5 h-5 text-slate-400" />
                  </div>
                  <div><strong>Donor:</strong> {user?.name || 'Melria Smith'} ({user?.bloodGroup || 'O+'})</div>
                  <div><strong>Camp:</strong> {bookingDrive.name}</div>
                  <div><strong>Location:</strong> {bookingDrive.locationName}</div>
                  <div><strong>Slot:</strong> {selectedSlot} on {bookingDrive.startDate}</div>
                </div>

                <button
                  onClick={() => setBookingDrive(null)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs"
                >
                  Close &amp; View Directions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ORGANIZE NEW BLOOD DRIVE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Publish New Blood Drive
                </h3>
                <p className="text-xs text-slate-500">Map a new donation camp to alert nearby registered donors.</p>
              </div>
            </div>

            <form onSubmit={handleCreateDriveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Drive Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Youth Red Cross Community Drive"
                  value={newDriveForm.name}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Organizer Entity</label>
                  <input
                    type="text"
                    value={newDriveForm.organizer}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, organizer: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Units Goal</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={newDriveForm.targetUnits}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, targetUnits: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Venue / Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Civic Pavilion Hall B"
                  value={newDriveForm.locationName}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, locationName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 4, Main Highway Corridor"
                  value={newDriveForm.address}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDriveForm.startDate}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    value={newDriveForm.contactPhone}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Mention target blood groups needed, special guidelines..."
                  value={newDriveForm.description}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-md transition"
                >
                  Publish &amp; Map Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
