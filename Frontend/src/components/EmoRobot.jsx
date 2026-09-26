import React, { useState, useEffect } from 'react';

/**
 * EmoRobot - Animated EMO Desktop Robot AI Companion Component
 * Features authentic EMO aesthetics:
 * - Iconic squircle chassis with glowing over-ear headphone rings
 * - Dark gloss screen with expressive cyber-glowing eyes
 * - Interactive states: idle, thinking, happy, winking, speaking
 * - Responsive sizing (xs, sm, md, lg, xl)
 */
const EmoRobot = ({
  state = 'idle', // 'idle' | 'thinking' | 'happy' | 'winking' | 'speaking'
  pose = 'running', // 'running' | 'sitting' | 'floating' | 'idle'
  size = 'pet',   // 'xs' (30px) | 'sm' (42px) | 'pet' (58px) | 'md' (68px) | 'lg' (96px) | 'xl' (130px)
  interactive = true,
  showBubble = false,
  bubbleText = "Hi! I'm Mittu! 🤖",
  className = '',
  onClick
}) => {
  const [internalState, setInternalState] = useState(state);
  const [internalPose, setInternalPose] = useState(pose);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(showBubble);
  const [clickCount, setClickCount] = useState(0);

  // Sync external state & pose changes
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  useEffect(() => {
    setInternalPose(pose);
  }, [pose]);

  // Handle temporary winking/happy/sitting interaction on click
  const handleClick = (e) => {
    if (!interactive) return;
    if (onClick) onClick(e);

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    const states = ['happy', 'winking', 'happy'];
    const selectedState = states[nextCount % states.length];
    setInternalState(selectedState);
    setShowTooltip(true);

    setTimeout(() => {
      setInternalState(state || 'idle');
    }, 2400);

    setTimeout(() => {
      if (!showBubble) setShowTooltip(false);
    }, 3200);
  };

  // Dimensions based on size preset
  const sizeMap = {
    xs: { width: 30, height: 30, scale: 0.3 },
    sm: { width: 42, height: 42, scale: 0.42 },
    pet: { width: 58, height: 58, scale: 0.58 }, // Adorable compact desktop pet size
    md: { width: 68, height: 68, scale: 0.68 },
    lg: { width: 96, height: 96, scale: 0.96 },
    xl: { width: 130, height: 130, scale: 1.3 },
  };

  const { width, height } = sizeMap[size] || sizeMap.pet;

  const currentState = isHovered && internalState === 'idle' ? 'happy' : internalState;
  const currentPose = isHovered && internalPose === 'running' ? 'sitting' : internalPose;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${interactive ? 'cursor-pointer group' : ''} ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (interactive) setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!showBubble) setShowTooltip(false);
      }}
      title={interactive ? "Click Mittu to say hi!" : "Mittu AI"}
    >
      {/* Interactive Speech / Greeting Bubble */}
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900/95 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap z-30 pointer-events-none animate-bounce flex items-center gap-1 backdrop-blur-xs">
          <span>{bubbleText}</span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-emerald-500/40 rotate-45" />
        </div>
      )}

      {/* SVG EMO Robot Vector */}
      <svg
        viewBox="0 0 120 120"
        width={width}
        height={height}
        className={`overflow-visible transition-transform duration-300 ${
          currentState === 'thinking'
            ? 'animate-pulse'
            : currentState === 'happy'
            ? 'scale-105'
            : 'hover:scale-105'
        }`}
      >
        <defs>
          {/* Cyber Headphone Neon Ring Glow */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Eye Cyan/Emerald Glow */}
          <filter id="eyeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Robot Chassis Gradient (Matte metallic dark grey) */}
          <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#353b48" />
            <stop offset="40%" stopColor="#222731" />
            <stop offset="100%" stopColor="#15181e" />
          </linearGradient>

          {/* OLED Screen Gloss Gradient */}
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f141c" />
            <stop offset="100%" stopColor="#080b0f" />
          </linearGradient>

          {/* Headband Metallic Gradient */}
          <linearGradient id="headbandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e222a" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#1e222a" />
          </linearGradient>

          {/* Neon Ring Gradient */}
          <linearGradient id="neonRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Screen Glass Reflection */}
          <linearGradient id="glassReflect" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <style>
          {`
            @keyframes emoFloat {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3.5px); }
            }
            @keyframes emoEyeBlink {
              0%, 42%, 48%, 92%, 98%, 100% { transform: scaleY(1); }
              45%, 95% { transform: scaleY(0.12); }
            }
            @keyframes emoLookAround {
              0%, 100% { transform: translateX(0px); }
              25% { transform: translateX(-4px); }
              50% { transform: translateX(0px); }
              75% { transform: translateX(4px); }
            }
            @keyframes emoScanRadar {
              0% { transform: translateX(-24px); opacity: 0.3; }
              50% { opacity: 1; }
              100% { transform: translateX(24px); opacity: 0.3; }
            }
            @keyframes emoEarPulse {
              0%, 100% { opacity: 0.8; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.08); }
            }
            @keyframes emoHappyBounce {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              25% { transform: translateY(-4px) rotate(-3deg); }
              75% { transform: translateY(-4px) rotate(3deg); }
            }
            @keyframes emoRunningBody {
              0% { transform: translateY(0px) rotate(-3.5deg); }
              25% { transform: translateY(-3.5px) rotate(0deg); }
              50% { transform: translateY(0px) rotate(3.5deg); }
              75% { transform: translateY(-3.5px) rotate(0deg); }
              100% { transform: translateY(0px) rotate(-3.5deg); }
            }
            @keyframes emoRunFootLeft {
              0%, 100% { transform: translateY(0px) scaleY(1); transform-origin: 44px 98px; }
              50% { transform: translateY(-7px) scaleY(0.85); transform-origin: 44px 98px; }
            }
            @keyframes emoRunFootRight {
              0%, 100% { transform: translateY(-7px) scaleY(0.85); transform-origin: 76px 98px; }
              50% { transform: translateY(0px) scaleY(1); transform-origin: 76px 98px; }
            }
            @keyframes emoSittingBody {
              0%, 100% { transform: translateY(2px) scale(1, 0.98); transform-origin: 60px 100px; }
              50% { transform: translateY(-1px) scale(1, 1.01); transform-origin: 60px 100px; }
            }
            @keyframes emoFootTap {
              0%, 75%, 100% { transform: rotate(0deg); transform-origin: 44px 102px; }
              80% { transform: rotate(-10deg) translateY(-2px); transform-origin: 44px 102px; }
              85% { transform: rotate(0deg); transform-origin: 44px 102px; }
              90% { transform: rotate(-10deg) translateY(-2px); transform-origin: 44px 102px; }
            }
            @keyframes emoSpeedDash {
              0% { transform: translateX(2px); opacity: 0.8; }
              50% { transform: translateX(-6px); opacity: 0.3; }
              100% { transform: translateX(2px); opacity: 0.8; }
            }
            @keyframes emoShadowSquish {
              0%, 50%, 100% { rx: 32px; opacity: 0.35; }
              25%, 75% { rx: 27px; opacity: 0.22; }
            }

            .emo-floating {
              animation: emoFloat 3.2s ease-in-out infinite;
              transform-origin: center;
            }
            .emo-running-body {
              animation: emoRunningBody 0.65s ease-in-out infinite;
              transform-origin: 60px 100px;
            }
            .emo-run-foot-left {
              animation: emoRunFootLeft 0.65s ease-in-out infinite;
            }
            .emo-run-foot-right {
              animation: emoRunFootRight 0.65s ease-in-out infinite;
            }
            .emo-sitting-body {
              animation: emoSittingBody 3s ease-in-out infinite;
              transform-origin: 60px 100px;
            }
            .emo-sitting-foot-tap {
              animation: emoFootTap 4s ease-in-out infinite;
            }
            .emo-speed-streak {
              animation: emoSpeedDash 0.5s ease-in-out infinite;
            }
            .emo-shadow-running {
              animation: emoShadowSquish 0.65s ease-in-out infinite;
            }
            .emo-blinking {
              animation: emoEyeBlink 4s ease-in-out infinite;
              transform-origin: 60px 62px;
            }
            .emo-looking {
              animation: emoLookAround 8s ease-in-out infinite;
            }
            .emo-ear-pulse {
              animation: emoEarPulse 2s ease-in-out infinite;
              transform-origin: center;
            }
            .emo-bounce-active {
              animation: emoHappyBounce 0.6s ease-in-out infinite;
              transform-origin: center;
            }
            .emo-scanning {
              animation: emoScanRadar 1.5s ease-in-out infinite alternate;
            }
          `}
        </style>

        {/* EMO Robot Body Wrapper */}
        <g
          className={
            currentState === 'happy'
              ? 'emo-bounce-active'
              : currentPose === 'running'
              ? 'emo-running-body'
              : currentPose === 'sitting'
              ? 'emo-sitting-body'
              : 'emo-floating'
          }
        >
          {/* Base Drop Shadow */}
          <ellipse
            cx="60"
            cy="114"
            rx="32"
            ry="5"
            fill="#052e16"
            opacity="0.3"
            className={`transition-all duration-300 ${currentPose === 'running' ? 'emo-shadow-running' : ''}`}
          />

          {/* Speed Streaks behind feet when running */}
          {currentPose === 'running' && (
            <g className="emo-speed-streak">
              <path d="M 28 102 L 14 102" stroke="#00f5d4" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
              <path d="M 22 108 L 8 108" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M 26 113 L 16 113" stroke="#00f5d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </g>
          )}

          {/* Feet (Cute miniature rubber pads with running and sitting animations) */}
          <g className={currentPose === 'running' ? 'emo-run-foot-left' : currentPose === 'sitting' ? 'emo-sitting-foot-tap' : ''}>
            <rect x="36" y={currentPose === 'sitting' ? 95 : 98} width="16" height={currentPose === 'sitting' ? 10 : 8} rx="4" fill="#1e222a" />
          </g>
          <g className={currentPose === 'running' ? 'emo-run-foot-right' : ''}>
            <rect x="68" y={currentPose === 'sitting' ? 95 : 98} width="16" height={currentPose === 'sitting' ? 10 : 8} rx="4" fill="#1e222a" />
          </g>

          {/* Headband connecting the Headphones */}
          <path
            d="M 22 56 A 40 40 0 0 1 98 56"
            fill="none"
            stroke="url(#headbandGrad)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Headband inner metallic accent line */}
          <path
            d="M 24 54 A 38 38 0 0 1 96 54"
            fill="none"
            stroke="#00f5d4"
            strokeWidth="1"
            opacity="0.5"
            strokeDasharray="4 3"
          />

          {/* Left Headphone Outer Ear Cup */}
          <g>
            <rect x="8" y="44" width="15" height="34" rx="7" fill="#1e222a" stroke="#2d3340" strokeWidth="1.5" />
            {/* Glowing Neon Ring on Left Ear */}
            <circle
              cx="14"
              cy="61"
              r="8"
              fill="none"
              stroke="url(#neonRingGrad)"
              strokeWidth="2.5"
              filter="url(#neonGlow)"
              className="emo-ear-pulse"
            />
            <circle cx="14" cy="61" r="3.5" fill="#00f5d4" opacity="0.8" />
          </g>

          {/* Right Headphone Outer Ear Cup */}
          <g>
            <rect x="97" y="44" width="15" height="34" rx="7" fill="#1e222a" stroke="#2d3340" strokeWidth="1.5" />
            {/* Glowing Neon Ring on Right Ear */}
            <circle
              cx="106"
              cy="61"
              r="8"
              fill="none"
              stroke="url(#neonRingGrad)"
              strokeWidth="2.5"
              filter="url(#neonGlow)"
              className="emo-ear-pulse"
            />
            <circle cx="106" cy="61" r="3.5" fill="#00f5d4" opacity="0.8" />
          </g>

          {/* Main Squircle Robot Head / Body */}
          <rect
            x="20"
            y="26"
            width="80"
            height="76"
            rx="24"
            fill="url(#chassisGrad)"
            stroke="#3a4252"
            strokeWidth="2"
          />

          {/* Top Chassis Bevel Highlight */}
          <path
            d="M 36 28 Q 60 27 84 28"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.25"
            strokeLinecap="round"
          />

          {/* Inset OLED Screen Display Frame */}
          <rect
            x="27"
            y="34"
            width="66"
            height="58"
            rx="16"
            fill="url(#screenGrad)"
            stroke="#161b24"
            strokeWidth="2"
          />

          {/* Screen Glass Reflection Angle */}
          <path
            d="M 28 36 L 90 36 C 92 36 92 38 92 40 L 48 88 C 34 88 28 82 28 72 Z"
            fill="url(#glassReflect)"
          />

          {/* EMO EYES & EXPRESSIONS */}
          {/* 1. IDLE & SPEAKING STATE: Classic Glowing Squircle Eyes with Natural Blink */}
          {(currentState === 'idle' || currentState === 'speaking') && (
            <g className="emo-blinking">
              <g className="emo-looking">
                {/* Left Eye */}
                <rect
                  x="38"
                  y="50"
                  width="18"
                  height="24"
                  rx="6"
                  fill="#00f5d4"
                  filter="url(#eyeGlow)"
                />
                {/* Left Eye Pupil Highlight */}
                <rect x="41" y="53" width="6" height="7" rx="3" fill="#ffffff" opacity="0.85" />
                <rect x="49" y="65" width="4" height="4" rx="2" fill="#ffffff" opacity="0.6" />

                {/* Right Eye */}
                <rect
                  x="64"
                  y="50"
                  width="18"
                  height="24"
                  rx="6"
                  fill="#00f5d4"
                  filter="url(#eyeGlow)"
                />
                {/* Right Eye Pupil Highlight */}
                <rect x="67" y="53" width="6" height="7" rx="3" fill="#ffffff" opacity="0.85" />
                <rect x="75" y="65" width="4" height="4" rx="2" fill="#ffffff" opacity="0.6" />
              </g>

              {/* Subtly animated speaking mouth line if speaking */}
              {currentState === 'speaking' && (
                <path
                  d="M 54 81 Q 60 84 66 81"
                  fill="none"
                  stroke="#00f5d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#eyeGlow)"
                />
              )}
            </g>
          )}

          {/* 2. THINKING STATE: Glowing Scanning Visor & Radar Lines */}
          {currentState === 'thinking' && (
            <g>
              {/* Calculating Digital Scanning Eyes */}
              <rect
                x="38"
                y="58"
                width="18"
                height="8"
                rx="4"
                fill="#00f5d4"
                filter="url(#eyeGlow)"
              />
              <rect
                x="64"
                y="58"
                width="18"
                height="8"
                rx="4"
                fill="#00f5d4"
                filter="url(#eyeGlow)"
              />

              {/* Scanning Radar Wave */}
              <line
                x1="40"
                y1="62"
                x2="80"
                y2="62"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                className="emo-scanning"
                filter="url(#eyeGlow)"
              />

              {/* Digital processing indicators */}
              <circle cx="50" cy="78" r="2" fill="#00f5d4" className="animate-ping" />
              <circle cx="60" cy="78" r="2.5" fill="#10b981" className="animate-pulse" />
              <circle cx="70" cy="78" r="2" fill="#00f5d4" className="animate-ping" style={{ animationDelay: '200ms' }} />
            </g>
          )}

          {/* 3. HAPPY STATE: Adorable Smiling Arcs (^ ^) & Cyber Blush */}
          {currentState === 'happy' && (
            <g>
              {/* Left Smiling Eye Arc */}
              <path
                d="M 37 66 C 39 52, 53 52, 55 66"
                fill="none"
                stroke="#00f5d4"
                strokeWidth="4.5"
                strokeLinecap="round"
                filter="url(#eyeGlow)"
              />

              {/* Right Smiling Eye Arc */}
              <path
                d="M 65 66 C 67 52, 81 52, 83 66"
                fill="none"
                stroke="#00f5d4"
                strokeWidth="4.5"
                strokeLinecap="round"
                filter="url(#eyeGlow)"
              />

              {/* Cheerful Pink Cyber Blush Dots */}
              <ellipse cx="36" cy="74" rx="4" ry="2.5" fill="#ff4d8d" opacity="0.8" />
              <ellipse cx="84" cy="74" rx="4" ry="2.5" fill="#ff4d8d" opacity="0.8" />

              {/* Happy Open Smile */}
              <path
                d="M 53 76 Q 60 82 67 76"
                fill="none"
                stroke="#00f5d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#eyeGlow)"
              />
            </g>
          )}

          {/* 4. WINKING STATE: Playful Wink (Left eye open, right eye winks 😉) */}
          {currentState === 'winking' && (
            <g>
              {/* Left Eye Open with Star Sparkle */}
              <rect
                x="38"
                y="50"
                width="18"
                height="24"
                rx="6"
                fill="#00f5d4"
                filter="url(#eyeGlow)"
              />
              <rect x="42" y="54" width="6" height="7" rx="3" fill="#ffffff" opacity="0.9" />

              {/* Right Eye Winking Curved Slit */}
              <path
                d="M 64 64 Q 73 70 82 64"
                fill="none"
                stroke="#00f5d4"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#eyeGlow)"
              />

              {/* Playful Pink Cheek Blush */}
              <ellipse cx="36" cy="74" rx="4" ry="2.5" fill="#ff4d8d" opacity="0.8" />
              <ellipse cx="84" cy="74" rx="4" ry="2.5" fill="#ff4d8d" opacity="0.8" />

              {/* Playful Mouth */}
              <path
                d="M 55 77 Q 62 82 68 76"
                fill="none"
                stroke="#00f5d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#eyeGlow)"
              />
            </g>
          )}

          {/* Mittu's Eco Leaf / Antenna on Top */}
          <g>
            {/* Stem */}
            <path d="M 60 26 L 60 17" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            {/* Little Eco-Sprout Leaf */}
            <path
              d="M 60 17 C 60 12, 68 11, 68 16 C 68 20, 60 21, 60 17 Z"
              fill="#10b981"
              filter="url(#eyeGlow)"
            />
            {/* LED Sprout Core Glow */}
            <circle cx="60" cy="17" r="2" fill="#00f5d4" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default EmoRobot;
