'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Camera, User, BookOpen, Calendar, AlignLeft, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OnboardingPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    major: '',
    classYear: '',
    bio: '',
  });

  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Faculty/Staff'];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
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
      
      let avatarUrl = undefined;
      
      if (avatarFile && user) {
        const updatedUser = await user.setProfileImage({ file: avatarFile });
        avatarUrl = updatedUser.imageUrl;
      }

      await axios.patch('http://127.0.0.1:3000/users/me', {
        ...formData,
        ...(avatarUrl && { avatarUrl }),
        onboardingComplete: true
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Redirect to marketplace home
      window.location.href = '/home';
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message || 'Failed to save profile.';
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 flex flex-col items-center justify-center p-4 py-12 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-[#3252DF]/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-[#DC2626]/10 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[#3252DF]/10 rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-[#3252DF]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            Welcome to Circlo!
          </h1>
          <p className="text-zinc-500 text-lg font-medium">
            Let's set up your student profile before you enter the marketplace.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl shadow-zinc-200/50">
          
          {error && (
            <Alert variant="destructive" className="mb-6 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
              <div 
                className="relative h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-zinc-100 group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-400 bg-zinc-50">
                    <User className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
              <p className="text-sm font-bold text-[#3252DF] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                Upload Profile Picture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-400" />
                  Full Name
                </label>
                <Input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-xl py-6 text-base font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-400" />
                  Username
                </label>
                <Input
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. janedoe"
                  className="w-full rounded-xl py-6 text-base font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50"
                />
              </div>

              {/* Major */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-zinc-400" />
                  Major
                </label>
                <Input
                  required
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl py-6 text-base font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50"
                />
              </div>

              {/* Class Year */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  Class Year
                </label>
                <Select 
                  value={formData.classYear} 
                  onValueChange={(val) => setFormData({ ...formData, classYear: val || '' })}
                >
                  <SelectTrigger className="w-full rounded-xl py-6 text-base font-medium bg-zinc-50 border-zinc-200 focus:ring-[#3252DF]/50">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-zinc-400" />
                Short Bio
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tell the community a bit about yourself..."
                className="w-full rounded-xl p-4 text-base font-medium bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF]/50 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.classYear}
                className="w-full h-14 text-lg font-bold bg-[#3252DF] hover:bg-[#2842B3] text-white rounded-xl shadow-lg shadow-[#3252DF]/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </Button>
            </div>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
