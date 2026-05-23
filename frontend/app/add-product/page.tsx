'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag, AlignLeft, DollarSign, ListPlus, Loader2, Sparkles, ImagePlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddProductPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'SCHOOL',
  });

  const categories = ['SCHOOL', 'CLOTHES', 'HOUSING', 'LEISURE', 'ACCESSORIES', 'OTHER'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const response = await axios.post('http://localhost:3000/listings', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // axios automatically sets the correct Content-Type for FormData
        },
      });

      // Automatically redirect to the marketplace/swipe page on success
      router.push('/listings');
    } catch (err: any) {
      // Axios wraps the response in err.response
      const errData = err.response?.data;
      const backendMessage = errData?.message 
        ? (Array.isArray(errData.message) ? errData.message.join(', ') : errData.message) 
        : (err.message || 'An error occurred while creating the listing.');
      
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white py-12 px-4 sm:px-6 relative overflow-hidden font-sans">
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-red-600/5 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-orange-500/5 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <Link href="/listings" className="inline-flex items-center gap-2 text-zinc-500 hover:text-black transition-colors mb-8 font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* Header */}
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-[#DC2626]" />
            Create a Listing
          </h1>
          <p className="text-zinc-500 text-lg font-medium">
            Share what you're offering with the UIC community.
          </p>
        </div>

        {/* Premium Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl shadow-zinc-200/50 relative">
          
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
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
                className="w-full rounded-xl py-6 text-base font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50"
              />
            </div>

            {/* Description */}
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
                className="w-full rounded-xl p-4 text-base font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50 resize-none"
              />
            </div>

            {/* Image Upload UI */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-zinc-400" />
                Upload Picture
              </label>
              
              <div className="relative group border-2 border-dashed border-zinc-300 hover:border-[#3252DF]/50 rounded-2xl p-6 transition-all text-center overflow-hidden cursor-pointer bg-zinc-50">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {imagePreview ? (
                  <div className="relative w-full rounded-xl overflow-hidden shadow-inner bg-zinc-100 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="object-contain w-full h-auto max-h-[400px]" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold backdrop-blur-sm">
                      Click to change image
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 py-4 text-zinc-500">
                    <div className="h-14 w-14 rounded-full bg-[#3252DF]/10 text-[#3252DF] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#3252DF]/20 transition-all duration-300 shadow-sm">
                      <ImagePlus className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-bold text-black">Click or drag a picture to upload</p>
                      <p className="text-xs mt-1 font-medium text-zinc-400">PNG, JPG, or WEBP (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-zinc-400" />
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-xl pl-8 py-6 text-base font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <ListPlus className="h-4 w-4 text-zinc-400" />
                  Category
                </label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val || 'SCHOOL' })}
                >
                  <SelectTrigger className="w-full rounded-xl py-6 text-base font-medium bg-zinc-50 border-zinc-200 focus:ring-[#3252DF]/50">
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

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl shadow-lg shadow-red-600/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
