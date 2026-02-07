import { cn } from "../../lib/utils";

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/5 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
};

export const TrackSkeleton = () => (
  <div className="w-64 space-y-4 p-4">
    <Skeleton className="aspect-square w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const HeroSkeleton = () => (
    <div className="w-full h-[60vh] flex flex-col justify-center px-16 space-y-8">
        <div className="space-y-4">
            <Skeleton className="h-16 w-1/3" />
            <Skeleton className="h-16 w-1/4" />
        </div>
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-4">
             <Skeleton className="h-12 w-32 rounded-full" />
             <Skeleton className="h-12 w-32 rounded-full" />
        </div>
    </div>
);
