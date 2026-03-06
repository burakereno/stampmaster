"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Stamp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface StampDropzoneProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    previewUrl: string | null;
    onClear: () => void;
}

export function StampDropzone({
    onFileSelect,
    selectedFile,
    previewUrl,
    onClear,
}: StampDropzoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleClick = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".png,.jpg,.jpeg";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) onFileSelect(file);
        };
        input.click();
    }, [onFileSelect]);

    if (selectedFile && previewUrl) {
        return (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                <div className="relative h-8 w-8 shrink-0 rounded overflow-hidden bg-white/10 flex items-center justify-center">
                    <Image
                        src={previewUrl}
                        alt="Kaşe önizleme"
                        fill
                        className="object-contain p-0.5"
                    />
                </div>
                <span className="text-sm font-medium truncate flex-1 min-w-0">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    className="shrink-0 h-7 w-7"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    }

    return (
        <Card
            className={`p-5 border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-muted/30 ${isDragOver
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25"
                }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-muted p-2">
                    <Stamp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium">Kaşe görselini sürükleyin</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        PNG veya JPG formatı
                    </p>
                </div>
            </div>
        </Card>
    );
}
