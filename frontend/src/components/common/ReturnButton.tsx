import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PushableButton } from "./PushableButton";
import { AppIcon } from "./AppIcon";
import { CommonModal } from "./CommonModal";

interface ReturnButtonProps {
  className?: string;
  style?: React.CSSProperties;
  gameName?: string;
  variant?: "mint" | "cream";
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
  variant = "mint",
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
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <PushableButton
          onClick={handleOpen}
          variant={variant}
          className={className}
          style={style}
          aria-label="로비로 돌아가기"
        >
          <span className="flex items-center justify-center lg:hidden">
            <AppIcon name="DoorOpen" size={20} strokeWidth={2.2} />
          </span>
          <span className="hidden lg:inline">돌아가기</span>
        </PushableButton>
      </motion.div>

      <CommonModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={<AppIcon name="DoorOpen" size={32} />}
        title={message}
        footerClassName="flex gap-3"
        footer={
          <>
            <PushableButton
              onClick={() => {
                setIsOpen(false);
                navigate("/lobby");
              }}
              variant="mint"
              className="flex-1"
            >
              응
            </PushableButton>
            <PushableButton
              onClick={() => setIsOpen(false)}
              variant="cream"
              className="flex-1"
            >
              아니
            </PushableButton>
          </>
        }
      />
    </>
  );
};
