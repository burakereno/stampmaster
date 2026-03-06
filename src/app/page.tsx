"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PdfDropzone } from "@/components/pdf-dropzone";
import { StampDropzone } from "@/components/stamp-dropzone";
import { StampControls } from "@/components/stamp-controls";
import { PdfPreview } from "@/components/pdf-preview";
import {
  DEFAULT_STAMP_OPTIONS,
  StampOptions,
  applyStamp,
} from "@/lib/stamp-engine";
import { toast } from "sonner";
import { Download, Stamp, Loader2 } from "lucide-react";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampPreviewUrl, setStampPreviewUrl] = useState<string | null>(null);
  const [stampOptions, setStampOptions] = useState<StampOptions>(DEFAULT_STAMP_OPTIONS);
  const [totalPages, setTotalPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // When totalPages changes, select all pages by default
  useEffect(() => {
    if (totalPages > 0) {
      setSelectedPages(Array.from({ length: totalPages }, (_, i) => i));
    } else {
      setSelectedPages([]);
    }
  }, [totalPages]);

  const handleStampFileSelect = useCallback((file: File) => {
    setStampFile(file);
    const url = URL.createObjectURL(file);
    setStampPreviewUrl(url);
  }, []);

  const handleStampClear = useCallback(() => {
    if (stampPreviewUrl) URL.revokeObjectURL(stampPreviewUrl);
    setStampFile(null);
    setStampPreviewUrl(null);
  }, [stampPreviewUrl]);

  const handlePdfClear = useCallback(() => {
    setPdfFile(null);
    setTotalPages(0);
    setStampOptions(DEFAULT_STAMP_OPTIONS);
  }, []);

  const handleTotalPagesChange = useCallback((total: number) => {
    setTotalPages(total);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!pdfFile || !stampFile) {
      toast.error("Lütfen hem PDF hem de kaşe görselini yükleyin.");
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const stampBytes = await stampFile.arrayBuffer();

      const result = await applyStamp(pdfBytes, stampBytes, stampFile.type, stampOptions);

      const blob = new Blob([new Uint8Array(result) as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(".pdf", "_kaseli.pdf");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Kaşeli PDF başarıyla indirildi!");
    } catch (error) {
      console.error(error);
      toast.error("PDF işlenirken bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  }, [pdfFile, stampFile, stampOptions]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary p-1.5">
              <Stamp className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">Kaseci</h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block leading-tight">
                PDF Kaşe Yerleştirme
              </p>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={!pdfFile || !stampFile || isProcessing}
            size="sm"
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Kaşele & İndir
          </Button>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-full">
          {/* Left Panel */}
          <div className="space-y-3 overflow-y-auto">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">PDF Dosyası</p>
              <PdfDropzone onFileSelect={setPdfFile} selectedFile={pdfFile} onClear={handlePdfClear} />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Kaşe Görseli</p>
              <StampDropzone
                onFileSelect={handleStampFileSelect}
                selectedFile={stampFile}
                previewUrl={stampPreviewUrl}
                onClear={handleStampClear}
              />
            </div>

            {pdfFile && stampFile && (
              <div>
                <Separator className="my-3" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Ayarlar</p>
                <StampControls
                  options={stampOptions}
                  onChange={setStampOptions}
                  totalPages={totalPages}
                  selectedPages={selectedPages}
                  onSelectedPagesChange={setSelectedPages}
                />
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="min-h-0 overflow-hidden">
            <PdfPreview
              pdfFile={pdfFile}
              stampPreviewUrl={stampPreviewUrl}
              stampOptions={stampOptions}
              onTotalPagesChange={handleTotalPagesChange}
              currentPage={currentPage}
              onCurrentPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
