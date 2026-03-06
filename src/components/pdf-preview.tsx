"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StampOptions, getPageSettings, PageStampSettings } from "@/lib/stamp-engine";

type StampPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";

interface PdfPreviewProps {
    pdfFile: File | null;
    stampPreviewUrl: string | null;
    stampOptions: StampOptions;
    onTotalPagesChange: (total: number) => void;
    currentPage: number;
    onCurrentPageChange: (page: number) => void;
}

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
    if (pdfjsLib) return pdfjsLib;
    pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return pdfjsLib;
}

function getStampOverlayPosition(
    canvasWidth: number,
    canvasHeight: number,
    stampWidth: number,
    stampHeight: number,
    settings: PageStampSettings
): { left: number; top: number } {
    const margin = 30 * (canvasWidth / 595);

    const positions: Record<StampPosition, { left: number; top: number }> = {
        "bottom-right": { left: canvasWidth - stampWidth - margin, top: canvasHeight - stampHeight - margin },
        "bottom-left": { left: margin, top: canvasHeight - stampHeight - margin },
        "top-right": { left: canvasWidth - stampWidth - margin, top: margin },
        "top-left": { left: margin, top: margin },
        center: { left: (canvasWidth - stampWidth) / 2, top: (canvasHeight - stampHeight) / 2 },
    };

    const base = positions[settings.position];
    const maxOffsetX = canvasWidth * 0.3;
    const maxOffsetY = canvasHeight * 0.3;
    const deltaX = ((settings.offsetX - 50) / 50) * maxOffsetX;
    const deltaY = ((settings.offsetY - 50) / 50) * maxOffsetY;

    return {
        left: Math.max(0, Math.min(canvasWidth - stampWidth, base.left + deltaX)),
        top: Math.max(0, Math.min(canvasHeight - stampHeight, base.top + deltaY)),
    };
}

export function PdfPreview({
    pdfFile,
    stampPreviewUrl,
    stampOptions,
    onTotalPagesChange,
    currentPage,
    onCurrentPageChange,
}: PdfPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [stampNaturalSize, setStampNaturalSize] = useState({ width: 0, height: 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfDocRef = useRef<any>(null);

    useEffect(() => {
        if (!stampPreviewUrl) return;
        const img = new window.Image();
        img.onload = () => setStampNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = stampPreviewUrl;
    }, [stampPreviewUrl]);

    useEffect(() => {
        if (!pdfFile) {
            pdfDocRef.current = null;
            setTotalPages(0);
            onCurrentPageChange(1);
            onTotalPagesChange(0);
            return;
        }
        const loadPdf = async () => {
            const pdfjs = await getPdfjs();
            const arrayBuffer = await pdfFile.arrayBuffer();
            const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            pdfDocRef.current = doc;
            setTotalPages(doc.numPages);
            onCurrentPageChange(1);
            onTotalPagesChange(doc.numPages);
        };
        loadPdf();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfFile]);

    const renderPage = useCallback(async () => {
        if (!pdfDocRef.current || !canvasRef.current || !containerRef.current) return;
        const page = await pdfDocRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        if (containerWidth === 0 || containerHeight === 0) return;

        const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        setCanvasDimensions({ width: scaledViewport.width, height: scaledViewport.height });

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, totalPages]);

    useEffect(() => { renderPage(); }, [renderPage]);

    const pageIndex = currentPage - 1;
    const settings = getPageSettings(stampOptions, pageIndex);

    const shouldShowStamp = (() => {
        if (!stampPreviewUrl) return false;
        switch (stampOptions.pageSelection) {
            case "all": return true;
            case "first": return pageIndex === 0;
            case "last": return pageIndex === totalPages - 1;
            case "custom": return stampOptions.customPages.includes(pageIndex);
            default: return true;
        }
    })();

    const stampOverlay = (() => {
        if (!shouldShowStamp || !canvasDimensions.width || !stampNaturalSize.width) return null;

        const maxStampDim = Math.min(canvasDimensions.width, canvasDimensions.height) * 0.4;
        const aspectRatio = stampNaturalSize.width / stampNaturalSize.height;
        let stampWidth = maxStampDim * (settings.scale / 100);
        let stampHeight = stampWidth / aspectRatio;
        if (stampHeight > maxStampDim * (settings.scale / 100)) {
            stampHeight = maxStampDim * (settings.scale / 100);
            stampWidth = stampHeight * aspectRatio;
        }

        const { left, top } = getStampOverlayPosition(canvasDimensions.width, canvasDimensions.height, stampWidth, stampHeight, settings);
        return { left, top, width: stampWidth, height: stampHeight };
    })();

    if (!pdfFile) {
        return (
            <Card className="flex items-center justify-center h-full border-dashed border-2 border-muted-foreground/25">
                <p className="text-muted-foreground text-sm">PDF yüklenince önizleme burada görünecek</p>
            </Card>
        );
    }

    return (
        <div className="flex flex-col h-full gap-2">
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => onCurrentPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground tabular-nums min-w-[80px] text-center">
                        {currentPage} / {totalPages}
                    </span>
                    <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => onCurrentPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div
                ref={containerRef}
                className="bg-muted/20 rounded-lg overflow-hidden flex-1 min-h-0 flex items-start justify-center"
            >
                <div className="relative" style={{ width: canvasDimensions.width || undefined, height: canvasDimensions.height || undefined }}>
                    <canvas ref={canvasRef} className="block" />
                    {stampOverlay && stampPreviewUrl && (
                        <img
                            src={stampPreviewUrl}
                            alt="Kaşe"
                            className="absolute pointer-events-none"
                            style={{
                                left: `${stampOverlay.left}px`,
                                top: `${stampOverlay.top}px`,
                                width: `${stampOverlay.width}px`,
                                height: `${stampOverlay.height}px`,
                                opacity: settings.opacity / 100,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
