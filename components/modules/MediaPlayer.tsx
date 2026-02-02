"use client";

import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, Link as LinkIcon, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MediaPlayer() {
    const {
        youtubeUrl,
        youtubePlaylist,
        setMediaUrl,
        addToPlaylist,
        removeFromPlaylist,
    } = useAppStore();
    const [expanded, setExpanded] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [inputUrl, setInputUrl] = useState("");

    const handleUpdateUrl = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUrl) {
            addToPlaylist(inputUrl);
            setInputUrl("");
        }
    };

    const extractId = (url: string) => {
        return url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    };

    const getEmbedUrl = () => {
        // Extract IDs for all videos in the playlist
        const currentId = extractId(youtubeUrl);
        const playlistIds = youtubePlaylist.map(extractId).join(",");
        // Use the current ID as the start and all IDs for the playlist parameter
        return `https://www.youtube.com/embed/${currentId}?autoplay=1&loop=1&playlist=${playlistIds}`;
    };

    return (
        <div
            className={cn(
                "transition-all duration-500 ease-out z-50",
                expanded
                    ? "relative mb-24 lg:mb-0 lg:fixed lg:bottom-6 lg:right-6 w-full lg:w-[500px]"
                    : "fixed bottom-6 right-6 w-16 h-16",
            )}
        >
            <div
                className={cn(
                    "bg-card/90 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 relative flex flex-col",
                    expanded
                        ? "h-[320px] sm:h-[450px] p-4 sm:p-6"
                        : "h-16 w-16 rounded-full p-0 flex items-center justify-center cursor-pointer hover:bg-white/10",
                )}
                onClick={() => !expanded && setExpanded(true)}
            >
                {/* Always rendered content container */}
                <div
                    className={cn(
                        "w-full h-full flex flex-col gap-4 overflow-hidden",
                        !expanded && "hidden",
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Youtube className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">
                                Focus Player
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8",
                                    showPlaylist &&
                                        "bg-primary/20 text-primary",
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPlaylist(!showPlaylist);
                                }}
                            >
                                <LinkIcon className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded(false);
                                }}
                            >
                                <ChevronDown className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Playlist (Management View) */}
                    {showPlaylist && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 shrink-0 pb-2">
                            <form
                                onSubmit={handleUpdateUrl}
                                className="flex gap-2"
                            >
                                <Input
                                    placeholder="Add YouTube URL..."
                                    className="h-9 text-xs bg-black/20 rounded-xl"
                                    value={inputUrl}
                                    onChange={(e) =>
                                        setInputUrl(e.target.value)
                                    }
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-9 rounded-xl px-4"
                                >
                                    Add
                                </Button>
                            </form>

                            <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                {youtubePlaylist.map((url, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 group/link"
                                    >
                                        <span className="text-[10px] text-muted-foreground truncate flex-1">
                                            {url}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() =>
                                                    setMediaUrl("YOUTUBE", url)
                                                }
                                                className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-md transition-colors",
                                                    youtubeUrl === url
                                                        ? "bg-primary text-primary-foreground"
                                                        : "hover:bg-white/10",
                                                )}
                                            >
                                                Play
                                            </button>
                                            <button
                                                onClick={() =>
                                                    removeFromPlaylist(url)
                                                }
                                                className="text-muted-foreground hover:text-destructive p-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Video Area */}
                    <div className="flex-1 w-full min-h-0 rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative group">
                        <iframe
                            src={getEmbedUrl()}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            title="Media Player"
                        />
                    </div>
                </div>

                {/* Minimized Icon - Absolute centered */}
                {!expanded && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <Youtube className="w-8 h-8 text-primary" />
                    </div>
                )}
            </div>
        </div>
    );
}
