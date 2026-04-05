interface SoundCloudEmbedProps {
  url: string;
  className?: string;
}

function SoundCloudEmbed({ url, className = "" }: SoundCloudEmbedProps) {
  const encodedUrl = encodeURIComponent(url);
  const embedSrc = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%230EA5E9&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;

  return (
    <iframe
      className={`soundcloud-embed ${className}`}
      width="100%"
      height="166"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={embedSrc}
      title="SoundCloud player"
    />
  );
}

export { SoundCloudEmbed };
export type { SoundCloudEmbedProps };
