"use client";

import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkflowGraph, WorkflowNodeData } from "@/lib/types";
import { nodeFromPalette } from "@/lib/workflow/nodes";
import { HakiNode } from "./HakiNode";
import { NodePanel } from "./NodePanel";
import { NodePalette, parsePaletteDrag } from "./NodePalette";

const nodeTypes = { haki: HakiNode };

function asFlowNodes(nodes?: WorkflowGraph["nodes"] | null): Node[] {
  return (nodes ?? []).map((node, index) => ({
    ...node,
    type: node.type || "haki",
    position: node.position ?? { x: 80, y: 40 + index * 120 },
    data: node.data ?? { type: "action", label: "Step" },
  }));
}

function dropPoint(event?: { clientX?: number; clientY?: number; nativeEvent?: { clientX?: number; clientY?: number } }) {
  const x = event?.clientX ?? event?.nativeEvent?.clientX;
  const y = event?.clientY ?? event?.nativeEvent?.clientY;
  if (typeof x !== "number" || typeof y !== "number") return null;
  return { x, y };
}

export function WorkflowCanvas({
  value,
  onChange,
  goal,
}: {
  value: WorkflowGraph;
  onChange: (graph: WorkflowGraph) => void;
  goal?: string;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner value={value} onChange={onChange} goal={goal} />
    </ReactFlowProvider>
  );
}

function CanvasInner({
  value,
  onChange,
}: {
  value: WorkflowGraph;
  onChange: (graph: WorkflowGraph) => void;
  goal?: string;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(asFlowNodes(value.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState((value.edges ?? []) as Edge[]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setNodes(asFlowNodes(value.nodes));
    setEdges((value.edges ?? []) as Edge[]);
  }, [value, setNodes, setEdges]);

  const emit = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      onChange({
        name: value.name,
        nodes: nextNodes as WorkflowGraph["nodes"],
        edges: nextEdges as WorkflowGraph["edges"],
      });
    },
    [onChange, value.name],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => {
        const next = addEdge({ ...connection, id: `${connection.source}-${connection.target}` }, current);
        emit(nodes, next);
        return next;
      });
    },
    [emit, nodes, setEdges],
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selected),
    [nodes, selected],
  );

  return (
    <div className="flex h-full min-h-[560px] overflow-hidden rounded-[16px] border border-line bg-[linear-gradient(180deg,#f7f7fa_0%,#eef0f5_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div
        ref={wrapper}
        className="relative min-w-0 flex-1"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          event.preventDefault();
          const item = parsePaletteDrag(event);
          const point = dropPoint(event);
          if (!item || !point) return;
          const position = screenToFlowPosition(point);
          const nextNodes = [...nodes, nodeFromPalette(item, position)];
          setNodes(nextNodes);
          emit(nextNodes, edges);
        }}
      >
        <NodePalette />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
          }}
          onNodeDragStop={() => emit(getNodes(), getEdges())}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            setTimeout(() => emit(nodes, edges), 0);
          }}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelected(node.id)}
          nodeTypes={nodeTypes}
          fitView
          zoomOnScroll={false}
          preventScrolling={false}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#c7c7cc", strokeWidth: 1.6 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#c7c7cc", width: 16, height: 16 },
          }}
          className="haki-flow"
        >
          <Background gap={22} size={1.2} color="#d2d2d7" />
          <MiniMap
            pannable
            zoomable
            className="!overflow-hidden !rounded-[12px] !border !border-line !bg-white/90 !shadow-[0_8px_20px_rgba(29,29,31,0.08)]"
            maskColor="rgba(242,242,247,0.72)"
          />
          <Controls
            showInteractive={false}
            className="!overflow-hidden !rounded-[12px] !border !border-line !bg-white/90 !shadow-[0_8px_20px_rgba(29,29,31,0.08)]"
          />
        </ReactFlow>
      </div>
      {selectedNode ? (
        <NodePanel
          nodeId={selectedNode.id}
          data={selectedNode.data as WorkflowNodeData}
          onClose={() => setSelected(null)}
          onChange={(id, data) => {
            const nextNodes = nodes.map((node) => (node.id === id ? { ...node, data } : node));
            setNodes(nextNodes);
            emit(nextNodes, edges);
          }}
        />
      ) : null}
    </div>
  );
}
