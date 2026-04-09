"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { CarFilterControls } from "./filter-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CarFilters = ({ filters }) => {
  const router = useRouter();
  const pathname = usePathname(); // The usePathname hook is used to get the current URL path in a Next.js application. This allows the component to construct new URLs with updated query parameters when applying filters, ensuring that the user stays on the same page while the filters are applied.
  const searchParams = useSearchParams(); // The useSearchParams hook is used to access the current URL's query parameters in a Next.js application. This allows the component to read the existing filter values from the URL, which can be used to initialize the filter state and ensure that the filters reflect the current URL parameters when the page loads or when the user navigates back and forth.

  // Get current filter values from searchParams
  const currentMake = searchParams.get("make") || "";
  const currentBodyType = searchParams.get("bodyType") || "";
  const currentFuelType = searchParams.get("fuelType") || "";
  const currentTransmission = searchParams.get("transmission") || "";
  const currentMinPrice = searchParams.get("minPrice")
    ? parseInt(searchParams.get("minPrice"))
    : filters.priceRange.min;
  const currentMaxPrice = searchParams.get("maxPrice")
    ? parseInt(searchParams.get("maxPrice"))
    : filters.priceRange.max;
  const currentSortBy = searchParams.get("sortBy") || "newest";

  // Local state for filters
  const [make, setMake] = useState(currentMake);
  const [bodyType, setBodyType] = useState(currentBodyType);
  const [fuelType, setFuelType] = useState(currentFuelType);
  const [transmission, setTransmission] = useState(currentTransmission);
  const [priceRange, setPriceRange] = useState([
    currentMinPrice,
    currentMaxPrice,
  ]);
  const [sortBy, setSortBy] = useState(currentSortBy);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Update local state when URL parameters change
  useEffect(() => {
    setMake(currentMake);
    setBodyType(currentBodyType);
    setFuelType(currentFuelType);
    setTransmission(currentTransmission);
    setPriceRange([currentMinPrice, currentMaxPrice]);
    setSortBy(currentSortBy);
  }, [
    currentMake,
    currentBodyType,
    currentFuelType,
    currentTransmission,
    currentMinPrice,
    currentMaxPrice,
    currentSortBy,
  ]);

  // Count active filters
  const activeFilterCount = [
    make,
    bodyType,
    fuelType,
    transmission,
    currentMinPrice > filters.priceRange.min ||
      currentMaxPrice < filters.priceRange.max,
  ].filter(Boolean).length;

  // Update URL when filters change
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(); // This creates a new instance of URLSearchParams, which is used to construct the query parameters for the URL when applying filters. By creating a new instance, we can build the query string based on the current filter state and then push the new URL to the router, allowing the application to update the displayed car listings based on the selected filters.

    if (make) params.set("make", make); // The function then checks if each filter (e.g., make, bodyType, etc.) has a value. If the value is not empty, it adds the corresponding query parameter to params.
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);
    if (priceRange[0] > filters.priceRange.min)
      params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < filters.priceRange.max)
      params.set("maxPrice", priceRange[1].toString());
    if (sortBy !== "newest") params.set("sortBy", sortBy);

    // Preserve search and page params if they exist
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    if (search) params.set("search", search);
    if (page && page !== "1") params.set("page", page);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.push(url);
    setIsSheetOpen(false);
  }, [
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    sortBy,
    pathname,
    searchParams,
    router,
    filters.priceRange.min,
    filters.priceRange.max,
  ]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => { //value is come from the CarFilterControls component when a user interacts with the filter controls (e.g., selects a make, body type, fuel type, etc.). The handleFilterChange function takes the name of the filter that changed (filterName) and the new value for that filter (value). It then updates the corresponding state variable based on the filterName using a switch statement. This allows the component to keep track of the current filter selections made by the user, which can later be applied to update the URL and fetch the filtered car listings when the user clicks the "Show Results" button.
    switch (filterName) {
      case "make":
        setMake(value);
        break;
      case "bodyType":
        setBodyType(value);
        break;
      case "fuelType":
        setFuelType(value);
        break;
      case "transmission":
        setTransmission(value);
        break;
      case "priceRange":
        setPriceRange(value);
        break;
    }
  };

  // Handle clearing specific filter
  const handleClearFilter = (filterName) => {
    handleFilterChange(filterName, "");
  };

  // Clear all filters
  const clearFilters = () => {
    setMake("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    setPriceRange([filters.priceRange.min, filters.priceRange.max]);
    setSortBy("newest");

    // Keep search term if exists
    const params = new URLSearchParams(); // This creates a new instance of URLSearchParams, which is used to construct the query parameters for the URL when clearing the filters. By creating a new instance, we can start with a clean slate and only add back the search term if it exists, ensuring that all other filters are reset while preserving the user's search query.
    const search = searchParams.get("search");// The clearFilters function is responsible for resetting all the filter state variables to their default values (e.g., empty strings for make, body type, fuel type, transmission, and the default price range). However, it also checks if there is an existing search term in the URL parameters. If a search term exists, it preserves that search term in the new URL parameters when clearing the filters. This allows users to reset their filters while still keeping their search query intact, providing a better user experience when they want to start fresh with their filter selections but still want to see results based on their original search.
    if (search) params.set("search", search);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.push(url);
    setIsSheetOpen(false);
  };

  // Current filters object for the controls component
  const currentFilters = {
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    priceRangeMin: filters.priceRange.min,
    priceRangeMax: filters.priceRange.max,
  };

  return (
    <div className="flex lg:flex-col justify-between gap-4">
      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-full sm:max-w-md overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>

              <div className="py-6">
                <CarFilterControls
                  filters={filters} //props passed to the CarFilterControls component, providing it with the necessary data to render the filter options and manage the filter state. The filters prop contains all the available filter options (such as makes, body types, fuel types, etc.) that the CarFilterControls component will use to display the filter controls to the user. By passing this data as props, we ensure that the CarFilterControls component has access to the information it needs to function correctly and allow users to select their desired filters for browsing cars.
                  currentFilters={currentFilters} // The currentFilters prop is an object that contains the current state of all the filters (make, body type, fuel type, transmission, price range, etc.) that the user has selected. This allows the CarFilterControls component to display the current filter selections and manage changes to these filters. By passing the currentFilters as props, we enable the CarFilterControls component to reflect the user's current filter choices and update them as needed when the user interacts with the filter controls.
                  onFilterChange={handleFilterChange} // The onFilterChange prop is a callback function that is passed to the CarFilterControls component. This function is called whenever a filter value changes within the CarFilterControls component. It takes two arguments: the name of the filter that changed (e.g., "make", "bodyType", "fuelType", etc.) and the new value for that filter. By passing this function as a prop, we allow the CarFilterControls component to communicate changes in the filter state back to the parent CarFilters component, which can then update its local state accordingly and apply the filters when the user clicks the "Show Results" button.
                  onClearFilter={handleClearFilter}
                />
              </div>

              <SheetFooter className="sm:justify-between flex-row pt-2 border-t space-x-4 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button type="button" onClick={applyFilters} className="flex-1">
                  Show Results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Select
        value={sortBy}
        onValueChange={(value) => {
          setSortBy(value);
          // Apply filters immediately when sort changes
          setTimeout(() => applyFilters(), 0);
        }}
      >
        <SelectTrigger className="w-[180px] lg:w-full">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {[
            { value: "newest", label: "Newest First" },
            { value: "priceAsc", label: "Price: Low to High" },
            { value: "priceDesc", label: "Price: High to Low" },
          ].map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Desktop Filters */}
      <div className="hidden lg:block sticky top-24">
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-medium flex items-center">
              <Sliders className="mr-2 h-4 w-4" />
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm text-gray-600"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>

          <div className="p-4">
            <CarFilterControls
              filters={filters}
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
              onClearFilter={handleClearFilter}
            />
          </div>

          <div className="px-4 py-4 border-t">
            <Button onClick={applyFilters} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
