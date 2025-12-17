import React, { useState, useEffect } from 'react';
import { MapPin, Phone, ExternalLink, Heart, Scale, Users, ShieldAlert, Loader2, Search } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

const SupportView: React.FC = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cityGuess, setCityGuess] = useState<string>('');



  // ... inside component
  useEffect(() => {
    const getLocation = async () => {
      try {
        const permission = await Geolocation.checkPermissions();
        if (permission.location === 'denied' || permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
          const request = await Geolocation.requestPermissions();
          if (request.location === 'denied') {
            setPermissionDenied(true);
            setLoading(false);
            return;
          }
        }

        const coordinates = await Geolocation.getCurrentPosition();
        setLocation(coordinates as any); // Type compatibility
        setLoading(false);
      } catch (e) {
        console.error("Error getting location", e);
        setPermissionDenied(true);
        setLoading(false);
      }
    };

    getLocation();

    // 2. Infer City from Timezone (Works offline/without API)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Example: "Europe/Zagreb" -> "Zagreb"
      if (tz && tz.includes('/')) {
        const city = tz.split('/')[1].replace(/_/g, ' ');
        setCityGuess(city);
      }
    } catch (e) {
      console.warn("Could not detect timezone city");
    }
  }, []);

  const generateMapLink = (query: string) => {
    // Append "near me" to help Google's relevance engine
    const localizedQuery = `${query} near me`;

    if (location) {
      // Force map view to user's coordinates
      return `https://www.google.com/maps/search/${encodeURIComponent(localizedQuery)}/@${location.coords.latitude},${location.coords.longitude},14z`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(localizedQuery)}`;
  };

  const resources = [
    {
      category: "Legal Protection",
      icon: Scale,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      items: [
        {
          name: "Family Law & Custody",
          desc: "Find lawyers specializing in fathers' rights and family law.",
          action: "Find Lawyers",
          link: generateMapLink("Family Law Lawyer"),
          type: 'map'
        },
        {
          name: "Free Legal Aid",
          desc: "Non-profit legal assistance and pro-bono services.",
          action: "Search Legal Aid",
          link: generateMapLink("Free Legal Aid Center"),
          type: 'map'
        },
      ]
    },
    {
      category: "Mental Health & Support",
      icon: Heart,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      items: [
        {
          name: "Crisis Hotline (EU/Intl)",
          desc: "Immediate confidential support.",
          action: "Call 112",
          link: "tel:112",
          type: 'call'
        },
        {
          name: "Men's Support Groups",
          desc: "Local community groups for fathers and men.",
          action: "Find Groups",
          link: generateMapLink("Men's Support Group"),
          type: 'map'
        },
      ]
    },
    {
      category: "Social Services",
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      items: [
        {
          name: "Food Assistance",
          desc: "Community food banks and pantries.",
          action: "Find Food Banks",
          link: generateMapLink("Food Bank"),
          type: 'map'
        },
        {
          name: "Social Welfare Centers",
          desc: "Government social support and child services.",
          action: "Find Offices",
          link: generateMapLink("Center for Social Welfare"), // "Center for Social Welfare" is common EU terminology
          type: 'map'
        },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full px-4 pt-36 pb-40 overflow-y-auto no-scrollbar">


      {/* Location Status */}
      <div className="mb-6 bg-surface border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${location ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-200 text-sm font-medium">
              {location ? "Location Active" : "Detecting Location..."}
            </h3>
            <p className="text-xs text-slate-500">
              {loading
                ? "Triangulating..."
                : permissionDenied
                  ? "GPS Denied (Using generic search)"
                  : location
                    ? "Results localized to your area"
                    : "Unavailable"}
            </p>
          </div>
        </div>
        {loading && <Loader2 className="animate-spin text-slate-500 w-5 h-5" />}
      </div>

      {/* Emergency Banner */}
      <div className="mb-6 bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="text-red-400 shrink-0 w-6 h-6" />
        <div className="w-full">
          <h3 className="text-red-400 font-bold text-sm">Immediate Crisis?</h3>
          <p className="text-red-200/70 text-xs mt-1 mb-3">
            If you or your child are in danger, call emergency services immediately.
          </p>
          <div className="flex gap-2 w-full">
            <a href="tel:112" className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg transition-colors text-center shadow-lg shadow-red-900/20">
              Call 112 (Europe)
            </a>
            <a href="tel:911" className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors text-center border border-slate-600">
              Call 911 (US)
            </a>
          </div>
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
                <div key={i} className="bg-surface border border-slate-700/50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-slate-200 font-medium text-sm">{item.name}</h3>
                      <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={item.link}
                      target={item.type === 'map' ? "_blank" : undefined}
                      rel={item.type === 'map' ? "noopener noreferrer" : undefined}
                      className={`flex-1 ${item.type === 'call'
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                        } py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-semibold`}
                    >
                      {item.type === 'call' ? <Phone size={14} /> : <Search size={14} />}
                      {item.action}
                    </a>

                    {item.type === 'map' && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-white/5 text-center">
        <p className="text-xs text-slate-400 italic">
          "Stay strong. You are building a safe future."
        </p>
      </div>
    </div>
  );
};

export default SupportView;