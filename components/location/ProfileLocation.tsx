"use client";

import { useState, useEffect } from "react";
import {
  updateProfileLocation,
  getProfileLocation,
} from "@/app/actions/profile";
import LocationPicker from "@/components/location/LocationPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem } from "@/components/ui/form";

type LocationFormValues = {
  location: {
    lat: number;
    lng: number;
    display_name: string;
  };
};

export default function ProfileLocation({ userId }: { userId: string }) {
  console.log("ProfileLocation rendering", userId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationName, setLocationName] = useState<string>();
  const [open, setOpen] = useState(false);

  const form = useForm<LocationFormValues>({
    defaultValues: {
      location: {
        lat: 0,
        lng: 0,
        display_name: "",
      },
    },
  });

  // load initial location
  useEffect(() => {
    async function loadLocation() {
      if (!userId) return;
      const location = await getProfileLocation(userId);
      if (location) {
        setLocationName(location.display_name);
        form.reset({
          location: {
            lat: location.lat,
            lng: location.lng,
            display_name: location.display_name,
          },
        });
      }
    }
    loadLocation();
  }, [userId, form.reset]);

  const onSubmit = async (data: LocationFormValues) => {
    setLoading(true);
    setError("");

    try {
      await updateProfileLocation(userId, data.location.lat, data.location.lng);
      setLocationName(data.location.display_name);
      setOpen(false);
      form.reset();
    } catch (e) {
      console.error("Failed to update location:", e);
      setError("Failed to update location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-4">
          {locationName && (
            <span className="text-sm text-neutral-600">{locationName}</span>
          )}
          <DialogTrigger asChild>
            <Button variant="outline">Update</Button>
          </DialogTrigger>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Your Location</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="location"
                render={() => (
                  <FormItem>
                    <LocationPicker name="location" disabled={loading} />
                  </FormItem>
                )}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Location"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
