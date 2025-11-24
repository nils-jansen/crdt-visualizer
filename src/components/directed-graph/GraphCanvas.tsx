import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Vertex, Arc, Position } from '../../types/crdt';

interface GraphCanvasProps {
  vertices: Vertex[];
  arcs: Arc[];
  positions: Map<string, Position>;
  onPositionChange: (name: string, pos: Position) => void;
  onRemoveVertex: (name: string) => void;
  onRemoveArc: (from: string, to: string) => void;
  getOrCreatePosition: (name: string) => Position;
}

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 200;
const NODE_RADIUS = 20;

export function GraphCanvas({
  vertices,
  arcs,
  positions,
  onPositionChange,
  onRemoveVertex,
  onRemoveArc,
  getOrCreatePosition,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleMouseDown = useCallback((name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(name);
    setSelectedNode(name);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(NODE_RADIUS, Math.min(CANVAS_WIDTH - NODE_RADIUS, e.clientX - rect.left));
    const y = Math.max(NODE_RADIUS, Math.min(CANVAS_HEIGHT - NODE_RADIUS, e.clientY - rect.top));

    onPositionChange(dragging, { x, y });
  }, [dragging, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleDoubleClick = useCallback((name: string) => {
    onRemoveVertex(name);
    setSelectedNode(null);
  }, [onRemoveVertex]);

  const handleArcClick = useCallback((from: string, to: string) => {
    onRemoveArc(from, to);
  }, [onRemoveArc]);

  return (
    <div className="mb-4">
      <div className="text-xs text-slate-400 mb-2">
        Graph View (drag nodes, double-click to remove, click arcs to remove)
      </div>
      <svg
        ref={svgRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="bg-slate-800 rounded-lg border border-slate-700"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <marker
            id="arrowhead-hover"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {/* Render arcs */}
        <AnimatePresence>
          {arcs.map((arc) => {
            const fromPos = positions.get(arc.from) || getOrCreatePosition(arc.from);
            const toPos = positions.get(arc.to) || getOrCreatePosition(arc.to);

            // Calculate arrow endpoint (stop at node edge)
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const offsetX = (dx / dist) * (NODE_RADIUS + 5);
            const offsetY = (dy / dist) * (NODE_RADIUS + 5);

            return (
              <ArcLine
                key={arc.uuid}
                from={{ x: fromPos.x + offsetX * 0.5, y: fromPos.y + offsetY * 0.5 }}
                to={{ x: toPos.x - offsetX, y: toPos.y - offsetY }}
                onClick={() => handleArcClick(arc.from, arc.to)}
              />
            );
          })}
        </AnimatePresence>

        {/* Render vertices */}
        <AnimatePresence>
          {vertices.map((vertex) => {
            const pos = positions.get(vertex.name) || getOrCreatePosition(vertex.name);
            return (
              <VertexNode
                key={vertex.uuid}
                vertex={vertex}
                position={pos}
                isSelected={selectedNode === vertex.name}
                isDragging={dragging === vertex.name}
                onMouseDown={(e) => handleMouseDown(vertex.name, e)}
                onDoubleClick={() => handleDoubleClick(vertex.name)}
              />
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {vertices.length === 0 && (
          <text
            x={CANVAS_WIDTH / 2}
            y={CANVAS_HEIGHT / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="14"
          >
            No vertices yet
          </text>
        )}
      </svg>
    </div>
  );
}

interface VertexNodeProps {
  vertex: Vertex;
  position: Position;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

function VertexNode({ vertex, position, isSelected, isDragging, onMouseDown, onDoubleClick }: VertexNodeProps) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <circle
        cx={position.x}
        cy={position.y}
        r={NODE_RADIUS}
        fill={isSelected ? '#3b82f6' : '#1e40af'}
        stroke={isSelected ? '#60a5fa' : '#3b82f6'}
        strokeWidth="2"
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        className="transition-colors hover:fill-blue-500"
      />
      <text
        x={position.x}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        pointerEvents="none"
      >
        {vertex.name}
      </text>
    </motion.g>
  );
}

interface ArcLineProps {
  from: Position;
  to: Position;
  onClick: () => void;
}

function ArcLine({ from, to, onClick }: ArcLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.line
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      exit={{ pathLength: 0, opacity: 0 }}
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={isHovered ? '#ef4444' : '#64748b'}
      strokeWidth={isHovered ? 3 : 2}
      markerEnd={isHovered ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
      className="transition-colors"
    />
  );
}
