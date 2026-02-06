import React, { useState, useEffect } from 'react';
import { MapPin, Phone, ExternalLink, Heart, Scale, Users, ShieldAlert, Loader2, Search } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { useLanguage } from '../contexts/LanguageContext';

const SupportView: React.FC = () => {
  const { t } = useLanguage();
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
      category: t('support.categories.legal'),
      icon: Scale,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      items: [
        {
          name: t('support.items.familyLaw.name'),
          desc: t('support.items.familyLaw.desc'),
          action: t('support.items.familyLaw.action'),
          link: generateMapLink(t('support.items.familyLaw.query')),
          type: 'map'
        },
        {
          name: t('support.items.legalAid.name'),
          desc: t('support.items.legalAid.desc'),
          action: t('support.items.legalAid.action'),
          link: generateMapLink(t('support.items.legalAid.query')),
          type: 'map'
        },
      ]
    },
    {
      category: t('support.categories.mental'),
      icon: Heart,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      items: [
        {
          name: t('support.items.hotline.name'),
          desc: t('support.items.hotline.desc'),
          action: t('support.items.hotline.action'),
          link: "tel:112",
          type: 'call'
        },
        {
          name: t('support.items.supportGroups.name'),
          desc: t('support.items.supportGroups.desc'),
          action: t('support.items.supportGroups.action'),
          link: generateMapLink(t('support.items.supportGroups.query')),
          type: 'map'
        },
      ]
    },
    {
      category: t('support.categories.social'),
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      items: [
        {
          name: t('support.items.food.name'),
          desc: t('support.items.food.desc'),
          action: t('support.items.food.action'),
          link: generateMapLink(t('support.items.food.query')),
          type: 'map'
        },
        {
          name: t('support.items.socialWelfare.name'),
          desc: t('support.items.socialWelfare.desc'),
          action: t('support.items.socialWelfare.action'),
          link: generateMapLink(t('support.items.socialWelfare.query')),
          type: 'map'
        },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full px-4 pt-0 pb-8 overflow-y-auto no-scrollbar">


      {/* Location Status */}
      <div className="mb-6 bg-card border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${location ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-200 text-sm font-medium">
              {location ? t('support.location.active') : t('support.location.detecting')}
            </h3>
            <p className="text-xs text-slate-500">
              {loading
                ? t('support.location.triangulating')
                : permissionDenied
                  ? t('support.location.denied')
                  : location
                    ? t('support.location.localized')
                    : t('support.location.unavailable')}
            </p>
          </div>
        </div>
        {loading && <Loader2 className="animate-spin text-slate-500 w-5 h-5" />}
      </div>

      {/* Emergency Banner */}
      <div className="mb-6 bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="text-red-400 shrink-0 w-6 h-6" />
        <div className="w-full">
          <h3 className="text-red-400 font-bold text-sm">{t('support.emergency.title')}</h3>
          <p className="text-red-200/70 text-xs mt-1 mb-3">
            {t('support.emergency.desc')}
          </p>
          <div className="flex gap-2 w-full">
            <a href="tel:112" className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg transition-colors text-center shadow-lg shadow-red-900/20">
              {t('support.emergency.callEU')}
            </a>
            <a href="tel:911" className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors text-center border border-slate-600">
              {t('support.emergency.callUS')}
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
                <div key={i} className="bg-card border border-slate-800 rounded-xl p-4">
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
          "{t('support.quote')}"
        </p>
      </div>
    </div>
  );
};

export default SupportView;