import React, { useState, useEffect } from 'react';
import { MapPin, Phone, ExternalLink, Heart, Scale, Users, ShieldAlert, Loader2 } from 'lucide-react';

const SupportView: React.FC = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location", error);
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionDenied(true);
          }
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  // Mock data that "adapts" (conceptually) to location
  const resources = [
    {
      category: "Legal Aid",
      icon: Scale,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      items: [
        { name: "Single Fathers Legal Help", desc: "Free initial consultation for custody & support.", contact: "1-800-555-0199", distance: location ? "2.4 km" : "Online" },
        { name: "Family Court Advocacy", desc: "Support during court proceedings.", contact: "www.fam-advocacy.org", distance: location ? "5.1 km" : "Local Branch" },
      ]
    },
    {
      category: "Emotional & Mental Health",
      icon: Heart,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      items: [
        { name: "Dads Support Group", desc: "Weekly meetups for single dads.", contact: "Every Wed 7PM", distance: location ? "1.2 km" : "Nearby" },
        { name: "24/7 Crisis Line", desc: "Immediate emotional support.", contact: "988", distance: "Always Available" },
      ]
    },
    {
      category: "Financial Assistance",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      items: [
        { name: "Single Parent Grants", desc: "Housing and utility assistance programs.", contact: "Apply Online", distance: "National" },
        { name: "Food Bank Network", desc: "Emergency food supplies for families.", contact: "Open 9-5", distance: location ? "3.8 km" : "Local" },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-24 overflow-y-auto no-scrollbar">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Support & Resources</h1>
        <p className="text-slate-400 text-sm">Help for single fathers in your area.</p>
      </div>

      {/* Location Status */}
      <div className="mb-6 bg-surface border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full">
            <MapPin className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-200 text-sm font-medium">Location Services</h3>
            <p className="text-xs text-slate-500">
              {loading ? "Locating..." : permissionDenied ? "Permission Denied" : location ? "Location Active" : "Unavailable"}
            </p>
          </div>
        </div>
        {loading && <Loader2 className="animate-spin text-slate-500 w-5 h-5" />}
      </div>

      {/* Emergency Banner */}
      <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="text-red-400 shrink-0 w-6 h-6" />
        <div>
          <h3 className="text-red-400 font-bold text-sm">Immediate Crisis?</h3>
          <p className="text-red-200/70 text-xs mt-1">
            If you or your child are in immediate danger, please call emergency services (112 or 911) immediately.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {resources.map((section, idx) => (
          <div key={idx} className="animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`${section.color} w-5 h-5`} />
              <h2 className="text-slate-200 font-semibold">{section.category}</h2>
            </div>
            
            <div className="grid gap-3">
              {section.items.map((item, i) => (
                <div key={i} className="bg-surface hover:bg-slate-800 transition-colors border border-slate-700/50 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-slate-200 font-medium text-sm">{item.name}</h3>
                      <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                    </div>
                    <span className="bg-slate-900 text-slate-400 text-[10px] px-2 py-1 rounded border border-slate-700">
                      {item.distance}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Phone size={12} /> Call
                    </button>
                    <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <ExternalLink size={12} /> Website
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-white/5 text-center">
        <p className="text-xs text-slate-400 italic">
          "Being a father is the most important job you'll ever have. You are doing great."
        </p>
      </div>

    </div>
  );
};

export default SupportView;