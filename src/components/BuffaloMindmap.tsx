import React, { useRef, useEffect, useState } from 'react';
import Tree from 'react-d3-tree';

// Convert the generated buffalo node structure to react-d3-tree format
function convert(node: any) {
  return {
    name: node.name,
    attributes: {
      born: node.born,
      milkStarts: node.milkStarts,
      totalChildren: node.totalChildren,
    },
    children: (node.children || []).map((c: any) => convert(c)),
  };
}

const BuffaloMindmap: React.FC<{ rootNode: any }> = ({ rootNode }) => {
  const treeData = [convert(rootNode)];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const translate = { x: 300, y: 100 };
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [showHover, setShowHover] = useState(false);

  useEffect(() => {
    // nothing for now
  }, []);

  const handleNodeMouseEnter = (nodeDatum: any, event: any) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
    setHoveredNode(nodeDatum);
    setShowHover(true);
  };

  const handleNodeMouseLeave = () => {
    setShowHover(false);
    setHoveredNode(null);
  };

  const renderCustomNodeElement = ({ nodeDatum, toggleNode }: any) => {
    const hasChildren = nodeDatum.attributes?.totalChildren > 0;
    const nodeColor = hasChildren ? '#10b981' : '#9ca3af'; // Green for parents, grey for childless
    const textColor = hasChildren ? '#065f46' : '#4b5563';
    
    // Extract year from milkStarts (e.g., "Jan-2026" -> "2026")
    const milkYear = nodeDatum.attributes?.milkStarts?.split('-')[1] || '';
    
    return (
      <g>
        {/* Node circle */}
        <circle
          r={30}
          fill={nodeColor}
          stroke="#fff"
          strokeWidth={3}
          onMouseEnter={(e) => handleNodeMouseEnter(nodeDatum, e)}
          onMouseLeave={handleNodeMouseLeave}
          style={{ cursor: 'pointer' }}
        />
        
        {/* Node name */}
        <text
          fill={textColor}
          strokeWidth="0"
          x={0}
          y={-5}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          onMouseEnter={(e) => handleNodeMouseEnter(nodeDatum, e)}
          onMouseLeave={handleNodeMouseLeave}
          style={{ cursor: 'pointer' }}
        >
          {nodeDatum.name}
        </text>
        
        {/* Milk start year */}
        <text
          fill={textColor}
          strokeWidth="0"
          x={0}
          y={10}
          textAnchor="middle"
          fontSize="11"
          fontWeight="400"
          onMouseEnter={(e) => handleNodeMouseEnter(nodeDatum, e)}
          onMouseLeave={handleNodeMouseLeave}
          style={{ cursor: 'pointer' }}
        >
          {milkYear}
        </text>
      </g>
    );
  };

  return (
    <div style={{ width: '100%', height: '700px', background: '#f8fafc', borderRadius: 12, padding: 16, overflow: 'hidden', position: 'relative' }} ref={containerRef}>
      <Tree
        data={treeData}
        translate={translate}
        orientation="vertical"
        pathFunc="step"
        collapsible={true}
        renderCustomNodeElement={renderCustomNodeElement}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        nodeSize={{ x: 150, y: 120 }}
        styles={{
          links: { 
            stroke: '#64748b', 
            strokeWidth: 2,
            fill: 'none'
          }
        }}
        zoomable={true}
        draggable={true}
        scaleExtent={{ min: 0.3, max: 2 }}
      />
      
      {/* Hover Tooltip */}
      {showHover && hoveredNode && (
        <div 
          style={{
            position: 'absolute',
            left: hoverPosition.x + 10,
            top: hoverPosition.y - 10,
            background: 'white',
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: `2px solid ${hoveredNode.attributes?.totalChildren > 0 ? '#10b981' : '#9ca3af'}`,
            zIndex: 1000,
            minWidth: '200px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: hoveredNode.attributes?.totalChildren > 0 ? '#10b981' : '#9ca3af',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                marginRight: '0.5rem'
              }}
            >
              {hoveredNode.name}
            </div>
            <strong style={{ color: '#1f2937', fontSize: '1.1rem' }}>
              Buffalo {hoveredNode.name}
            </strong>
          </div>
          
          <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong style={{ color: '#374151' }}>Born:</strong>
              <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                {hoveredNode.attributes?.born || 'N/A'}
              </span>
            </div>
            
            <div style={{ marginBottom: '0.25rem' }}>
              <strong style={{ color: '#374151' }}>Milk Starts:</strong>
              <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                {hoveredNode.attributes?.milkStarts || 'N/A'}
              </span>
            </div>
            
            <div>
              <strong style={{ color: '#374151' }}>Children:</strong>
              <span 
                style={{ 
                  marginLeft: '0.5rem', 
                  color: hoveredNode.attributes?.totalChildren > 0 ? '#10b981' : '#ef4444',
                  fontWeight: '600'
                }}
              >
                {hoveredNode.attributes?.totalChildren || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuffaloMindmap;
