"use client";
import { useEffect, useState } from 'react';

// 색상 (은행잎, 단풍잎, 초록잎 등 사진과 어울리는 자연스러운 색상)
const LEAF_COLORS = [
  '#4CAF50', // 밝은 초록
  '#2E7D32', // 어두운 초록
  '#81C784', // 연한 초록
  '#F57F17', // 단풍 오렌지
  '#FFB300', // 은행 노랑
  '#689F38', // 연두
];

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    // 클라이언트 사이드에서만 생성 (hydration 에러 방지)
    const newLeaves = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      // 7초 ~ 15초 사이의 무작위 떨어지는 시간
      animationDuration: `${Math.random() * 8 + 7}s`,
      // 무작위 지연 시간
      animationDelay: `${Math.random() * 10}s`,
      // 무작위 크기 (사진과 어울리는 12px ~ 28px)
      size: `${Math.random() * 16 + 12}px`,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      opacity: Math.random() * 0.4 + 0.4, // 0.4 ~ 0.8 투명도
      // 좌우로 흔들리는 애니메이션 시간 (2초 ~ 4초)
      swayDuration: `${Math.random() * 2 + 2}s`,
    }));
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
            color: leaf.color,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              animation: `fallingLeafSway ${leaf.swayDuration} ease-in-out infinite alternate`,
            }}
          >
            {/* 나뭇잎 SVG 아이콘 */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-sm opacity-90">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
