"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/prisma";
import { createClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { serializeCarData } from "@/lib/helpers";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

// Function to convert File to base64
async function fileToBase64(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString("base64");
}

// Upload a list of base64-encoded images to Supabase storage and return public URLs
async function uploadCarImages(carId, images) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const folderPath = `cars/${carId}`;
  const imageUrls = [];

  for (let i = 0; i < images.length; i++) {
    const base64Data = images[i];
    if (!base64Data || !base64Data.startsWith("data:image/")) {
      console.warn("Skipping invalid image data");
      continue;
    }

    const base64 = base64Data.split(",")[1];
    const imageBuffer = Buffer.from(base64, "base64");
    const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
    const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";
    const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
    const filePath = `${folderPath}/${fileName}`;

    const { error } = await supabase.storage
      .from("car-images")
      .upload(filePath, imageBuffer, {
        contentType: `image/${fileExtension}`,
      });

    if (error) {
      console.error("Error uploading image:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;
    imageUrls.push(publicUrl);
  }

  return imageUrls;
}

// Gemini AI integration for car image processing
export async function processCarImageWithAI(file) {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Initialize Gemini API with the provided API key
    const modelName =
      process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName }); // Configurable to avoid model name drift

    // Convert image file to base64
    const base64Image = await fileToBase64(file); // Convert the uploaded image file to a base64 string for inline data usage 

    // Create image part for the model
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    // Define the prompt for car detail extraction
    const prompt = `
      Analyze this car image and extract the following information:
      1. Make (manufacturer)
      2. Model
      3. Year (approximately)
      4. Color
      5. Body type (SUV, Sedan, Hatchback, etc.)
      6. Mileage
      7. Fuel type (your best guess)
      8. Transmission type (your best guess)
      9. Price (your best guess)
      9. Short Description as to be added to a car listing

      Format your response as a clean JSON object with these fields:
      {
        "make": "",
        "model": "",
        "year": 0000,
        "color": "",
        "price": "",
        "mileage": "",
        "bodyType": "",
        "fuelType": "",
        "transmission": "",
        "description": "",
        "confidence": 0.0
      }

      For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
      Only respond with the JSON object, nothing else.
    `;

    // Get response from Gemini
    const result = await model.generateContent([imagePart, prompt]);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse the JSON response
    try {
      const carDetails = JSON.parse(cleanedText);  // Attempt to parse the cleaned text as JSON object

      // Validate the response format
      const requiredFields = [
        "make",
        "model",
        "year",
        "color",
        "bodyType",
        "price",
        "mileage",
        "fuelType",
        "transmission",
        "description",
        "confidence",
      ];

      const missingFields = requiredFields.filter(
        (field) => !(field in carDetails)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `AI response missing required fields: ${missingFields.join(", ")}`
        );
      }

      // Return success response with data
      return {
        success: true,
        data: carDetails,
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", text);
      return {
        success: false,
        error: "Failed to parse AI response",
      };
    }
  } catch (error) {
    console.error();
    throw new Error("Gemini API error:" + error.message);
  }
}

// Add a car to the database with images
export async function addCar({ carData, images }) {
  try {
    await requireAdmin();

    // Create a unique folder name for this car's images
    const carId = uuidv4(); // Generate a unique ID for the car, which will also be used as the folder name in Supabase storage
    const folderPath = `cars/${carId}`;

    // Initialize Supabase client for server-side operations
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const imageUrls = await uploadCarImages(carId, images);

    if (imageUrls.length === 0) {
      throw new Error("No valid images were uploaded");
    }

    // Add the car to the database
    const car = await db.car.create({
      data: {
        id: carId, // Use the same ID we used for the folder
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        color: carData.color,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        bodyType: carData.bodyType,
        seats: carData.seats,
        description: carData.description,
        status: carData.status,
        featured: carData.featured,
        images: imageUrls, // Store the array of image URLs
      },
    });

    // Revalidate the cars list page
    revalidatePath("/admin/cars"); //revalidate mean to refresh the page data after a change, so the new car will appear in the list without needing a manual refresh 

    return {
      success: true,
    };
  } catch (error) {
    throw new Error("Error adding car:" + error.message);
  }
}

export async function getCarById(id) {
  try {
    await requireAdmin();

    const car = await db.car.findUnique({
      where: { id },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    return {
      success: true,
      data: serializeCarData(car),
    };
  } catch (error) {
    console.error("Error fetching car:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateCar(id, { carData, existingImages, newImages }) {
  try {
    await requireAdmin();

    // Ensure the car exists
    const existingCar = await db.car.findUnique({
      where: { id },
    });

    if (!existingCar) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    const updatePayload = {
      make: carData.make,
      model: carData.model,
      year: carData.year,
      price: carData.price,
      mileage: carData.mileage,
      color: carData.color,
      fuelType: carData.fuelType,
      transmission: carData.transmission,
      bodyType: carData.bodyType,
      seats: carData.seats,
      description: carData.description,
      status: carData.status,
      featured: carData.featured,
      images: existingImages ?? existingCar.images,
    };

    if (newImages && newImages.length > 0) {
      const newImageUrls = await uploadCarImages(id, newImages);
      updatePayload.images = [...(updatePayload.images || []), ...newImageUrls];
    }

    if (!updatePayload.images || updatePayload.images.length === 0) {
      throw new Error("A car must have at least one image");
    }

    await db.car.update({
      where: { id },
      data: updatePayload,
    });

    revalidatePath("/admin/cars");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating car:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Fetch all cars with simple search
export async function getCars(search = "") {  
  try {
    // Build where conditions
    let where = {};

    // Add search filter
    if (search) {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute main query
    const cars = await db.car.findMany({
      where, // Apply the search filter if provided, otherwise fetch all cars
      orderBy: { createdAt: "desc" },
    });

    const serializedCars = cars.map(serializeCarData);// Serialize the car data to ensure it's in a format suitable for frontend consumption, such as converting Date objects to strings and ensuring all fields are properly formatted

    return {
      success: true,
      data: serializedCars,
    };
  } catch (error) {
    console.error("Error fetching cars:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete a car by ID
export async function deleteCar(id) {
  try {
    await requireAdmin();

    // First, fetch the car to get its images
    const car = await db.car.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Delete the car from the database
    await db.car.delete({
      where: { id },
    });

    // Delete the images from Supabase storage
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);

      // Extract file paths from image URLs
      const filePaths = car.images
        .map((imageUrl) => {
          const url = new URL(imageUrl);
          const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
          return pathMatch ? pathMatch[1] : null;
        })
        .filter(Boolean);

      // Delete files from storage if paths were extracted
      if (filePaths.length > 0) {
        const { error } = await supabase.storage
          .from("car-images")
          .remove(filePaths);

        if (error) {
          console.error("Error deleting images:", error);
          // We continue even if image deletion fails
        }
      }
    } catch (storageError) {
      console.error("Error with storage operations:", storageError);
      // Continue with the function even if storage operations fail
    }

    // Revalidate the cars list page
    revalidatePath("/admin/cars");// Revalidate the cars list page to reflect the deletion immediately in the admin interface

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting car:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update car status or featured status
export async function updateCarStatus(id, { status, featured }) {
  try {
    await requireAdmin();

    const updateData = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (featured !== undefined) {
      updateData.featured = featured;
    }

    // Update the car
    await db.car.update({
      where: { id },
      data: updateData,
    });

    // Revalidate the cars list page
    revalidatePath("/admin/cars");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating car status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
