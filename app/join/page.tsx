"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";

export default function JoinPage() {
    const [roomId, setRoomId] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    function joinRoom() {
        if (!roomId.trim()) {
            toast({
                title: "Room code required",
                description: "Please enter a valid room code.",
                variant: "destructive"
            });
            return;
        }

        setIsConnecting(true);

        const peer = new Peer({ debug: 2 });
        peerRef.current = peer;

        peer.on("open", () => {
            const connection = peer.connect(roomId);

            connection.on("open", () => {
                setIsConnected(true);
                toast({
                    title: "Connected!",
                    description: "Waiting for host to share their screen..."
                });
            });

            peer.on("call", (call) => {
                call.answer();
                call.on("stream", (remoteStream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = remoteStream;
                        videoRef.current.play().catch(console.error);
                    }
                });
            });

            connection.on("close", () => {
                setIsConnecting(false);
                setIsConnected(false);
                setRoomId("");
                toast({
                    title: "Disconnected",
                    description: "The session has been ended.",
                    variant: "destructive"
                });
            });
        });

        peer.on("error", (err) => {
            setIsConnecting(false);
            toast({
                title: "Connection failed",
                description: "Could not connect to the room. Please check the room code and try again.",
                variant: "destructive"
            });
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="outline" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Join a Room
                        </CardTitle>
                        <CardDescription>Enter the room code to join and view the shared screen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!isConnected ? (
                            <div className="space-y-4">
                                <Input placeholder="Enter room code" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={isConnecting} />
                                <Button className="w-full" onClick={joinRoom} disabled={isConnecting || !roomId.trim()}>
                                    {isConnecting ? "Connecting..." : "Join Room"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div ref={videoContainerRef} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
                                    <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
