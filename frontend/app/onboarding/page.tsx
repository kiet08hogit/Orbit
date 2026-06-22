'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Camera, User, BookOpen, Calendar, AlignLeft, Sparkles, AlertCircle, GraduationCap } from 'lucide-react';
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
    university: '',
  });

  const [isUniversityLocked, setIsUniversityLocked] = useState(false);

  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Faculty/Staff'];

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      if (email.endsWith('@uic.edu')) {
        setFormData((prev) => ({ ...prev, university: 'University of Illinois Chicago' }));
        setIsUniversityLocked(true);
      } else if (email.endsWith('@illinois.edu')) {
        setFormData((prev) => ({ ...prev, university: 'University of Illinois Urbana-Champaign' }));
        setIsUniversityLocked(true);
      } else if (email.endsWith('@depaul.edu')) {
        setFormData((prev) => ({ ...prev, university: 'DePaul University' }));
        setIsUniversityLocked(true);
      } else if (email.endsWith('.edu')) {
        const domain = email.split('@')[1];
        setFormData((prev) => ({ ...prev, university: domain }));
        setIsUniversityLocked(false);
      }
    }
  }, [user]);

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
        avatarUrl = updatedUser.publicUrl;
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
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-4 py-12 font-sans relative overflow-hidden">

      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          {/* <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div> */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Welcome to Orbit!
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Let's set up your student profile before you enter the marketplace.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
              <div
                className="relative h-24 w-24 rounded-full border-4 border-background shadow-sm overflow-hidden bg-secondary group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-secondary">
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
              <p className="text-sm font-bold text-primary cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                Upload Profile Picture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </label>
                <Input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl py-6 text-base font-medium bg-secondary border-border focus-visible:ring-primary/50"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Username
                </label>
                <Input
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter a unique username"
                  className="w-full rounded-xl py-6 text-base font-medium bg-secondary border-border focus-visible:ring-primary/50"
                />
              </div>

              {/* University */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  University
                </label>
                <Input
                  required
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  disabled={isUniversityLocked}
                  placeholder="e.g. University of Illinois Chicago"
                  className="w-full rounded-xl py-6 text-base font-medium bg-secondary border-border focus-visible:ring-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              {/* Major */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Major
                </label>
                <Input
                  required
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl py-6 text-base font-medium bg-secondary border-border focus-visible:ring-primary/50"
                />
              </div>

              {/* Class Year */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Class Year
                </label>
                <Select
                  value={formData.classYear}
                  onValueChange={(val) => setFormData({ ...formData, classYear: val || '' })}
                >
                  <SelectTrigger className="w-full rounded-xl py-6 text-base font-medium bg-secondary border-border focus:ring-primary/50">
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
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                Short Bio
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tell the community a bit about yourself..."
                className="w-full rounded-xl p-4 text-base font-medium bg-secondary border-border focus-visible:ring-primary/50 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.classYear || !formData.university}
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm"
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
