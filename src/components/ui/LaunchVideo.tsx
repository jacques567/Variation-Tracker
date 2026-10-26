'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'

type Cut = { src: string; poster: string }

const PORTRAIT: Cut = {
  src: '/video/vartracker-launch-mobile.mp4',
  poster: '/video/vartracker-launch-mobile-poster.jpg',
}
const LANDSCAPE: Cut = {
  src: '/video/vartracker-launch.mp4',
  poster: '/video/vartracker-launch-poster.jpg',
}

// Matches Tailwind's `sm` breakpoint, which the frame's CSS sizing also switches on.
const PHONE_QUERY = '(max-width: 639px)'

const controlClass =
  'flex h-11 items-center justify-center gap-2 rounded-full bg-black/70 text-sm font-medium text-white transition-colors hover:bg-black/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

// Autoplays muted (browsers block autoplay with sound) and loops.
// Phones get the 9:16 cut, everything else the 16:9 cut.
// The frame is sized in CSS so it never jumps when the cut is picked after hydration.
export default function LaunchVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cut, setCut] = useState<Cut | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const phoneQuery = window.matchMedia(PHONE_QUERY)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setCut(phoneQuery.matches ? PORTRAIT : LANDSCAPE)
      setReducedMotion(motionQuery.matches)
    }
    update()
    phoneQuery.addEventListener('change', update)
    motionQuery.addEventListener('change', update)
    return () => {
      phoneQuery.removeEventListener('change', update)
      motionQuery.removeEventListener('change', update)
    }
  }, [])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !muted
    video.muted = nextMuted
    setMuted(nextMuted)
    // Turning sound on restarts the story so the hook isn't missed.
    if (!nextMuted) {
      video.currentTime = 0
      void video.play()
    }
  }

  return (
    <div className="relative mx-auto aspect-[9/16] w-[min(100%,calc(64svh*9/16))] overflow-hidden rounded-xl bg-[#0d1b2a] shadow-[0_12px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:aspect-video sm:w-[min(100%,48rem,calc((100svh_-_16rem)*16/9))]">
      {cut && (
        <video
          key={cut.src}
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain"
          autoPlay={!reducedMotion}
          loop
          muted
          playsInline
          controls={reducedMotion}
          preload="auto"
          poster={cut.poster}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label="VarTracker launch video: log a variation, get it signed, get paid"
        >
          <source src={cut.src} type="video/mp4" />
        </video>
      )}
      {cut && !reducedMotion && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause video' : 'Play video'}
            className={`${controlClass} w-11`}
          >
            {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            className={`${controlClass} px-4`}
          >
            {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
            {muted ? 'Tap for sound' : 'Sound on'}
          </button>
        </div>
      )}
    </div>
  )
}
