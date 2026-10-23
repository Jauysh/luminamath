'use client';

import React from 'react';

/**
 * Official LuminaMath Vector Logo from `logos/LuminaMath-Logo.svg`
 * With "Lumina" in brand orange (#F26B21) and "Math" in royal blue (#1758A8 / #2C3987)
 * matching the official LuminaMath Moldova poster.
 */
export function LuminaMathLogo({
  className = 'h-10 sm:h-12 w-auto',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 300 53.7"
      className={className}
      role="img"
      aria-label="LuminaMath — Concursul Național de Matematică"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="luminaMonogramGrad"
          gradientUnits="userSpaceOnUse"
          x1="37.3167"
          y1="0.992"
          x2="37.3167"
          y2="51.915"
        >
          <stop offset="0%" stopColor="#F8A71A" />
          <stop offset="100%" stopColor="#ED5526" />
        </linearGradient>
      </defs>

      {/* Blue Ribbon Background */}
      <path fill="#1B56A5" d="M300,35.3H81.7v17H300L300,35.3z" />

      {/* "Lumina" letters in vibrant Orange */}
      <path
        fill="#F06423"
        d="M200.6,11.4c5.7,0,10.3,4.5,10.6,10.1v11.1h-5v-1.7c-1.6,1-3.6,1.6-5.6,1.6c-5.8,0-10.6-4.7-10.6-10.6
        C190,16.1,194.8,11.4,200.6,11.4 M113.9,32.5c-5.8,0-10.6-4.6-10.6-10.6
        V11.4h5V22c0,3.4,2.2,5.6,5.6,5.6c3.4,0,5.7-2.1,5.7-5.6V11.4h4.7V22C124.4,28,119.8,32.5,113.9,32.5 M81.8,32.5V1.3h5v26.3h15.1
        v5L81.8,32.5z M183.8,32.4V21.8c0-3.4-2.2-5.6-5.6-5.6s-5.6,2.2-5.6,5.6v10.6h-5V21.8c0-5.8,4.6-10.6,10.6-10.6
        c5.8,0,10.6,4.6,10.6,10.6v10.6H183.8z M161.5,11.2h4.7v21.1h-4.7V11.2z M155.5,32.4V21.8c0-3.1-1.9-5.6-5.2-5.6
        c-3.1,0-5.2,2.6-5.2,5.6v10.6h-4.6V21.8c0-3-1.7-5.6-5-5.6c-3.4,0-5.2,2.3-5.2,5.6v10.6h-4.6V21.8c0-5.7,3.7-10.6,9.7-10.6
        c2.9,0,5.4,1.3,7.3,3.7c1.9-2.5,4.6-3.7,7.4-3.7c5.8,0,9.7,5,9.7,10.6v10.6H155.5z M161.5,4.2h4.7v5h-4.7V4.2z M200.6,16.2
        c-3.1,0-5.7,2.5-5.7,5.7c0,3.1,2.5,5.7,5.7,5.7c3.1,0,5.7-2.5,5.7-5.7C206.3,18.8,203.7,16.2,200.6,16.2"
      />

      {/* "Math" letters in Royal Blue */}
      <path
        fill="#1B56A5"
        d="M295.2,32.5V22c0-3.5-2.5-5.6-5.7-5.6c-3.4,0-5.6,2.2-5.6,5.6v10.6h-5V1.3h5v11.8
        c1.7-1,3.6-1.7,5.6-1.7c5.9,0,10.6,4.6,10.6,10.6v10.6H295.2z M266.4,32.5V1.3h5v9.1h6v5h-6v17.2L266.4,32.5L266.4,32.5z
        M238,32.5V10.1l-8.3,13.4h-4.4l-7.9-13.3v22.3h-5V1.3h5.2l10,16.3l9.9-16.3h5.2v31.2H238z M254.7,11.4
        c5.7,0,10.3,4.5,10.6,10.1v11.1h-5v-1.7c-1.6,1-3.6,1.6-5.6,1.6c-5.8,0-10.6-4.7-10.6-10.6C244.1,16.1,248.9,11.4,254.7,11.4
        M254.7,16.2c-3.1,0-5.7,2.5-5.7,5.7c0,3.1,2.5,5.7,5.7,5.7c3.1,0,5.7-2.5,5.7-5.7C260.4,18.8,257.8,16.2,254.7,16.2"
      />

      {/* LM Orange Monogram Icon */}
      <path
        fill="url(#luminaMonogramGrad)"
        d="M8.2,52.3c-4.5,0-8.2-3.7-8.2-8.2V1.3h11.2v36.3l2.3,2.3h47l2.2-2.2V12.8h-9.9v21.1H41.1V12.8H31v21.1H18.9
        V9.6c0-4.5,3.7-8.2,8.2-8.2h16.5L47.3,5L51,1.3h15.4c4.5,0,8.2,3.7,8.2,8.2v34.5c0,4.5-3.7,8.3-8.2,8.3H8.2"
      />

      {/* White Subtitle: CONCURSUL NAȚIONAL DE MATEMATICĂ */}
      <g fill="#FFFFFF">
        <path d="M83.7,45.7c0.4,0.4,1,0.7,1.6,0.7c0.8,0,1.4-0.3,2-0.9l0.8,0.9c-0.9,0.9-1.6,1.2-2.8,1.2c-1.1,0-1.9-0.4-2.6-1c-0.7-0.6-1-1.5-1-2.6c0-1,0.4-1.9,1-2.5c0.6-0.6,1.5-1,2.6-1c1.2,0,2,0.3,2.8,1.2l-0.8,0.9c-0.6-0.6-1.2-0.9-2-0.9c-0.6,0-1.2,0.2-1.6,0.6c-0.4,0.4-0.7,1-0.7,1.7C83.1,44.8,83.4,45.4,83.7,45.7z" />
        <path d="M95.1,41.6c0.7,0.7,1,1.6,1,2.5c0,1-0.4,1.8-1,2.5c-0.7,0.7-1.5,1.1-2.6,1.1c-1.1,0-2-0.4-2.7-1.1c-0.6-0.6-0.9-1.5-0.9-2.4c0-1,0.4-1.8,1-2.4c0.6-0.7,1.6-1.1,2.7-1.1C93.6,40.6,94.5,40.9,95.1,41.6z M90.9,45.7c0.4,0.4,1,0.7,1.6,0.7c0.6,0,1.2-0.3,1.6-0.7c0.4-0.4,0.6-0.9,0.6-1.6c0-0.7-0.2-1.3-0.6-1.7c-0.4-0.4-0.9-0.7-1.6-0.7c-0.6,0-1.2,0.2-1.6,0.7c-0.4,0.4-0.6,0.9-0.6,1.6C90.3,44.8,90.5,45.3,90.9,45.7z" />
        <path d="M103.7,40.7v6.8h-1.2l-3.8-4.6v4.6h-1.3v-6.8h1.2l3.8,4.7v-4.7H103.7z" />
        <path d="M106.9,45.7c0.4,0.4,1,0.7,1.6,0.7c0.8,0,1.4-0.3,2-0.9l0.8,0.9c-0.9,0.9-1.6,1.2-2.8,1.2c-1.1,0-1.9-0.4-2.6-1c-0.7-0.6-1-1.5-1-2.6c0-1,0.4-1.9,1-2.5c0.6-0.6,1.5-1,2.6-1c1.2,0,2,0.3,2.8,1.2l-0.8,0.9c-0.6-0.6-1.2-0.9-2-0.9c-0.6,0-1.2,0.2-1.6,0.6c-0.4,0.4-0.7,1-0.7,1.7C106.3,44.8,106.5,45.4,106.9,45.7z" />
        <path d="M117.6,46.9c-0.5,0.5-1.2,0.8-2.1,0.8c-0.9,0-1.6-0.3-2.2-0.8c-0.5-0.6-0.9-1.3-0.9-2.3v-3.8h1.4v3.9c0,0.6,0.2,1,0.5,1.3c0.3,0.3,0.7,0.5,1.2,0.5c0.5,0,0.9-0.2,1.2-0.5c0.3-0.3,0.5-0.7,0.5-1.3v-3.9h1.4v3.8C118.6,45.5,118.2,46.3,117.6,46.9z" />
        <path d="M125.6,44.6c-0.2,0.4-0.6,0.7-1,0.9l1.3,2.1h-1.6l-1.1-1.8h-1.9v1.8H120v-6.8h3.3c0.8,0,1.5,0.3,2,0.7c0.5,0.5,0.8,1.1,0.8,1.8C126,43.7,125.9,44.2,125.6,44.6z M121.4,44.5h1.9c0.5,0,0.8-0.1,1-0.4c0.2-0.2,0.3-0.6,0.3-0.9c0-0.3-0.1-0.7-0.3-0.9c-0.2-0.3-0.6-0.4-1.1-0.4h-1.8V44.5z" />
        <path d="M127.5,43.8c-0.3-0.3-0.5-0.7-0.5-1.2c0-0.7,0.3-1.1,0.7-1.4c0.5-0.4,1.3-0.6,2.2-0.6c1,0,1.8,0.1,2.8,0.7l-0.5,1.1c-0.8-0.4-1.5-0.6-2.2-0.6c-0.6,0-1.1,0.1-1.4,0.3c-0.1,0.1-0.2,0.3-0.2,0.5c0,0.2,0.1,0.3,0.2,0.4c0.2,0.1,0.5,0.2,0.7,0.2l1.4,0.2c0.8,0.1,1.4,0.4,1.9,0.8c0.3,0.3,0.5,0.7,0.5,1.3c0,0.8-0.3,1.3-0.8,1.6c-0.6,0.4-1.6,0.6-2.4,0.6c-1.2,0-1.8-0.2-2.8-0.6l0.4-1.1c0.9,0.4,1.6,0.5,2.4,0.5c0.9,0,1.3-0.1,1.7-0.4c0.1-0.1,0.2-0.3,0.2-0.5c0-0.2-0.1-0.4-0.2-0.5c-0.2-0.2-0.6-0.3-0.9-0.3l-1.5-0.3C128.5,44.4,127.9,44.2,127.5,43.8z" />
        <path d="M139.3,46.9c-0.5,0.5-1.2,0.8-2.1,0.8c-0.9,0-1.6-0.3-2.2-0.8c-0.5-0.6-0.9-1.3-0.9-2.3v-3.8h1.4v3.9c0,0.6,0.2,1,0.5,1.3c0.3,0.3,0.7,0.5,1.2,0.5c0.5,0,0.9-0.2,1.2-0.5c0.3-0.3,0.5-0.7,0.5-1.3v-3.9h1.4v3.8C140.2,45.5,139.9,46.3,139.3,46.9z" />
        <path d="M147,47.5h-5.3v-6.8h1.4v5.6h4V47.5z" />
        <path d="M157.8,40.7v6.8h-1.2l-3.8-4.6v4.6h-1.3v-6.8h1.2l3.8,4.7v-4.7H157.8z" />
        <path d="M163.4,40.7l3,6.8H165l-0.6-1.2H161l-0.5,1.2H159l3-6.8H163.4z M161.5,45.1h2.4l-1.2-3h-0.1L161.5,45.1z" />
        <path d="M166.3,40.7h6.3v1.2h-2.5v5.6h-0.3c0.3,0.2,0.4,0.5,0.4,0.8c0,0.4-0.1,0.7-0.4,0.9c-0.3,0.3-0.6,0.5-1,0.6l-0.3-0.5c0.2-0.1,0.4-0.3,0.5-0.5c0.1-0.2,0.2-0.4,0.2-0.6c0-0.4-0.2-0.6-0.5-0.7v-5.6h-2.5V40.7z" />
        <path d="M175.1,47.5h-1.3v-6.8h1.3V47.5z" />
        <path d="M182.4,41.6c0.7,0.7,1,1.6,1,2.5c0,1-0.4,1.8-1,2.5c-0.7,0.7-1.5,1.1-2.6,1.1c-1.1,0-2-0.4-2.7-1.1c-0.6-0.6-0.9-1.5-0.9-2.4c0-1,0.4-1.8,1-2.4c0.6-0.7,1.6-1.1,2.7-1.1C180.9,40.6,181.8,40.9,182.4,41.6z M178.2,45.7c0.4,0.4,1,0.7,1.6,0.7c0.6,0,1.2-0.3,1.6-0.7c0.4-0.4,0.6-0.9,0.6-1.6c0-0.7-0.2-1.3-0.6-1.7c-0.4-0.4-0.9-0.7-1.6-0.7c-0.6,0-1.2,0.2-1.6,0.7c-0.4,0.4-0.6,0.9-0.6,1.6C177.6,44.8,177.8,45.3,178.2,45.7z" />
        <path d="M191,40.7v6.8h-1.2l-3.8-4.6v4.6h-1.3v-6.8h1.2l3.8,4.7v-4.7H191z" />
        <path d="M196.6,40.7l3,6.8h-1.5l-0.6-1.2h-3.4l-0.5,1.2h-1.4l3-6.8H196.6z M194.7,45.1h2.4l-1.2-3h-0.1L194.7,45.1z" />
        <path d="M206.1,47.5h-5.3v-6.8h1.4v5.6h4V47.5z" />
        <path d="M213.7,40.7c1.2,0,2,0.4,2.7,1.1c0.6,0.6,0.9,1.4,0.9,2.4c0,1-0.4,1.9-1,2.5c-0.6,0.6-1.5,0.9-2.6,0.9H211v-6.8H213.7z M212.3,41.9v4.4h1.4c0.8,0,1.3-0.2,1.7-0.6c0.4-0.4,0.6-0.9,0.6-1.6c0-0.7-0.2-1.2-0.6-1.6c-0.4-0.4-0.9-0.6-1.7-0.6H212.3z" />
        <path d="M218.6,40.7h5.4V42h-4v1.4h3.6v1.2H220v1.7h4.1v1.2h-5.5V40.7z" />
        <path d="M230.6,40.7l2.3,3.3l2.2-3.3h1.4v6.8h-1.4v-4.7h0l-2,2.9h-0.5l-2-2.9h0v4.7h-1.3v-6.8H230.6z" />
        <path d="M242.1,40.7l3,6.8h-1.5l-0.6-1.2h-3.4l-0.5,1.2h-1.4l3-6.8H242.1z M240.2,45.1h2.4l-1.2-3h-0.1L240.2,45.1z" />
        <path d="M245,40.7h6.3v1.2h-2.5v5.6h-1.3v-5.6H245V40.7z" />
        <path d="M252.4,40.7h5.4V42h-4v1.4h3.6v1.2h-3.6v1.7h4.1v1.2h-5.5V40.7z" />
        <path d="M260.7,40.7L263,44l2.2-3.3h1.4v6.8h-1.4v-4.7h0l-2,2.9h-0.5l-2-2.9h0v4.7h-1.3v-6.8H260.7z" />
        <path d="M272.3,40.7l3,6.8h-1.5l-0.6-1.2h-3.4l-0.5,1.2h-1.4l3-6.8H272.3z M270.4,45.1h2.4l-1.2-3h-0.1L270.4,45.1z" />
        <path d="M275.2,40.7h6.3v1.2H279v5.6h-1.3v-5.6h-2.5V40.7z" />
        <path d="M283.9,47.5h-1.3v-6.8h1.3V47.5z" />
        <path d="M287.1,45.7c0.4,0.4,1,0.7,1.6,0.7c0.8,0,1.4-0.3,2-0.9l0.8,0.9c-0.9,0.9-1.6,1.2-2.8,1.2c-1.1,0-1.9-0.4-2.6-1c-0.7-0.6-1-1.5-1-2.6c0-1,0.4-1.9,1-2.5c0.6-0.6,1.5-1,2.6-1c1.2,0,2,0.3,2.8,1.2l-0.8,0.9c-0.6-0.6-1.2-0.9-2-0.9c-0.6,0-1.2,0.2-1.6,0.6c-0.4,0.4-0.7,1-0.7,1.7C286.5,44.8,286.7,45.4,287.1,45.7z" />
        <path d="M296.9,40.7l3,6.8h-1.5l-0.6-1.2h-3.4l-0.5,1.2h-1.4l3-6.8H296.9z M298,39.1c-0.1,0.4-0.4,0.6-0.7,0.8c-0.3,0.2-0.7,0.4-1.1,0.4c-0.4,0-0.8-0.1-1.1-0.4c-0.3-0.2-0.5-0.4-0.7-0.8l0.9-0.5c0.1,0.1,0.2,0.3,0.3,0.4c0.1,0.1,0.3,0.2,0.5,0.2c0.2,0,0.4-0.1,0.5-0.2c0.1-0.1,0.2-0.2,0.3-0.4L298,39.1z M295,45.1h2.4l-1.2-3h-0.1L295,45.1z" />
      </g>
    </svg>
  );
}

