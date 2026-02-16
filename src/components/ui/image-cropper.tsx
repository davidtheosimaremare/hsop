"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/canvasUtils";
import { Loader2 } from "lucide-react";

interface ImageCropperProps {
    imageSrc: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCropComplete: (blob: Blob) => void;
    aspect?: number;
}

export function ImageCropper({ imageSrc, open, onOpenChange, onCropComplete, aspect = 1 }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsLoading(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
                onOpenChange(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Sesuaikan Gambar</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-80 bg-gray-900 rounded-md overflow-hidden">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteInternal}
                            cropShape="round"
                            showGrid={false}
                            restrictPosition={false}
                            minZoom={0.5}
                        />
                    )}
                </div>
                <div className="space-y-2 py-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Zoom</span>
                        <span>{zoom.toFixed(1)}x</span>
                    </div>
                    <Slider
                        value={[zoom]}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onValueChange={(v: number[]) => onZoomChange(v[0])}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan & Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
