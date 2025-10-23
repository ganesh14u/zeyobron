import { useState, useEffect, useRef } from 'react';

export default function SecureVideoPlayer({ videoUrl, videoType, poster, title }) {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = videoType === 'youtube' ? getYouTubeId(videoUrl) : null;

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable certain keyboard shortcuts
    const handleKeyDown = (e) => {
      // Prevent Ctrl+S, Ctrl+U, F12, Ctrl+Shift+I (inspect)
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'u')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (videoType === 'youtube' && youtubeId && playerRef.current) {
      // Load YouTube IFrame API
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
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              window.ytPlayer = event.target;
              setDuration(event.target.getDuration());
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startTimeUpdate();
              } else {
                setIsPlaying(false);
              }
            }
          }
        });
      };

      if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
      }
    }
  }, [youtubeId, videoType]);

  const startTimeUpdate = () => {
    const interval = setInterval(() => {
      if (window.ytPlayer && window.ytPlayer.getCurrentTime) {
        setCurrentTime(window.ytPlayer.getCurrentTime());
      }
    }, 100);
    return () => clearInterval(interval);
  };

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
    
    if (videoType === 'youtube' && window.ytPlayer) {
      window.ytPlayer.setVolume(newVolume * 100);
    } else if (playerRef.current) {
      playerRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    const container = playerRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.() ||
      container.webkitRequestFullscreen?.() ||
      container.msRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const skipTime = (seconds) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    
    if (videoType === 'youtube' && window.ytPlayer) {
      window.ytPlayer.seekTo(newTime, true);
    } else if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // For direct video
  const handleDirectVideoLoad = () => {
    if (playerRef.current) {
      setDuration(playerRef.current.duration);
    }
  };

  const handleDirectVideoTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
    }
  };

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Video Player */}
      <div className="relative aspect-video">
        {videoType === 'youtube' && youtubeId ? (
          <div
            ref={playerRef}
            className="w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <video
            ref={playerRef}
            src={videoUrl}
            poster={poster}
            className="w-full h-full"
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedMetadata={handleDirectVideoLoad}
            onTimeUpdate={handleDirectVideoTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Overlay to prevent right-click */}
        <div 
          className="absolute inset-0 z-10"
          style={{ pointerEvents: 'auto' }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Custom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div 
            className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-4 relative group"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-red-600 rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button onClick={handlePlayPause} className="text-white hover:text-red-500 transition">
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 4l10 6-10 6V4z" />
                  </svg>
                )}
              </button>

              {/* Skip Backward */}
              <button onClick={() => skipTime(-10)} className="text-white hover:text-red-500 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>

              {/* Skip Forward */}
              <button onClick={() => skipTime(10)} className="text-white hover:text-red-500 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                </svg>
              </button>

              {/* Time Display */}
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-red-600"
                />
              </div>

              {/* Fullscreen */}
              <button onClick={handleFullscreen} className="text-white hover:text-red-500 transition">
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute top-4 right-4 text-white/30 text-xs pointer-events-none z-30">
        {title}
      </div>
    </div>
  );
}
