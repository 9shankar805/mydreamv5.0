import { useEffect, useRef } from 'react';
import icon1 from "@/assets/icon1.png";
import icon2 from "@/assets/icon2.png";

interface ModeSwiperProps {
  currentMode: 'shopping' | 'food';
  onModeChange: (mode: 'shopping' | 'food') => void;
}

export default function ModeSwiper({ currentMode, onModeChange }: ModeSwiperProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const shopBtnRef = useRef<HTMLButtonElement>(null);
  const foodBtnRef = useRef<HTMLButtonElement>(null);
  const shopImgRef = useRef<HTMLImageElement>(null);
  const foodImgRef = useRef<HTMLImageElement>(null);
  let animationFrameId: number;

  const updateSlider = () => {
    if (!sliderRef.current) return;
    
    const isShopping = currentMode === 'shopping';
    const slider = sliderRef.current;
    
    // Use requestAnimationFrame for smoother animations
    const animate = () => {
      const currentLeft = parseFloat(slider.style.left || '6px');
      const targetLeft = isShopping ? 6 : 'calc(50% - 0px)';
      
      // Direct DOM manipulation for better performance
      if (typeof targetLeft === 'string') {
        slider.style.left = targetLeft;
      } else {
        const newLeft = currentLeft + (targetLeft - currentLeft) * 0.3;
        slider.style.left = `${newLeft}px`;
        
        if (Math.abs(newLeft - targetLeft) > 0.5) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          slider.style.left = `${targetLeft}px`;
        }
      }
      
      // Update background gradient
      const progress = isShopping 
        ? 1 - (parseFloat(slider.style.left || '6') - 6) / (window.innerWidth * 0.5 - 12)
        : (parseFloat(slider.style.left || '0') - 6) / (window.innerWidth * 0.5 - 12);
      
      slider.style.background = `linear-gradient(135deg, 
        ${mixColors('#3b82f6', '#f97316', progress)}, 
        ${mixColors('#1d4ed8', '#dc2626', progress)}
      )`;
    };
    
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animate);
    
    // Update button states
    if (shopBtnRef.current && foodBtnRef.current) {
      shopBtnRef.current.style.color = isShopping ? 'white' : '';
      foodBtnRef.current.style.color = isShopping ? '' : 'white';
      
      if (shopImgRef.current) {
        shopImgRef.current.style.transform = isShopping ? 'scale(1.1)' : 'scale(1)';
      }
      if (foodImgRef.current) {
        foodImgRef.current.style.transform = isShopping ? 'scale(1)' : 'scale(1.1)';
      }
    }
  };
  
  // Simple color mixing function
  const mixColors = (color1: string, color2: string, weight: number) => {
    const w1 = weight;
    const w2 = 1 - w1;
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r * w1 + rgb2.r * w2);
    const g = Math.round(rgb1.g * w1 + rgb2.g * w2);
    const b = Math.round(rgb1.b * w1 + rgb2.b * w2);
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  useEffect(() => {
    updateSlider();
    
    // Cleanup animation frame on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentMode]);

  const handleSwipe = (newMode: 'shopping' | 'food') => {
    if (newMode === currentMode) return;
    onModeChange(newMode);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        {/* Background slider */}
        <div
          ref={sliderRef}
          className="absolute top-1.5 bottom-1.5 rounded-xl shadow-md"
          style={{
            width: 'calc(50% - 6px)',
            left: currentMode === 'shopping' ? '6px' : 'calc(50% - 0px)',
            background: currentMode === 'shopping' 
              ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
              : 'linear-gradient(135deg, #f97316, #dc2626)'
          }}
        />
        
        {/* Shopping Button */}
        <button
          ref={shopBtnRef}
          onClick={() => handleSwipe('shopping')}
          className="relative z-10 flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors duration-100"
          style={{
            color: currentMode === 'shopping' ? 'white' : 'inherit'
          }}
          title="Shopping Mode"
        >
          <img 
            ref={shopImgRef}
            src={icon2} 
            alt="Shopping" 
            className="h-5 w-5 transition-transform duration-100" 
            style={{
              transform: currentMode === 'shopping' ? 'scale(1.1)' : 'scale(1)'
            }}
          />
          <span className="text-sm font-medium">Shop</span>
        </button>
        
        {/* Food Delivery Button */}
        <button
          ref={foodBtnRef}
          onClick={() => handleSwipe('food')}
          className="relative z-10 flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors duration-100"
          style={{
            color: currentMode === 'food' ? 'white' : 'inherit'
          }}
          title="Food Delivery Mode"
        >
          <img 
            ref={foodImgRef}
            src={icon1} 
            alt="Food" 
            className="h-5 w-5 transition-transform duration-100"
            style={{
              transform: currentMode === 'food' ? 'scale(1.1)' : 'scale(1)'
            }}
          />
          <span className="text-sm font-medium">Food</span>
        </button>
      </div>
    </div>
  );
}