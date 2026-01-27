import React, { useState, useEffect } from 'react';
import { Move, Maximize, Minimize, Scan, LayoutGrid, ChevronDown, Loader2 } from "lucide-react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import { BuffaloNode, TreeBranch, formatCurrency } from './CommonComponents';

const TreeVisualization = ({
    treeData,
    zoom,
    containerRef,
    treeContainerRef,
    isFullScreen,
    toggleFullScreen,
    handleFitToScreen,
}: {
    treeData: any;
    zoom: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    treeContainerRef: React.RefObject<HTMLDivElement | null>;
    isFullScreen: boolean;
    toggleFullScreen: () => void;
    handleFitToScreen: () => void;
}) => {
    const updateXarrow = useXarrow();
    const [activeFounderId, setActiveFounderId] = useState("all");
    const [activeLayout, setActiveLayout] = useState("layout1");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showLines, setShowLines] = useState(true);

    // Create a stable dependency key to prevent re-running on reference changes if content is same
    const dataDependency = treeData
        ? `${treeData.buffaloes?.length || 0}-${treeData.summaryStats?.totalNetRevenue || 0}`
        : '';



    // Handle Layout Change - Instant
    const handleLayoutChange = (layout: string) => {
        if (activeLayout === layout) return;
        setActiveLayout(layout);
        // Force refresh immediately after render cycle
        setTimeout(() => {
            forceRefreshLines();
        }, 0);
    };

    // Reset to "all" when treeData changes (new simulation)
    useEffect(() => {
        if (!treeData) return;

        setActiveFounderId("all");
        setIsProcessing(true);

        const timer = setTimeout(() => {
            if (containerRef.current) {
                const { scrollWidth, clientWidth, scrollHeight } = containerRef.current;

                // valid ref check
                if (scrollWidth && scrollHeight) {
                    // Horizontal Center
                    const scrollLeft = (scrollWidth - clientWidth) / 2;
                    if (scrollLeft > 0) {
                        containerRef.current.scrollLeft = scrollLeft;
                    }

                    // Vertical 10%
                    const scrollTop = scrollHeight * 0.10;
                    if (scrollTop > 0) {
                        containerRef.current.scrollTop = scrollTop;
                    }
                }
            }
            setIsProcessing(false);
            // Force update after scroll position set
            setTimeout(updateXarrow, 0);
        }, 500);

        return () => clearTimeout(timer);
    }, [dataDependency]);

    // Force updates with synthetic events to ensure Xarrows detects the new positions
    const forceRefreshLines = () => {
        updateXarrow();
        // Dispatch window resize to force re-calculation
        window.dispatchEvent(new Event('resize'));
        // Dispatch scroll on container if possible
        if (containerRef.current) {
            containerRef.current.dispatchEvent(new Event('scroll'));
        }
    };

    // Update arrows when layout or zoom changes
    useEffect(() => {
        forceRefreshLines();

        let animationFrameId: number;
        const startTime = Date.now();
        const duration = 1500;

        const animate = () => {
            const now = Date.now();
            if (now - startTime < duration) {
                // Periodically force powerful refresh
                if (Math.random() > 0.8) forceRefreshLines();
                else updateXarrow();

                animationFrameId = requestAnimationFrame(animate);
            }
        };

        cancelAnimationFrame(animationFrameId!);
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [activeLayout, zoom, isProcessing]);

    // Final strict update when processing finishes
    useEffect(() => {
        if (!isProcessing) {
            const timers = [
                setTimeout(forceRefreshLines, 50),
                setTimeout(forceRefreshLines, 200),
                setTimeout(forceRefreshLines, 500),
                setTimeout(forceRefreshLines, 1000)
            ];
            return () => timers.forEach(t => clearTimeout(t));
        }
    }, [isProcessing, updateXarrow]);



    if (!treeData) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-14 shadow-2xl border border-gray-200 text-center max-w-4xl">
                    <h2 className="text-4xl font-bold text-gray-800 mb-6">
                        Buffalo Family Tree Simulator
                    </h2>
                    <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                        Simulate the growth of your buffalo herd over time. Watch as your founding buffalos
                        create generations of offspring in this interactive family tree visualization.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <div className="text-center p-6">
                            <h3 className="font-bold text-xl mb-3">Configure</h3>
                            <p className="text-base text-gray-600">Set your starting units and simulation period</p>
                        </div>
                        <div className="text-center p-6">
                            <h3 className="font-bold text-xl mb-3">Simulate</h3>
                            <p className="text-base text-gray-600">Run the simulation to generate your herd</p>
                        </div>
                        <div className="text-center p-6">
                            <h3 className="font-bold text-xl mb-3">Explore</h3>
                            <p className="text-base text-gray-600">Navigate through the interactive family tree</p>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // Function to get buffalo display name (A1, A2, etc.)
    const getBuffaloDisplayName = (buffalo: any) => {
        return buffalo.id;
    };

    const filteredBuffaloes = activeFounderId === "all"
        ? treeData.buffaloes
        : treeData.buffaloes.filter((b: any) => b.rootId === activeFounderId || b.id === activeFounderId);

    const stats = {
        count: filteredBuffaloes.length,
        revenue: filteredBuffaloes.reduce((sum: any, b: any) => sum + (b.lifetimeRevenue || 0), 0),
        netRevenue: activeFounderId === "all" && treeData.summaryStats ? treeData.summaryStats.totalNetRevenue : filteredBuffaloes.reduce((sum: any, b: any) => sum + (b.lifetimeNet || 0), 0),
        assetValue: filteredBuffaloes.reduce((sum: any, b: any) => sum + (b.currentAssetValue || 0), 0),
        producing: filteredBuffaloes.filter((b: any) => b.ageInMonths >= 34).length,
        nonProducing: filteredBuffaloes.filter((b: any) => b.ageInMonths < 34).length
    };

    // --- LAYOUT CALCULATION LOGIC ---

    // 1. Build Hierarchy
    const buildHierarchy = (items: any[]) => {
        const map: any = {};
        const roots: any[] = [];
        items.forEach((item: any) => {
            map[item.id] = { ...item, children: [] };
        });
        items.forEach((item: any) => {
            if (item.parentId && map[item.parentId]) {
                map[item.parentId].children.push(map[item.id]);
            } else {
                roots.push(map[item.id]);
            }
        });
        return roots;
    };

    const countLeaves = (node: any): number => {
        if (node.children.length === 0) {
            node.leaves = 1;
        } else {
            node.leaves = node.children.reduce((sum: any, child: any) => sum + countLeaves(child), 0);
        }
        return node.leaves;
    };

    const roots = buildHierarchy(filteredBuffaloes);
    roots.forEach(countLeaves);

    // 2. Layout Algorithms
    const positionedNodes: any[] = [];
    const CANVAS_CENTER_X = 1000;
    const ROOT_SPACING_Y = 1400; // Used for Layout 1
    const INITIAL_Y = 700;

    // --- Layout 1: Radial ---
    const RADIUS_INCREMENT = 180;
    const layoutRadial = (node: any, startAngle: number, endAngle: number, level: number, centerX: number, centerY: number) => {
        let x = centerX;
        let y = centerY;

        if (level > 0) {
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const radians = (midAngle - 90) * (Math.PI / 180);
            const radius = level * RADIUS_INCREMENT;
            x = centerX + radius * Math.cos(radians);
            y = centerY + radius * Math.sin(radians);
        }

        positionedNodes.push({ ...node, x, y, level });

        if (node.children.length > 0) {
            let currentStartAngle = startAngle;
            const exponent = 0.65;
            const totalWeight = node.children.reduce((sum: any, child: any) => sum + Math.pow(child.leaves, exponent), 0);
            const availableAngle = endAngle - startAngle;

            node.children.forEach((child: any) => {
                const weight = Math.pow(child.leaves, exponent);
                const share = weight / totalWeight;
                const childAngleSpan = availableAngle * share;
                const childEndAngle = currentStartAngle + childAngleSpan;

                layoutRadial(child, currentStartAngle, childEndAngle, level + 1, centerX, centerY);
                currentStartAngle = childEndAngle;
            });
        }
    };

    // --- Layout 2: Vertical (Top-Down) ---
    const LEVEL_HEIGHT = 170;
    const layoutVertical = (node: any, minX: number, maxX: number, level: number, startY: number) => {
        const x = minX + (maxX - minX) / 2;
        const y = startY + (level * LEVEL_HEIGHT);

        positionedNodes.push({ ...node, x, y, level });

        if (node.children.length > 0) {
            let currentMinX = minX;
            const exponent = 0.65;
            const totalWeight = node.children.reduce((sum: any, child: any) => sum + Math.pow(child.leaves, exponent), 0);
            const availableX = maxX - minX;

            node.children.forEach((child: any) => {
                const weight = Math.pow(child.leaves, exponent);
                const share = weight / totalWeight;
                const childXSpan = availableX * share;
                const childMaxX = currentMinX + childXSpan;

                layoutVertical(child, currentMinX, childMaxX, level + 1, startY);
                currentMinX = childMaxX;
            });
        }
    };

    // --- Layout 3: Horizontal (Left-Right) ---
    const LEVEL_WIDTH = 200;
    const layoutHorizontal = (node: any, minY: number, maxY: number, level: number, startX: number) => {
        const y = minY + (maxY - minY) / 2;
        const x = startX + (level * LEVEL_WIDTH);

        positionedNodes.push({ ...node, x, y, level });

        if (node.children.length > 0) {
            let currentMinY = minY;
            const exponent = 0.75; // Slightly stricter for vertical space
            const totalWeight = node.children.reduce((sum: any, child: any) => sum + Math.pow(child.leaves, exponent), 0);
            const availableY = maxY - minY;

            node.children.forEach((child: any) => {
                const weight = Math.pow(child.leaves, exponent);
                const share = weight / totalWeight;
                const childYSpan = availableY * share;
                const childMaxY = currentMinY + childYSpan;

                layoutHorizontal(child, currentMinY, childMaxY, level + 1, startX);
                currentMinY = childMaxY;
            });
        }
    };

    // --- Layout 4: Compact (Sankey-ish) ---
    const COMPACT_LEVEL_WIDTH = 250;
    // Uses significantly tighter vertical packing
    const layoutCompact = (node: any, minY: number, maxY: number, level: number, startX: number) => {
        const y = minY + (maxY - minY) / 2;
        const x = startX + (level * COMPACT_LEVEL_WIDTH);

        positionedNodes.push({ ...node, x, y, level });

        if (node.children.length > 0) {
            let currentMinY = minY;
            // Tighter packing logic
            const totalLeaves = node.children.reduce((sum: any, child: any) => sum + child.leaves, 0);
            const availableY = maxY - minY;

            // Allocate space purely based on leaf count for maximum density
            const heightPerLeaf = availableY / totalLeaves;

            node.children.forEach((child: any) => {
                const childHeight = child.leaves * heightPerLeaf;
                const childMaxY = currentMinY + childHeight;

                layoutCompact(child, currentMinY, childMaxY, level + 1, startX);
                currentMinY = childMaxY;
            });
        }
    };

    // Vertical Stacking Logic
    let currentRootY = INITIAL_Y;
    const treeSeparators: any[] = [];

    if (activeLayout === 'layout1') {
        roots.forEach((root: any, idx: any) => {
            layoutRadial(root, 0, 360, 0, CANVAS_CENTER_X, currentRootY);
            // if (idx < roots.length - 1) {
            //   treeSeparators.push(currentRootY + (ROOT_SPACING_Y / 2));
            // }
            currentRootY += ROOT_SPACING_Y;
        });
    } else if (activeLayout === 'layout2') {
        // Layout 2: Vertical
        let currentY = 150;

        roots.forEach((root: any, idx: any) => {
            const TREE_WIDTH = Math.max(1000, root.leaves * 85);
            layoutVertical(root, CANVAS_CENTER_X - (TREE_WIDTH / 2), CANVAS_CENTER_X + (TREE_WIDTH / 2), 0, currentY);

            // Calculate height of this tree to place separator and next tree
            const treeNodes = positionedNodes.filter(n => n.rootId === root.id || n.id === root.id);
            const maxLevel = Math.max(...treeNodes.map(n => n.level), 0);
            const treeBottom = currentY + (maxLevel * LEVEL_HEIGHT);

            if (idx < roots.length - 1) {
                treeSeparators.push(treeBottom + 200);
            }
            currentY = treeBottom + 400;
        });
    } else if (activeLayout === 'layout3') {
        // Layout 3: Horizontal
        let currentX = 150;
        roots.forEach((root: any, idx: any) => {
            // Estimate height based on leaves - Increased for better spacing
            const TREE_HEIGHT = Math.max(400, root.leaves * 70);

            layoutHorizontal(root, currentRootY, currentRootY + TREE_HEIGHT, 0, currentX);

            // Calculate separator
            if (idx < roots.length - 1) {
                treeSeparators.push(currentRootY + TREE_HEIGHT + 20);
            }
            currentRootY += TREE_HEIGHT + 40;
        });
    } else if (activeLayout === 'layout4') {
        // Layout 4: Compact Pill
        let currentX = 350;
        roots.forEach((root: any, idx: any) => {
            // Tighter height - Increased from 50 to 60 for safe spacing "pill" variant
            const TREE_HEIGHT = Math.max(330, root.leaves * 45);

            layoutCompact(root, currentRootY, currentRootY + TREE_HEIGHT, 0, currentX);

            if (idx < roots.length - 1) {
                treeSeparators.push(currentRootY + TREE_HEIGHT + 20);
            }
            currentRootY += TREE_HEIGHT + 40;
        });
    }

    // 3. Calculate Container Dimensions
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    if (positionedNodes.length === 0) {
        minX = 0; maxX = 2000; minY = 0; maxY = 2000;
    } else {
        positionedNodes.forEach(node => {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.y > maxY) maxY = node.y;
        });
    }

    // Add Padding
    const PADDING = 100; // Standardize padding

    // Calculate dimensions based on actual content range
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const calculatedWidth = contentWidth + (PADDING * 2);
    const calculatedHeight = contentHeight + (PADDING * 2);

    // Apply strict sizing for horizontal layouts to ensure scroll works
    // Added extra buffer to width/height to prevent clipping of labels or tooltips
    const containerWidth = activeLayout === 'layout1' ? calculatedWidth + 500 : Math.max(calculatedWidth + 300, 1500);
    const containerHeight = activeLayout === 'layout1' ? calculatedHeight : Math.max(calculatedHeight + 200, 1200);

    // Normalize coordinates so content starts exactly at PADDING
    const xOffset = PADDING - minX;
    const yOffset = PADDING - minY;

    // Apply offset to all nodes
    positionedNodes.forEach(n => {
        n.x += xOffset;
        n.y += yOffset;
    });

    // Separators need separate offset update as they are just Y values
    for (let i = 0; i < treeSeparators.length; i++) {
        treeSeparators[i] += yOffset;
    }

    const lineColors = ["#ff9800", "#3f51b5", "#009688", "#e91e63"];


    return (
        <div className="w-full h-full flex flex-col relative">
            {/* Floating Header Controls */}
            <div className="absolute top-4 left-4 z-30 flex flex-row items-start gap-2 pointer-events-none">

                {/* View Controls & Layout Toggle - Expandable Dropdown */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm pointer-events-auto w-fit transition-all duration-300 ease-in-out max-h-[38px] hover:max-h-[200px] overflow-hidden group/layout">
                    {/* Main Button (Header) */}
                    <div className="flex items-center">
                        <button
                            onClick={toggleFullScreen}
                            className="flex items-center gap-1.5 px-2.5 py-2.5 hover:bg-slate-50 text-slate-600 transition-colors text-[10px] font-bold uppercase tracking-wider border-r border-slate-100"
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        >
                            {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
                            <span className="hidden sm:inline">{isFullScreen ? "Exit" : "Expand"}</span>
                        </button>
                        <div className="px-2 py-2.5 flex items-center gap-1 bg-slate-50/50 group-hover/layout:bg-white transition-colors">
                            <span className="text-[10px] font-bold text-slate-400">LAYOUT {activeLayout.replace('layout', '')}</span>
                            <ChevronDown size={14} className="text-slate-400 group-hover/layout:rotate-180 transition-transform duration-300" />
                        </div>
                    </div>

                    {/* Layout Options Dropdown */}
                    <div className="p-1 px-1.5 pb-1.5 flex flex-col gap-1.5 border-t border-slate-100 opacity-0 group-hover/layout:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={() => handleLayoutChange("layout1")}
                            className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all ${activeLayout === "layout1"
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                }`}
                        >
                            Layout 1
                        </button>
                        <button
                            onClick={() => handleLayoutChange("layout2")}
                            className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all ${activeLayout === "layout2"
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                }`}
                        >
                            Layout 2
                        </button>
                        <button
                            onClick={() => handleLayoutChange("layout3")}
                            className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all ${activeLayout === "layout3"
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                }`}
                        >
                            Layout 3
                        </button>
                        <button
                            onClick={() => handleLayoutChange("layout4")}
                            className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all ${activeLayout === "layout4"
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                }`}
                        >
                            Layout 4
                        </button>
                    </div>
                </div>

                {/* Unit Selection - Expandable Tab */}
                <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-lg pointer-events-auto min-w-[150px] overflow-hidden transition-all duration-300 ease-in-out max-h-[42px] hover:max-h-[500px] group">

                    {/* Header showing active selection */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50/50 group-hover:bg-white transition-colors cursor-default border-b border-transparent group-hover:border-slate-100 h-[42px]">
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={14} className="text-slate-500" />
                            <span className="text-xs font-bold text-slate-700">
                                {activeFounderId === "all" ? "Unit 1" : `Unit 1 ${activeFounderId}`}
                            </span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
                    </div>

                    {/* Expandable List Content */}
                    <div className="p-1.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                        <button
                            onClick={() => setActiveFounderId("all")}
                            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeFounderId === "all"
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                }`}
                        >
                            <span>Unit 1</span>
                            {activeFounderId === "all" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </button>

                        <div className="w-full h-px bg-slate-100 mx-auto my-0.5" />

                        {treeData.lineages && Object.values(treeData.lineages).map((lineage: any) => (
                            <button
                                key={lineage.id}
                                onClick={() => setActiveFounderId(lineage.id)}
                                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeFounderId === lineage.id
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                    }`}
                            >
                                <span>Unit 1 {lineage.id}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeFounderId === lineage.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {lineage.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-3 pointer-events-none">

                {/* Right Side: Stats Sidebar - Expandable Tab */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg pointer-events-auto min-w-[170px] flex flex-col overflow-hidden transition-all duration-300 ease-in-out max-h-[40px] hover:max-h-[500px] group">

                    {/* Header */}
                    <div className="px-3 py-2.5 flex items-center justify-between bg-slate-50/50 group-hover:bg-white border-b border-transparent group-hover:border-slate-100 h-[40px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Summary</span>
                        <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
                    </div>

                    {/* Stats Content */}
                    <div className="p-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                        {/* Buffaloes */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-medium text-slate-500">Buffaloes</span>
                            <span className="text-sm font-black text-slate-800">{stats.count}</span>
                        </div>

                        {/* Revenue -> Cumulative Net */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-medium text-slate-500">Net Rev</span>
                            <span className="text-sm font-black text-emerald-600">
                                {stats.netRevenue > 100000
                                    ? `${(stats.netRevenue / 100000).toFixed(2)}L`
                                    : formatCurrency(stats.netRevenue)}
                            </span>
                        </div>

                        {/* Asset Value */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-medium text-slate-500">Asset Val</span>
                            <span className="text-sm font-black text-blue-600">
                                {stats.assetValue > 100000
                                    ? `${(stats.assetValue / 100000).toFixed(2)}L`
                                    : formatCurrency(stats.assetValue)}
                            </span>
                        </div>

                        {/* Producing */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-medium text-slate-500">Milking</span>
                            <span className="text-sm font-black text-green-600">{stats.producing}</span>
                        </div>

                        {/* Non-Producing */}
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-medium text-slate-500">Non-Milking</span>
                            <span className="text-sm font-black text-amber-600">{stats.nonProducing}</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Loading Overlay */}
            {isProcessing && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] transition-opacity duration-300">
                    <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-small">
                        <div className="relative">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                        <span className="text-sm font-bold text-slate-600">Processing Tree Layout...</span>
                    </div>
                </div>
            )}

            {/* Scrollable Tree Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto relative bg-slate-50 active:cursor-grabbing"
                onScroll={updateXarrow} // Update arrows on scroll
                onMouseDown={(e: React.MouseEvent) => {
                    const ele = containerRef.current;
                    if (!ele) return;
                    ele.style.userSelect = 'none';
                    let pos = { left: ele.scrollLeft, top: ele.scrollTop, x: e.clientX, y: e.clientY };

                    const mouseMoveHandler = (e: any) => {
                        const dx = e.clientX - pos.x;
                        const dy = e.clientY - pos.y;
                        if (ele) {
                            ele.scrollTop = pos.top - dy;
                            ele.scrollLeft = pos.left - dx;
                        }
                    };

                    const mouseUpHandler = () => {
                        if (ele) {
                            ele.style.removeProperty('userSelect');
                        }
                        document.removeEventListener('mousemove', mouseMoveHandler);
                        document.removeEventListener('mouseup', mouseUpHandler);
                    };

                    document.addEventListener('mousemove', mouseMoveHandler);
                    document.addEventListener('mouseup', mouseUpHandler);
                }}
            >
                <div
                    ref={treeContainerRef}
                    className="relative flex items-center justify-center p-20"
                    style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        width: `${containerWidth}px`,
                        height: `${containerHeight}px`,
                    }}
                >
                    <Xwrapper key={activeLayout}>
                        {/* Edges - Only render when showLines is true */}
                        {showLines && positionedNodes.map(node => {
                            if (!node.parentId) return null;
                            const isVertical = activeLayout === 'layout2';
                            const isHorizontal = activeLayout === 'layout3' || activeLayout === 'layout4';

                            // Define anchors and path based on layout
                            let startAnchor: any = "middle";
                            let endAnchor: any = "middle";
                            let path: any = "straight";
                            let curveness = 0;
                            let gridBreak = "50%";

                            if (activeLayout === 'layout2') {
                                // Vertical Tree - Orthogonal (Grid) lines look best
                                startAnchor = "bottom";
                                endAnchor = "top";
                                path = "grid";
                            } else if (activeLayout === 'layout3') {
                                // Horizontal Tree - Orthogonal (Grid) lines look best
                                startAnchor = "right";
                                endAnchor = "left";
                                path = "grid";
                            } else if (activeLayout === 'layout4') {
                                // Compact/Sankey - Smooth lines look best
                                startAnchor = "right";
                                endAnchor = "left";
                                path = "smooth";
                                curveness = 0.5;
                            }

                            return (
                                <Xarrow
                                    key={`edge-${node.id}-${activeLayout}`}
                                    start={`buffalo-${node.parentId}`}
                                    end={`buffalo-${node.id}`}
                                    color={lineColors[(Math.max(0, node.level - 1)) % lineColors.length] || "#64748b"}
                                    strokeWidth={activeLayout === 'layout4' ? 2.5 : 2}
                                    curveness={curveness}
                                    path={path}
                                    gridBreak={gridBreak}
                                    showHead={false}
                                    startAnchor={startAnchor}
                                    endAnchor={endAnchor}
                                    dashness={false}
                                    zIndex={0}
                                />
                            );
                        })}

                        {/* Tree Separators */}
                        {treeSeparators.map((y, i) => (
                            <div
                                key={`sep-${i}`}
                                className="absolute left-0 w-full border-t border-slate-200"
                                style={{ top: y, height: '8px', backgroundColor: '#f8fafc' }}
                            />
                        ))}

                        {/* Tree Labels for Vertical & Horizontal Layouts */}
                        {(activeLayout === 'layout2' || activeLayout === 'layout3' || activeLayout === 'layout4') && roots.map((root: any, idx: any) => {
                            // Find root node in positionedNodes because we might have shifted X
                            const rootNode = positionedNodes.find(n => n.id === root.id);
                            if (!rootNode) return null;

                            // Calculate Label Position
                            let labelStyle: React.CSSProperties = {};
                            if (activeLayout === 'layout2') {
                                // Vertical: Center above
                                labelStyle = {
                                    left: rootNode.x,
                                    top: rootNode.y - 100,
                                    transform: 'translateX(-50%)'
                                };
                            } else {
                                // Horizontal (3 & 4): Above, Left aligned or Centered on Root
                                labelStyle = {
                                    left: rootNode.x, // Align with root X
                                    top: rootNode.y - 80, // Slightly closer than vertical layout
                                    transform: 'translateX(-20%)', // Slight shift to center visually over root area
                                    textAlign: 'left'
                                };
                            }


                            return (
                                <div
                                    key={`label-${root.id}`}
                                    className="absolute z-20"
                                    style={labelStyle}
                                >
                                    <div className="text-sm font-black text-slate-800 uppercase tracking-wide whitespace-nowrap">
                                        Unit 1 - {root.id}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                        Started: {root.startedAt}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Nodes */}
                        {positionedNodes.map(node => (
                            <div
                                key={node.id}
                                className="z-10 hover:z-[100]"
                                style={{
                                    position: 'absolute',
                                    left: node.x,
                                    top: node.y,
                                    transform: 'translate(-50%, -50%)', // Center div on coordinate
                                }}
                            >
                                <BuffaloNode
                                    data={node}
                                    founder={node.parentId === null}
                                    displayName={getBuffaloDisplayName(node)}
                                    elementId={`buffalo-${node.id}`}
                                    variant={activeLayout === 'layout4' ? 'pill' : 'circle'}
                                    tooltipPosition={activeLayout === 'layout4' ? 'right' : 'top'}
                                />
                            </div>
                        ))}
                    </Xwrapper>

                    {/* Generic Year/Generation Markers */}
                    {(() => {
                        if (positionedNodes.length === 0) return null;

                        // Helper to format year text
                        const getYearText = (nodes: any[]) => {
                            const years = nodes.map(n => {
                                // For Foundation (Gen 0), use the acquisition year (Start Year) instead of birth year
                                if (n.generation === 0 && n.absoluteAcquisitionMonth) {
                                    return Math.floor(n.absoluteAcquisitionMonth / 12);
                                }
                                return n.birthYear;
                            }).filter(y => y);

                            if (years.length === 0) return "";
                            const min = Math.min(...years);
                            const max = Math.max(...years);
                            return min === max ? `${min}` : `${min}-${max}`;
                        };

                        // --- Horizontal Layouts (3 & 4) ---
                        // Roots are stacked vertically (sharing X columns), so we can use Global Headers
                        if (activeLayout === 'layout3' || activeLayout === 'layout4') {
                            const maxLevel = Math.max(...positionedNodes.map(n => n.level));
                            const markers = [];
                            // Find global top Y for headers
                            const minY = Math.min(...positionedNodes.map(n => n.y));

                            for (let l = 0; l <= maxLevel; l++) {
                                const nodesInLevel = positionedNodes.filter(n => n.level === l);
                                if (nodesInLevel.length === 0) continue;

                                // In these layouts, X is consistent for a level
                                const avgX = nodesInLevel[0].x;
                                const yearText = getYearText(nodesInLevel);
                                const label = l === 0 ? 'Foundation' : `Gen ${l}`;

                                markers.push(
                                    <div key={`header-${l}`}
                                        className="absolute text-center z-10"
                                        style={{
                                            left: avgX,
                                            top: minY - 40, // Consistent top placement
                                            transform: 'translate(-50%, -100%)',
                                            minWidth: 100
                                        }}
                                    >
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
                                        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block shadow-sm">
                                            {yearText}
                                        </div>
                                        {/* Vertical Grid Line suggestion */}
                                        <div className="absolute top-full left-1/2 w-px h-[2000px] bg-slate-50/0 pointer-events-none" />
                                    </div>
                                );
                            }
                            return markers;
                        }

                        // --- Vertical Layout (2) ---
                        // Roots are stacked vertically, so each tree needs its own side labels
                        if (activeLayout === 'layout2') {
                            return roots.map((root: any) => {
                                const treeNodes = positionedNodes.filter(n => n.rootId === root.id || n.id === root.id);
                                if (treeNodes.length === 0) return null;

                                const maxLevel = Math.max(...treeNodes.map(n => n.level));
                                // Place labels to the left of this tree's leftmost node
                                const minTreeX = Math.min(...treeNodes.map(n => n.x));

                                const labels = [];
                                for (let l = 0; l <= maxLevel; l++) {
                                    const levelNodes = treeNodes.filter(n => n.level === l);
                                    if (levelNodes.length === 0) continue;

                                    // In Layout 2, Y is consistent for a level within a tree
                                    const avgY = levelNodes[0].y;
                                    const yearText = getYearText(levelNodes);
                                    const label = l === 0 ? 'Foundation' : `Gen ${l}`;

                                    labels.push(
                                        <div key={`row-label-${root.id}-${l}`}
                                            className="absolute text-right z-10 flex flex-col items-end justify-center"
                                            style={{
                                                left: minTreeX - 25,
                                                top: avgY,
                                                transform: 'translate(-100%, -50%)',
                                                paddingRight: '12px'
                                            }}
                                        >
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap mb-0.5">{label}</div>
                                            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm border border-indigo-100">{yearText}</div>
                                        </div>
                                    );
                                }
                                return <React.Fragment key={`markers-${root.id}`}>{labels}</React.Fragment>;
                            });
                        }

                        return null;
                    })()}
                </div>
            </div>
        </div>
    );
};

export default TreeVisualization;
