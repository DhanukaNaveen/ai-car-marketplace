"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Edit3, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useFetch from "@/hooks/use-fetch";
import { updateCar } from "@/actions/cars";
import NextImage from "next/image";

const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"];
const transmissions = ["Automatic", "Manual", "Semi-Automatic"];
const bodyTypes = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Convertible",
  "Coupe",
  "Wagon",
  "Pickup",
];
const carStatuses = ["AVAILABLE", "UNAVAILABLE", "SOLD"];

const carFormSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().refine((val) => {
    const year = parseInt(val, 10);
    return !isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1;
  }, "Valid year required"),
  price: z.string().min(1, "Price is required"),
  mileage: z.string().min(1, "Mileage is required"),
  color: z.string().min(1, "Color is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  bodyType: z.string().min(1, "Body type is required"),
  seats: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"]),
  featured: z.boolean().default(false),
});

export function EditCarForm({ car }) {
  const router = useRouter();
  const [existingImages, setExistingImages] = useState(car.images || []);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState("");

  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: car.make,
      model: car.model,
      year: car.year.toString(),
      price: car.price.toString(),
      mileage: car.mileage.toString(),
      color: car.color,
      fuelType: car.fuelType,
      transmission: car.transmission,
      bodyType: car.bodyType,
      seats: car.seats ? car.seats.toString() : "",
      description: car.description,
      status: car.status,
      featured: car.featured,
    },
  });

  useEffect(() => {
    reset({
      make: car.make,
      model: car.model,
      year: car.year.toString(),
      price: car.price.toString(),
      mileage: car.mileage.toString(),
      color: car.color,
      fuelType: car.fuelType,
      transmission: car.transmission,
      bodyType: car.bodyType,
      seats: car.seats ? car.seats.toString() : "",
      description: car.description,
      status: car.status,
      featured: car.featured,
    });
  }, [car, reset]);

  const {
    loading: updatingCar,
    fn: updateCarFn,
    data: updateResult,
    error: updateError,
    setData: setUpdateResult,
  } = useFetch(updateCar);

  useEffect(() => {
    if (updateResult?.success) {
      toast.success("Car updated successfully");
      router.push("/admin/cars");
      setUpdateResult(null);
    }
  }, [updateResult, router, setUpdateResult]);

  useEffect(() => {
    if (updateError) {
      toast.error(updateError.message || "Failed to update car");
    }
  }, [updateError]);

  const onMultiImagesDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit and will be skipped`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);

        const newImages = [];
        validFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            newImages.push(e.target.result);
            if (newImages.length === validFiles.length) {
              setUploadedImages((prev) => [...prev, ...newImages]);
              setUploadProgress(0);
              setImageError("");
              toast.success(`Successfully uploaded ${validFiles.length} new image(s)`);
            }
          };
          reader.readAsDataURL(file);
        });
      }
    }, 200);
  }, []);

  const { getRootProps: getMultiImageRootProps, getInputProps: getMultiImageInputProps } =
    useDropzone({
      onDrop: onMultiImagesDrop,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      },
      multiple: true,
    });

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (existingImages.length === 0 && uploadedImages.length === 0) {
      setImageError("Please keep at least one image or upload a new one");
      return;
    }

    const carData = {
      make: data.make,
      model: data.model,
      year: parseInt(data.year, 10),
      price: parseFloat(data.price),
      mileage: parseInt(data.mileage, 10),
      color: data.color,
      fuelType: data.fuelType,
      transmission: data.transmission,
      bodyType: data.bodyType,
      seats: data.seats ? parseInt(data.seats, 10) : null,
      description: data.description,
      status: data.status,
      featured: data.featured,
    };

    await updateCarFn(car.id, {
      carData,
      existingImages,
      newImages: uploadedImages,
    });
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Car Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  {...register("make")}
                  placeholder="e.g. Toyota"
                  className={errors.make ? "border-red-500" : ""}
                />
                {errors.make && <p className="text-xs text-red-500">{errors.make.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  {...register("model")}
                  placeholder="e.g. Camry"
                  className={errors.model ? "border-red-500" : ""}
                />
                {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  {...register("year")}
                  placeholder="e.g. 2022"
                  className={errors.year ? "border-red-500" : ""}
                />
                {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  {...register("price")}
                  placeholder="e.g. 25000"
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  {...register("mileage")}
                  placeholder="e.g. 15000"
                  className={errors.mileage ? "border-red-500" : ""}
                />
                {errors.mileage && <p className="text-xs text-red-500">{errors.mileage.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  {...register("color")}
                  placeholder="e.g. Blue"
                  className={errors.color ? "border-red-500" : ""}
                />
                {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  onValueChange={(value) => setValue("fuelType", value)}
                  defaultValue={getValues("fuelType")}
                >
                  <SelectTrigger className={errors.fuelType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fuelType && <p className="text-xs text-red-500">{errors.fuelType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission</Label>
                <Select
                  onValueChange={(value) => setValue("transmission", value)}
                  defaultValue={getValues("transmission")}
                >
                  <SelectTrigger className={errors.transmission ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    {transmissions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.transmission && <p className="text-xs text-red-500">{errors.transmission.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyType">Body Type</Label>
                <Select
                  onValueChange={(value) => setValue("bodyType", value)}
                  defaultValue={getValues("bodyType")}
                >
                  <SelectTrigger className={errors.bodyType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select body type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bodyType && <p className="text-xs text-red-500">{errors.bodyType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  {...register("seats")}
                  placeholder="e.g. 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  onValueChange={(value) => setValue("status", value)}
                  defaultValue={getValues("status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {carStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter detailed description of the car..."
                className={`min-h-32 ${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="featured"
                checked={getValues("featured")}
                onCheckedChange={(checked) => {
                  setValue("featured", checked);
                }}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="featured">Feature this car</Label>
                <p className="text-sm text-gray-500">Featured cars appear on the homepage</p>
              </div>
            </div>

            <div>
              <Label htmlFor="images" className={imageError ? "text-red-500" : ""}>
                Images {imageError && <span className="text-red-500">*</span>}
              </Label>
              <div className="mt-2 grid gap-4">
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Existing Images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden border">
                          <NextImage
                            src={image}
                            alt={`Existing image ${index + 1}`}
                            width={240}
                            height={140}
                            className="object-cover w-full h-32"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => removeExistingImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  {...getMultiImageRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition ${
                    imageError ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <input {...getMultiImageInputProps()} />
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600">Drag & drop or click to upload additional images</span>
                    <span className="text-xs text-gray-500 mt-1">(JPG, PNG, WebP, max 5MB each)</span>
                  </div>
                </div>

                {imageError && <p className="text-xs text-red-500">{imageError}</p>}

                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">New Images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden border">
                          <NextImage
                            src={image}
                            alt={`New image ${index + 1}`}
                            width={240}
                            height={140}
                            className="object-cover w-full h-32"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={updatingCar} className="w-full md:w-auto">
              {updatingCar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Car...
                </>
              ) : (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Update Car
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
