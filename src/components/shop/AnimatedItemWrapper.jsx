// components/shop/AnimatedItemWrapper.js
'use client';

import React from 'react';
import { useInView } from 'react-intersection-observer';

const AnimatedItemWrapper = ({ children, index }) => {
  const { ref, inView } = useInView({
    // `triggerOnce: true` ensures the animation only runs once
    triggerOnce: true,
    // The animation will trigger when the item is 10% visible
    threshold: 0.1,
  });

  const style = {
    // Defines the animation properties
    transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
    // Stagger the animation for items in the same row for a nice effect
    transitionDelay: `${(index % 4) * 0.1}s`,
    // Initial state (hidden)
    opacity: 0,
    transform: 'translateY(20px)',
    // Final state (visible)
    ...(inView && {
      opacity: 1,
      transform: 'translateY(0)',
    }),
  };

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
};

export default AnimatedItemWrapper;