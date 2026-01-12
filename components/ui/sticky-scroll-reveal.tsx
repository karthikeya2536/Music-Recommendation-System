
import React, { useRef } from "react";
import { useMotionValueEvent, useScroll, useInView } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: ref,
  });
  const cardLength = content.length;

  /* Removed scrollYProgress logic */

  const backgroundColors = [
    "rgba(0, 0, 0, 0.4)",
    "rgba(20, 20, 20, 0.4)",
    "rgba(10, 10, 10, 0.4)",
  ];

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      className="h-[40rem] overflow-y-auto flex justify-center relative space-x-0 lg:space-x-20 rounded-2xl p-2 lg:p-4 backdrop-blur-sm border border-white/5 transition-colors duration-500 scrollbar-hide"
      ref={ref}
    >
      <div className="div relative flex items-start px-0 lg:px-4 w-full lg:w-1/2">
        <div className="max-w-3xl w-full">
          {content.map((item, index) => (
            <TextCard 
               key={item.title + index}
               item={item}
               index={index}
               activeCard={activeCard}
               setActiveCard={setActiveCard}
               containerRef={ref}
            />
          ))}
          <div className="h-40" />
        </div>
      </div>
      <div
        className={cn(
          "hidden lg:block h-[350px] w-[500px] rounded-2xl bg-white sticky top-36 overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5",
          contentClassName
        )}
      >
        {content[activeCard].content ?? null}
      </div>
    </motion.div>
  );
};

const TextCard = ({ 
  item, 
  index, 
  activeCard, 
  setActiveCard,
  containerRef
}: {
  item: any;
  index: number;
  activeCard: number;
  setActiveCard: (idx: number) => void;
  containerRef: React.RefObject<any>;
}) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { 
    root: containerRef, 
    margin: "-50% 0px -50% 0px" 
  });

  React.useEffect(() => {
    if (isInView) {
      setActiveCard(index);
    }
  }, [isInView, index, setActiveCard]);

  return (
    <div ref={cardRef} className="my-20 first:mt-60 last:mb-20">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: activeCard === index ? 1 : 0.3 }}
        className="text-3xl font-bold text-slate-100"
      >
        {item.title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: activeCard === index ? 1 : 0.3 }}
        className="text-xl text-slate-300 max-w-xl mt-6 leading-relaxed"
      >
        {item.description}
      </motion.p>
    </div>
  );
};