/**
 * Official Orizont 1993 Circular Seal & Concentric Rings + Floating Math Symbols
 * Recreated directly from the official LuminaMath Moldova poster for Grades II–VIII.
 */
export function OrizontPosterMedallion({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'sm'
      ? 'w-40 h-40'
      : size === 'lg'
      ? 'w-72 h-72 sm:w-80 sm:h-80'
      : 'w-56 h-56 sm:w-64 sm:h-64';

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Floating Playful Math Symbols (Grades II-VIII spirit) */}
      <svg
        viewBox="0 0 360 360"
        className="w-full max-w-[340px] sm:max-w-[380px] h-auto overflow-visible"
        aria-hidden="true"
      >
        {/* Top-left blue plus */}
        <g transform="translate(45, 55) rotate(-12)">
          <rect x="-3" y="-15" width="6" height="30" rx="3" fill="#1758A8" />
          <rect x="-15" y="-3" width="30" height="6" rx="3" fill="#1758A8" />
        </g>

        {/* Top-left yellow asterisk */}
        <g transform="translate(105, 42) rotate(18)">
          <rect x="-2.5" y="-14" width="5" height="28" rx="2.5" fill="#F5B316" />
          <rect
            x="-2.5"
            y="-14"
            width="5"
            height="28"
            rx="2.5"
            fill="#F5B316"
            transform="rotate(60)"
          />
          <rect
            x="-2.5"
            y="-14"
            width="5"
            height="28"
            rx="2.5"
            fill="#F5B316"
            transform="rotate(120)"
          />
        </g>

        {/* Top-right orange multiplication X */}
        <g transform="translate(278, 52) rotate(28)">
          <rect x="-3.5" y="-18" width="7" height="36" rx="3.5" fill="#EB5A24" />
          <rect x="-18" y="-3.5" width="36" height="7" rx="3.5" fill="#EB5A24" />
        </g>

        {/* Top-right blue small plus */}
        <g transform="translate(322, 78)">
          <rect x="-2.5" y="-11" width="5" height="22" rx="2.5" fill="#1758A8" />
          <rect x="-11" y="-2.5" width="22" height="5" rx="2.5" fill="#1758A8" />
        </g>

        {/* Left solid orange triangle */}
        <polygon
          points="42,102 68,118 38,132"
          fill="#EB5A24"
          stroke="#EB5A24"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Right yellow hollow triangle */}
        <polygon
          points="296,98 316,125 284,122"
          fill="none"
          stroke="#F5B316"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Mid-left large orange plus */}
        <g transform="translate(42, 192)">
          <rect x="-4" y="-18" width="8" height="36" rx="4" fill="#EB5A24" />
          <rect x="-18" y="-4" width="36" height="8" rx="4" fill="#EB5A24" />
        </g>

        {/* Bottom-left blue triangle */}
        <polygon
          points="25,248 48,232 45,260"
          fill="#1758A8"
          stroke="#1758A8"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Bottom-left orange X */}
        <g transform="translate(92, 282) rotate(40)">
          <rect x="-3" y="-12" width="6" height="24" rx="3" fill="#EB5A24" />
          <rect x="-12" y="-3" width="24" height="6" rx="3" fill="#EB5A24" />
        </g>

        {/* Bottom blue X */}
        <g transform="translate(150, 322) rotate(22)">
          <rect x="-3" y="-14" width="6" height="28" rx="3" fill="#1758A8" />
          <rect x="-14" y="-3" width="28" height="6" rx="3" fill="#1758A8" />
        </g>

        {/* Bottom-right large hollow orange triangle */}
        <polygon
          points="296,245 330,266 292,286"
          fill="none"
          stroke="#EB5A24"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Right division slash */}
        <line
          x1="315"
          y1="210"
          x2="332"
          y2="182"
          stroke="#1758A8"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="170"
          y1="42"
          x2="184"
          y2="20"
          stroke="#EB5A24"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="205"
          y1="30"
          x2="230"
          y2="38"
          stroke="#1758A8"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Decorative Confetti Dots */}
        <circle cx="75" cy="84" r="4" fill="#F5B316" />
        <circle cx="145" cy="48" r="3.5" fill="#1758A8" />
        <circle cx="246" cy="68" r="4" fill="#1758A8" />
        <circle cx="332" cy="146" r="4.5" fill="#EB5A24" />
        <circle cx="66" cy="242" r="4" fill="#1758A8" />
        <circle cx="118" cy="312" r="4.5" fill="#F5B316" />
        <circle cx="222" cy="315" r="4" fill="#1758A8" />
        <circle cx="268" cy="296" r="5" fill="#F5B316" />
        <circle cx="338" cy="236" r="4" fill="#1758A8" />

        {/* CONCENTRIC RINGS (Yellow Outer -> Blue Middle -> Orange Inner -> White Core) */}
        <circle cx="180" cy="180" r="108" fill="#F5B316" />
        <circle cx="180" cy="180" r="95" fill="#1758A8" />
        <circle cx="180" cy="180" r="81" fill="#EB5A24" />
        <circle cx="180" cy="180" r="67" fill="#FFFFFF" />

        {/* Inner Orizont 1993 Official Emblem */}
        <circle
          cx="180"
          cy="180"
          r="62"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* Circular Curved Text Paths for Liceul Teoretic Orizont */}
        <defs>
          <path
            id="orizontTopArc"
            d="M 129,180 A 51,51 0 1,1 231,180"
          />
          <path
            id="orizontBottomArc"
            d="M 231,180 A 51,51 0 1,1 129,180"
          />
        </defs>
        <text
          fill="#0F172A"
          fontSize="6.6"
          fontWeight="800"
          letterSpacing="0.7"
        >
          <textPath href="#orizontTopArc" startOffset="50%" textAnchor="middle">
            INSTITUȚIA PRIVATĂ DE ÎNVĂȚĂMÂNT
          </textPath>
        </text>
        <text
          fill="#0F172A"
          fontSize="6.8"
          fontWeight="900"
          letterSpacing="0.8"
        >
          <textPath href="#orizontBottomArc" startOffset="50%" textAnchor="middle">
            LICEUL TEORETIC „ORIZONT”
          </textPath>
        </text>

        {/* Stylized Student/Torch Figure + 1993 inside Orizont Seal */}
        <circle cx="177" cy="154" r="9.5" fill="#1758A8" />
        <path
          d="M160,152 C167,168 172,184 176,204 C172,186 164,170 156,158 Z"
          fill="#D92D20"
        />
        <path
          d="M196,150 C186,166 181,182 177,204 C183,186 190,170 201,156 Z"
          fill="#D92D20"
        />
        {/* Blue book waves at bottom of emblem */}
        <path
          d="M150,196 Q180,214 210,194"
          fill="none"
          stroke="#1758A8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M154,202 Q180,219 206,200"
          fill="none"
          stroke="#1758A8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text
          x="196"
          y="186"
          fill="#0F172A"
          fontSize="9.5"
          fontWeight="900"
          textAnchor="middle"
        >
          1993
        </text>
      </svg>
      <span className="sr-only {dim}">Liceul Teoretic Orizont 1993</span>
    </div>
  );
}
