import { motion } from "framer-motion";

const EGYPT_COLORS = {
  red: "#E41E2B",
  white: "#FFFFFF",
  black: "#000000",
  gold: "#C09E77",
};

export default function EgyptianLoader() {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="relative">
        {/* Pyramid shape */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-32 h-32 relative"
        >
          {/* Pyramid body */}
          <motion.div
            animate={{
              borderBottomColor: [EGYPT_COLORS.gold, "#8B7355", EGYPT_COLORS.gold],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0
                     border-l-[60px] border-l-transparent
                     border-r-[60px] border-r-transparent
                     border-b-[100px]"
            style={{ borderBottomColor: EGYPT_COLORS.gold }}
          />

          {/* Sun disk */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full"
            style={{ backgroundColor: EGYPT_COLORS.red }}
          />
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <h3 className="text-2xl font-cairo text-white mb-2">جاري التحميل</h3>
          <p className="text-gold font-poppins" style={{ color: EGYPT_COLORS.gold }}>
            Loading...
          </p>
        </motion.div>
      </div>
    </div>
  );
} 