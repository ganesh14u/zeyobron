import { useState, useEffect, useRef } from 'react';

export default function SecureVideoPlayer({ videoUrl, videoType, poster, title, onDurationChange }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Notify parent of duration changes
  useEffect(() => {
    if (duration > 0 && onDurationChange) {
      onDurationChange(duration);
    }
  }, [duration]);

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = videoType === 'youtube' ? getYouTubeId(videoUrl) : null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isReady) {
        if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          handlePlayPause();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          skipTime(10);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          skipTime(-10);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReady]);

  const clickTimeout = useRef(null);

  // Sync volume and quality with players
  useEffect(() => {
    if (videoType === 'youtube' && window.ytPlayer) {
      window.ytPlayer.setVolume(volume * 100);
      try {
        // Attempt to suggest high quality
        if (window.ytPlayer.setPlaybackQuality) {
          window.ytPlayer.setPlaybackQuality('hd1080');
        }
      } catch (e) { }
    } else if (playerRef.current && videoType !== 'youtube') {
      playerRef.current.volume = volume;
    }
  }, [volume, videoType, isPlaying]); // Re-check on play to force quality

  useEffect(() => {
    if (videoType === 'youtube' && youtubeId && playerRef.current) {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        new window.YT.Player(playerRef.current, {
          videoId: youtubeId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
            autoplay: 1, // Suggest autoplay for better UX
            vq: 'hd1080' // Historical parameter still recognized by some players
          },
          events: {
            onReady: (event) => {
              window.ytPlayer = event.target;
              setDuration(event.target.getDuration());
              setIsReady(true);
              // Force high quality on ready
              try {
                if (event.target.setPlaybackQuality) {
                  event.target.setPlaybackQuality('hd1080');
                }
              } catch (e) { }
            },
            onStateChange: (event) => {
              // Update duration again on State Change as YouTube sometimes reports 0 during Ready
              if (event.target.getDuration) {
                const d = event.target.getDuration();
                if (d > 0) setDuration(d);
              }

              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
              }
            }
          }
        });
      };

      if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
      }
    } else if (videoType === 'direct') {
      setIsReady(true);
    }
  }, [youtubeId, videoType]);

  useEffect(() => {
    let interval;
    if (isPlaying && videoType === 'youtube' && window.ytPlayer) {
      interval = setInterval(() => {
        if (window.ytPlayer.getCurrentTime) {
          setCurrentTime(window.ytPlayer.getCurrentTime());
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoType]);

  const handlePlayPause = () => {
    if (videoType === 'youtube' && window.ytPlayer) {
      if (isPlaying) {
        window.ytPlayer.pauseVideo();
      } else {
        window.ytPlayer.playVideo();
      }
    } else if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    if (videoType === 'youtube' && window.ytPlayer) {
      window.ytPlayer.seekTo(newTime, true);
    } else if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.() ||
        container.webkitRequestFullscreen?.() ||
        container.mozRequestFullScreen?.() ||
        container.msRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const skipTime = (seconds) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));

    if (videoType === 'youtube' && window.ytPlayer) {
      window.ytPlayer.seekTo(newTime, true);
      setCurrentTime(newTime);
    } else if (playerRef.current) {
      playerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  // Improved click handling for single vs double click
  const handlePlayerClick = (e) => {
    // If clicking on controls, don't trigger pause
    if (e.target.closest('.player-controls')) return;

    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleFullscreen();
    } else {
      clickTimeout.current = setTimeout(() => {
        handlePlayPause();
        clickTimeout.current = null;
      }, 250); // 250ms window for double click
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-[2rem] overflow-hidden group w-full h-full select-none outline-none`}
      onMouseMove={handleMouseMove}
      onClick={handlePlayerClick}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 z-10 pointer-events-auto" onContextMenu={e => e.preventDefault()} />

      {/* Video Player */}
      <div className="w-full h-full relative aspect-video bg-black flex items-center justify-center pointer-events-none">
        {videoType === 'youtube' && youtubeId ? (
          <div
            ref={playerRef}
            className="w-full h-full"
          />
        ) : (
          <video
            ref={playerRef}
            src={videoUrl}
            poster={poster}
            className="w-full h-full object-contain"
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedMetadata={() => setDuration(playerRef.current.duration)}
            onTimeUpdate={() => setCurrentTime(playerRef.current.currentTime)}
          />
        )}

        {/* Big Centered Play Button (YouTube Logo Style) */}
        {!isPlaying && isReady && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-[2px] transition-all"
          >
            <div className="relative group/play flex items-center justify-center">
              <div className="w-24 h-16 bg-red-600 rounded-[24px] flex items-center justify-center shadow-2xl transition-transform group-hover/play:scale-110 duration-300">
                <div className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-white ml-2"></div>
              </div>
              <div className="absolute -inset-10 bg-red-600/20 blur-[50px] rounded-full opacity-50 group-hover/play:opacity-100 transition-opacity"></div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-8 left-8 opacity-20 pointer-events-none z-30 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Live</span>
        </div>
      </div>

      {/* Player Controls */}
      <div
        className={`player-controls absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent transition-all duration-500 z-40 transform ${showControls || !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
        onClick={e => e.stopPropagation()} // Prevent controls from triggering pause
      >
        {/* Seek Bar */}
        <div className="relative h-1.5 w-full bg-white/10 rounded-full mb-8 cursor-pointer group/seek" onClick={handleSeek}>
          <div
            className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover/seek:scale-100 transition-transform shadow-xl"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={handlePlayPause} className="text-white hover:text-red-500 transition-colors">
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <div className="flex items-center gap-4">
              <button onClick={() => skipTime(-10)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /><path d="M11 10h1v4h-1z" /><path d="M13 10.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v3c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-3z" /></svg>
              </button>
              <button onClick={() => skipTime(10)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /><path d="M10 10h1v4h-1z" /><path d="M12 10.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-3z" /></svg>
              </button>
            </div>

            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 group/vol px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
              <input
                type="range" min="0" max="1" step="0.05"
                value={volume} onChange={handleVolumeChange}
                className="w-20 accent-red-600 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <button onClick={handleFullscreen} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
