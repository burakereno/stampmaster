import { PDFDocument } from "pdf-lib";

export type StampPosition =
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left"
    | "center";

export type PageSelection = "all" | "first" | "last" | "custom";

export interface PageStampSettings {
    position: StampPosition;
    offsetX: number;
    offsetY: number;
    scale: number;
    opacity: number;
}

export interface StampOptions {
    pageSelection: PageSelection;
    customPages: number[];
    pageSettings: Record<number, PageStampSettings>;
}

export const DEFAULT_STAMP_SETTINGS: PageStampSettings = {
    position: "bottom-right",
    offsetX: 50,
    offsetY: 50,
    scale: 50,
    opacity: 100,
};

export const DEFAULT_STAMP_OPTIONS: StampOptions = {
    pageSelection: "all",
    customPages: [],
    pageSettings: {},
};

/** Get stamp settings for a page, falling back to defaults */
export function getPageSettings(
    options: StampOptions,
    pageIndex: number
): PageStampSettings {
    return options.pageSettings[pageIndex] ?? DEFAULT_STAMP_SETTINGS;
}

function getStampCoordinates(
    pageWidth: number,
    pageHeight: number,
    stampWidth: number,
    stampHeight: number,
    settings: PageStampSettings
): { x: number; y: number } {
    const margin = 30;

    const positions: Record<StampPosition, { x: number; y: number }> = {
        "bottom-right": { x: pageWidth - stampWidth - margin, y: margin },
        "bottom-left": { x: margin, y: margin },
        "top-right": { x: pageWidth - stampWidth - margin, y: pageHeight - stampHeight - margin },
        "top-left": { x: margin, y: pageHeight - stampHeight - margin },
        center: { x: (pageWidth - stampWidth) / 2, y: (pageHeight - stampHeight) / 2 },
    };

    const base = positions[settings.position];
    const maxOffsetX = pageWidth * 0.3;
    const maxOffsetY = pageHeight * 0.3;
    const deltaX = ((settings.offsetX - 50) / 50) * maxOffsetX;
    const deltaY = ((settings.offsetY - 50) / 50) * maxOffsetY;

    return {
        x: Math.max(0, Math.min(pageWidth - stampWidth, base.x + deltaX)),
        y: Math.max(0, Math.min(pageHeight - stampHeight, base.y - deltaY)),
    };
}

function getTargetPages(totalPages: number, options: StampOptions): number[] {
    switch (options.pageSelection) {
        case "first": return [0];
        case "last": return [totalPages - 1];
        case "custom": return options.customPages.filter((p) => p >= 0 && p < totalPages);
        case "all":
        default: return Array.from({ length: totalPages }, (_, i) => i);
    }
}

export async function applyStamp(
    pdfBytes: ArrayBuffer,
    stampImageBytes: ArrayBuffer,
    stampMimeType: string,
    options: StampOptions
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    let stampImage;
    if (stampMimeType === "image/png") {
        stampImage = await pdfDoc.embedPng(stampImageBytes);
    } else {
        stampImage = await pdfDoc.embedJpg(stampImageBytes);
    }

    const pages = pdfDoc.getPages();
    const targetPages = getTargetPages(pages.length, options);

    for (const pageIndex of targetPages) {
        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const settings = getPageSettings(options, pageIndex);

        const maxStampDim = Math.min(pageWidth, pageHeight) * 0.4;
        const aspectRatio = stampImage.width / stampImage.height;
        let stampWidth = maxStampDim * (settings.scale / 100);
        let stampHeight = stampWidth / aspectRatio;

        if (stampHeight > maxStampDim * (settings.scale / 100)) {
            stampHeight = maxStampDim * (settings.scale / 100);
            stampWidth = stampHeight * aspectRatio;
        }

        const { x, y } = getStampCoordinates(pageWidth, pageHeight, stampWidth, stampHeight, settings);

        page.drawImage(stampImage, {
            x, y,
            width: stampWidth,
            height: stampHeight,
            opacity: settings.opacity / 100,
        });
    }

    return await pdfDoc.save();
}
