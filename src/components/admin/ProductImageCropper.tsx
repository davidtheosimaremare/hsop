"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, X, Crop as CropIcon } from "lucide-react";
import { uploadCroppedImage } from "@/app/actions/upload";

interface ProductImageCropperProps {
    onImageUploaded: (url: string) => void;
    currentImage?: string;
    onRemove?: () => void;
    aspectRatio?: number;
    targetWidth?: number;
    targetHeight?: number;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export function ProductImageCropper({ 
    onImageUploaded, 
    currentImage, 
    onRemove,
    aspectRatio = 1, // Default to 1:1
    targetWidth = 1000,
    targetHeight = 1000
}: ProductImageCropperProps) {
    const [imgSrc, setImgSrc] = useState("");
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImgSrc(reader.result?.toString() || "");
                setIsDialogOpen(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspectRatio));
    }, [aspectRatio]);

    const getCroppedImg = useCallback(async (): Promise<string | null> => {
        if (!imgRef.current || !completedCrop) return null;

        const image = imgRef.current;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        // Set canvas to target size
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Fill with white background (useful for transparent PNGs)
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scale
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Draw cropped image scaled to target size
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            targetWidth,
            targetHeight
        );

        return canvas.toDataURL("image/jpeg", 0.9);
    }, [completedCrop, targetWidth, targetHeight]);

    const handleCropComplete = async () => {
        setIsUploading(true);
        try {
            const croppedDataUrl = await getCroppedImg();
            if (!croppedDataUrl) {
                alert("Gagal crop gambar");
                return;
            }

            const result = await uploadCroppedImage(croppedDataUrl, "product-image.jpg", "products");
            if (result.success && result.url) {
                onImageUploaded(result.url);
                setIsDialogOpen(false);
                setImgSrc("");
            } else {
                alert("Gagal upload gambar: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Gagal upload gambar");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full">
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all group"
            >
                <Upload className="h-8 w-8 mx-auto text-slate-300 group-hover:text-red-400 mb-2 transition-colors" />
                <p className="text-sm font-bold text-slate-500 group-hover:text-red-600 transition-colors">
                    Upload Foto Produk
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                    Rasio 1:1 (Persegi)
                </p>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectFile}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <CropIcon className="h-5 w-5 text-red-600" />
                            Sesuaikan Foto Produk
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center">
                        <p className="text-xs text-slate-500 mb-6 font-medium">Geser dan sesuaikan kotak agar produk berada di tengah.</p>
                        
                        {imgSrc && (
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={aspectRatio}
                                    className="max-h-[450px]"
                                >
                                    <img
                                        ref={imgRef}
                                        alt="Crop preview"
                                        src={imgSrc}
                                        onLoad={onImageLoad}
                                        className="max-h-[450px] rounded-lg"
                                    />
                                </ReactCrop>
                            </div>
                        )}

                        <div className="flex gap-3 mt-8 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-xl h-11 font-bold text-slate-600"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setImgSrc("");
                                }}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCropComplete}
                                disabled={isUploading || !completedCrop}
                                className="flex-[2] bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 font-black uppercase tracking-widest text-xs shadow-lg shadow-red-600/20"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Simpan Potongan Gambar"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
