"use client";
import { useEffect, useState } from 'react';

// 학교 전경 우측의 실제 나무(느티나무/벚나무류)와 유사한 자연스럽고 차분한 색상
const LEAF_TYPES = [
  { id: 1, c1: '#4a5d23', c2: '#384d16' }, // 짙은 올리브 그린
  { id: 2, c1: '#5a6b31', c2: '#4a5d23' }, // 중간 올리브 그린
  { id: 3, c1: '#6b7a3a', c2: '#5a6b31' }, // 약간 밝은 녹색
  { id: 4, c1: '#7c8a45', c2: '#6b7a3a' }, // 살짝 노란빛이 도는 녹색
  { id: 5, c1: '#8a8845', c2: '#737134' }, // 초가을 느낌의 탁한 황록색
];

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    // 갯수를 줄여서 산만함을 없앰 (18개 -> 8개)
    const newLeaves = Array.from({ length: 8 }).map((_, i) => {
      const leafType = LEAF_TYPES[Math.floor(Math.random() * LEAF_TYPES.length)];
      return {
        id: i,
        left: `${Math.random() * 90 + 5}%`,
        animationDuration: `${Math.random() * 12 + 10}s`, // 10~22초 (더 천천히 떨어짐)
        animationDelay: `${Math.random() * 15}s`,
        size: `${Math.random() * 12 + 12}px`, // 12~24px (사진 스케일에 맞게 크기 축소)
        type: leafType,
        opacity: Math.random() * 0.4 + 0.4, // 0.4 ~ 0.8 투명도로 배경과 융화
        swayDuration: `${Math.random() * 3 + 3}s`, // 더 부드럽게 흔들림
        // 좌우 반전 랜덤
        scaleX: Math.random() > 0.5 ? 1 : -1,
        rotationStart: Math.random() * 360
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
              transform: `rotate(${leaf.rotationStart}deg)`,
            }}
          >
            {/* 만화 느낌을 뺀, 단순하고 유기적인 나뭇잎 실루엣 (우측 나무 잎사귀 형태) */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full drop-shadow-sm blur-[0.5px]" 
              preserveAspectRatio="xMidYMid meet"
              style={{ transform: `scaleX(${leaf.scaleX})` }}
            >
              <defs>
                <linearGradient id={`leafGrad-${leaf.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={leaf.type.c1} />
                  <stop offset="100%" stopColor={leaf.type.c2} />
                </linearGradient>
              </defs>
              
              {/* 잔잔한 잎사귀 모양 (인맥/반사광 제거하여 실루엣 위주로 자연스럽게) */}
              <path 
                d="M 50 5 C 80 25 85 55 50 95 C 15 55 20 25 50 5 Z" 
                fill={`url(#leafGrad-${leaf.id})`} 
              />
              <path 
                d="M 50 93 Q 53 98 48 100" 
                stroke={leaf.type.c2} 
                strokeWidth="3" 
                fill="none" 
                strokeLinecap="round" 
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
