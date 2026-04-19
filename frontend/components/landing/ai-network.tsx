'use client'

import { useEffect, useRef } from 'react'

interface Node { x: number; y: number }
interface Edge { from: number; to: number }

const NODES: Node[] = [
  { x: 10,  y: 20  },
  { x: 28,  y: 55  },
  { x: 15,  y: 80  },
  { x: 42,  y: 10  },
  { x: 50,  y: 40  },
  { x: 60,  y: 70  },
  { x: 75,  y: 20  },
  { x: 80,  y: 55  },
  { x: 90,  y: 30  },
  { x: 88,  y: 80  },
  { x: 35,  y: 90  },
  { x: 65,  y: 92  },
]

const EDGES: Edge[] = [
  { from: 0, to: 3 }, { from: 0, to: 1 }, { from: 1, to: 4 },
  { from: 1, to: 2 }, { from: 2, to: 10 }, { from: 3, to: 4 },
  { from: 3, to: 6 }, { from: 4, to: 5 }, { from: 4, to: 7 },
  { from: 5, to: 11 }, { from: 6, to: 8 }, { from: 6, to: 7 },
  { from: 7, to: 9 }, { from: 7, to: 8 }, { from: 9, to: 11 },
  { from: 10, to: 11 },
]

export function AINetworkBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-[0.18] dark:opacity-[0.22]"
      >
        <defs>
          {/* Pulse gradient travels along a path */}
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1AFF5C" stopOpacity="1" />
            <stop offset="100%" stopColor="#1AFF5C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Edges */}
        {EDGES.map((e, i) => {
          const a = NODES[e.from]
          const b = NODES[e.to]
          const len = Math.hypot(b.x - a.x, b.y - a.y)
          return (
            <g key={i}>
              {/* Static edge */}
              <line
                x1={a.x} y1={a.y}
                x2={b.x} y2={b.y}
                stroke="#1AFF5C"
                strokeWidth="0.18"
                strokeOpacity="0.4"
              />
              {/* Data pulse dot travelling along the edge */}
              <circle r="0.6" fill="#1AFF5C">
                <animateMotion
                  dur={`${3 + (i % 4)}s`}
                  repeatCount="indefinite"
                  begin={`${(i * 0.7).toFixed(1)}s`}
                >
                  <mpath href={`#edge-path-${i}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur={`${3 + (i % 4)}s`}
                  repeatCount="indefinite"
                  begin={`${(i * 0.7).toFixed(1)}s`}
                />
              </circle>
              {/* Hidden path for animateMotion */}
              <path
                id={`edge-path-${i}`}
                d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                fill="none"
                stroke="none"
              />
            </g>
          )
        })}

        {/* Nodes */}
        {NODES.map((n, i) => (
          <g key={i}>
            {/* Outer pulse ring */}
            <circle cx={n.x} cy={n.y} r="1.8" fill="#1AFF5C" opacity="0.15">
              <animate
                attributeName="r"
                values="1.8;3;1.8"
                dur={`${2.5 + (i % 3) * 0.8}s`}
                repeatCount="indefinite"
                begin={`${(i * 0.3).toFixed(1)}s`}
              />
              <animate
                attributeName="opacity"
                values="0.15;0;0.15"
                dur={`${2.5 + (i % 3) * 0.8}s`}
                repeatCount="indefinite"
                begin={`${(i * 0.3).toFixed(1)}s`}
              />
            </circle>
            {/* Core dot */}
            <circle cx={n.x} cy={n.y} r="0.9" fill="#1AFF5C">
              <animate
                attributeName="opacity"
                values="0.7;1;0.7"
                dur={`${2 + (i % 5) * 0.5}s`}
                repeatCount="indefinite"
                begin={`${(i * 0.2).toFixed(1)}s`}
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  )
}
