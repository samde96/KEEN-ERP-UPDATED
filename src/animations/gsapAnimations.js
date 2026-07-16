import gsap from 'gsap';

function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animatePageEnter(root) {
  if (!root || shouldReduceMotion()) return;

  gsap.fromTo(
    root.querySelectorAll('[data-animate="fade-up"]'),
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
  );
}

export function animateSidebar(root) {
  if (!root || shouldReduceMotion()) return;

  gsap.fromTo(
    root.querySelectorAll('.sidebar-link'),
    { autoAlpha: 0, x: -8 },
    { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.02, ease: 'power1.out' }
  );
}

export function pulseAlert(element) {
  if (!element || shouldReduceMotion()) return;

  gsap.fromTo(
    element,
    { boxShadow: '0 0 0 0 rgba(5, 5, 5, 0.2)' },
    {
      boxShadow: '0 0 0 10px rgba(5, 5, 5, 0)',
      duration: 1.4,
      repeat: -1,
      ease: 'power1.out'
    }
  );
}

export function animateCartRow(element) {
  if (!element || shouldReduceMotion()) return;

  gsap.fromTo(element, { autoAlpha: 0, x: 10 }, { autoAlpha: 1, x: 0, duration: 0.18, ease: 'power1.out' });
}
