"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, X, Crop as CropIcon } from "lucide-react";
import { uploadCroppedNewsImage } from "@/app/actions/upload";

interface ImageCropperProps {
    onImageUploaded: (url: string) => void;
    currentImage?: string;
    onRemove?: () => void;
}

const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 600;
const ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT; // 4:3

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

export function ImageCropper({ onImageUploaded, currentImage, onRemove }: ImageCropperProps) {
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
        setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
    }, []);

    const getCroppedImg = useCallback(async (): Promise<string | null> => {
        if (!imgRef.current || !completedCrop) return null;

        const image = imgRef.current;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        // Set canvas to target size
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;

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
            TARGET_WIDTH,
            TARGET_HEIGHT
        );

        return canvas.toDataURL("image/jpeg", 0.9);
    }, [completedCrop]);

    const handleCropComplete = async () => {
        setIsUploading(true);
        try {
            const croppedDataUrl = await getCroppedImg();
            if (!croppedDataUrl) {
                alert("Gagal crop gambar");
                return;
            }

            const result = await uploadCroppedNewsImage(croppedDataUrl, "news-image.jpg");
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
        <>
            {currentImage ? (
                <div className="relative">
                    <img
                        src={currentImage}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
                >
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                        Klik untuk upload gambar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Ukuran: 800 x 600 px
                    </p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectFile}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CropIcon className="h-5 w-5" />
                            Crop Gambar (800 x 600 px)
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center">
                        {imgSrc && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={ASPECT_RATIO}
                                className="max-h-[400px]"
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop preview"
                                    src={imgSrc}
                                    onLoad={onImageLoad}
                                    className="max-h-[400px]"
                                />
                            </ReactCrop>
                        )}

                        <div className="flex gap-3 mt-4">
                            <Button
                                type="button"
                                variant="outline"
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
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Simpan Gambar"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
