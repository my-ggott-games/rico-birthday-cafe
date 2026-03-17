import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ActionButton } from "./ActionButton";
import type { ActionButtonSize, ActionButtonVariant } from "./ActionButton";

interface ReturnButtonProps {
  className?: string;
  style?: React.CSSProperties;
  gameName?: string;
  label?: string;
  buttonVariant?: ActionButtonVariant;
  buttonSize?: ActionButtonSize;
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
  buttonVariant = "frame",
  buttonSize = "sm",
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const preventDrag = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleOpen = () => {
    const randomMsg = MESSAGES[
      Math.floor(Math.random() * MESSAGES.length)
    ].replace("{Game Name}", gameName);
    setMessage(randomMsg);
    setIsOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ActionButton
          onClick={handleOpen}
          className={className}
          style={style}
          variant={buttonVariant}
          size={buttonSize}
        >
          {label}
        </ActionButton>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className="fixed inset-0 z-[999999] flex items-center justify-center p-4 select-none"
              draggable={false}
              onDragStart={preventDrag}
            >
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
                className="bg-[#FFFFF8] p-6 rounded-[2rem] shadow-2xl z-10 max-w-sm w-full border-4 border-[#D6C0B0] text-center select-none"
                draggable={false}
              >
                <span className="text-4xl block mb-3">🚪</span>
                <h3
                  className="text-[#166D77] font-black text-xl mb-6 select-none"
                  draggable={false}
                >
                  {message}
                </h3>
                <div className="flex gap-3">
                  <ActionButton
                    onClick={() => navigate("/lobby")}
                    className="flex-1"
                    variant="teal"
                    size="md"
                  >
                    응
                  </ActionButton>
                  <ActionButton
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                    variant="neutral"
                    size="md"
                  >
                    아니
                  </ActionButton>
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
