"use client";

const LorryAnimation = ({ trigger, stock = 0 }) => {
return (
<div className="lorry-scene">
{/* Animation header */}
<div className="lorry-scene__top">
<div>
<p className="lorry-scene__eyebrow">
SMARTSTOCK AI · LOGISTICS
</p>
<h3 className="lorry-scene__title">
Stock Movement
</h3>
</div>

    <span className="lorry-scene__stock">
      📦 {stock} units
    </span>
  </div>

  {/* Road and continuously moving lorry */}
  <div className="lorry-road">
    <div className="lorry-road__glow" />
    <div className="lorry-road__lane" />

    <div className="lorry-vehicle lorry-vehicle--moving">
      <svg
        viewBox="0 0 220 100"
        role="img"
        aria-label="Delivery lorry carrying inventory"
        className="lorry-vehicle__svg"
      >
        {/* Cargo section */}
        <rect
          x="8"
          y="17"
          width="130"
          height="52"
          rx="5"
          fill="#7c3aed"
        />
        <rect
          x="14"
          y="23"
          width="118"
          height="40"
          rx="3"
          fill="#a78bfa"
        />

        {/* Cargo boxes */}
        <rect
          x="22"
          y="29"
          width="29"
          height="27"
          rx="3"
          fill="#facc15"
        />
        <rect
          x="56"
          y="29"
          width="29"
          height="27"
          rx="3"
          fill="#22d3ee"
        />
        <rect
          x="90"
          y="29"
          width="29"
          height="27"
          rx="3"
          fill="#34d399"
        />

        {/* Box details */}
        <path
          d="M36 29 V56 M70 29 V56 M104 29 V56"
          stroke="#ffffff"
          strokeWidth="1.5"
          opacity=".65"
        />

        {/* Driver cabin facing right */}
        <path
          d="M138 37 L163 37 L190 55 L190 69 L138 69 Z"
          fill="#06b6d4"
        />

        {/* Window */}
        <path
          d="M151 42 L162 42 L180 55 L151 55 Z"
          fill="#e0f2fe"
        />

        {/* Bumper */}
        <rect
          x="187"
          y="61"
          width="9"
          height="8"
          rx="2"
          fill="#94a3b8"
        />

        {/* Rear wheel */}
        <circle
          cx="39"
          cy="73"
          r="13"
          fill="#020617"
          stroke="#94a3b8"
          strokeWidth="3"
        />
        <circle
          cx="39"
          cy="73"
          r="5"
          fill="#cbd5e1"
        />

        {/* Front wheel */}
        <circle
          cx="164"
          cy="73"
          r="13"
          fill="#020617"
          stroke="#94a3b8"
          strokeWidth="3"
        />
        <circle
          cx="164"
          cy="73"
          r="5"
          fill="#cbd5e1"
        />

        {/* Lights */}
        <rect
          x="191"
          y="57"
          width="6"
          height="7"
          rx="2"
          fill="#fef08a"
        />
        <rect
          x="139"
          y="62"
          width="5"
          height="8"
          rx="1"
          fill="#fb7185"
        />
      </svg>

      <span className="lorry-vehicle__label">
        STOCK
      </span>
    </div>

    <div className="lorry-road__arrow">→</div>
  </div>

  <p className="lorry-scene__caption">
    Your inventory is on the move...
  </p>

  <style jsx>{`
    .lorry-scene {
      width: 100%;
      overflow: hidden;
      border: 1px solid rgba(129, 140, 248, 0.22);
      border-radius: 20px;
      padding: 16px;
      color: #e2e8f0;
      background: linear-gradient(
        135deg,
        #0f172a,
        #111c3d 55%,
        #172554
      );
    }

    .lorry-scene__top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }

    .lorry-scene__eyebrow {
      color: #67e8f9;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.16em;
    }

    .lorry-scene__title {
      margin-top: 3px;
      font-size: 15px;
      font-weight: 700;
    }

    .lorry-scene__stock {
      border: 1px solid rgba(52, 211, 153, 0.3);
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.12);
      padding: 6px 10px;
      color: #a7f3d0;
      font-size: 11px;
    }

    .lorry-road {
      position: relative;
      height: 116px;
      overflow: hidden;
      border-radius: 14px;
      background: linear-gradient(
        180deg,
        #101b39 0%,
        #16254b 68%,
        #26364f 69%,
        #111827 100%
      );
    }

    .lorry-road__glow {
      position: absolute;
      right: 8%;
      bottom: 20px;
      width: 40%;
      height: 20px;
      border-radius: 50%;
      background: #6366f1;
      opacity: 0.2;
      filter: blur(18px);
    }

    .lorry-road__lane {
      position: absolute;
      right: 0;
      bottom: 23px;
      left: 0;
      height: 2px;
      background: repeating-linear-gradient(
        90deg,
        #cbd5e1 0 22px,
        transparent 22px 42px
      );
      background-size: 42px 2px;
      opacity: 0.65;
      animation: laneMove 0.65s linear infinite;
    }

    /* Lorry begins outside the left edge */
    .lorry-vehicle {
      position: absolute;
      top: 7px;
      left: -230px;
      width: 220px;
      will-change: left;
      filter: drop-shadow(
        0 8px 10px rgba(34, 211, 238, 0.18)
      );
    }

    /* Repeat continuously: left to right */
    .lorry-vehicle--moving {
      animation: driveRight 10s linear infinite;
    }

    .lorry-vehicle__svg {
      display: block;
      width: 100%;
      height: auto;
    }

    .lorry-vehicle__label {
      position: absolute;
      top: 38px;
      left: 52px;
      color: #1e293b;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.12em;
    }

    .lorry-road__arrow {
      position: absolute;
      right: 12px;
      bottom: 2px;
      color: #67e8f9;
      font-size: 18px;
      font-weight: 800;
    }

    .lorry-scene__caption {
      margin-top: 9px;
      color: #94a3b8;
      font-size: 11px;
    }

    @keyframes driveRight {
      from {
        left: -230px;
      }

      to {
        left: calc(100% + 230px);
      }
    }

    @keyframes laneMove {
      from {
        background-position: 0 0;
      }

      to {
        background-position: -42px 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .lorry-vehicle--moving,
      .lorry-road__lane {
        animation: none;
      }
    }
  `}</style>
</div>

);
};

export default LorryAnimation;