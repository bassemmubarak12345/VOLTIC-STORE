import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, Plus } from 'lucide-react';
import { Language } from '../types';
import { DEFAULT_BANNERS, BannerItem } from '../data/banners';

interface BannerSliderProps {
  language: Language;
  banners?: BannerItem[];
  autoSlideInterval?: number;
  onSelectCategory?: (category: 'summer' | 'winter' | 'occasions' | 'sport') => void;
}

const STORAGE_KEY = 'voltic_user_uploaded_banners_v5';

export const BannerSlider: React.FC<BannerSliderProps> = ({
  language,
  banners: propBanners = DEFAULT_BANNERS,
  autoSlideInterval = 4500,
  onSelectCategory,
}) => {
  const isRtl = language === 'ar';

  // Load uploaded banners from localStorage or propBanners
  const [bannersList, setBannersList] = useState<BannerItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Exclude any old demo pexels images
          const valid = parsed.filter(
            (b) => typeof b.image === 'string' && !b.image.includes('pexels')
          );
          if (valid.length > 0) return valid;
        }
      }
    } catch {
      // Ignore
    }

    const validProps = propBanners.filter((b) => Boolean(b.image && b.image.trim()));
    return validProps;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  // Optional direct link input in empty state
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Active banners filtering: exclude empty or failed images
  const activeBanners = React.useMemo(() => {
    return bannersList.filter((b, index) => {
      const id = b.id || `banner-${index}`;
      const hasImage = Boolean(b.image && b.image.trim());
      const isFailed = Boolean(failedImageIds[id]);
      return hasImage && !isFailed;
    });
  }, [bannersList, failedImageIds]);

  const totalBanners = activeBanners.length;
  const hasBanners = totalBanners > 0;

  // Persist banners to localStorage & backend
  const saveBanners = useCallback((newBanners: BannerItem[]) => {
    setBannersList(newBanners);
    setCurrentIndex(0);
    setFailedImageIds({});

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBanners));
    } catch {
      // Safe storage
    }

    fetch('/api/save-banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banners: newBanners }),
    }).catch(() => {
      // Safe ignore
    });
  }, []);

  // Process uploaded files
  const processFiles = (files: FileList | File[]) => {
    const fileList: File[] = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileList.length === 0) return;

    let loadedCount = 0;
    const newItems: BannerItem[] = [];

    fileList.forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newItems.push({
            id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${index}`,
            image: result,
            altAr: `بنر متجر VOLTIC ${index + 1}`,
            altEn: `VOLTIC Banner ${index + 1}`,
            category: 'summer',
          });
        }

        loadedCount++;
        if (loadedCount === fileList.length) {
          saveBanners(newItems);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Add banner via URL link (in empty state)
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError(isRtl ? 'يرجى إدخال رابط الصورة أولاً' : 'Please enter an image URL');
      return;
    }

    setUrlError('');
    const newBanner: BannerItem = {
      id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      image: trimmed,
      altAr: 'بنر متجر VOLTIC',
      altEn: 'VOLTIC Store Banner',
      category: 'summer',
    };

    saveBanners([newBanner]);
    setUrlInput('');
  };

  // Slide navigation
  const nextSlide = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const prevSlide = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  // Automatic slide rotation
  useEffect(() => {
    if (totalBanners <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [nextSlide, autoSlideInterval, isPaused, totalBanners]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        if (isRtl) prevSlide();
        else nextSlide();
      } else {
        if (isRtl) nextSlide();
        else prevSlide();
      }
    }
    touchStartX.current = null;
  };

  return (
    <section
      id="hero-banner-slider-section"
      aria-label={isRtl ? 'البنرات الإعلانية' : 'Promotional Banners'}
      className="w-full max-w-[1300px] mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-2 select-none relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hidden file input for uploading banner images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        id="banner-file-input"
      />

      {/* =========================================================================
          VIEW A: BANNERS ARE LOADED
          100% PURE: Absolutely NO Add button, NO Delete button, NO control overlays!
          ========================================================================= */}
      {hasBanners ? (
        <div className="relative w-full rounded-xl sm:rounded-2xl border border-[#c9a84c]/25 shadow-2xl bg-black/60 overflow-hidden">
          {/* Banner Images with Silky Smooth Crossfade */}
          <div className="relative w-full">
            {activeBanners.map((banner, index) => {
              const isActive = index === currentIndex;
              const bannerId = banner.id || `banner-${index}`;
              return (
                <div
                  key={bannerId}
                  className={`w-full transition-opacity duration-1000 ease-in-out ${
                    isActive
                      ? 'opacity-100 relative z-10'
                      : 'opacity-0 absolute inset-0 pointer-events-none z-0'
                  }`}
                  aria-hidden={!isActive}
                >
                  <img
                    src={banner.image}
                    alt={isRtl ? banner.altAr : banner.altEn}
                    className="w-full h-auto object-contain block mx-auto rounded-xl sm:rounded-2xl cursor-pointer"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding={index === 0 ? 'sync' : 'async'}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImageIds((prev) => ({ ...prev, [bannerId]: true }))}
                    onClick={() => {
                      if (banner.category && onSelectCategory) {
                        onSelectCategory(banner.category);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Minimalist indicators (subtle gold progress dots at the bottom if multiple banners) */}
          {totalBanners > 1 && (
            <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
              {activeBanners.map((banner, index) => {
                const isActive = index === currentIndex;
                return (
                  <span
                    key={banner.id || index}
                    className={`transition-all duration-300 rounded-full ${
                      isActive
                        ? 'w-6 sm:w-7 h-1.5 bg-gradient-to-r from-[#e8c96d] to-[#c9a84c] shadow-sm'
                        : 'w-1.5 h-1.5 bg-white/40'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            VIEW B: NO BANNERS YET -> Upload Button to pick images from device or link
            ========================================================================= */
        <div
          id="banner-empty-upload-card"
          className="w-full rounded-2xl border-2 border-dashed border-[#c9a84c]/50 hover:border-[#c9a84c]/90 bg-gradient-to-b from-[#141414] via-[#0f0f0f] to-[#0a0a0a] p-6 sm:p-10 shadow-2xl transition-all duration-300 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] mb-4 shadow-lg">
            <ImageIcon className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-xl font-black text-white">
            {isRtl ? 'رفع بنرات المتجر' : 'Upload Store Banners'}
          </h3>

          <p className="text-xs sm:text-sm text-gray-300 max-w-md mt-1.5 leading-relaxed">
            {isRtl
              ? 'اختر صور البنرات من جهازك لعرضها مباشرة بأعلى المتجر وبكامل حجمها الطبيعي'
              : 'Select banner images from your device to display them at the top of the store'}
          </p>

          {/* Primary Upload Button */}
          <div className="mt-5 w-full max-w-sm">
            <button
              id="upload-banners-main-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#e8c96d] via-[#c9a84c] to-[#9a7830] text-black font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              <Upload className="w-4 h-4" />
              <span>{isRtl ? 'رفع البنرات من جهازك الآن' : 'Upload Banners From Device'}</span>
            </button>
          </div>

          {/* Optional Direct Image Link input */}
          <div className="mt-4 pt-3 border-t border-[#c9a84c]/20 w-full max-w-sm">
            <form onSubmit={handleAddUrl} className="flex gap-2">
              <input
                id="banner-url-quick-input"
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError('');
                }}
                placeholder={isRtl ? 'أو ضع رابط صورة مباشر https://...' : 'Or paste direct image URL https://...'}
                className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white text-xs border border-white/15 focus:border-[#c9a84c] focus:outline-none"
                dir="ltr"
              />
              <button
                id="banner-url-quick-btn"
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#c9a84c] hover:bg-[#e8c96d] text-black font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إضافة' : 'Add'}</span>
              </button>
            </form>
            {urlError && <p className="text-[11px] text-red-400 mt-1">{urlError}</p>}
          </div>
        </div>
      )}
    </section>
  );
};
