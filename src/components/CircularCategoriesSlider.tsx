import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, CategoryItem } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { CATEGORIES_DATA } from '../data/products';

interface CircularCategoriesSliderProps {
  language: Language;
  selectedCategory?: string;
  categories?: CategoryItem[];
  onSelectCategory: (categoryId: string) => void;
}

// 3 continuous cycles per set to guarantee sufficient track length for any screen resolution
const CYCLES = [0, 1, 2];
const CANONICAL_ORDER = ['summer', 'winter', 'sport', 'occasions'];

// Base auto-scroll speed in pixels per second
const AUTO_SPEED = 30;

export const CircularCategoriesSlider: React.FC<CircularCategoriesSliderProps> = ({
  language,
  selectedCategory,
  categories = CATEGORIES_DATA as unknown as CategoryItem[],
  onSelectCategory,
}) => {
  const isRtl = language === 'ar';
  const t = TRANSLATIONS[language];

  // Strictly enforce canonical order: summer -> winter -> sport -> occasions
  const activeCats = useMemo(() => {
    const source =
      categories && categories.length > 0 ? categories : (CATEGORIES_DATA as unknown as CategoryItem[]);
    return [...source].sort((a, b) => {
      const idxA = CANONICAL_ORDER.indexOf(a.id);
      const idxB = CANONICAL_ORDER.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [categories]);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const setRefA = useRef<HTMLDivElement | null>(null);

  // Animation & gesture state refs (avoid React re-renders during 60fps movement)
  const offsetRef = useRef<number>(0);
  const singleSetWidthRef = useRef<number>(1200);
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const flingVelocityRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Measure single set width
  const updateSetWidth = useCallback(() => {
    if (setRefA.current) {
      const width = setRefA.current.offsetWidth;
      if (width > 50) {
        singleSetWidthRef.current = width;
      }
    }
  }, []);

  // Update transform on DOM directly
  const applyTransform = useCallback(() => {
    if (!trackRef.current) return;
    const setWidth = singleSetWidthRef.current || 1200;
    // Normalize offset to positive modulo
    const normalized = ((offsetRef.current % setWidth) + setWidth) % setWidth;
    // Base position is -setWidth (viewing Set 1), moving smoothly from -setWidth to 0
    const translatePx = -setWidth + normalized;
    trackRef.current.style.transform = `translate3d(${translatePx}px, 0, 0)`;
  }, []);

  // Set up resize observer and image load listeners to update width accurately
  useEffect(() => {
    updateSetWidth();
    const handleResize = () => {
      updateSetWidth();
      applyTransform();
    };

    window.addEventListener('resize', handleResize);
    const timeout = setTimeout(updateSetWidth, 250);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [activeCats, updateSetWidth, applyTransform]);

  // Main 60fps / 120fps requestAnimationFrame loop
  useEffect(() => {
    lastFrameTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      const setWidth = singleSetWidthRef.current || 1200;

      if (!isDraggingRef.current) {
        if (Math.abs(flingVelocityRef.current) > 2) {
          // Inertia / fling deceleration decaying into AUTO_SPEED
          offsetRef.current += flingVelocityRef.current * dt;
          flingVelocityRef.current *= 0.94; // friction
          // Blend back to AUTO_SPEED
          if (Math.abs(flingVelocityRef.current) < AUTO_SPEED * 1.2) {
            flingVelocityRef.current = 0;
          }
        } else {
          // Continuous, silky smooth auto-movement
          offsetRef.current += AUTO_SPEED * dt;
        }

        // Keep offset bounded to prevent number overflow
        if (offsetRef.current >= setWidth * 10 || offsetRef.current <= -setWidth * 10) {
          offsetRef.current = ((offsetRef.current % setWidth) + setWidth) % setWidth;
        }

        applyTransform();
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [applyTransform]);

  // Pointer / Touch / Mouse Drag Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    flingVelocityRef.current = 0;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 5) {
      hasDraggedRef.current = true;
    }

    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    if (dt > 0.008) {
      flingVelocityRef.current = (e.clientX - lastXRef.current) / dt;
      lastXRef.current = e.clientX;
      lastTimeRef.current = now;
    }

    offsetRef.current = startOffsetRef.current + deltaX;
    applyTransform();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    // Clamp maximum initial fling velocity
    if (Math.abs(flingVelocityRef.current) > 1200) {
      flingVelocityRef.current = Math.sign(flingVelocityRef.current) * 1200;
    }
  };

  // Manual nudge step (arrow click)
  const handleManualNudge = (direction: 'left' | 'right') => {
    const step = direction === 'left' ? -220 : 220;
    flingVelocityRef.current = step * 2;
  };

  // Category item click: only trigger if user tapped and did not drag
  const handleCategoryClick = (catId: string, e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onSelectCategory(catId);
  };

  // Render a full track set containing CYCLES repetitions
  const renderItemSet = (setKey: string, setRef?: React.RefObject<HTMLDivElement | null>) => (
    <div ref={setRef} key={setKey} className="flex items-center flex-shrink-0">
      {CYCLES.map((cycleIdx) => (
        <React.Fragment key={`${setKey}-cycle-${cycleIdx}`}>
          {activeCats.map((cat, catIdx) => {
            const title = isRtl ? cat.titleAr : cat.titleEn;
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={`${setKey}-${cycleIdx}-${cat.id}-${catIdx}`}
                className="px-2.5 sm:px-3.5 flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={(e) => handleCategoryClick(cat.id, e)}
                  className="group flex flex-col items-center focus:outline-none transition-all cursor-pointer select-none"
                  style={{ width: '90px' }}
                  title={title}
                >
                  {/* Circular Avatar with Luxury Continuous Gold Ring - 100% full, unbroken and never clipped */}
                  <div
                    className={`relative rounded-full transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'p-[3px] bg-gradient-to-tr from-[#ffe082] via-[#c9a84c] to-[#9a7830] shadow-[0_0_18px_rgba(201,168,76,0.7)] scale-105'
                        : 'p-[2px] bg-gradient-to-tr from-[#c9a84c]/60 via-[#e8c96d]/40 to-[#9a7830]/40 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(201,168,76,0.35)]'
                    }`}
                  >
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-[var(--bg-page)] bg-[var(--bg-card)] flex items-center justify-center">
                      {cat.img || CATEGORIES_DATA.find((c) => c.id === cat.id)?.img ? (
                        <img
                          src={cat.img || CATEGORIES_DATA.find((c) => c.id === cat.id)?.img}
                          alt={title}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none"
                          loading="lazy"
                          draggable={false}
                          onLoad={updateSetWidth}
                        />
                      ) : (
                        <span className="text-[#c9a84c] font-black text-sm">{title.slice(0, 2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Category Name */}
                  <span
                    className={`mt-1.5 text-xs sm:text-sm font-extrabold transition-colors text-center line-clamp-1 pointer-events-none select-none ${
                      isSelected
                        ? 'text-[#c9a84c]'
                        : 'text-[var(--text-main)] group-hover:text-[#c9a84c]'
                    }`}
                  >
                    {title}
                  </span>
                </button>
              </div>
            );
          })}

          {/* Elegant separator dot gap after each cycle */}
          <div
            className="w-12 sm:w-16 md:w-20 flex-shrink-0 flex items-center justify-center select-none pointer-events-none"
            aria-hidden="true"
          >
            <div className="flex items-center gap-1.5 opacity-35">
              <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
              <span className="w-4 sm:w-6 h-px bg-[#c9a84c]" />
              <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <section
      id="categoriesSliderSection"
      aria-label="Categories"
      className="w-full max-w-[1440px] mx-auto px-2 sm:px-3.5 md:px-5 py-2.5 sm:py-3.5 relative group/section"
    >
      {/* Header with Title and Royal Sparkle Accent */}
      <div className="flex items-center justify-between mb-2 sm:mb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#c9a84c]" />
          <h3 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-[var(--text-main)]">
            {t.categoriesSliderTitle}
          </h3>
        </div>

        {/* Desktop Quick Nav Arrows */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => handleManualNudge('left')}
            className="w-7 h-7 rounded-full border border-[#c9a84c]/30 hover:border-[#c9a84c] hover:bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center transition-all cursor-pointer"
            title={isRtl ? 'تحريك لليمين' : 'Move Left'}
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleManualNudge('right')}
            className="w-7 h-7 rounded-full border border-[#c9a84c]/30 hover:border-[#c9a84c] hover:bg-[#c9a84c]/10 text-[#c9a84c] flex items-center justify-center transition-all cursor-pointer"
            title={isRtl ? 'تحريك لليسار' : 'Move Right'}
            aria-label="Next categories"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 
        Continuous Seamless Waterwheel with Full Touch & Mouse Dragging Support:
        - Automatically slides continuously in real time.
        - Dragging or swiping with finger or mouse moves the categories smoothly to the left or right.
        - Releasing resumes automatic smooth movement seamlessly without jumping or resetting.
      */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full overflow-hidden py-3.5 sm:py-4.5 select-none touch-pan-y cursor-grab active:cursor-grabbing"
        dir="ltr"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Ambient subtle edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-8 bg-gradient-to-r from-[var(--bg-page)] to-transparent z-10 opacity-80" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-4 sm:w-8 bg-gradient-to-l from-[var(--bg-page)] to-transparent z-10 opacity-80" />

        {/* 
          Infinite Multi-Set Track:
          Set 0 (setRefA for width measurement), Set 1 (main visible viewport set), Set 2 (seamless continuation)
        */}
        <div ref={trackRef} className="waterwheel-track flex items-center">
          {renderItemSet('set-0', setRefA)}
          {renderItemSet('set-1')}
          {renderItemSet('set-2')}
        </div>
      </div>
    </section>
  );
};
