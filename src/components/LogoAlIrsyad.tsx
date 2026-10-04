import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const LogoAlIrsyad: React.FC<LogoProps> = ({ className = "w-full h-full", ...props }) => {
  return (
    <svg
      viewBox="0 0 1000 680"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Path for text on left ribbon */}
        <path
          id="leftRibbonPath"
          d="M 330 190 C 270 230 255 340 310 470 C 350 550 430 615 490 645"
          fill="none"
        />
        {/* Path for text on right ribbon */}
        <path
          id="rightRibbonPath"
          d="M 670 190 C 730 230 745 340 690 470 C 650 550 570 615 510 645"
          fill="none"
        />
      </defs>

      {/* BACKGROUND SHADOW / BASE */}
      <g id="wings">
        {/* LEFT WING FEATHERS */}
        {/* Feather 1 (Top) */}
        <path
          d="M 25 230 L 280 230 C 260 255 240 265 200 270 L 40 270 C 28 270 20 255 25 230 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 2 */}
        <path
          d="M 50 282 L 230 282 C 205 310 180 320 150 324 L 70 324 C 55 324 45 305 50 282 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 3 */}
        <path
          d="M 75 336 L 200 336 C 180 365 155 375 130 378 L 95 378 C 80 378 72 360 75 336 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 4 */}
        <path
          d="M 105 390 L 195 390 C 180 418 160 428 140 432 L 125 432 C 112 432 103 415 105 390 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 5 (Bottom) */}
        <path
          d="M 145 444 L 210 444 C 200 470 185 480 170 484 L 160 484 C 148 484 142 468 145 444 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Left Wing connecting base */}
        <path
          d="M 24 230 C 10 230 5 245 10 260 C 25 330 95 445 220 515 C 235 525 260 530 290 535 L 290 230 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="8"
        />
        {/* Left feather separator cutouts */}
        <path d="M 28 276 L 260 276" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 52 330 L 235 330" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 78 384 L 215 384" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 112 438 L 220 438" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 152 492 L 230 492" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />

        {/* RIGHT WING FEATHERS (Symmetrical) */}
        {/* Feather 1 (Top) */}
        <path
          d="M 975 230 L 720 230 C 740 255 760 265 800 270 L 960 270 C 972 270 980 255 975 230 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 2 */}
        <path
          d="M 950 282 L 770 282 C 795 310 820 320 850 324 L 930 324 C 945 324 955 305 950 282 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 3 */}
        <path
          d="M 925 336 L 800 336 C 820 365 845 375 870 378 L 905 378 C 920 378 928 360 925 336 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 4 */}
        <path
          d="M 895 390 L 805 390 C 820 418 840 428 860 432 L 875 432 C 888 432 897 415 895 390 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Feather 5 (Bottom) */}
        <path
          d="M 855 444 L 790 444 C 800 470 815 480 830 484 L 840 484 C 852 484 858 468 855 444 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="6"
        />
        {/* Right Wing connecting base */}
        <path
          d="M 976 230 C 990 230 995 245 990 260 C 975 330 905 445 780 515 C 765 525 740 530 710 535 L 710 230 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="8"
        />
        {/* Right feather separator cutouts */}
        <path d="M 972 276 L 740 276" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 948 330 L 765 330" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 922 384 L 785 384" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 888 438 L 780 438" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 848 492 L 770 492" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
      </g>

      {/* TOP CREST DOME / RAYS */}
      <g id="topCrest">
        {/* Top Dome Leaf Silhouette */}
        <path
          d="M 500 20 C 510 50 630 110 630 235 C 630 250 600 260 500 260 C 400 260 370 250 370 235 C 370 110 490 50 500 20 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="10"
        />
        {/* Inner Dome Border */}
        <path
          d="M 500 38 C 508 65 612 120 612 230 C 580 242 535 248 500 248 C 465 248 420 242 388 230 C 388 120 492 65 500 38 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="4"
        />
        {/* Radiating Light Flame Rays */}
        {/* Center Ray */}
        <path d="M 500 48 L 500 100" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        {/* Left Rays */}
        <path d="M 488 52 C 480 80 475 95 470 120" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M 470 65 C 460 90 450 110 442 140" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M 450 82 C 435 110 422 135 415 165" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M 432 108 C 415 135 402 165 395 195" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        {/* Right Rays */}
        <path d="M 512 52 C 520 80 525 95 530 120" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M 530 65 C 540 90 550 110 558 140" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M 550 82 C 565 110 578 135 585 165" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <path d="M 568 108 C 585 135 598 165 605 195" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* MAIN HEART EMBLEM */}
      <g id="mainHeart">
        {/* Outer Heart Silhouette */}
        <path
          d="M 500 170 
             C 525 125 580 105 650 115 
             C 725 125 765 185 765 270 
             C 765 375 660 520 500 660 
             C 340 520 235 375 235 270 
             C 235 185 275 125 350 115 
             C 420 105 475 125 500 170 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="12"
        />

        {/* Second Inner Line for Heart */}
        <path
          d="M 500 185 
             C 522 142 575 122 640 132 
             C 710 142 748 195 748 275 
             C 748 370 648 505 500 638 
             C 352 505 252 370 252 275 
             C 252 195 290 142 360 132 
             C 425 122 478 142 500 185 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="4"
        />

        {/* Inner Shield Boundary */}
        <path
          d="M 500 230 
             C 520 190 560 170 615 180 
             C 670 190 705 235 705 300 
             C 705 385 615 500 500 595 
             C 385 500 295 385 295 300 
             C 295 235 330 190 385 180 
             C 440 170 480 190 500 230 Z"
          fill="#06511a"
          stroke="#ffffff"
          strokeWidth="8"
        />
      </g>

      {/* TEXT ON HEART BANNERS */}
      {/* Left Ribbon: AL-IRSYAD AL-ISLAMIYYAH */}
      <text
        fill="#ffffff"
        fontSize="25"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="2"
      >
        <textPath href="#leftRibbonPath" startOffset="5%">
          AL-IRSYAD AL-ISLAMIYYAH
        </textPath>
      </text>

      {/* Right Ribbon: ١٣٣٢ and Arabic text */}
      <text
        fill="#ffffff"
        fontSize="28"
        fontWeight="bold"
        fontFamily="'Traditional Arabic', 'Amiri', 'Arial', sans-serif"
        direction="rtl"
      >
        <textPath href="#rightRibbonPath" startOffset="8%">
          ١٣٣٢  جامعية الإصلاح الإسلامية
        </textPath>
      </text>

      {/* FLAMING TORCH AT TOP CENTER */}
      <g id="torch">
        {/* Red Flame */}
        <path
          d="M 500 100 
             C 490 120 480 135 480 150 
             C 480 165 490 175 495 190 
             C 485 180 475 168 472 155 
             C 468 140 475 125 465 110 
             C 460 125 455 140 458 158 
             C 462 178 480 198 500 205 
             C 520 198 538 178 542 158 
             C 545 140 540 125 535 110 
             C 525 125 532 140 528 155 
             C 525 168 515 180 505 190 
             C 510 175 520 165 520 150 
             C 520 135 510 120 500 100 Z"
          fill="#dc2626"
        />
        {/* White Torch Cup */}
        <path
          d="M 465 208 L 535 208 L 520 230 L 480 230 Z"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="3"
        />
      </g>

      {/* INNER SHIELD CONTENT */}
      {/* 1. TWO STACKED BOOKS */}
      <g id="books">
        {/* UPPER BOOK */}
        {/* Left page */}
        <path
          d="M 370 280 Q 435 285 500 295 L 500 330 Q 435 320 370 315 Z"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="4"
        />
        {/* Right page */}
        <path
          d="M 630 280 Q 565 285 500 295 L 500 330 Q 565 320 630 315 Z"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="4"
        />
        {/* Lines on Upper Book Left Page */}
        <path d="M 385 292 Q 435 296 480 302" stroke="#06511a" strokeWidth="3" strokeLinecap="round" />
        <path d="M 388 302 Q 435 306 480 312" stroke="#06511a" strokeWidth="3" strokeLinecap="round" />
        {/* Arabic letter 'ق' on Upper Book Right Page */}
        <text
          x="585"
          y="312"
          fill="#06511a"
          fontSize="24"
          fontWeight="bold"
          fontFamily="'Traditional Arabic', 'Amiri', serif"
          textAnchor="middle"
        >
          ق
        </text>

        {/* LOWER BOOK */}
        {/* Left page */}
        <path
          d="M 370 340 Q 435 345 500 355 L 500 390 Q 435 380 370 375 Z"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="4"
        />
        {/* Right page */}
        <path
          d="M 630 340 Q 565 345 500 355 L 500 390 Q 565 380 630 375 Z"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="4"
        />
        {/* Arabic letter 'ح' on Lower Book Left Page */}
        <text
          x="415"
          y="370"
          fill="#06511a"
          fontSize="24"
          fontWeight="bold"
          fontFamily="'Traditional Arabic', 'Amiri', serif"
          textAnchor="middle"
        >
          ح
        </text>
        {/* Lines on Lower Book Right Page */}
        <path d="M 520 362 Q 565 356 615 352" stroke="#06511a" strokeWidth="3" strokeLinecap="round" />
        <path d="M 520 372 Q 565 366 615 362" stroke="#06511a" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* 2. DIAMOND / RHOMBUS WITH LETTER 'ض' IN CENTER */}
      <g id="diamond">
        {/* Outer White Diamond */}
        <polygon
          points="500,285 555,340 500,395 445,340"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="6"
        />
        {/* Inner Green Diamond */}
        <polygon
          points="500,296 543,340 500,384 457,340"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="3"
        />
        {/* Arabic letter 'ض' in center */}
        <text
          x="500"
          y="352"
          fill="#06511a"
          fontSize="36"
          fontWeight="bold"
          fontFamily="'Traditional Arabic', 'Amiri', serif"
          textAnchor="middle"
        >
          ض
        </text>
      </g>

      {/* 3. COMB ("SISIR") CRESCENT WITH TEETH OF EQUALITY */}
      <g id="comb">
        {/* White Crescent Bar */}
        <path
          d="M 380 435 Q 500 480 620 435 L 620 450 Q 500 500 380 450 Z"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="2"
        />
        {/* Vertical Comb Teeth */}
        <line x1="410" y1="415" x2="410" y2="445" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="428" y1="415" x2="428" y2="448" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="446" y1="415" x2="446" y2="451" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="464" y1="415" x2="464" y2="455" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="482" y1="415" x2="482" y2="458" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="500" y1="415" x2="500" y2="460" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="518" y1="415" x2="518" y2="458" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="536" y1="415" x2="536" y2="455" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="554" y1="415" x2="554" y2="451" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="572" y1="415" x2="572" y2="448" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="590" y1="415" x2="590" y2="445" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* 4. HAND / FIST HOLDING TORCH FROM BELOW */}
      <g id="hand">
        {/* Vertical Torch Handle */}
        <rect x="494" y="460" width="12" height="70" fill="#ffffff" />
        {/* Stylized Fist / Hand Grasping Handle */}
        <path
          d="M 475 490 
             C 475 478 490 475 500 475 
             C 510 475 525 478 525 490 
             C 525 510 518 520 515 540 
             L 508 570 L 492 570 L 485 540 
             C 482 520 475 510 475 490 Z"
          fill="#ffffff"
          stroke="#06511a"
          strokeWidth="3"
        />
        {/* Fingers lines */}
        <line x1="478" y1="495" x2="522" y2="495" stroke="#06511a" strokeWidth="2.5" />
        <line x1="480" y1="507" x2="520" y2="507" stroke="#06511a" strokeWidth="2.5" />
        <line x1="482" y1="519" x2="518" y2="519" stroke="#06511a" strokeWidth="2.5" />
        {/* Thumb */}
        <path d="M 476 492 C 470 500 472 512 478 520" stroke="#06511a" strokeWidth="2.5" fill="none" />
      </g>

      {/* 5. BOTTOM POINT CHEVRONS */}
      <g id="bottomChevrons">
        <path d="M 470 590 L 500 625 L 530 590" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M 480 610 L 500 635 L 520 610" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export default LogoAlIrsyad;
