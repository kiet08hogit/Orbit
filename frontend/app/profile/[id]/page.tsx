'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Loader2, MapPin, MessageSquare, Shield, Tag, Calendar, GraduationCap, Heart, AlertTriangle, BookOpen, Star, Pencil, Camera, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { getToken, isLoaded, isSignedIn, userId: currentUserId } = useAuth();
  const { user: clerkUser } = useUser();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    major: '',
    classYear: '',
  });

  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Faculty/Staff'];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        const token = await getToken();
        const res = await axios.get(`http://127.0.0.1:3000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserProfile(res.data);
        setFormData({
          name: res.data.name || '',
          username: res.data.username || '',
          bio: res.data.bio || '',
          major: res.data.major || '',
          classYear: res.data.classYear || '',
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, isLoaded, isSignedIn, getToken]);

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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      
      let avatarUrl = userProfile.avatarUrl;
      if (avatarFile && clerkUser) {
        const updatedUser = await clerkUser.setProfileImage({ file: avatarFile });
        avatarUrl = updatedUser.imageUrl;
      }

      await axios.patch('http://127.0.0.1:3000/users/me', {
        ...formData,
        avatarUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserProfile({ ...userProfile, ...formData, avatarUrl });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const token = await getToken();
      await axios.delete(`http://127.0.0.1:3000/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile((prev: any) => ({
        ...prev,
        listings: prev.listings.filter((l: any) => l.id !== listingId)
      }));
    } catch (err) {
      console.error('Failed to delete listing', err);
      alert('Failed to delete listing.');
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <AlertTriangle className="h-12 w-12 text-zinc-400" />
        <h2 className="text-2xl font-bold text-black">Profile not found</h2>
        <Link href="/listings">
          <Button className="rounded-xl font-bold bg-[#272343] hover:bg-black text-white">
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const joinDate = new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const listingsCount = userProfile._count?.listings || 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 py-10 px-4 sm:px-6 font-sans relative overflow-hidden">
      
      {/* Background Orbs to match the vibe */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-[#3252DF]/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-[#DC2626]/10 blur-[100px]" />

      <div className="max-w-6xl mx-auto z-10">
        
        {/* Back Link */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-8 text-sm font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6"/></svg>
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Info & Trust */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-200 flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <div 
                className={`h-32 w-32 rounded-full border-4 border-zinc-50 shadow-md overflow-hidden bg-zinc-100 mb-5 relative ${isEditing ? 'cursor-pointer group' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {(avatarPreview || userProfile.avatarUrl) ? (
                  <img src={avatarPreview || userProfile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[#3252DF] text-4xl font-bold bg-[#3252DF]/10">
                    {(formData.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              
              {/* Profile Details */}
              {isEditing ? (
                <div className="w-full space-y-4 mb-8 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
                    <Input name="name" value={formData.name} onChange={handleChange} className="rounded-xl font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Username</label>
                    <Input name="username" value={formData.username} onChange={handleChange} className="rounded-xl font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Major</label>
                    <Input name="major" value={formData.major} onChange={handleChange} className="rounded-xl font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Class Year</label>
                    <Select value={formData.classYear} onValueChange={(val) => setFormData({ ...formData, classYear: val })}>
                      <SelectTrigger className="rounded-xl font-medium"><SelectValue placeholder="Select Year" /></SelectTrigger>
                      <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Bio</label>
                    <Textarea name="bio" value={formData.bio} onChange={handleChange} className="rounded-xl font-medium resize-none" rows={3} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h1 className="text-2xl font-black tracking-tight text-black">{userProfile.name || 'Anonymous User'}</h1>
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white shadow-sm" title="Verified UIC Student">
                      <Shield className="h-3 w-3" />
                    </div>
                  </div>
                  
                  <p className="text-zinc-500 text-sm font-bold mb-5">@{userProfile.username || userProfile.id.slice(0,8)}</p>

                  <div className="flex flex-col w-full gap-2 mb-6">
                    {userProfile.major && (
                      <div className="flex items-center justify-center gap-2 bg-zinc-50 border border-zinc-100 text-zinc-700 px-3 py-2 font-bold text-sm rounded-xl">
                        <BookOpen className="h-4 w-4 text-zinc-400" />
                        {userProfile.major}
                      </div>
                    )}
                    {userProfile.classYear && (
                      <div className="flex items-center justify-center gap-2 bg-[#3252DF]/5 border border-[#3252DF]/10 text-[#3252DF] px-3 py-2 font-bold text-sm rounded-xl">
                        <GraduationCap className="h-4 w-4" />
                        {userProfile.classYear}
                      </div>
                    )}
                  </div>

                  <div className="w-full text-sm font-medium text-zinc-600 text-center mb-8">
                    {userProfile.bio ? (
                      <p className="leading-relaxed">{userProfile.bio}</p>
                    ) : (
                      <p className="italic text-zinc-400">This student hasn't written a bio yet.</p>
                    )}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3 mt-auto">
                {currentUserId === userProfile.clerkUserId ? (
                  isEditing ? (
                    <Button 
                      className="w-full rounded-xl h-12 font-bold text-sm bg-[#3252DF] hover:bg-[#2842B3] text-white shadow-sm flex items-center gap-2"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full rounded-xl h-12 font-bold text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-900 shadow-sm flex items-center gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  )
                ) : (
                  <Button className="w-full rounded-xl h-12 font-bold text-sm bg-[#272343] hover:bg-black text-white shadow-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Seller
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="ghost" className="w-full rounded-xl h-11 font-bold text-sm text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Report
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Trust & Reputation Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200"
            >
              <h3 className="font-bold text-black text-sm mb-5 flex items-center gap-2 uppercase tracking-wider">
                <Shield className="h-4 w-4 text-[#3252DF]" />
                Trust & Reputation
              </h3>
              
              <div className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-500 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Rating
                  </span>
                  <span className="font-black text-black">New</span>
                </div>
                
                <Separator className="bg-zinc-100" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-500 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-zinc-400" /> Active Listings
                  </span>
                  <span className="font-black text-black">{listingsCount}</span>
                </div>
                
                <Separator className="bg-zinc-100" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-500 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" /> Exchanges
                  </span>
                  <span className="font-black text-black">0</span>
                </div>

                <Separator className="bg-zinc-100" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-500 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-zinc-400" /> Response Rate
                  </span>
                  <span className="font-black text-black">—</span>
                </div>
                
                <Separator className="bg-zinc-100" />
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {joinDate}
                  </span>
                </div>

              </div>
            </motion.div>
          </div>

          {/* Right Column: User's Listings */}
          <div className="lg:col-span-8">
            <h2 className="text-2xl font-black tracking-tight text-black mb-6">Active Listings</h2>
            
            {userProfile.listings && userProfile.listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {userProfile.listings.map((listing: any, i: number) => (
                  <motion.div 
                    key={listing.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/listings/${listing.id}`} className="block h-full group">
                      <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                        
                        {/* Image */}
                        <div className="aspect-square bg-zinc-100 relative overflow-hidden">
                          {listing.images && listing.images.length > 0 ? (
                            <img 
                              src={`http://127.0.0.1:3000${listing.images[0].url}`} 
                              alt={listing.title} 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                              <Tag className="h-10 w-10" />
                            </div>
                          )}
                          
                          {/* Category Badge */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider text-black shadow-sm">
                              {listing.category}
                            </span>
                          </div>
                          
                          {/* Edit/Delete Button Overlay */}
                          {currentUserId === userProfile.clerkUserId && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                              <div 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  router.push(`/listings/${listing.id}/edit`); 
                                }}
                                className="cursor-pointer"
                              >
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white text-zinc-900 shadow-sm hover:bg-zinc-100">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                              <div 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  handleDeleteListing(listing.id);
                                }}
                                className="cursor-pointer"
                              >
                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-black text-sm leading-tight line-clamp-2 pr-2 group-hover:text-[#3252DF] transition-colors">
                              {listing.title}
                            </h3>
                          </div>
                          
                          <div className="mt-auto pt-3 flex items-end justify-between">
                            <span className="text-lg font-black text-[#DC2626]">
                              ${Number(listing.price).toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {new Date(listing.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                  <Tag className="h-8 w-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-black text-black mb-1">No active listings</h3>
                <p className="text-zinc-500 text-sm font-medium">This student doesn't have any items for sale right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
