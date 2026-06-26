"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Tag,
  AlignLeft,
  DollarSign,
  ListPlus,
  Loader2,
  ImagePlus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://127.0.0.1:3000${url}`;
};

export default function EditListingPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "SCHOOL",
    status: "ACTIVE",
  });

  const categories = [
    "SCHOOL",
    "CLOTHES",
    "DORM",
    "SUBLEASE",
    "LEISURE",
    "ACCESSORIES",
    "OTHER",
  ];

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    const fetchListing = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          `http://127.0.0.1:3000/listings/${listingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const listing = res.data;
        setFormData({
          title: listing.title || "",
          description: listing.description || "",
          price: listing.price?.toString() || "",
          category: listing.category || "SCHOOL",
          status: listing.status || "ACTIVE",
        });

        if (listing.images) {
          setImages(
            listing.images.map((img: any) => ({
              id: img.id,
              url: getImageUrl(img.url),
            })),
          );
        }
      } catch (err: any) {
        console.error("Failed to fetch listing", err);
        setError(
          "Could not load listing data. It may have been deleted or you do not have permission.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [listingId, isLoaded, isSignedIn, getToken, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const token = await getToken();
      // The updateListing endpoint expects a JSON body (CreateListingDto)
      await axios.put(
        `http://127.0.0.1:3000/listings/${listingId}`,
        {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          category: formData.category,
          status: formData.status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      router.push(`/listings/${listingId}`);
    } catch (err: any) {
      const errData = err.response?.data;
      const backendMessage = errData?.message
        ? Array.isArray(errData.message)
          ? errData.message.join(", ")
          : errData.message
        : err.message || "An error occurred while saving the listing.";

      setError(backendMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-secondary flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10 px-4 sm:px-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        {/* Back Button */}
        <Link
          href={`/listings/${listingId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listing
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Edit Listing
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Update the details of your marketplace offering.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Image Display (Read-Only) ── */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                Photos{" "}
                <span className="text-muted-foreground font-medium text-xs ml-1">
                  (Read-only)
                </span>
              </label>

              {images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-secondary"
                    >
                      <img
                        src={img.url}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover opacity-80"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-foreground/70 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-medium text-muted-foreground italic py-2">
                  No images attached to this listing.
                </div>
              )}
              <p className="text-[11px] text-muted-foreground font-medium">
                Image updates are currently disabled. You must delete and
                recreate the listing to change images.
              </p>
            </div>

            {/* ── Title ── */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Title
              </label>
              <Input
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. TI-84 Plus CE Calculator"
                className="w-full rounded-2xl py-5 text-sm font-medium bg-secondary border-border focus-visible:ring-[#3252DF]/50"
              />
            </div>

            {/* ── Description ── */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                Description
              </label>
              <Textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the condition, location to meet up, etc."
                className="w-full rounded-2xl p-4 text-sm font-medium bg-secondary border-border focus-visible:ring-[#3252DF]/50 resize-none"
              />
            </div>

            {/* ── Price + Category ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                    $
                  </span>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-2xl pl-8 py-5 text-sm font-medium bg-secondary border-border focus-visible:ring-[#3252DF]/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ListPlus className="h-4 w-4 text-muted-foreground" />
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData({ ...formData, category: val || "SCHOOL" })
                  }
                >
                  <SelectTrigger className="w-full rounded-2xl py-5 text-sm font-medium bg-secondary border-border focus:ring-[#3252DF]/50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Status ── */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val || "ACTIVE" })
                }
              >
                <SelectTrigger className="w-full rounded-2xl py-5 text-sm font-medium bg-secondary border-border focus:ring-[#3252DF]/50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    Active (Visible to everyone)
                  </SelectItem>
                  <SelectItem value="RESERVED">
                    Reserved (Pending sale)
                  </SelectItem>
                  <SelectItem value="SOLD">Sold (Not visible)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Submit ── */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 text-sm font-bold bg-[#272343] hover:bg-foreground text-primary-foreground rounded-2xl shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
