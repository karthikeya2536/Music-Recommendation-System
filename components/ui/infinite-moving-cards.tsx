import { cn } from "../../lib/utils";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
  items = [],
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
  renderItem,
  noMask,
}: {
  items?: any[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
  renderItem?: (item: any, index: number) => React.ReactNode;
  noMask?: boolean;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
        let duration = "40s";
        if (speed === "fast") {
          duration = "40s";
        } else if (speed === "normal") {
          duration = "80s";
        } else {
          duration = "200s";
        }
        containerRef.current.style.setProperty("--animation-duration", duration);
        setStart(true);
    }
  }, [direction, speed]);

  // Robust duplication logic to ensure content fills the screen + buffer
  // We repeat the items 6 times to create a very long base set.
  // Then we duplicate THAT base set to create the seamless loop pair [Set A, Set A].
  // Safe check for items being an array
  const safeItems = Array.isArray(items) ? items : [];
  const denseItems = [...safeItems, ...safeItems, ...safeItems, ...safeItems, ...safeItems, ...safeItems];
  const seamlessItems = [...denseItems, ...denseItems];

  const animationClass = direction === "left" ? "animate-scroll-left" : "animate-scroll-right";

  const renderContent = (item: any, idx: number) => {
      // Create a unique key for the list iteration based on index
      const key = `card-dup-${idx}`; 
      
      if (renderItem) {
          return <React.Fragment key={key}>{renderItem(item, idx)}</React.Fragment>;
      }
      
      return (
        <li
            className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px]"
            style={{
              background: "linear-gradient(180deg, var(--slate-800), var(--slate-900))",
            }}
            key={key}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className=" relative z-20 text-sm leading-[1.6] text-gray-100 font-normal">
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.name}
                  </span>
                  <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
      );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 w-full overflow-hidden",
        !noMask && "[mask-image:linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap pr-4",
          start && animationClass,
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {seamlessItems.map((item, idx) => renderContent(item, idx))}
      </ul>
    </div>
  );
};