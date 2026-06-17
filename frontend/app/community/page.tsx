import { auth } from '@clerk/nextjs/server';
import axios from 'axios';
import { CommunityClient } from './CommunityClient';

export default async function CommunityPage() {
 const { getToken } = await auth();
 const token = await getToken();
 let initialPosts = [];
 try {
 const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
 const res = await axios.get(`${apiUrl}/posts`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 console.log("CommunityPage API Response:", res.data);
 initialPosts = res.data;
 } catch (error) {
 console.error("Failed to fetch initial posts:", error);
 }

 return <CommunityClient initialPosts={initialPosts} />;
}
