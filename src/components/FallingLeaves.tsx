"use client";
import { useEffect, useState } from 'react';

// 현실적인 단풍/나뭇잎 색상 팔레트 (다크/라이트/베인 색상)
const LEAF_TYPES = [
  { id: 1, c1: '#4CAF50', c2: '#2E7D32', c3: '#1B5E20', vein: '#A5D6A7' }, // 녹색 잎
  { id: 2, c1: '#81C784', c2: '#388E3C', c3: '#1B5E20', vein: '#C8E6C9' }, // 밝은 녹색
  { id: 3, c1: '#FFB300', c2: '#F57F17', c3: '#E65100', vein: '#FFE082' }, // 은행 노랑
  { id: 4, c1: '#FF7043', c2: '#E64A19', c3: '#BF360C', vein: '#FFCCBC' }, // 단풍 오렌지
  { id: 5, c1: '#D4E157', c2: '#AFB42B', c3: '#827717', vein: '#F0F4C3' }, // 연두색 잎
];

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    // 클라이언트 사이드에서만 생성 (hydration 에러 방지)
    const newLeaves = Array.from({ length: 18 }).map((_, i) => {
      const leafType = LEAF_TYPES[Math.floor(Math.random() * LEAF_TYPES.length)];
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 10 + 8}s`, // 8~18초
        animationDelay: `${Math.random() * 12}s`,
        size: `${Math.random() * 25 + 18}px`, // 18~43px (크기를 키워서 디테일이 보이게)
        type: leafType,
        opacity: Math.random() * 0.3 + 0.6, // 0.6 ~ 0.9 투명도 (너무 투명하면 디테일이 안 보임)
        swayDuration: `${Math.random() * 2 + 2.5}s`,
        rotationDuration: `${Math.random() * 10 + 5}s`,
        // 좌우 반전 랜덤
        scaleX: Math.random() > 0.5 ? 1 : -1
      };
    });
    setLeaves(newLeaves);
  }, []);

  if (leaves.length === 0) return null;

  return (
    <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden" aria-hidden="true">
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="absolute top-[-10%]"
          style={{
            left: leaf.left,
            width: leaf.size,
            height: leaf.size,
            animation: `fallingLeaf ${leaf.animationDuration} linear ${leaf.animationDelay} infinite`,
            opacity: leaf.opacity,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              animation: `fallingLeafSway ${leaf.swayDuration} ease-in-out infinite alternate`,
            }}
          >
            {/* 고품질 리얼리스틱 벡터 나뭇잎 */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full drop-shadow-md" 
              preserveAspectRatio="xMidYMid meet"
              style={{ transform: `scaleX(${leaf.scaleX})` }}
            >
              <defs>
                <linearGradient id={`leafGrad-${leaf.id}`} x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor={leaf.type.c1} />
                  <stop offset="50%" stopColor={leaf.type.c2} />
                  <stop offset="100%" stopColor={leaf.type.c3} />
                </linearGradient>
                <filter id={`shadow-${leaf.id}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.4" />
                </filter>
              </defs>
              
              {/* 나뭇잎 기본 형태 (자연스러운 굴곡) */}
              <path 
                d="M 50 2 C 70 10 95 35 90 70 C 85 90 65 98 50 98 C 35 98 15 90 10 70 C 5 35 30 10 50 2 Z" 
                fill={`url(#leafGrad-${leaf.id})`} 
                filter={`url(#shadow-${leaf.id})`}
              />
              
              {/* 나뭇잎 줄기 (Stem) */}
              <path d="M 50 90 Q 52 105 45 110" stroke="#3e2723" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              
              {/* 중앙 인맥 (Central Vein) */}
              <path d="M 50 2 Q 45 50 50 95" stroke={leaf.type.vein} strokeWidth="1.5" fill="none" opacity="0.6" />
              
              {/* 측면 인맥 (Side Veins) */}
              <path d="M 50 25 Q 65 20 80 35" stroke={leaf.type.vein} strokeWidth="1" fill="none" opacity="0.5" />
              <path d="M 50 45 Q 70 45 85 60" stroke={leaf.type.vein} strokeWidth="1" fill="none" opacity="0.5" />
              <path d="M 50 65 Q 65 70 75 80" stroke={leaf.type.vein} strokeWidth="1" fill="none" opacity="0.5" />
              
              <path d="M 50 25 Q 35 20 20 35" stroke={leaf.type.vein} strokeWidth="1" fill="none" opacity="0.5" />
              <path d="M 50 45 Q 30 45 15 60" stroke={leaf.type.vein} strokeWidth="1" fill="none" opacity="0.5" />
              <path d="M 50 65 Q 35 70 25 80" stroke={leaf.type.vein} strokeWidth="1" fill="none" opacity="0.5" />
              
              {/* 빛 반사 하이라이트 (Glossy reflection) */}
              <path d="M 45 10 C 25 25 15 50 20 70 C 15 50 25 20 45 10 Z" fill="#ffffff" opacity="0.15" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
