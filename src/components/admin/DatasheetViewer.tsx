"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText, ExternalLink, Loader2 } from "lucide-react";

interface DatasheetViewerProps {
    sku: string;
}

export function DatasheetViewer({ sku }: DatasheetViewerProps) {
    const datasheetUrl = `https://mall.industry.siemens.com/teddatasheet/?format=PDF&mlfbs=${sku}&language=en&caller=SiePortal`;
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="flex gap-4">
            {/* Download Button (Direct) */}
            <Button className="flex-1" variant="outline" asChild>
                <a
                    href={datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </a>
            </Button>

            {/* View Modal Button */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                        <FileText className="mr-2 h-4 w-4" />
                        View Datasheet
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-4 border-b flex-shrink-0 bg-white z-10">
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            Datasheet Viewer: {sku}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 relative bg-gray-100 w-full overflow-hidden">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        )}
                        <iframe
                            src={datasheetUrl}
                            className="w-full h-full border-none"
                            onLoad={() => setIsLoading(false)}
                            title={`Datasheet for ${sku}`}
                        />
                    </div>

                    <div className="p-4 border-t bg-gray-50 flex justify-between items-center text-sm text-gray-500 shrink-0">
                        <p>Jika PDF tidak muncul, browser Anda mungkin memblokir embed.</p>
                        <Button size="sm" variant="outline" asChild>
                            <a href={datasheetUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Buka di Tab Baru
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
