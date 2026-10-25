import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Network, 
  Activity, 
  Layers, 
  Zap, 
  Share2, 
  ShieldAlert,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ArrowRight,
  Filter,
  Eye,
  CheckCircle2,
  TrendingUp,
  Users
} from 'lucide-react';

export default function NetworksView({ onSelectAccount }) {
  const [networkData, setNetworkData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [riskCategoryFilter, setRiskCategoryFilter] = useState('ALL'); // ALL, SUSPICIOUS, MODERATE, LEGITIMATE
  const [topologyFilter, setTopologyFilter] = useState('ALL'); // ALL, STAR, CHAIN, FAN-OUT, FAN-IN
  const [minRiskScore, setMinRiskScore] = useState(0);

  // Canvas Viewport Transforms
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Hover Tooltip
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Dragging Node
  const [draggedNodeId, setDraggedNodeId] = useState(null);

  // Physics positions state ref
  const nodePositionsRef = useRef({});
  const canvasRef = useRef(null);

  // Fetch Network Graph Data
  const fetchNetworkGraph = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      setNetworkData(data);

      // Initialize node positions in a force/circle layout if not set
      if (data.nodes && data.nodes.length > 0) {
        const positions = {};
        const width = 800;
        const height = 500;
        const center = { x: width / 2, y: height / 2 };

        data.nodes.forEach((node, idx) => {
          const angle = (idx / data.nodes.length) * 2 * Math.PI;
          const radius = node.is_mule ? 140 + (idx % 3) * 40 : 220 + (idx % 4) * 30;
          positions[node.id] = {
            x: center.x + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
            y: center.y + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
            vx: 0,
            vy: 0
          };
        });

        nodePositionsRef.current = positions;

        const firstMule = data.nodes.find(n => n.is_mule) || data.nodes[0];
        setSelectedNode(firstMule);
      }
    } catch (err) {
      console.error('Failed to fetch network graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkGraph();
  }, []);

  // Filter Nodes & Edges
  const filteredNodes = useMemo(() => {
    if (!networkData || !networkData.nodes) return [];
    return networkData.nodes.filter(node => {
      if (riskCategoryFilter === 'SUSPICIOUS' && node.risk_score < 50) return false;
      if (riskCategoryFilter === 'MODERATE' && (node.risk_score < 25 || node.risk_score >= 50)) return false;
      if (riskCategoryFilter === 'LEGITIMATE' && node.risk_score >= 25) return false;

      if (topologyFilter !== 'ALL' && node.primary_topology !== topologyFilter) return false;

      if (node.risk_score < minRiskScore) return false;

      if (selectedClusterId && node.cluster_id !== selectedClusterId) return false;

      return true;
    });
  }, [networkData, riskCategoryFilter, topologyFilter, minRiskScore, selectedClusterId]);

  const filteredNodeIdSet = useMemo(() => {
    return new Set(filteredNodes.map(n => n.id));
  }, [filteredNodes]);

  const filteredEdges = useMemo(() => {
    if (!networkData || !networkData.edges) return [];
    return networkData.edges.filter(edge => {
      return filteredNodeIdSet.has(edge.source) && filteredNodeIdSet.has(edge.target);
    });
  }, [networkData, filteredNodeIdSet]);

  const connectedNodeIdSet = useMemo(() => {
    if (!selectedNode || !networkData || !networkData.edges) return new Set();
    const set = new Set([selectedNode.id]);
    networkData.edges.forEach(edge => {
      if (edge.source === selectedNode.id) set.add(edge.target);
      if (edge.target === selectedNode.id) set.add(edge.source);
    });
    return set;
  }, [selectedNode, networkData]);

  const maxEdgeAmount = useMemo(() => {
    if (!networkData || !networkData.edges || networkData.edges.length === 0) return 1.0;
    return Math.max(...networkData.edges.map(e => e.amount), 1.0);
  }, [networkData]);

  // HTML5 2D Canvas Physics & Rendering Loop (Clean Banking Palette)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const positions = nodePositionsRef.current;

      // Simple physics relaxation step
      filteredNodes.forEach((nodeA) => {
        const posA = positions[nodeA.id];
        if (!posA) return;

        filteredNodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return;
          const posB = positions[nodeB.id];
          if (!posB) return;

          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 90;

          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.05;
            posA.x += dx * force;
            posA.y += dy * force;
          }
        });
      });

      // 1. Draw Edges
      filteredEdges.forEach(edge => {
        const posSrc = positions[edge.source];
        const posTgt = positions[edge.target];
        if (!posSrc || !posTgt) return;

        const isSelectedEdge = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
        const isDimmed = selectedNode && !isSelectedEdge;

        const widthFactor = Math.max(1.2, Math.min(5.0, (edge.amount / maxEdgeAmount) * 5.0));

        ctx.beginPath();
        ctx.moveTo(posSrc.x, posSrc.y);
        ctx.lineTo(posTgt.x, posTgt.y);

        ctx.lineWidth = isSelectedEdge ? widthFactor + 1.5 : widthFactor;

        if (isDimmed) {
          ctx.strokeStyle = '#E2E8F0';
        } else if (isSelectedEdge) {
          ctx.strokeStyle = edge.is_suspicious ? '#D64545' : '#1565C0';
        } else if (edge.is_suspicious) {
          ctx.strokeStyle = 'rgba(214, 69, 69, 0.4)';
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        }

        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(posTgt.y - posSrc.y, posTgt.x - posSrc.x);
        const nodeRadius = 24;
        const arrowX = posTgt.x - nodeRadius * Math.cos(angle);
        const arrowY = posTgt.y - nodeRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - 9 * Math.cos(angle - Math.PI / 6),
          arrowY - 9 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - 9 * Math.cos(angle + Math.PI / 6),
          arrowY - 9 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = isDimmed ? '#CBD5E1' : (edge.is_suspicious ? '#D64545' : '#1565C0');
        ctx.fill();
      });

      // 2. Draw Nodes
      filteredNodes.forEach(node => {
        const pos = positions[node.id];
        if (!pos) return;

        const isSelected = selectedNode?.id === node.id;
        const isConnected = connectedNodeIdSet.has(node.id);
        const isDimmed = selectedNode && !isConnected;

        const radius = isSelected ? 24 : 20;

        // Selection aura
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 6, 0, 2 * Math.PI);
          ctx.fillStyle = node.risk_score >= 50 ? 'rgba(214, 69, 69, 0.2)' : 'rgba(21, 101, 192, 0.2)';
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);

        if (isDimmed) {
          ctx.fillStyle = '#F1F5F9';
          ctx.strokeStyle = '#CBD5E1';
        } else if (node.risk_score >= 50) {
          // RED (Suspicious Mule)
          ctx.fillStyle = '#D64545';
          ctx.strokeStyle = '#B42318';
        } else if (node.risk_score >= 25) {
          // AMBER (Moderate)
          ctx.fillStyle = '#D98B00';
          ctx.strokeStyle = '#B45309';
        } else {
          // BLUE/GREEN (Legitimate / Normal)
          ctx.fillStyle = '#1565C0';
          ctx.strokeStyle = '#0F2747';
        }

        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fill();
        ctx.stroke();

        // Node Account ID Label
        ctx.font = isSelected ? 'bold 10px sans-serif' : '9px sans-serif';
        ctx.fillStyle = isDimmed ? '#94A3B8' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, pos.x, pos.y - 3);

        // Node Risk Score Sublabel
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = isDimmed ? '#CBD5E1' : '#FFFFFF';
        ctx.fillText(node.risk_score.toFixed(1), pos.x, pos.y + 7);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [filteredNodes, filteredEdges, selectedNode, connectedNodeIdSet, pan, zoom, maxEdgeAmount]);

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const worldX = (clientX - pan.x) / zoom;
    const worldY = (clientY - pan.y) / zoom;

    const positions = nodePositionsRef.current;

    const hitNode = filteredNodes.find(node => {
      const pos = positions[node.id];
      if (!pos) return false;
      const dx = worldX - pos.x;
      const dy = worldY - pos.y;
      return Math.sqrt(dx * dx + dy * dy) <= 24;
    });

    if (hitNode) {
      setSelectedNode(hitNode);
      setDraggedNodeId(hitNode.id);
    } else {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    setMousePos({ x: clientX, y: clientY });

    if (draggedNodeId) {
      const worldX = (clientX - pan.x) / zoom;
      const worldY = (clientY - pan.y) / zoom;
      if (nodePositionsRef.current[draggedNodeId]) {
        nodePositionsRef.current[draggedNodeId].x = worldX;
        nodePositionsRef.current[draggedNodeId].y = worldY;
      }
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }

    const worldX = (clientX - pan.x) / zoom;
    const worldY = (clientY - pan.y) / zoom;
    const positions = nodePositionsRef.current;

    const hitNode = filteredNodes.find(node => {
      const pos = positions[node.id];
      if (!pos) return false;
      const dx = worldX - pos.x;
      const dy = worldY - pos.y;
      return Math.sqrt(dx * dx + dy * dy) <= 24;
    });

    setHoveredNode(hitNode || null);

    if (!hitNode) {
      const hitEdge = filteredEdges.find(edge => {
        const p1 = positions[edge.source];
        const p2 = positions[edge.target];
        if (!p1 || !p2) return false;

        const d1 = Math.sqrt((worldX - p1.x) ** 2 + (worldY - p1.y) ** 2);
        const d2 = Math.sqrt((worldX - p2.x) ** 2 + (worldY - p2.y) ** 2);
        const lineLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        return (d1 + d2) >= lineLen - 0.5 && (d1 + d2) <= lineLen + 2.5;
      });
      setHoveredEdge(hitEdge || null);
    } else {
      setHoveredEdge(null);
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(2.5, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev / 1.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedClusterId(null);
  };

  const handleFitToScreen = () => {
    setZoom(0.9);
    setPan({ x: 10, y: 10 });
  };

  const handleSelectCluster = (cluster) => {
    if (selectedClusterId === cluster.cluster_id) {
      setSelectedClusterId(null);
    } else {
      setSelectedClusterId(cluster.cluster_id);
      const firstInCluster = filteredNodes.find(n => n.cluster_id === cluster.cluster_id);
      if (firstInCluster) setSelectedNode(firstInCluster);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#D9E2EC] pb-6 gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] uppercase">
              GRAPH INTELLIGENCE
            </span>
            <span className="text-xs text-[#5B6B7A] font-mono">FINANCIAL CRIME ANALYTICS</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] mt-2 flex items-center gap-3">
            <Network className="w-7 h-7 text-[#1565C0]" />
            MULE NETWORKS & TRANSACTION TOPOLOGY
          </h1>
          <p className="text-xs text-[#5B6B7A] mt-1">
            Interactive graph analytics interface for visualizing multi-hop transaction topologies (Star, Chain, Fan-out, Fan-in) and identifying money mule clusters.
          </p>
        </div>
      </div>

      {/* Top Filter & Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
          {/* Risk Level Category Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-[#5B6B7A] uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#1565C0]" /> Risk:
            </span>
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'SUSPICIOUS', label: 'SUSPICIOUS / MULE', color: 'text-[#D64545] border-[#F87171] bg-[#FEF2F2]' },
              { id: 'MODERATE', label: 'MODERATE', color: 'text-[#D98B00] border-[#FDE68A] bg-[#FFFBEB]' },
              { id: 'LEGITIMATE', label: 'LEGITIMATE', color: 'text-[#168A5B] border-[#A8DADC] bg-[#E6F4EA]' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setRiskCategoryFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                  riskCategoryFilter === f.id
                    ? f.color || 'bg-[#1565C0] text-white border-[#1565C0]'
                    : 'bg-[#F5F7FA] text-[#5B6B7A] border-[#D9E2EC] hover:bg-[#EEF3F8]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Topology Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-[#5B6B7A] uppercase mr-1">Topology:</span>
            {['ALL', 'STAR', 'CHAIN', 'FAN-OUT', 'FAN-IN'].map(topo => (
              <button
                key={topo}
                onClick={() => setTopologyFilter(topo)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] font-mono border transition cursor-pointer ${
                  topologyFilter === topo
                    ? 'bg-[#1565C0] text-white border-[#1565C0]'
                    : 'bg-[#F5F7FA] text-[#5B6B7A] border-[#D9E2EC] hover:bg-[#EEF3F8]'
                }`}
              >
                {topo === 'ALL' ? 'ALL TOPOLOGIES' : topo}
              </button>
            ))}
          </div>
        </div>

        {/* Min Risk Score Slider & Canvas View Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#D9E2EC] text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider shrink-0">
              Min Risk Score: <span className="font-mono text-[#1565C0] font-bold">{minRiskScore}</span>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={minRiskScore}
              onChange={(e) => setMinRiskScore(Number(e.target.value))}
              className="w-48 accent-[#1565C0] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg bg-[#F5F7FA] text-[#0F2747] hover:bg-[#EEF3F8] border border-[#D9E2EC] cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg bg-[#F5F7FA] text-[#0F2747] hover:bg-[#EEF3F8] border border-[#D9E2EC] cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitToScreen}
              title="Fit to Screen"
              className="p-1.5 rounded-lg bg-[#F5F7FA] text-[#0F2747] hover:bg-[#EEF3F8] border border-[#D9E2EC] cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              title="Reset View"
              className="p-1.5 rounded-lg bg-[#F5F7FA] text-[#0F2747] hover:bg-[#EEF3F8] border border-[#D9E2EC] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph & Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive HTML5 Graph Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1565C0]" />
                <span>INTERACTIVE TRANSACTION GRAPH ({filteredNodes.length} NODES • {filteredEdges.length} EDGES)</span>
              </h3>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-bold font-mono">
                <span className="flex items-center gap-1 text-[#D64545]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D64545]"></span> Mule (&gt;=50)
                </span>
                <span className="flex items-center gap-1 text-[#D98B00]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D98B00]"></span> Moderate (25-49)
                </span>
                <span className="flex items-center gap-1 text-[#1565C0]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0]"></span> Normal (&lt;25)
                </span>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full h-[520px] bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] overflow-hidden cursor-grab active:cursor-grabbing">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#1565C0] animate-spin" />
                  <div className="text-xs text-[#5B6B7A] font-bold">Computing Graph Analytics & Topology...</div>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={520}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="w-full h-full block"
                />
              )}

              {/* Hover Tooltip Overlay for Node */}
              {hoveredNode && (
                <div
                  className="absolute pointer-events-none p-3 rounded-xl bg-white border border-[#D9E2EC] text-xs shadow-xl z-20 space-y-1 font-mono"
                  style={{ left: mousePos.x + 15, top: mousePos.y - 10 }}
                >
                  <div className="font-extrabold text-[#1565C0]">{hoveredNode.id}</div>
                  <div className="text-[#0F2747]">Risk Score: <span className="font-bold">{hoveredNode.risk_score}</span></div>
                  <div className="text-[#5B6B7A] text-[10px]">Topology: {hoveredNode.primary_topology}</div>
                  <div className="text-[#5B6B7A] text-[10px]">PageRank: {hoveredNode.pagerank}</div>
                </div>
              )}

              {/* Hover Tooltip Overlay for Edge */}
              {hoveredEdge && !hoveredNode && (
                <div
                  className="absolute pointer-events-none p-3 rounded-xl bg-white border border-[#D9E2EC] text-xs shadow-xl z-20 space-y-1 font-mono"
                  style={{ left: mousePos.x + 15, top: mousePos.y - 10 }}
                >
                  <div className="font-bold text-[#D98B00] flex items-center gap-1">
                    <span>{hoveredEdge.source}</span>
                    <ArrowRight className="w-3 h-3 text-[#5B6B7A]" />
                    <span>{hoveredEdge.target}</span>
                  </div>
                  <div className="text-[#0F2747] font-bold">Amount: ₹{hoveredEdge.amount.toLocaleString()}</div>
                  <div className="text-[#5B6B7A] text-[10px]">Transactions: {hoveredEdge.transactions}</div>
                  <div className="text-[#5B6B7A] text-[10px]">Last Date: {hoveredEdge.last_date}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#5B6B7A] font-mono pt-1">
              <span>Tip: Click any node to inspect details • Drag nodes to reposition • Scroll to zoom</span>
              <span>Line Thickness = Transaction Volume (₹)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Node Panel */}
        <div className="lg:col-span-4 space-y-6">
          {selectedNode ? (
            <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                <div>
                  <span className="text-[10px] text-[#5B6B7A] font-bold uppercase">SELECTED NODE</span>
                  <div className="text-xl font-extrabold text-[#1565C0] font-mono mt-0.5">{selectedNode.id}</div>
                </div>

                <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
                  selectedNode.risk_score >= 50
                    ? 'bg-[#FEF2F2] text-[#B42318] border border-[#B42318]'
                    : selectedNode.risk_score >= 25
                    ? 'bg-[#FFFBEB] text-[#D98B00] border border-[#FDE68A]'
                    : 'bg-[#E6F4EA] text-[#168A5B] border border-[#A8DADC]'
                }`}>
                  {selectedNode.classification}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Risk Score</div>
                  <div className="text-xl font-extrabold text-[#0F2747] mt-1">{selectedNode.risk_score} <span className="text-[10px] text-[#7A8896] font-normal">/ 100</span></div>
                </div>

                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Mule Probability</div>
                  <div className="text-xl font-extrabold text-[#1565C0] mt-1">{(selectedNode.probability * 100).toFixed(1)}%</div>
                </div>

                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">PageRank</div>
                  <div className="text-base font-bold text-[#0F2747] mt-1">{selectedNode.pagerank}</div>
                </div>

                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC]">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Degree (In/Out)</div>
                  <div className="text-base font-bold text-[#0F2747] mt-1">
                    <span className="text-[#1565C0]">{selectedNode.in_degree}</span> / <span className="text-[#D98B00]">{selectedNode.out_degree}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#D9E2EC] col-span-2">
                  <div className="text-[10px] text-[#5B6B7A] font-sans uppercase font-bold">Transaction Volume Flow</div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="text-[#168A5B] font-bold">In: ₹{selectedNode.incoming_amount?.toLocaleString() ?? 0}</span>
                    <span className="text-[#D64545] font-bold">Out: ₹{selectedNode.outgoing_amount?.toLocaleString() ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Detected Topology & Explanation */}
              <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#D9E2EC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#5B6B7A] uppercase tracking-wider">DETECTED TOPOLOGY</span>
                  <span className="px-2.5 py-0.5 rounded bg-[#EEF3F8] text-[#1565C0] border border-[#D9E2EC] text-[10px] font-bold font-mono">
                    {selectedNode.primary_topology}
                  </span>
                </div>
                <p className="text-xs text-[#0F2747] leading-relaxed font-sans font-medium">
                  {selectedNode.topology_explanation}
                </p>
              </div>

              {/* Inspect in Drishthi Button */}
              <button
                onClick={() => onSelectAccount && onSelectAccount(selectedNode.id)}
                className="w-full py-3 rounded-xl bg-[#1565C0] hover:bg-[#0F2747] text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>INSPECT IN DRISHTHI</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-[#D9E2EC] text-center text-xs text-[#5B6B7A] shadow-2xs">
              Select any node on the network graph to inspect relationship metrics.
            </div>
          )}
        </div>
      </div>

      {/* Mule Network Clusters Section */}
      {networkData?.clusters && networkData.clusters.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1565C0]" />
              <span>DETECTED MULE NETWORK CLUSTERS ({networkData.clusters.length})</span>
            </h3>
            <span className="text-[10px] text-[#5B6B7A] font-mono">WEAKLY CONNECTED GRAPH COMPONENTS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {networkData.clusters.map((cluster) => {
              const isSelectedCluster = selectedClusterId === cluster.cluster_id;
              return (
                <div
                  key={cluster.cluster_id}
                  onClick={() => handleSelectCluster(cluster)}
                  className={`p-4 rounded-xl border transition cursor-pointer space-y-3 ${
                    isSelectedCluster
                      ? 'bg-[#EEF3F8] border-[#1565C0] shadow-sm'
                      : 'bg-[#F5F7FA] border-[#D9E2EC] hover:border-[#1565C0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1565C0]">{cluster.cluster_id}</span>
                    <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D98B00] border border-[#FDE68A] text-[9px] font-bold font-mono">
                      {cluster.primary_topology}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-white border border-[#D9E2EC]">
                      <div className="text-[9px] text-[#5B6B7A] font-sans">Accounts</div>
                      <div className="font-bold text-[#0F2747] mt-0.5">{cluster.node_count}</div>
                    </div>

                    <div className="p-2 rounded bg-white border border-[#D9E2EC]">
                      <div className="text-[9px] text-[#5B6B7A] font-sans">Edges</div>
                      <div className="font-bold text-[#1565C0] mt-0.5">{cluster.edge_count}</div>
                    </div>

                    <div className="p-2 rounded bg-white border border-[#D9E2EC]">
                      <div className="text-[9px] text-[#5B6B7A] font-sans">Mules</div>
                      <div className="font-bold text-[#D64545] mt-0.5">{cluster.suspicious_count}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Network Summary Statistics Footer */}
      {networkData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#D9E2EC] text-center space-y-1 shadow-2xs">
            <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Total Accounts</div>
            <div className="text-2xl font-extrabold font-mono text-[#0F2747]">{networkData.summary.total_accounts}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#D9E2EC] text-center space-y-1 shadow-2xs">
            <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Suspicious Mules</div>
            <div className="text-2xl font-extrabold font-mono text-[#D64545]">{networkData.summary.suspicious_accounts}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#D9E2EC] text-center space-y-1 shadow-2xs">
            <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Legitimate Accounts</div>
            <div className="text-2xl font-extrabold font-mono text-[#168A5B]">{networkData.summary.legitimate_accounts}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#D9E2EC] text-center space-y-1 shadow-2xs">
            <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Total Connections</div>
            <div className="text-2xl font-extrabold font-mono text-[#1565C0]">{networkData.summary.total_connections}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#D9E2EC] text-center space-y-1 shadow-2xs">
            <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Suspicious Edges</div>
            <div className="text-2xl font-extrabold font-mono text-[#D98B00]">{networkData.summary.suspicious_connections}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#D9E2EC] text-center space-y-1 shadow-2xs">
            <div className="text-[10px] text-[#5B6B7A] font-bold uppercase">Mule Networks</div>
            <div className="text-2xl font-extrabold font-mono text-[#1565C0]">{networkData.summary.detected_mule_networks}</div>
          </div>
        </div>
      )}
    </div>
  );
}
