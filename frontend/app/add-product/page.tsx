'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Tag, AlignLeft, DollarSign, ListPlus, Loader2, ImagePlus, AlertCircle, X, GripVertical } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_IMAGES = 6;

interface ImagePreview {
  id: string;
  file: File;
  url: string;
}

export default function AddProductPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'SCHOOL',
  });

  const categories = ['SCHOOL', 'CLOTHES', 'HOUSING', 'LEISURE', 'ACCESSORIES', 'OTHER'];

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const remaining = MAX_IMAGES - images.length;
    const filesToAdd = newFiles.slice(0, remaining);

    const newPreviews: ImagePreview[] = filesToAdd.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newPreviews]);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = await getToken();

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price.toString());
      submitData.append('category', formData.category);

      images.forEach((img) => {
        submitData.append('images', img.file);
      });

      await axios.post('http://127.0.0.1:3000/listings', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push('/listings');
    } catch (err: any) {
      const errData = err.response?.data;
      const backendMessage = errData?.message
        ? Array.isArray(errData.message)
          ? errData.message.join(', ')
          : errData.message
        : err.message || 'An error occurred while creating the listing.';

      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 py-10 px-4 sm:px-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        {/* Back Button */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-6 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-black">
            Create a Listing
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Share what you're offering with the UIC community.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Image Upload ── */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-zinc-400" />
                Photos
                <span className="text-zinc-400 font-medium ml-1">
                  ({images.length}/{MAX_IMAGES})
                </span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {/* Existing previews */}
                <AnimatePresence mode="popLayout">
                  {images.map((img, idx) => (
                    <motion.div
                      key={img.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-200 group bg-zinc-100"
                    >
                      <img
                        src={img.url}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Cover badge on first image */}
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          Cover
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add more button */}
                {images.length < MAX_IMAGES && (
                  <motion.div
                    layout
                    className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#3252DF] bg-zinc-50 hover:bg-[#3252DF]/5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group relative"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageAdd}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <ImagePlus className="h-6 w-6 text-zinc-400 group-hover:text-[#3252DF] transition-colors mb-1" />
                    <span className="text-[10px] font-bold text-zinc-400 group-hover:text-[#3252DF] transition-colors">
                      Add
                    </span>
                  </motion.div>
                )}
              </div>

              <p className="text-[11px] text-zinc-400 font-medium">
                First image will be the cover. You can upload up to {MAX_IMAGES} photos.
              </p>
            </div>

            {/* ── Title ── */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black flex items-center gap-2">
                <Tag className="h-4 w-4 text-zinc-400" />
                Title
              </label>
              <Input
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. TI-84 Plus CE Calculator"
                className="w-full rounded-xl py-5 text-sm font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50"
              />
            </div>

            {/* ── Description ── */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-zinc-400" />
                Description
              </label>
              <Textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the condition, location to meet up, etc."
                className="w-full rounded-xl p-4 text-sm font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50 resize-none"
              />
            </div>

            {/* ── Price + Category ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-zinc-400" />
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">$</span>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-xl pl-8 py-5 text-sm font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <ListPlus className="h-4 w-4 text-zinc-400" />
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val || 'SCHOOL' })}
                >
                  <SelectTrigger className="w-full rounded-xl py-5 text-sm font-medium bg-zinc-50 border-zinc-200 focus:ring-[#3252DF]/50">
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

            {/* ── Submit ── */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-sm font-bold bg-[#272343] hover:bg-black text-white rounded-xl shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  'Publish Listing'
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
