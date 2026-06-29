"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { getToken, userId } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const res = await axios.get(`http://127.0.0.1:3000/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSettings(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [getToken, userId]);

  const updateSetting = async (key: string, value: any) => {
    if (!settings) return;
    const oldSettings = { ...settings };
    setSettings({ ...settings, [key]: value });

    try {
      const token = await getToken();
      await axios.patch(
        `http://127.0.0.1:3000/users/me`,
        { [key]: value },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
      setSettings(oldSettings); // revert on failure
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F7F4] dark:bg-background pt-10 px-4 pb-20">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
            Account Preferences
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage your Orbit notifications, safety tools, and campus settings.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Notification Preferences Card */}
          <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                Campus Alerts & Notifications
              </h2>
              <p className="text-sm text-muted-foreground">
                Control how you stay updated on your marketplace activity and
                campus meetups.
              </p>
            </div>

            <div className="space-y-8">
              {/* Global Email Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Orbit Digest & Updates
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Receive important alerts straight to your university inbox.
                  </p>
                </div>
                <Checkbox
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("emailNotifications", checked)
                  }
                  className="h-5 w-5 rounded-[4px]"
                />
              </div>

              {/* Frequency Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Email frequency
                  </h3>
                  <Select
                    value={settings.emailFrequency}
                    onValueChange={(val) =>
                      updateSetting("emailFrequency", val)
                    }
                  >
                    <SelectTrigger className="w-full bg-secondary/50 border-border">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Digest time (local)
                  </h3>
                  <Select
                    value={settings.digestTime}
                    onValueChange={(val) => updateSetting("digestTime", val)}
                  >
                    <SelectTrigger className="w-full bg-secondary/50 border-border">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="04:00">04:00</SelectItem>
                      <SelectItem value="08:00">08:00</SelectItem>
                      <SelectItem value="12:00">12:00</SelectItem>
                      <SelectItem value="18:00">18:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specific Alerts */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Email me about
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">
                      Direct Messages from Buyers/Sellers
                    </span>
                    <Checkbox
                      checked={settings.notifyMessages}
                      onCheckedChange={(checked) =>
                        updateSetting("notifyMessages", checked)
                      }
                      className="h-5 w-5 rounded-[4px]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">
                      Questions on your items
                    </span>
                    <Checkbox
                      checked={settings.notifyComments}
                      onCheckedChange={(checked) =>
                        updateSetting("notifyComments", checked)
                      }
                      className="h-5 w-5 rounded-[4px]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">
                      When someone wishlists your items
                    </span>
                    <Checkbox
                      checked={settings.notifyWishlists}
                      onCheckedChange={(checked) =>
                        updateSetting("notifyWishlists", checked)
                      }
                      className="h-5 w-5 rounded-[4px]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">
                      Meetup & Reservation Updates
                    </span>
                    <Checkbox
                      checked={settings.notifyMeetups}
                      onCheckedChange={(checked) =>
                        updateSetting("notifyMeetups", checked)
                      }
                      className="h-5 w-5 rounded-[4px]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors">
                    <span className="text-sm font-medium">
                      Reminders to verify meetups & leave ratings
                    </span>
                    <Checkbox
                      checked={settings.notifyReminders}
                      onCheckedChange={(checked) =>
                        updateSetting("notifyReminders", checked)
                      }
                      className="h-5 w-5 rounded-[4px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Preferences Card */}
          <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm mt-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                Safety & Community Preferences
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize your Orbit browsing experience to keep campus trading
                safe.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Campus Content Filter
                </h3>
                <p className="text-sm text-muted-foreground">
                  Automatically hide explicit language and inappropriate content
                  from your feed and messages.
                </p>
              </div>
              <Checkbox
                checked={settings.profanityFilter}
                onCheckedChange={(checked) =>
                  updateSetting("profanityFilter", checked)
                }
                className="h-5 w-5 rounded-[4px]"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
