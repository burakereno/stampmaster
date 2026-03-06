"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    StampOptions,
    StampPosition,
    PageStampSettings,
    DEFAULT_STAMP_SETTINGS,
    getPageSettings,
} from "@/lib/stamp-engine";

interface StampControlsProps {
    options: StampOptions;
    onChange: (options: StampOptions) => void;
    totalPages: number;
    selectedPages: number[];
    onSelectedPagesChange: (pages: number[]) => void;
}

const positionLabels: Record<StampPosition, string> = {
    "bottom-right": "Sağ Alt",
    "bottom-left": "Sol Alt",
    "top-right": "Sağ Üst",
    "top-left": "Sol Üst",
    center: "Orta",
};

export function StampControls({
    options,
    onChange,
    totalPages,
    selectedPages,
    onSelectedPagesChange,
}: StampControlsProps) {
    // Get the displayed settings: use the first selected page's settings
    const displaySettings: PageStampSettings =
        selectedPages.length > 0
            ? getPageSettings(options, selectedPages[0])
            : DEFAULT_STAMP_SETTINGS;

    // Update all selected pages at once
    const handleSettingChange = (partial: Partial<PageStampSettings>) => {
        const newPageSettings = { ...options.pageSettings };
        for (const pageIdx of selectedPages) {
            const current = getPageSettings(options, pageIdx);
            newPageSettings[pageIdx] = { ...current, ...partial };
        }
        onChange({ ...options, pageSettings: newPageSettings });
    };

    // Checkbox helpers
    const allSelected = totalPages > 0 && selectedPages.length === totalPages;
    const noneSelected = selectedPages.length === 0;

    const toggleAll = () => {
        if (allSelected) {
            onSelectedPagesChange([]);
        } else {
            onSelectedPagesChange(Array.from({ length: totalPages }, (_, i) => i));
        }
    };

    const togglePage = (pageIdx: number) => {
        if (selectedPages.includes(pageIdx)) {
            onSelectedPagesChange(selectedPages.filter((p) => p !== pageIdx));
        } else {
            onSelectedPagesChange([...selectedPages, pageIdx].sort((a, b) => a - b));
        }
    };

    return (
        <div className="space-y-4">
            {/* Page Checkbox Grid */}
            {totalPages > 1 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="select-all"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="rounded border-border accent-primary h-3.5 w-3.5"
                        />
                        <label htmlFor="select-all" className="text-xs font-medium cursor-pointer select-none">
                            Tümünü Seç
                        </label>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                            {selectedPages.length}/{totalPages} seçili
                        </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: totalPages }, (_, i) => {
                            const isSelected = selectedPages.includes(i);
                            const hasCustom = i in options.pageSettings;
                            return (
                                <button
                                    key={i}
                                    onClick={() => togglePage(i)}
                                    className={`text-[11px] py-1 rounded border transition-colors ${isSelected
                                        ? "bg-primary/15 border-primary/40 text-primary font-medium"
                                        : hasCustom
                                            ? "bg-muted/50 border-border text-muted-foreground"
                                            : "bg-transparent border-border/50 text-muted-foreground/60 hover:border-border"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                    <Separator />
                </div>
            )}

            {/* Settings — disabled if no pages selected */}
            <fieldset disabled={noneSelected} className={noneSelected ? "opacity-40" : ""}>
                <div className="space-y-4">
                    {/* Position */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                            Konum
                        </Label>
                        <Select
                            value={displaySettings.position}
                            onValueChange={(value: StampPosition) =>
                                handleSettingChange({ position: value })
                            }
                        >
                            <SelectTrigger className="w-full h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(positionLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* X Offset */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                Yatay Ayar
                            </Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {displaySettings.offsetX - 50 > 0 ? "+" : ""}
                                {displaySettings.offsetX - 50}
                            </span>
                        </div>
                        <Slider
                            value={[displaySettings.offsetX]}
                            onValueChange={([value]) => handleSettingChange({ offsetX: value })}
                            min={0} max={100} step={1}
                        />
                    </div>

                    {/* Y Offset */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                Dikey Ayar
                            </Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {displaySettings.offsetY - 50 > 0 ? "+" : ""}
                                {displaySettings.offsetY - 50}
                            </span>
                        </div>
                        <Slider
                            value={[displaySettings.offsetY]}
                            onValueChange={([value]) => handleSettingChange({ offsetY: value })}
                            min={0} max={100} step={1}
                        />
                    </div>

                    {/* Scale */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                Boyut
                            </Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                %{displaySettings.scale}
                            </span>
                        </div>
                        <Slider
                            value={[displaySettings.scale]}
                            onValueChange={([value]) => handleSettingChange({ scale: value })}
                            min={5} max={100} step={1}
                        />
                    </div>

                    {/* Opacity */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                Opaklık
                            </Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                %{displaySettings.opacity}
                            </span>
                        </div>
                        <Slider
                            value={[displaySettings.opacity]}
                            onValueChange={([value]) => handleSettingChange({ opacity: value })}
                            min={10} max={100} step={1}
                        />
                    </div>
                </div>
            </fieldset>

        </div>
    );
}
