import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ReturnButtonProps {
  className?: string;
  style?: React.CSSProperties;
  gameName?: string;
  label?: string;
}

const MESSAGES = [
  "{Game Name}, 그만할까?",
  "미안... 재미없지?",
  "이제 다른 거 할까?",
  "로비로 돌아갈까?",
];

export const ReturnButton: React.FC<ReturnButtonProps> = ({
  className,
  style,
  gameName = "게임",
  label = "← 돌아가기",
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleOpen = () => {
    const randomMsg = MESSAGES[
      Math.floor(Math.random() * MESSAGES.length)
    ].replace("{Game Name}", gameName);
    setMessage(randomMsg);
    setIsOpen(true);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className={className}
        style={style}
      >
        {label}
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="bg-[#FFFFF8] p-6 rounded-[2rem] shadow-2xl z-10 max-w-sm w-full border-4 border-[#D6C0B0] text-center"
              >
                <span className="text-4xl block mb-3">🚪</span>
                <h3 className="text-[#166D77] font-black text-xl mb-6">
                  {message}
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/lobby")}
                    className="flex-1 py-3 rounded-xl font-black text-sm bg-[#ff6b6b] text-white hover:bg-[#fa5252] transition-colors"
                  >
                    응
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-3 rounded-xl font-black text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    아니
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};
