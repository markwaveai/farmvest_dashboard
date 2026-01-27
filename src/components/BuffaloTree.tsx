import React, { useState } from 'react';
import BuffaloMindmap from './BuffaloMindmap';
import './BuffaloTree.css';

function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function formatYM(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' }) + '-' + date.getFullYear();
}

function countTotalBuffalos(node: any): number {
  let count = 1; // Count the current node
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      count += countTotalBuffalos(child);
    }
  }
  return count;
}

function generateBuffalo(name: string, bornDate: Date, windowStart: Date, windowEnd: Date) {
  const milkStart = addYears(bornDate, 3); // lactation starts 3 yrs after birth

  const node: any = {
    name,
    born: formatYM(bornDate),
    milkStarts: formatYM(milkStart),
    children: [],
  };

  // No children if milkStart is after projection window
  if (milkStart > windowEnd) {
    node.totalChildren = 0;
    return node;
  }

  let childBirthYear = milkStart.getFullYear();
  const windowEndYear = windowEnd.getFullYear();
  const maxBornYear = 2035; // Maximum birth year allowed

  let childIndex = 1;
  let childBirthDate = new Date(milkStart);
  const maxChildren = 10; // Maximum number of children per buffalo

  while (childBirthYear <= windowEndYear && childIndex <= maxChildren && childBirthYear <= maxBornYear) {
    const childName = `${name}${childIndex}`;

    const childNode = generateBuffalo(childName, new Date(childBirthDate), windowStart, windowEnd);

    node.children.push(childNode);

    // next birth after 1 year
    childBirthDate.setFullYear(childBirthDate.getFullYear() + 1);
    childBirthYear++;

    childIndex++;
  }

  node.totalChildren = node.children.length;
  return node;
}

const BuffaloNode: React.FC<{ node: any; level?: number }> = ({ node, level = 0 }) => {
  const [open, setOpen] = useState(level < 1); // root expanded
  return (
    <div style={{ marginLeft: level * 16 }} className="buffalo-node-wrapper">
      <div className="buffalo-node-content">
        {node.children && node.children.length > 0 && (
          <button onClick={() => setOpen(!open)} className="buffalo-node-toggle-btn">
            {open ? '-' : '+'}
          </button>
        )}
        <div className="buffalo-node-name">{node.name}</div>
        <div className="buffalo-node-info">born: {node.born}</div>
        <div className="buffalo-node-info">milk: {node.milkStarts}</div>
        <div className="buffalo-node-children-count">children: {node.totalChildren}</div>
      </div>
      {open && node.children && node.children.length > 0 && (
        <div className="buffalo-node-children">
          {node.children.map((c: any, idx: number) => (
            <BuffaloNode key={idx} node={c} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const BuffaloTree: React.FC = () => {
  // Default inputs from the original algorithm
  const parentName = 'A';
  const born = '2023-01-01';
  const bornDate = new Date(born);

  const milkStart = addYears(bornDate, 3); // Jan 2026
  const windowStart = milkStart;
  const windowEnd = addYears(windowStart, 9); // Jan 2036

  const tree = generateBuffalo(parentName, bornDate, windowStart, windowEnd);
  const totalBuffalos = countTotalBuffalos(tree);

  const [view, setView] = useState<'list' | 'mindmap'>('list');

  return (
    <div>
      {/* Summary Card */}
      <div className="buffalo-tree-card">
        <div className="buffalo-tree-stat">
          <span className="buffalo-tree-stat-label">Buffalo count:</span>
          <span className="buffalo-tree-stat-value">
            {totalBuffalos}
          </span>
        </div>
        <div className="buffalo-tree-period">
          <span className="buffalo-tree-stat-label">Projection period:</span>
          <span className="buffalo-tree-period-value">
            {formatYM(windowStart)} to {formatYM(windowEnd)}
          </span>
        </div>
      </div>

      {/* View Toggle Buttons */}
      <div className="buffalo-view-toggle">
        <button
          onClick={() => setView('list')}
          className={`buffalo-view-btn ${view === 'list' ? 'active' : 'inactive'}`}
        >
          List View
        </button>
        <button
          onClick={() => setView('mindmap')}
          className={`buffalo-view-btn ${view === 'mindmap' ? 'active' : 'inactive'}`}
        >
          Mindmap View
        </button>
      </div>

      {/* Tree Views */}
      {view === 'list' ? (
        <div className="buffalo-list-view-container">
          <BuffaloNode node={tree} level={0} />
        </div>
      ) : (
        <BuffaloMindmap rootNode={tree} />
      )}
    </div>
  );
};

export default BuffaloTree;
