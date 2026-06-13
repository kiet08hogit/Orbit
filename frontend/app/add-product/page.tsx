'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Tag, AlignLeft, DollarSign, ListPlus, Loader2, ImagePlus, AlertCircle, X, GripVertical, ShieldCheck, Banknote, UploadCloud } from 'lucide-react';
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
  const { getToken, userId } = useAuth();
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
    acceptsDirectPayment: true,
    acceptsProtectedPayment: false,
  });

  const [isStripeLinked, setIsStripeLinked] = useState(false);
  const [isLoadingStripeStatus, setIsLoadingStripeStatus] = useState(true);

  // Fetch Stripe status on mount
  useEffect(() => {
    const fetchStripeStatus = async () => {
      try {
        const token = await getToken();
        if (token) {
          const res = await axios.get(`http://127.0.0.1:3000/payments/connect/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsStripeLinked(res.data.linked);
        }
      } catch (err) {
        console.error("Failed to fetch Stripe status", err);
      } finally {
        setIsLoadingStripeStatus(false);
      }
    };
    fetchStripeStatus();
  }, [getToken]);

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
      submitData.append('acceptsDirectPayment', formData.acceptsDirectPayment.toString());
      submitData.append('acceptsProtectedPayment', formData.acceptsProtectedPayment.toString());

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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f5f7] py-10 px-4 sm:px-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#1d1d1f] transition-colors mb-6 text-[14px] font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold tracking-tight text-[#1d1d1f]">
            Create a Listing
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-[20px] p-6 md:p-8 shadow-sm">
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-[14px]">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Image Upload ── */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#1d1d1f]">Upload Image</label>
              
              <div className="relative w-full border-2 border-dashed border-zinc-300 rounded-[14px] p-8 flex flex-col items-center justify-center hover:bg-zinc-50 hover:border-[#0066cc] transition-colors group cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <UploadCloud className="h-8 w-8 text-zinc-400 group-hover:text-[#0066cc] transition-colors mb-3" />
                <p className="text-[14px] text-zinc-600 mb-1 text-center">Drag and drop your image here, or click to select a file</p>
                <p className="text-[12px] text-zinc-400 text-center">(Only *.jpeg, *.jpg, *.png images will be accepted)</p>
              </div>

              {/* Previews */}
              {images.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 hide-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {images.map((img, idx) => (
                      <motion.div
                        key={img.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-100"
                      >
                        <img src={img.url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Cover
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <p className="text-[11px] text-zinc-400 font-medium">
                ({images.length}/{MAX_IMAGES}) uploaded. First image will be the cover.
              </p>
            </div>

            {/* ── Category ── */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#1d1d1f]">Category</label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val || 'SCHOOL' })}
              >
                <SelectTrigger className="w-full h-12 rounded-[14px] bg-zinc-50 border-zinc-200 text-[14px] focus:ring-[#0066cc] focus:ring-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-[14px]">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-lg">
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Title ── */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#1d1d1f]">Title</label>
              <Input
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. TI-84 Plus CE Calculator"
                className="w-full h-12 rounded-[14px] px-4 text-[14px] bg-zinc-50 border-zinc-200 focus-visible:ring-[#0066cc] focus-visible:ring-1"
              />
            </div>

            {/* ── Price ── */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#1d1d1f]">Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-[14px]">$</span>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full h-12 rounded-[14px] pl-8 pr-4 text-[14px] bg-zinc-50 border-zinc-200 focus-visible:ring-[#0066cc] focus-visible:ring-1"
                />
              </div>
            </div>

            {/* ── Description ── */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#1d1d1f]">Description</label>
              <Textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide any additional details about the item..."
                className="w-full min-h-[120px] rounded-[14px] p-4 text-[14px] bg-zinc-50 border-zinc-200 focus-visible:ring-[#0066cc] focus-visible:ring-1 resize-none"
              />
            </div>

            {/* ── Payment Settings ── */}
            <div className="space-y-3 pt-2">
              <label className="text-[13px] font-semibold text-[#1d1d1f]">Payment Options</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Direct Payment */}
                <div 
                  className={`border-[1.5px] rounded-[14px] p-4 cursor-pointer transition-all ${formData.acceptsDirectPayment ? 'border-[#0066cc] bg-[#0066cc]/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                  onClick={() => setFormData(prev => ({ ...prev, acceptsDirectPayment: !prev.acceptsDirectPayment }))}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#1d1d1f] text-[14px]">Direct Payment</span>
                    <div className={`h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${formData.acceptsDirectPayment ? 'border-[#0066cc] bg-[#0066cc]' : 'border-zinc-300'}`}>
                      {formData.acceptsDirectPayment && <div className="h-2 w-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-500">Cash, Zelle, Venmo at meetup.</p>
                </div>

                {/* Protected Payment */}
                <div 
                  className={`border-[1.5px] rounded-[14px] p-4 cursor-pointer transition-all relative overflow-hidden ${formData.acceptsProtectedPayment ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                  onClick={() => {
                    if (!isStripeLinked) {
                      setError("You must connect your bank account in your Profile before enabling protected payments.");
                      return;
                    }
                    setError("");
                    setFormData(prev => ({ ...prev, acceptsProtectedPayment: !prev.acceptsProtectedPayment }))
                  }}
                >
                  {isLoadingStripeStatus && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#1d1d1f] text-[14px] flex items-center gap-1.5">
                      Protected Payment
                    </span>
                    <div className={`h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${formData.acceptsProtectedPayment ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-300'}`}>
                      {formData.acceptsProtectedPayment && <div className="h-2 w-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-500">Card payments via Circlo Escrow.</p>
                  
                  {!isStripeLinked && !isLoadingStripeStatus && (
                    <div className="mt-2 text-[11px] font-semibold text-[#0066cc] hover:underline" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/${userId}`);
                    }}>
                      Connect bank account first →
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-[14px] bg-[#1d1d1f] hover:bg-black text-white text-[15px] font-semibold transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
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
