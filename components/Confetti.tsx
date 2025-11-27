import React from 'react';

export const Confetti: React.FC = () => {
  // Generate particles with random properties
  const particles = Array.from({ length: 50 }).map((_, i) => {
    const colors = ['#d4af37', '#9b7bf6', '#f4c430', '#ffffff'];
    return {
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: 2 + Math.random() * 2 + 's',
      animationDelay: Math.random() * 0.5 + 's',
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 4 + 'px',
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm opacity-0"
          style={{
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.backgroundColor,
            animation: `confetti-drop ${p.animationDuration} linear ${p.animationDelay} forwards`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-drop {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          25% { transform: translateY(25vh) rotate(90deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};