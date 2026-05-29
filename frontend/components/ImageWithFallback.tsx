import React from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

const DEFAULT_FALLBACK = `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'><rect width='100%' height='100%' fill='%23222' /><text x='50%' y='50%' fill='%23ddd' font-family='Arial, Helvetica, sans-serif' font-size='28' dominant-baseline='middle' text-anchor='middle'>No Image</text></svg>`
  );

export const ImageWithFallback: React.FC<Props> = ({ src, fallback, onError, ...rest }) => {
  const [curr, setCurr] = React.useState<string | undefined>(src as string | undefined);

  React.useEffect(() => {
    setCurr(src as string | undefined);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (curr !== (fallback || DEFAULT_FALLBACK)) {
      setCurr(fallback || DEFAULT_FALLBACK);
    }
    if (onError) onError(e);
  };

  return <img src={curr || (fallback || DEFAULT_FALLBACK)} onError={handleError} {...rest} />;
};

export default ImageWithFallback;
