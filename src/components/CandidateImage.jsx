const fallbackPortrait = '/candidates/avatar-fallback.svg'

export function CandidateImage({ src, alt, ...props }) {
  return (
    <img
      {...props}
      src={src || fallbackPortrait}
      alt={alt}
      onError={(event) => {
        event.currentTarget.onerror = null
        event.currentTarget.src = fallbackPortrait
      }}
    />
  )
}
